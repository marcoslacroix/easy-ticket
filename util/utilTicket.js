const Ticket = require('../models/ticket')
const { Op } = require('sequelize');
const QRCode = require('qrcode');
const TicketStatusEnum = require("../enum/TicketStatusEnum");
const Lots = require("../models/lots");

async function findTicketForCheckin(uuid) {
  try {
    const ticket = await Ticket.findOne({
      where: {
        uuid: uuid,
        status: TicketStatusEnum.PAID,
        is_used: false
      }
    });
    if (!ticket) {
      throw new Error("Desculpe, o ingresso não foi encontrado ou já foi utilizado.")
    }
    return ticket;
  } catch(error) {
    throw error;
  }
}

async function findAllTicketsUserBought(_user, eventId) {
  var lotsByEvent = await Lots.findAll({
    where: {
        event_id: eventId
    }
  });
  var tickets = await Ticket.findAll({
    where: {
        status: TicketStatusEnum.PAID,
        owner_user_id: _user.id,
        lots_id: {
            [Op.in]: lotsByEvent.map(it => it.id)
        }
    }
  })

  return tickets;
}

async function setIsUsed(_ticket) {
  await _ticket.update({
    is_used: true
  })

}

async function findAllByIds(ids) {
  try {
    return await Ticket.findAll({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });
  } catch (error) {
    console.error('Erro na busca dos ingressos: ', error);
    throw error;
  }
}
const generateQRCode = async (dados) => {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(dados, (err, qrCodeUrl) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(qrCodeUrl);
    });
  });
};

async function findOneById(id) {
  try {
      return await Ticket.findOne({
        where: {
          id: id
        }
      });
  } catch (error) {
      console.error('Erro na busca do ingresso: ', error);
      throw error;
  }
}

module.exports = {
  findAllByIds,
  findOneById,
  setIsUsed,
  findTicketForCheckin,  
  findAllTicketsUserBought,
  generateQRCode
}