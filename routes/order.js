const express = require("express");
const router = express.Router();
const UtilJsonWebToken = require("../util/utilJsonWebToken");
const PagSeguro = require('../payment/PagSeguro');
const UtilUser = require("../util/utilUser");
const User = require("../models/user");
const { sequelize } = require('../config/database');
const Order = require("../models/order");
const UtilTicket = require("../util/utilTicket");
const Queue = require("../queue/queue");
const { v4: uuidv4 } = require('uuid');
const TicketStatusEnum = require("../enum/TicketStatusEnum");
const PaySchema = require("../schemaValidate/paySchema");
const UtilPayment = require("../util/utilPayment");
const { custom } = require("joi");
const Ticket = require("../models/ticket");


router.post("/payment-return", async function (req, res) {
  const payload = req.body;
  const userId = parseInt(payload.reference_id);
  try {
    let statusPayment;
  
    let amountPaid = 0;
    payload.charges?.forEach((charge) => {
      statusPayment = charge?.status;
      paymentResponse = charge?.payment_response?.message;
      amountPaid = charge?.amount?.summary?.paid;
      delete charge?.payment_method;
    });
  
    console.log("Pagamento retornado as: ", new Date());
    console.log("Com o status de: ", statusPayment);
    console.log("orderId: ", payload.id);
    console.log("--------------------------------");
  
    if (statusPayment == TicketStatusEnum.PAID) {
      let ticketsPaid = await UtilPayment.updateTicketToPaidAndGenerateQrCode(payload.items, userId);
      if (ticketsPaid) {
        //UtilPayment.sendEmailTicketApproved(ticketsPaid, amountPaid, payload.customer.email);
      }
    } else if (statusPayment == TicketStatusEnum.IN_ANALYSIS) {
      await UtilPayment.updateTicketsToPending(payload.items);
      //UtilPayment.sendEmailPaymentInAnalysis(payload.customer.email);
    } else if (statusPayment == TicketStatusEnum.DECLINED || statusPayment == Ticket.CANCELED){
      await UtilPayment.updateTicketsToAvailable(payload.items);
      //UtilPayment.sendEmailPaymentRefused(payload.customer.email);
    }

    await Order.create({
      response: payload,
      user_id: userId,
      created_on: new Date()
    });

    res.status(200).json({message: "Recebido."});

  } catch (error) {
    console.error(error);
    await Order.create({
      response: payload,
      user_id: userId,
      error: error.message,
      created_on: new Date()
    });
  }
  
});

router.post("/pay", UtilJsonWebToken.verifyToken, async function (req, res) {
  try {
    await sequelize.transaction(async (t1) => {
      const {error, value} = PaySchema.payObject.validate(req.body);
      const decoded = UtilJsonWebToken.decodeToken(req);
      const user = await UtilUser.getUserByEmail(decoded.email);
      if (error) {
        throw new Error(error.details[0].message);
      }
      if (!user) {
        throw new Error("Usuário não encontrado")
      }

      const {tickets, customer, amount, payment_method, isQrCode} = value;

      const { items, totalPriceTickets } = await UtilPayment.parseItems(tickets, t1);
      if (totalPriceTickets != amount.value) {
        throw new Error("O valor total dos ingressos não corresponde ao valor fornecido pelo usuário");
      }
      const data = {
        "reference_id": user.id,
        "customer": {
          "name": customer.name,
          "email": customer.email,
          "tax_id": customer.document,
          "phones": customer.phones
        },
        "items": items,
        "charges": payment_method ? UtilPayment.parseCharges(amount, payment_method) : null,
        "notification_urls": [
          `${process.env.URL}/order/payment-return`
        ]
      }

      if (isQrCode) {
        const expirationDate =  new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + 5);
        data.qr_codes = [
          {
            "amount": {
              "value": amount.value
            },
            "expiration_date": expirationDate
          }
        ]
      };

      const response = await PagSeguro.createOrder(data);
      let statusPayment;
      let paymentResponse;
      response?.data?.charges?.forEach((charge) => {
        statusPayment = charge?.status;
        paymentResponse = charge?.payment_response?.message;
      });
  
            
      if(response?.data?.qr_codes) {
        await UtilPayment.updateTicketsToPending(response.data.items);
        const payload = JSON.stringify(response.data.items);
        const content = Buffer.from(payload);
        Queue.publish("ticket-status", content, 600000);
        return res.status(201).json({message: response.data.qr_codes});
      } else if (statusPayment == TicketStatusEnum.PAID) {
        return res.status(200).json({message: "Pagamento aprovado."});
      } else if (statusPayment == TicketStatusEnum.IN_ANALYSIS) {
        return res.status(200).json({message: "Seu pagamento está em análise"});
      } else {
        return res.status(400).json({ error: paymentResponse ? paymentResponse : 'Erro no pagamento' });
      }
      
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