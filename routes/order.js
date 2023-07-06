const express = require("express");
const router = express.Router();
const Joi = require('joi');
const UtilJsonWebToken = require("../util/utilJsonWebToken");
const PagSeguro = require('../payment/PagSeguro');
const UtilUser = require("../util/utilUser");
const UtilDocument = require("../util/utilDocument");
const { sequelize } = require('../config/database');
const UtilPhone = require("../util/utilPhone");
const UtilTicketStatus = require("../util/utilTicketStatus");
const Order = require("../models/order");
const UtilTicket = require("../util/utilTicket");
const Ticket = require("../models/ticket");
const { v4: uuidv4 } = require('uuid');
const TicketStatus = require("../models/ticket_status");
const Lots = require("../models/lots");
const TicketStatusEnum = require("../enum/TicketStatusEnum");
const queue = require("../queue/queue");

async function getPhones(user) {
  const userPhones = await UtilPhone.findAllByUserId(user.id);
  const phones = [];
  for (const phone of userPhones) {
    const newPhone = {
      country: phone.country,
      area: phone.area_code,
      number: phone.number,
      type: phone.type
    }
    phones.push(newPhone);
  }
  return phones;
}

async function getItems(ids) {
  const items = [];
  const tickets = await UtilTicket.findAllByIds(ids);
  let totalValue = 0;

  for (const ticket of tickets) {
    const ticketStatus = await UtilTicketStatus.findOneByTicketId(ticket.id);
    if (ticketStatus && TicketStatusEnum.AVAILABLE != ticketStatus.status ) {
      throw new Error(`Ingresso ${ticket.id} não disponível`);
    }
    const _lots = await Lots.findOne({
      where:  {
        id: ticket.lots_id
      }
    });

    const newItem = {
      reference_id: ticket.id.toString(),
      name: ticket.name,
      quantity: 1,
      unit_amount: _lots.price
    }
    totalValue+= _lots.price;
    items.push(newItem);
  }
  if (items.length == 0) {
    throw new Error("Nenhum ingresso encontrado");
  }
  return {items, totalValue}
}

const paySchema = Joi.object({
    amount: Joi.object({
      value: Joi.number().required(),
      currency: Joi.string().required()
    }).required(),
    payment_method: Joi.object({
      type: Joi.string().valid('CREDIT_CARD').required(),
      installments: Joi.number().integer().required(),
      card: Joi.object({
        number: Joi.string().creditCard().required(),
        exp_month: Joi.string().length(2).required(),
        exp_year: Joi.string().length(4).required(),
        security_code: Joi.string().length(3).required(),
        holder: Joi.object({
          name: Joi.string().required()
        }).required(),
        store: Joi.boolean().required()
      }).required(),
    }).required()
});

router.post("/pay", UtilJsonWebToken.verifyToken, async function (req, res) {
  try {
    await sequelize.transaction(async (t1) => {
      const {error, value} = paySchema.validate(req.body);
      const decoded = UtilJsonWebToken.decodeToken(req);
      const user = await UtilUser.getUserByEmail(decoded.email);
      if (error) {
        throw new Error(error.details[0].message);
      }
      if (!user) {
        throw new Error("Usuário não encontrado")
      }
  
      const queryParams = req.query;
      const orderId = queryParams.orderId;
      if (!orderId) {
        throw new Error("ID do pedido não enviado");
      }
      const orderPagSeguro = await PagSeguro.getOrder(orderId);
      if (orderPagSeguro.data.charges) {
        for (const charge of orderPagSeguro.data.charges) {
          if (charge.status === TicketStatusEnum.PAID)
          throw new Error("Já foi realizado o pagamento desse pedido.");
        }
      }
  
      for (const item of orderPagSeguro.data.items) {
        const ticketStatus = await TicketStatus.findOne({
          where: {
            ticket_id: parseInt(item.reference_id)
          },
          order: [['created_on', 'DESC']],
          limit: 1
        });
  
        const tenMinutesLater = new Date(ticketStatus.created_on.getTime() + 10 * 60000);
        const now = new Date();
  
        if (now > tenMinutesLater || ticketStatus.status != TicketStatusEnum.PENDING) {
          throw new Error("Pedido expirado favor criar um novo.");
        }
  
      }
  
      const payload = {
        charges: [
          {
            reference_id: "referencia da cobranca",
            description: "descricao da cobranca",
            amount: {
              value: value.amount.value,
              currency: value.amount.currency
            },
            payment_method: {
              type: value.payment_method.type,
              installments: value.payment_method.installments,
              capture: true,
              card: {
                number: value.payment_method.card.number,
                exp_month: value.payment_method.card.exp_month,
                exp_year: value.payment_method.card.exp_year,
                security_code: value.payment_method.card.security_code,
                holder: {
                  name: value.payment_method.card.holder.name
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
      };
  
        /* todo adicionar no json split de pagamento
        
        "metadata": {
              "Key": "value"
          },
        "notification_urls": [
          "https://teste.site/testando"
        ], */
      const response = await PagSeguro.payOrder(orderId, payload);
      response?.data?.charges?.forEach((charge) => {
        delete charge.payment_method;
      });
  
      await Order.create({
        response: response.data,
        user_id: user.id,
        created_on: new Date()
      });
  
      const items = response.data.items;
      for (const item of items) {
        const ticketId = parseInt(item.reference_id);
  
        await Ticket.update(
          {
            sold: true,
            reserved_user_id: null,
            owner_user_id: user.id
          },
          {
            where: {
              id: ticketId
            },
          }
        );
  
        await TicketStatus.create({
          status: TicketStatusEnum.PAID,
          created_on: new Date(),
          ticket_id: ticketId
        });
  
      }
  
      res.status(200).json({message: "Pagamento realizado com sucesso"});
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

router.post("/create", UtilJsonWebToken.verifyToken, async function (req, res) {
  try {
    await sequelize.transaction(async (t1) => {
      const { ids } = req.body;
      const decoded = UtilJsonWebToken.decodeToken(req);
      const user = await UtilUser.getUserByEmail(decoded.email);

      if (!ids) {
        throw new Error("Nenhum ticket enviado");
      }
  
      const userDocument = await UtilDocument.findByUserId(user.id);
      const {items, totalValue} = await getItems(ids);
      const data = {
        "reference_id": uuidv4(),
        "customer": {
          "name": UtilUser.getCompleteName(user),
          "email": user.email,
          "tax_id": userDocument.value,
          "phones": await getPhones(user)
        },
        "items": items
      }

      const response = await PagSeguro.createOrder(data);
      response.data?.charges?.forEach((charge) => {
        delete charge.payment_method;
      });
      await Order.create({
        response: response.data,
        user_id: user.id,
        created_on: new Date()
      });
  
      for (const id of ids) {
  
        await Ticket.update(
          {
            reserved_user_id: user.id
          },
          {
            where: {
              id: id
            },
          }
        );
  
        await TicketStatus.create({
          status: TicketStatusEnum.PENDING,
          created_on: new Date(),
          ticket_id: id
        });
  
        const payload = {
          ticketId: id
        };
        
        const jsonPayload = JSON.stringify(payload);
        
        // todo delay 15 min 900000
        queue.publish("ticket-status", Buffer.from(jsonPayload), "200000");
      }
      res.status(200).json({order: response.data.id, message: "Pedido criado"});
    });
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error_messages) {
      const errorMessages = error.response.data.error_messages;
      res.status(400).json({ message: errorMessages });
    } else {
      console.error(error);
      res.status(400).json({ message: error.message });
    }
  }


});

module.exports = router;