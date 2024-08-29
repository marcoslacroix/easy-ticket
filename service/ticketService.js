const express = require('express');
const Joi = require('joi');
const UtilJsonWebToken = require("../util/utilJsonWebToken");

const { createCanvas } = require('canvas');
const QRCode = require('qrcode');
const { sequelize } = require('../config/database');
const RolesEnum = require("../enum/RolesEnum");
const UtilUser = require("../util/utilUser");
const { Op, literal } = require('sequelize');
const UtilCompany = require("../util/utilCompany");
const UtilTicket = require("../util/utilTicket")
const UtilEvent = require("../util/utilEvent");
const TicketType = require('../enum/TicketTypeEnum')
const UtilLots = require("../util/utilLots");
const Ticket = require("../models/ticket");
const { v4: uuidv4 } = require('uuid');
const Event = require("../models/event");
const Lots = require("../models/lots");
const TicketStatusEnum = require("../enum/TicketStatusEnum");
const TicketSchema = require("../schemaValidate/ticketSchema");

async function getAvailable(req) {

    const params = req.query;
    const eventId = params.eventId;
    const decoded = UtilJsonWebToken.decodeToken(req);
    let quantityTicketsUserAlreadyBougthForThisEvent = 0;
    let _user;
    if (decoded) {
        _user = await UtilUser.getUserById(decoded.userId);
    }
    if (_user) {
        var tickets = await UtilTicket.findAllTicketsUserBought(_user, eventId);
        if (tickets) {
            quantityTicketsUserAlreadyBougthForThisEvent = tickets.length;
        }
    }

    const _lots = await Lots.findAll({
        where: {
            active: true,
            event_id: eventId,
            [Op.and]: [
                { start_sales: { [Op.lte]: literal('CURRENT_DATE') } }, // Use CURRENT_DATE to compare with the start_sales column directly
                { end_sales: { [Op.gte]: literal('CURRENT_DATE') } } // Use CURRENT_DATE to compare with the end_sales column directly
                ]
        }
    })

    let lots = [];

    for (const lote of _lots) {
        const lot = {
            id: lote.id,
            description: lote.description,
            startsales: lote.start_sales,
            endSales: lote.end_sales
        }
        const tickets = [];
        const ticketFemale = await Ticket.findAll({
            where: {
                type: TicketType.FEMALE,
                status: TicketStatusEnum.AVAILABLE,
                lots_id: lote.id
            }
        })

        if (ticketFemale.length > 0) {
            const ticket = {
                quantity: ticketFemale.length,
                type: TicketType.FEMALE,
                price: ticketFemale[0]?.price
            }
            tickets.push(ticket)
        }

        const ticketMale = await Ticket.findAll({
            where: {
                type: TicketType.MALE,
                status: TicketStatusEnum.AVAILABLE,
                lots_id: lote.id
            }
        })

        if (ticketMale.length > 0) {
            const ticket = {
                quantity: ticketMale.length,
                type: TicketType.MALE,
                price: ticketMale[0]?.price
            }
            tickets.push(ticket)
        }
        
        if (tickets.length > 0 ) {
            lots.push({
                lot: lot,
                tickets: tickets
            });
        }
    }
     
    return {
        lots: lots,
        quantityTicketsUserAlreadyBougthForThisEvent: quantityTicketsUserAlreadyBougthForThisEvent
    }
}

async function update(req) {
    return sequelize.transaction(async (t1) => {
        const { error, value } = TicketSchema.updateLotsSchema.validate(req.body);
        if (error) {
            throw new Error(error.details[0].message);
        }
        const {lots} = value;
        const decoded = UtilJsonWebToken.decodeToken(req);
        const _user = await UtilUser.getUserById(decoded.userId);
        UtilUser.validateUserRoles(_user, [RolesEnum.UPDATE_LOTS]);
        const _lots = await UtilLots.findById(lots.id);
        const _company = await UtilCompany.findByCompanyId(_lots.company_id);
        UtilCompany.validaUserHasAccessToCompany(_user, _company.id);
        
        await _lots.update(
            {
                description: lots.description,
                start_sales: lots.startSales,
                end_sales: lots.endSales
            },
            {
                where: {
                    id: lots.id
                }
            }
        )
        
        return {
            id: _lots.id,
            description: _lots.description,
            start_sales: _lots.startSales,
            end_sales: _lots.endSales
        }
    });
}

async function updateStatus(req) {
    const queryParams = req.query;
    const lotId = queryParams.lotId;
    const status = queryParams.status;
    const decoded = UtilJsonWebToken.decodeToken(req);
    const _user = await UtilUser.getUserById(decoded.userId);
    UtilUser.validateUserRoles(_user, [RolesEnum.UPDATE_LOTS]);
    const _lots = await UtilLots.findById(lotId);
    const _company = await UtilCompany.findByCompanyId(_lots.company_id);
    UtilCompany.validaUserHasAccessToCompany(_user, _company.id);

    _lots.update({
        active: status
    })
}

