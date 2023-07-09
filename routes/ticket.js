const express = require('express');
const router = express.Router();
const Joi = require('joi');
const UtilJsonWebToken = require("../util/utilJsonWebToken");

const RolesEnum = require("../enum/RolesEnum");
const UtilUser = require("../util/utilUser");
const UtilCompany = require("../util/utilCompany");
const UtilTicket = require("../util/utilTicket")
const UtilEvent = require("../util/utilEvent");
const UtilLots = require("../util/utilLots");
const Ticket = require("../models/ticket");
const { v4: uuidv4 } = require('uuid');
const Lots = require("../models/lots");
const TicketStatusEnum = require("../enum/TicketStatusEnum");
const TicketSchema = require("../schemaValidate/ticketSchema");

router.post("/checking", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        const { error, value } = TicketSchema.checkingSchema.validate(req.body);
        if (error) {
            throw new Error(error.details[0].message);
        }
        const decoded = UtilJsonWebToken.decodeToken(req);
        const _user = await UtilUser.getUserById(decoded.userId);
        UtilUser.validateUserRoles(_user, [RolesEnum.CHECKING_TICKET]);

        const {uuid} = value;
        const _ticket = await UtilTicket.findTicketForChecking(uuid);

        const _lots = await Lots.findOne({
            where: {
                id: _ticket.lots_id
            }
        });
        const _company = await UtilCompany.findByCompanyId(_lots.company_id);
        UtilCompany.validaUserHasAccessToCompany(_user, _company.id);

        await _ticket.update({
            is_used: true
        })

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

        res.status(200).json({ message: "Ingressos criado." });

    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }

});

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