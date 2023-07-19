const express = require('express');
const router = express.Router();
const Joi = require('joi');
const UtilJsonWebToken = require("../util/utilJsonWebToken");


const UtilDate = require("../util/utilDate");
const RolesEnum = require("../enum/RolesEnum");
const UtilUser = require("../util/utilUser");
const { Op, literal } = require('sequelize');
const UtilCompany = require("../util/utilCompany");
const moment = require("moment");
const UtilTicket = require("../util/utilTicket")
const UtilEvent = require("../util/utilEvent");
const TicketType = require('../enum/TicketTypeEnum')
const UtilLots = require("../util/utilLots");
const Ticket = require("../models/ticket");
const { v4: uuidv4 } = require('uuid');
const Lots = require("../models/lots");
const TicketStatusEnum = require("../enum/TicketStatusEnum");
const TicketSchema = require("../schemaValidate/ticketSchema");
const { ticketsCanceled } = require('../util/utilPayment');

router.post("/checking", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        const { error, value } = TicketSchema.checkingSchema.validate(req.body);
        if (error) {
            throw new Error(error.details[0].message);
        }
        const decoded = UtilJsonWebToken.decodeToken(req);
        const _user = await UtilUser.getUserById(decoded.userId);
        UtilUser.validateUserRoles(_user, [RolesEnum.CHECKING_TICKET]);

        const {uuid, event} = value;
        const _ticket = await UtilTicket.findTicketForChecking(uuid);
        const _lots = await UtilLots.findById(_ticket.lots_id);
        const _company = await UtilCompany.findByCompanyId(_lots.company_id);
        const _event = await UtilEvent.findById(_lots.event_id);
        UtilCompany.validaUserHasAccessToCompany(_user, _company.id);
        UtilTicket.validateTicketIsSameEvent(_event, event);
        UtilTicket.setIsUsed(_ticket, _event);
        res.status(200).json({message: "Entrada autorizada com sucesso!"});
    } catch(error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.post("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
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

        res.status(200).json({ lote: _lots.id  });

    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }

});

router.patch("/change-status", UtilJsonWebToken.verifyToken, async function (req, res) {
    try {
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
        
        res.status(200).json({});
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
})

router.get("/available", async function(req, res) {
    try {
        const params = req.query;
        const eventId = params.eventId;
        const decoded = UtilJsonWebToken.decodeToken(req);
        let quantityTicketsUserAlreadyBouthForThisEvent = 0;
        let _user;
        if (decoded) {
            _user = await UtilUser.getUserById(decoded.userId);
        }
        if (_user) {
            var lotsByEvent = await Lots.findAll({
                where: {
                    event_id: eventId
                }
            });
            console.log(lotsByEvent);
            var tickets = await Ticket.findAll({
                where: {
                    status: TicketStatusEnum.PAID,
                    owner_user_id: _user.id,
                    lots_id: {
                        [Op.in]: lotsByEvent.map(it => it.id)
                    }
                }
            })
            if (tickets) {
                quantityTicketsUserAlreadyBouthForThisEvent = tickets.length;
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

        res.status(200).json(
            {
                lots,
                quantityTicketsUserAlreadyBouthForThisEvent: quantityTicketsUserAlreadyBouthForThisEvent
            }
        )

    } catch (error) {
        console.error(error);
        res.status(400).json({error: error.message});
    }
})

router.patch("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
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
                startSales: lots.startSales,
                endSales: lots.endSales
            },
            {
                where: {
                    id: lots.id
                }
            }
        )
    
        res.status(200).json({ message: "Lote alterado com sucesso." });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;