const express = require("express");
const router = express.Router();
const UtilJsonWebToken = require("../util/utilJsonWebToken");
const PagSeguro = require('../payment/PagSeguro');
const UtilUser = require("../util/utilUser");
const UtilDocument = require("../util/utilDocument");
const UtilPhone = require("../util/utilPhone");
const Order = require("../models/order");
const UtilTicket = require("../util/utilTicket");
const { v4: uuidv4 } = require('uuid');

const chargers = [
    {
        "reference_id": "referencia da cobranca",
        "description": "descricao da cobranca",
        "amount": {
            "value": 100,
            "currency": "BRL"
        },
        "payment_method": {
            "type": "CREDIT_CARD",
            "installments": 1,
            "capture": true,
            "card": {
                "number": "4111111111111111",
                "exp_month": "12",
                "exp_year": "2026",
                "security_code": "123",
                "holder": {
                    "name": "Jose da Silva"
                },
                "store": false
            }
        },
    }
];


router.post("/create-and-pay" , UtilJsonWebToken.verifyToken, async function (req, res) {
  try {
    const decoded = UtilJsonWebToken.decodeToken(req);
    const user = await UtilUser.getUserByEmail(decoded.email);
    if (!user) {
      throw new Error("Usuário não encontrado")
    }

    const dataWithPayment = {
      "reference_id": "ex-00001",
      "chargers": chargers
  }
  
    PagSeguro.createOrder(dataWithPayment).then(order => {
      console.log(order.data);
      res.status(200).json({message: "Compra realizada com sucesso"});
    });
  } catch (error) {
    res.status(400).json({message: error.message});
  }
});

router.post("/create", UtilJsonWebToken.verifyToken, async function (req, res) {
  try {
    const { ids } = req.body;
    const decoded = UtilJsonWebToken.decodeToken(req);
    const user = await UtilUser.getUserByEmail(decoded.email);
    if (!user) {
      throw new Error("Usuário não encontrado")
    }
    if (!ids) {
      throw new Error("Nenhum ticket enviado");
    }
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

    const items = [];
    const tickets = await UtilTicket.findAllByIds(ids);
    console.log(tickets);

    for (const ticket of tickets) {
      const newItem = {
        reference_id: ticket.id.toString(),
        name: ticket.id,
        quantity: 1,
        unit_amount: ticket.price
      }
      items.push(newItem);
    }

    const userDocument = await UtilDocument.findByUserId(user.id);
    console.log("user document: ", userDocument.value);
    console.log("phones", phones);
    const data = {
      "reference_id": uuidv4(),
      "customer": {
        "name": UtilUser.getCompleteName(user),
        "email": user.email,
        "tax_id": userDocument.value,
        "phones": phones
      },
      "items": items
    }

    console.log("data send: ", data);
    const response = await PagSeguro.createOrder(data);
    await Order.create({
      response: response.data,
      created_on: new Date()
    });
    res.status(200).json({message: "Pedido criado"});


  } catch (error) {
    if (error.response && error.response.data && error.response.data.error_messages) {
      const errorMessages = error.response.data.error_messages;
      res.status(400).json({ message: errorMessages });
    } else {
      res.status(400).json({ message: error.message });
    }
  }


});

module.exports = router;