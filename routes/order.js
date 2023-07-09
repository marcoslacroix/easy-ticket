const express = require("express");
const router = express.Router();
const UtilJsonWebToken = require("../util/utilJsonWebToken");
const PagSeguro = require('../payment/PagSeguro');
const UtilUser = require("../util/utilUser");
const { sequelize } = require('../config/database');
const Order = require("../models/order");
const UtilTicket = require("../util/utilTicket");
const { v4: uuidv4 } = require('uuid');
const TicketStatusEnum = require("../enum/TicketStatusEnum");
const PaySchema = require("../schemaValidate/paySchema");
const UtilPayment = require("../util/utilPayment");


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

      const {tickets, customer, amount, payment_method} = value;
      
      const data = {
        "reference_id": uuidv4(),
        "customer": {
          "name": customer.name,
          "email": customer.email,
          "tax_id": customer.document,
          "phones": customer.phones
        },
        "items": await UtilPayment.parseItems(tickets),
        "charges": UtilPayment.parseCharges(amount, payment_method)
      }

      const response = await PagSeguro.createOrder(data);
      let statusPayment;
      let paymentRespopnse;
      response?.data?.charges?.forEach((charge) => {
        if (charge.status === "DECLINED") {
          statusPayment = "DECLINED";
          paymentRespopnse = charge.payment_response.message;
        } else if (charge.status === "PAID") {
          statusPayment = "PAID";
        }
        delete charge.payment_method;
      });

      if (statusPayment != "PAID") {
        throw new Error(paymentRespopnse ? paymentRespopnse : "Houve um erro para realizar o pagamento")
      }

      await Order.create({
        response: response.data,
        user_id: user.id,
        created_on: new Date()
      });
  
      const responseItems = response.data.items;
      for (const item of responseItems) {
        const ticketId = parseInt(item.reference_id);
        const _ticket = await UtilTicket.findOneById(ticketId);
        const qrCodeUrl = await UtilTicket.generateQRCode(_ticket.uuid);
  
        await _ticket.update(
          {
            owner_user_id: user.id,
            status: TicketStatusEnum.PAID,
            qr_code: qrCodeUrl
          }
        );
      }
    
      
      res.status(200).json({message: "Pagamento realizado com sucesso"});
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