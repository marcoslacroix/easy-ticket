const Ticket = require('../models/ticket')
const { Op } = require('sequelize');

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

module.exports = {
  findAllByIds
}