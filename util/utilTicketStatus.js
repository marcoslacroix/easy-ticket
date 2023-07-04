const { Op } = require('sequelize');
const TicketStatus = require("../models/ticket_status");
const TicketStatusEnum = require("../enum/TicketStatusEnum");
const Ticket = require("../models/ticket");

async function findOneByTicketId(id) {
    try {
        return await TicketStatus.findOne({
          where: {
            ticket_id: id
          },
          order: [['created_on', 'DESC']],
          limit: 1
        });
    } catch (error) {
        console.error('Erro na busca do status: ', error);
        throw error;
    }
}

async function changeStatusForAvailableIfNotPaid(ticketStatusId) {
  try {
    const tickerStatus = await TicketStatus.findOne({
      where: {
        ticket_id: ticketStatusId
      },
      order: [['created_on', 'DESC']],
      limit: 1
    });

    if (TicketStatusEnum.PENDING == tickerStatus.status ) {
      await TicketStatus.create({
        status: TicketStatusEnum.AVAILABLE,
        created_on: new Date(),
        ticket_id: tickerStatus.ticket_id
      })

      await Ticket.update(
        {
          reserved_user_id: null
        },
        {
          where: {
            id: tickerStatus.ticket_id
          },
        }
      );

    }

  } catch (error) {
    console.log(error);
    throw error;
  }
}

module.exports = {
    findOneByTicketId,
    changeStatusForAvailableIfNotPaid
}