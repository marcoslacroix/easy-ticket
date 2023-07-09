const Ticket = require("../models/ticket");
const TicketStatusEnum = require("../enum/TicketStatusEnum");

async function parseItems(tickets) {
    const items = [];
    for (const ticket of tickets) {
      const _tickets = await Ticket.findAll({
        where: {
          lots_id: ticket.lots,
          type: ticket.type,
          status: TicketStatusEnum.AVAILABLE
        },
        limit: ticket.quantity
      });
      
      if (_tickets.length == 0) {
        throw new Error("Ingressos esgotados.");
      } else if (_tickets.length < ticket.quantity ) {
        throw new Error("Quantidade indisponivel.");
      }
  
      for (const ticketToAdd of _tickets) {[]
        const newItem = {
          reference_id: ticketToAdd.id.toString(),
          name: ticketToAdd.uuid.toString(),
          quantity: 1,
          unit_amount: ticketToAdd.price
        }
        items.push(newItem);
      }
    }
  
    return items;
  }

  function parseCharges(amount, payment_method) {
    const charges = [
        {
          reference_id: "referencia da cobranca",
          description: "descricao da cobranca",
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
                          id: "ACCO_22222222-ABCD-2222-AABB-AA22222222BB"
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
  

  module.exports = {
    parseItems,
    parseCharges
  };