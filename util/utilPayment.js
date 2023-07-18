let isDebug = false;
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
  isDebug = true;
}

const Ticket = require("../models/ticket");
const TicketStatusEnum = require("../enum/TicketStatusEnum");
const GNRequest = require('../apis/gerencianet');
const UtilTicket = require("../util/utilTicket");
const EmailSend = require("../email/send");
const User = require("../models/user");
const Lots = require("../models/lots");
const Charge = require("../models/charge");
const DocumentTypeEnum = require("../enum/DocumentTypeEnum");
const PaymentToken = require("../apis/paymentToken");

async function getTicketsToPay(tickets, transaction, companyId) {
    const ticketsToPay = [];
    let totalPriceTickets = 0;
    for (const ticket of tickets) {
      const _tickets = await Ticket.findAll({
        where: {
          lots_id: ticket.lots,
          type: ticket.type,
          status: TicketStatusEnum.AVAILABLE
        },
        limit: ticket.quantity,
        lock: transaction.LOCK.UPDATE // Aplicar bloqueio pessimista na transação
      });
      
      if (_tickets.length <= 0) {
        throw new Error("Ingressos esgotados ou indisponíveis.");
      } 
  
      for (const ticketToAdd of _tickets) {

        const _lots = await Lots.findOne({
          where: {
            id: ticketToAdd.lots_id
          }
        })
        if (!_lots || _lots.company_id != companyId) {
          throw new Error(`Esse ingresso: ${ticket.id} não percentence a empresa: ${companyId}`)
        }

        await ticketToAdd.update({
            status: TicketStatusEnum.PENDING
        });
        totalPriceTickets+= ticketToAdd.price;
        ticketsToPay.push(ticketToAdd);
      }
    }
  
    return {
        ticketsToPay,
        totalPriceTickets
    };
  }

  async function updateTicketsToPedingOnQrCodeGenerate(ticketsToPay, txid ) {
    for (const ticket of ticketsToPay) {
      await ticket.update({
        txid: txid,
        status: TicketStatusEnum.PENDING
      })
    }
  }

  function parseCobData(value) {
    const valueWithTax = value + (value * parseFloat(process.env.PERCENT_MORE));
    const dataCob = {
      calendario: {
        expiracao: 300
      },
      valor: {
        original: (valueWithTax / 100).toFixed(2).toString()
      },
      chave: process.env.GN_CHAVE_PIX,
      solicitacaoPagador: 'Easy Ticket'
    };
    return dataCob;
  }
  
  function parseSplitData(companyDocumentType, gn_account, companyDocumentValue) {
    let favorecido;
    if (companyDocumentType == DocumentTypeEnum.CPF) {
      favorecido = {
          cpf: companyDocumentValue,
      }
    } else if (companyDocumentType == DocumentTypeEnum.CNPJ) {
      favorecido = {
          cnpj: companyDocumentValue,
      }
    } 
    favorecido.conta = gn_account;

    const data = {
      descricao: "Split pagamento - plano 1",
      lancamento: {
          imediato: true
      },
      split: {
          divisaoTarifa: "proporcional",
          minhaParte: {
              tipo: "porcentagem",
              valor: "15.00"
          },
          repasses: [
              {
                  tipo: "porcentagem",
                  valor: "85.00",
                  favorecido: favorecido
              }
          ]
      }
    }
    return data;
  }

  function parseCharges(amount, payment_method) {
    const charges = [
        {
          amount: {
            value: amount.value,
            currency: amount.currency
          },
          payment_method: {
            type: payment_method.type,
            installments: payment_method.installments,
            capture: true,
            card: {
              number: payment_method.card.number,
              exp_month: payment_method.card.exp_month,
              exp_year: payment_method.card.exp_year,
              security_code: payment_method.card.security_code,
              holder: {
                name: payment_method.card.holder.name
              },
              store: false
            },
            soft_descriptor: "Easy Ticket",
          }
        }
      ]
    return charges;
  }

  function createTicketHTML(tickets) {
    let html = '';
  
    html += '<h2>Ingressos:</h2>';
    html += '<table>';
    html += '<thead><tr><th>Código</th><th>Valor</th><th>QR Code</th></tr></thead>';
    html += '<tbody>';
  
    for (const ticket of tickets) {
      html += '<tr>';
      html += `<td>${ticket.uuid}</td>`;
      html += `<td>R$ ${formatCurrency(ticket.price)}</td>`;
      html += `<td><img src="${ticket.qr_code}" alt="QR Code do ingresso" /></td>`;
      html += '</tr>';
    }
  
    html += '</tbody>';
    html += '</table>';
  
    return html;
  }

  function formatCurrency(value) {
    const valuePaid = value / 100;
    return valuePaid.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function ticketsCanceled({chargeId}) {
    const tickets = await Ticket.findAll({
      where: {
        charge_id: chargeId
      }
    })
    await updateTicketsToAvailable(tickets);
    return tickets;
  }

  async function sendEmailTicketsCanceled({tickets, chargeId}) {
    if (!tickets || ticketsCanceled.length == 0){ 
      return;
    }
    const userId = ticketsPaid[0].owner_user_id;
    const user = await User.findOne({
      where: {
        id: userId
      }
    });

    const subject = "Pagamento Cancelado - EasyTicket";
    const paymentCanceledEmailTemplate = `<!DOCTYPE html>
                                            <html>
                                            <head>
                                              <meta charset="UTF-8">
                                              <title>Pagamento Cancelado - EasyTicket</title>
                                            </head>
                                            <body>
                                              <h1>Pagamento foi Cancelado</h1>
                                              <p>Olá,</p>
                                              <p>O usuário ${user.email} solicitou cancelamento dos ingressos charge_id: ${chargeId}</p>
                                              <p>Atenciosamente,<br>Equipe EasyTicket</p>
                                            </body>
                                            </html>`;
  
    EmailSend.sendMail(process.env.EMAIL, subject, paymentCanceledEmailTemplate);
  }

  async function sendEmailTicketApproved({chargeId, txid}) {
    
    const userId = await getUserIdOnCharge({chargeId: chargeId, txid: txid});
    const _user = await User.findOne({
      where: {
        id: userId
      }
    });

    const subject = "Pagamento Aprovado - EasyTicket";
    const template = `<!DOCTYPE html>
                                            <html>
                                            <head>
                                              <meta charset="UTF-8">
                                              <title>Pagamento Aprovado - EasyTicket</title>
                                            </head>
                                            <body>
                                              <p>Olá,</p>
                                              <p>Seu pagamento foi aprovado com sucesso!</p>
                                              <p>Por favor guarde o pagamento ser confirmado.</p>
                                              <p>Agradecemos por utilizar o EasyTicket.</p>
                                              <p>Atenciosamente,<br>Equipe EasyTicket</p>
                                            </body>
                                            </html>`;
  
    EmailSend.sendMail(_user.email, subject, template);
  }

async function getUserIdOnCharge({chargeId, txid}) {
  let userId;
  if (chargeId) {
    const charge = await Charge.findOne({
      where: {
        charge_id: chargeId
      }
    })
    userId = charge.user_id;
  } else if (txid) {
    const charge = await Charge.findOne({
      where: {
        txid: txid
      }
    })
    userId = charge.user_id;
  } else {
    throw new Error("Nenhuma cobrança!")
  }
  return userId;
}

  async function sendEmailTicketConfirmed({ticketsPaid, amount, chargeId, txid}) {
    const valuePaidFormated = formatCurrency(amount);
    const ticketHTML = createTicketHTML(ticketsPaid);
    if (!ticketsPaid || ticketsPaid.length == 0) {
      return;
    }

    const userId = await getUserIdOnCharge({chargeId: chargeId, txid: txid});
    const user = await User.findOne({
      where: {
        id: userId
      }
    });

    const subject = "Pagamento Confirmado - EasyTicket";
    const template = `<!DOCTYPE html>
                                            <html>
                                            <head>
                                              <meta charset="UTF-8">
                                              <title>Pagamento Confirmado - EasyTicket</title>
                                            </head>
                                            <body>
                                              <p>Olá,</p>
                                              <p>Seu pagamento foi confirmado com sucesso!</p>
                                              <p>O valor de ${valuePaidFormated} foi recebido e sua compra foi confirmada.</p>
                                              ${ticketHTML}
                                              <p>Agradecemos por utilizar o EasyTicket.</p>
                                              <p>Atenciosamente,<br>Equipe EasyTicket</p>
                                            </body>
                                            </html>`;
  
    EmailSend.sendMail(user.email, subject, template);
  }

  async function ticketsToPending({tickets, chargeId, txid}) {
    for (const ticket of tickets) {
      console.log(`Alterado status do ingresso: ${ticket.id} para PENDING`, new Date());
      await ticket.update({
        status: TicketStatusEnum.PENDING,
        charge_id: chargeId,
        txid: txid
      })
    }
  }


  async function ticketsPaid({chargeId, txid}) {
    console.log("chargeId: ", chargeId)
    const tickets = await Ticket.findAll({
      where: {
        charge_id: chargeId
      }
    });

    const userId = await getUserIdOnCharge({chargeId: chargeId, txid: txid})

    for (const ticket of tickets) {
      const qrCodeUrl = await UtilTicket.generateQRCode(ticket.uuid);
      console.log(`Alterado status do ingresso: ${ticket.id} para PAID`, new Date());
      await ticket.update({
        status: TicketStatusEnum.PAID,
        owner_user_id: userId,
        charge_id: chargeId,
        qr_code: qrCodeUrl
      })
    }
    return tickets;
  }

  async function updateTicketsToAvailable(ticketIds) {
    const reqGN = await GNRequest({clientID: process.env.GN_CLIENT_ID, clientSecret: process.env.GN_CLIENT_SECRET});
    for (const ticketId of ticketIds) {
        const _ticket = await UtilTicket.findOneById(ticketId);
        const cobResponse = await reqGN.get(`/v2/cob/${_ticket.txid}`);
        if (cobResponse.data.status != TicketStatusEnum.CONCLUIDA && _ticket.status == TicketStatusEnum.PENDING) {
          console.log(`Alterado status do ingresso: ${_ticket.id} para AVAILABLE`, new Date());
          await _ticket.update(
            {
              status: TicketStatusEnum.AVAILABLE,
              owner_user_id: null,
              txid: null,
              charge_id: null
            }
          );
        }
    }
  }

  async function updateTicketsToPending(items) {
    for (const item of items) {
        const ticketId = parseInt(item.reference_id);
        const _ticket = await UtilTicket.findOneById(ticketId);
  
        await _ticket.update(
          {
            status: TicketStatusEnum.PENDING
          }
        );
    }
  }

  function sendEmailPaymentInAnalysis(email) {
    const subject = "Pagamento Em Análise - EasyTicket";
    body = `<!DOCTYPE html>
                <html>
                    <head>
                        <title>Pagamento em Análise</title>
                    </head>
                <body>
                    <h1>Pagamento em Análise</h1>
                    <p>O seu pagamento está sendo analisado. Aguarde a confirmação.</p>
                </body>
            </html>`;
    EmailSend.sendMail(email, subject, body);
  }

  function sendEmailPaymentRefused(email) {
    const subject = "Pagamento Reprovado - EasyTicket";
    const body = `<!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="UTF-8">
                      <title>Pagamento Reprovado - EasyTicket</title>
                    </head>
                    <body>
                      <h1>Pagamento Reprovado</h1>
                      <p>Olá,</p>
                      <p>Infelizmente, seu pagamento foi reprovado.</p>
                      <p>O pagamento não foi autorizado pela instituição financeira ou ocorreu algum problema durante o processamento.</p>
                      <p>Por favor, verifique as informações do seu cartão de crédito e tente novamente.</p>
                      <p>Caso precise de assistência, entre em contato com nosso suporte.</p>
                      <p>Agradecemos por utilizar o EasyTicket.</p>
                      <p>Atenciosamente,<br>Equipe EasyTicket</p>
                    </body>
                    </html>
                    `;
      EmailSend.sendMail(email, subject, body);
  }

  async function parseDataOneStepCharge(payment, card, ticketsToPay, _company) {

    const dataPaymentToken = await PaymentToken.getPaymentToken(process.env.GN_ACCOUNT_IDENTIFIER_PAYEE_CODE, card, isDebug);
      
    if (!dataPaymentToken || !dataPaymentToken.data || !dataPaymentToken.data.payment_token) {
      throw new Error("Pagamento negado.")
    }
    
    payment.credit_card.customer.cpf = payment.credit_card.customer.cpf.replace(/[-.]/g, "");
    payment.credit_card.payment_token = dataPaymentToken.data.payment_token;

    let body = {
      payment: payment,
      items: await parseItems(ticketsToPay, _company),
      metadata: {
        notification_url: `${process.env.URL}/gerencianet/webhook-card`,
      }
    }
    return body
  }

  async function parseItems(ticketsToPay, _company) {
    const items = [];
    for (const ticket of ticketsToPay) {
      const valueWithTax = ticket.price + (ticket.price * process.env.PERCENT_MORE);
      const newItem = {
        name: ticket.uuid,
        value: valueWithTax,
        marketplace: {
          repasses: [{
            payee_code: _company.gn_account_identifier_payee_code,
            percentage: 8500
          }, 
          {
            payee_code: process.env.GN_ACCOUNT_IDENTIFIER_PAYEE_CODE,
            percentage: 1500
          }
        ]
        },
        amount: 1,
      }
      items.push(newItem);
    };
    return items;
  }

  module.exports = {
    getTicketsToPay,
    parseItems,
    parseCharges,
    ticketsCanceled,
    sendEmailTicketsCanceled,
    sendEmailTicketConfirmed,
    parseSplitData,
    ticketsPaid,
    sendEmailTicketApproved,
    parseDataOneStepCharge,
    parseCobData,
    ticketsToPending,
    updateTicketsToPending,
    updateTicketsToPedingOnQrCodeGenerate,
    updateTicketsToAvailable,
    sendEmailPaymentRefused,
    sendEmailPaymentInAnalysis
  };