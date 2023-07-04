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
  findOneById
}