async function checkin(req) {
    const { error, value } = TicketSchema.checkinSchema.validate(req.body);
    if (error) {
        throw new Error(error.details[0].message);
    }
    const decoded = UtilJsonWebToken.decodeToken(req);
    const _user = await UtilUser.getUserById(decoded.userId);
    UtilUser.validateUserRoles(_user, [RolesEnum.CHECKIN_TICKET]);

    const {uuid, event} = value;
    console.log("evnt: ", event);
    const _ticket = await UtilTicket.findTicketForCheckin(uuid);
    const _lots = await UtilLots.findByIdAndEventId(_ticket.lots_id, event);
    const _company = await UtilCompany.findByCompanyId(_lots.company_id);
    const _event = await UtilEvent.findById(_lots.event_id);
    validateAllowCheckin(_event);
    UtilCompany.validaUserHasAccessToCompany(_user, _company.id);
    UtilTicket.setIsUsed(_ticket, _event);
}

function validateAllowCheckin(_event) {
    const currentDate = new Date().toISOString().slice(0, 10);
    const eventDate = new Date(_event.period).toISOString().slice(0, 10);
    const oneDayInMillis = 24 * 60 * 60 * 1000;
    const diffInDays = Math.abs(new Date(currentDate) - new Date(eventDate)) / oneDayInMillis;

    if (diffInDays > 1) {
        throw new Error("Checkin permitido somente um dia antes ou um dia depois do evento.");
    }
}

async function createTickets(req) {
    return sequelize.transaction(async (t1) => {
        const { error, value } = TicketSchema.createSchema.validate(req.body);
        if (error) {
            throw new Error(error.details[0].message);
        }
        const {event, tickets, lots} = value;
        const decoded = UtilJsonWebToken.decodeToken(req);
        const _user = await UtilUser.getUserById(decoded.userId);
        UtilUser.validateUserRoles(_user, [RolesEnum.CREATE_TICKET]);

        const _event = await UtilEvent.findById(event.id);
        const _company = await UtilCompany.findByCompanyId(_event.company_id);
        UtilCompany.validaUserHasAccessToCompany(_user, _company.id);

        const _lots = await Lots.create({
            description: lots.description,
            company_id: _company.id,
            created_on: new Date(),
            start_sales: lots.startSales,
            end_sales: lots.endSales,
            active: true,
            event_id: _event.id
        });

        for (const item of tickets) {
            for (let i = 0; i < item.quantity; i++) {
                await Ticket.create({
                    uuid: uuidv4(),
                    created_on: new Date(),
                    price: item.price,
                    status: TicketStatusEnum.AVAILABLE,
                    type: item.type,
                    lots_id: _lots.id,
                });
            }
        }
        return {
            id: _lots.id,
            description: _lots.description,
            startSales: _lots.start_sales,
            endSales: _lots.end_sales
        };
    })
}

async function generateQRCodeDataUrl(data) {
    try {
      const dataString = data.toString('utf8'); // Convert binary data to a string
      const canvas = createCanvas();
      await QRCode.toCanvas(canvas, dataString);
      const qrCodeDataUrl = canvas.toDataURL('image/png');
      return qrCodeDataUrl;
    } catch (err) {
      throw err;
    }
  }

async function findMyTickets(req) {
    const decoded = UtilJsonWebToken.decodeToken(req);
    let _user = await UtilUser.getUserById(decoded.userId);
    let userTickets = await Ticket.findAll({
        where: {
            owner_user_id: _user.id
        }
    });

    var tickets = [];

    for (const ticket of userTickets) {
        const lote = await Lots.findOne({
            where: {
                id: ticket.lots_id
            }
        });

        const event = await Event.findOne({
            where: {
                id: lote.event_id
            } 
        });

        const item = {
            uuid: ticket.uuid,
            type: ticket.type,
            lot: {
                name: lote.description
            },
            event: {
                name: event.name,
                start: event?.start?.substring(0, 5),
                period: event.period,
            }
        }
        tickets.push(item);
    }
    return tickets;
}

async function findByUuid(req) {
    const queryParams = req.query;
    const uuid = queryParams.uuid;

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

    const lote = await Lots.findOne({
        where: {
            id: ticket.lots_id
        }
    });

    const event = await Event.findOne({
        where: {
            id: lote.event_id
        }
    });

    return {
        "ticket": {
            "type": ticket.type
        },
        "event": {
            "name": event.name,
            "id": event.id,
        },
        "lot": {
            "description": lote.description
        }
    };


}

async function getQrcode(req) {
    const decoded = UtilJsonWebToken.decodeToken(req);
    let _user = await UtilUser.getUserById(decoded.userId);

    const queryParams = req.query;
    const uuid = queryParams.uuid;

    const ticket = await Ticket.findOne({
        where: {
            uuid: uuid,
            owner_user_id: _user.id
        }
    })

    return ticket.qr_code;

}

module.exports = {
    findMyTickets,
    getAvailable,
    checkin,
    getQrcode,
    createTickets,
    findByUuid,
    update,
    updateStatus
}