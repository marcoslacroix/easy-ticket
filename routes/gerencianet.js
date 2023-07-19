let isDebug = false;
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
  isDebug = true;
}
const options = require('../credentials')
const Gerencianet = require('gn-api-sdk-node')
const UtilJsonWebToken = require("../util/utilJsonWebToken");
const express = require("express");
const Charge = require("../models/charge")
const router = express.Router();
const GNRequest = require('../apis/gerencianet');
const { sequelize } = require('../config/database');
const UtilPayment = require("../util/utilPayment");
const UtilUser = require("../util/utilUser");
const TicketStatusEnum = require("../enum/TicketStatusEnum");
const Queue = require("../queue/queue");
const PaySchema = require("../schemaValidate/paySchema");
const UtilCompany = require("../util/utilCompany");
const UtilCompanyDocument = require("../util/utilCompanyDocument");

router.get("/getInstallments", UtilJsonWebToken.verifyToken, async (req, res) => {
  try {
    const gerencianet = new Gerencianet(options);
    const params = {
      'brand': req.query.brand,
      'total': req.query.total
    };
    const response = await gerencianet.getInstallments(params);
    res.status(200).json({"data": response.data});
  } catch (error) {
    res.status(400).send({message: error.message});
  }

}) 

router.post("/pay", UtilJsonWebToken.verifyToken, async (req, res) => {
  try {
    await sequelize.transaction(async (t1) => {
      const {error, value} = PaySchema.ticketsPaymentByCard.validate(req.body);
      if (error) {
        throw new Error(error.details[0].message);
      }
      const decoded = UtilJsonWebToken.decodeToken(req);
      const _user = await UtilUser.getUserByEmail(decoded.email);
      const {company, tickets, card, payment } = value;
      const _company = await UtilCompany.findByCompanyId(company);
      UtilCompany.validateGnAccountIdentifierPayeeCode(_company);
      validateEasyTicketGnAccountIdentifierToken();
      const { ticketsToPay} = await UtilPayment.getTicketsToPay(tickets, t1, _company.id);
      const gerencianet = new Gerencianet(options);
      const response = await gerencianet.createOneStepCharge([], await UtilPayment.parseDataOneStepCharge(payment, card, ticketsToPay, _company));
      await Charge.create({
        user_id: _user.id,
        charge_id: response.data.charge_id,
        company_id: _company.id,
        created_on: new Date()
      })
      await UtilPayment.ticketsToPending({tickets: ticketsToPay, chargeId: response.data.charge_id});
      res.status(200).send({ message: response });
    })
  } catch (error) {
    console.error(error);
    if (error.error_description) {
      res.status(400).send({message: error.error_description});
    } else {
      res.status(400).send({message: error.message});
    }
  }
  
})

function validateEasyTicketGnAccountIdentifierToken() {
  if (!process.env.GN_ACCOUNT_IDENTIFIER_PAYEE_CODE) {
    throw new Error("Easy Ticket sem o GN_ACCOUNT_IDENTIFIER");
  }
}

async function associateSplitToCobranca(txid, _company, reqGN, companyDocument) {
  let gn_split_config;
  if (_company.gn_split_config) {
    gn_split_config = _company.gn_split_config;
  } else {
    const splitResponse = await reqGN.post('/v2/gn/split/config', UtilPayment.parseSplitData(companyDocument.type, _company.gn_account, companyDocument.value));
    _company.update({ gn_split_config: splitResponse.data.id});
    gn_split_config = splitResponse.data.id;
  }

  await reqGN.put(`/v2/gn/split/cob/${txid}/vinculo/${gn_split_config}`);
}

