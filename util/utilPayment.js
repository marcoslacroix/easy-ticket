const Ticket = require("../models/ticket");
const TicketStatusEnum = require("../enum/TicketStatusEnum");
const UtilTicket = require("../util/utilTicket");
const EmailSend = require("../email/send");

async function parseItems(tickets, transaction) {
    const items = [];
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
      
      if (_tickets.length == 0) {
        throw new Error("Ingressos esgotados.");
      } else if (_tickets.length < ticket.quantity ) {
        throw new Error("Quantidade indisponivel.");
      }
  
      for (const ticketToAdd of _tickets) {
        await ticketToAdd.update({
            status: TicketStatusEnum.PENDING
        });
        const newItem = {
          reference_id: ticketToAdd.id.toString(),
          name: ticketToAdd.uuid.toString(),
          quantity: 1,
          unit_amount: ticketToAdd.price
        }
        totalPriceTickets+= ticketToAdd.price;
        items.push(newItem);
      }
    }
  
    return {
        items,
        totalPriceTickets
    };
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
            splits: {
              method: "FIXED",
              receivers: [
                  {
                      account: {
                          id: process.env.EASY_TICKET_PAGSEGURO_ACCOUNT_ID
                      },
                      amount: {
                          value: 20
                      }
                  },
                  {
                      account: {
                          id: process.env.EASY_TICKET_PAGSEGURO_ACCOUNT_ID
                      },
                      amount: {
                          value: 80
                      }
                  }
              ]
          }
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


  function sendEmailTicketApproved(ticketsPaid, amount, email) {
    const valuePaidFormated = formatCurrency(amount);
    const ticketHTML = createTicketHTML(ticketsPaid);
  
    const subject = "Pagamento Aprovado - EasyTicket";
    const paymentApprovedEmailTemplate = `<!DOCTYPE html>
                                            <html>
                                            <head>
                                              <meta charset="UTF-8">
                                              <title>Pagamento Aprovado - EasyTicket</title>
                                            </head>
                                            <body>
                                              <h1>Pagamento Aprovado</h1>
                                              <p>Olá,</p>
                                              <p>Seu pagamento foi aprovado com sucesso!</p>
                                              <p>O valor de ${valuePaidFormated} foi recebido e sua compra foi confirmada.</p>
                                              ${ticketHTML}
                                              <p>Agradecemos por utilizar o EasyTicket.</p>
                                              <p>Atenciosamente,<br>Equipe EasyTicket</p>
                                            </body>
                                            </html>`;
  
    EmailSend.sendMail(email, subject, paymentApprovedEmailTemplate);
  }

  async function updateTicketToPaidAndGenerateQrCode(items, userId) {
    let ticketsPaid = [];
    for (const item of items) {
        const ticketId = parseInt(item.reference_id);
        const _ticket = await UtilTicket.findOneById(ticketId);
        const qrCodeUrl = await UtilTicket.generateQRCode(_ticket.uuid);
  
        const ticketPaid = await _ticket.update(
          {
            owner_user_id: userId,
            status: TicketStatusEnum.PAID,
            qr_code: qrCodeUrl
          }
        );
  
        ticketsPaid.push(ticketPaid);
      }
      return ticketsPaid;
  }

  async function updateTicketsToAvailable(items) {
    for (const item of items) {
        const ticketId = parseInt(item.reference_id);
        const _ticket = await UtilTicket.findOneById(ticketId);
  
        await _ticket.update(
          {
            status: TicketStatusEnum.AVAILABLE
          },
          {
            where: {
              status: TicketStatusEnum.PENDING
            }
          }
        );
  
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

  module.exports = {
    parseItems,
    parseCharges,
    sendEmailTicketApproved,
    updateTicketToPaidAndGenerateQrCode,
    updateTicketsToPending,
    updateTicketsToAvailable,
    sendEmailPaymentRefused,
    sendEmailPaymentInAnalysis
  };