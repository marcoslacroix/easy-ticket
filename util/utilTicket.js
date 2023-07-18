const Ticket = require('../models/ticket')
const { Op } = require('sequelize');
const QRCode = require('qrcode');

async function findTicketForChecking(uuid) {
  try {
    const ticket = await Ticket.findOne({
      where: {
        uuid: uuid,
        status: TicketStatusEnum.PAID,
        is_used: false
      }
    });
    if (!_ticket) {
      throw new Error("Ingresso não localizado ou já foi utilizado.") 
    }
    return ticket;
  } catch(error) {
    throw error;
  }
}

function validateTicketIsSameEvent(_event, event) {
  if (_event.id != event) {
    throw new Error("Não é possível fazer o checking de outro evento.");
  }
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
  validateTicketIsSameEvent,
  setIsUsed,
  findTicketForChecking,  
  generateQRCode
}