router.post('/getQrCode', UtilJsonWebToken.verifyToken, async (req, res) => {
  try {
    await sequelize.transaction(async (t1) => {
      const reqGN = await GNRequest({clientID: process.env.GN_CLIENT_ID, clientSecret: process.env.GN_CLIENT_SECRET});
      const {error, value} = PaySchema.ticketsPayment.validate(req.body);
      if (error) {
        throw new Error(error.details[0].message);
      }
      const decoded = UtilJsonWebToken.decodeToken(req);
      const _user = await UtilUser.getUserByEmail(decoded.email);
      const {tickets, company} = value;
      const _company = await UtilCompany.findByCompanyId(company);
      UtilCompany.validateGnAccount(_company);
      const companyDocument = await UtilCompanyDocument.findByCompany(company);
      const { ticketsToPay, totalPriceTickets } = await UtilPayment.getTicketsToPay(tickets, t1, _company.id);
      const cobResponse = await reqGN.post('/v2/cob', UtilPayment.parseCobData(totalPriceTickets));
      const txid = cobResponse.data.txid;
      await Charge.create({
        user_id: _user.id,
        txid: txid,
        company_id: _company.id,
        created_on: new Date()
      })
      await associateSplitToCobranca(txid, _company, reqGN, companyDocument);
      await UtilPayment.ticketsToPending({tickets: ticketsToPay, txid: txid});
      const qrcodeResponse = await reqGN.get(`/v2/loc/${cobResponse.data.loc.id}/qrcode`);
      publicTicketsToQueue(ticketsToPay);
      res.status(201).json({message: qrcodeResponse.data});
  });
  } catch (error) {
    console.error('Error:', error);
    if (error?.data?.mensagem) {
      res.status(400).send({message: error?.data?.mensagem});
      return;
    }
    res.status(400).send({message: error.message})
  }
});

function publicTicketsToQueue(ticketsToPay) {
  const ticketsId = ticketsToPay.map(it => it.id);
  const payload = JSON.stringify(ticketsId);
  const content = Buffer.from(payload);
  // 600000 = 10 minutos
  Queue.publish("ticket-status", content, 600000);
}

router.post('/webhook-card', async (req, res) => {
  try {
    const notification = req.body.notification;

    const gerencianet = new Gerencianet(options)
    let params = {
      token: notification,
    }
    const response = await gerencianet.getNotification(params);
    if (response && response.code == 200) {
      const lastStatus = response.data[response.data.length - 1];
      const chargeId = lastStatus.identifiers.charge_id;
      const currentStatus = lastStatus.status.current;
      if (currentStatus == TicketStatusEnum.APPROVED) {
        //await UtilPayment.sendEmailTicketApproved({chargeId: chargeId});
      } else if (currentStatus == TicketStatusEnum.PAID) {
        const ticketsPaid = await UtilPayment.ticketsPaid({chargeId: chargeId});
        //await UtilPayment.sendEmailTicketConfirmed({ticketsPaid: ticketsPaid, amount: lastStatus.value, chargeId: chargeId});
      } else if (currentStatus == TicketStatusEnum.CANCELED || currentStatus == TicketStatusEnum.REFUNDED || currentStatus == TicketStatusEnum.UNPAID) {
        const ticketsCanceled = await UtilPayment.ticketsCanceled({chargeId: chargeId});
        //await UtilPayment.sendEmailTicketsCanceled({ticketsCanceled: ticketsCanceled, chargeId: chargeId})
      } 
    }
    res.status(200).json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({});
  }
  
});


router.post('/webhook(/pix)?', async (req, res) => {
    console.log("Recebido webhook PIX");
    const reqGN = await GNRequest({ clientID: process.env.GN_CLIENT_ID, clientSecret: process.env.GN_CLIENT_SECRET});
    const body = req.body;
    console.log("body:", body);
    if (body.pix) {
      const txid = body?.pix[0]?.txid;
      const respCobranca = await reqGN.get(`/v2/cob/${txid}`);
      const cobranca = respCobranca.data;
      console.log("cobranca.status: ", cobranca.status);
      if (cobranca.status == TicketStatusEnum.CONCLUIDA) {
        const ticketsPaid = await UtilPayment.ticketsPaid({txid: txid});
        //await UtilPayment.sendEmailTicketConfirmed({ticketsPaid: ticketsPaid, amount: cobranca.valor.original, txid: txid});
      }
    }
    res.status(200).json({});
});

module.exports = router;