const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { sequelize } = require('../config/database');
const UtilJsonWebToken = require("../util/utilJsonWebToken");

const Event = require("../models/event");
const RolesEnum = require("../enum/RolesEnum");
const UtilUser = require("../util/utilUser");
const UtilCompany = require("../util/utilCompany");
const UtilEvent = require("../util/utilEvent");
const UtilLots = require("../util/utilLots");
const Ticket = require("../models/ticket");
const TicketStatus = require("../models/ticket_status");
const { v4: uuidv4 } = require('uuid');
const Lots = require("../models/lots");
const TicketStatusEnum = require("../enum/TicketStatusEnum");

const createTicketSchema = Joi.object({
    event: Joi.object({
        id: Joi.number().required()
    }).required(),
    ticket: Joi.object({
        quantity: Joi.number().required(),
        price: Joi.number().required(),
        name: Joi.string().required()
    }).required(),
    lots: Joi.object({
        description: Joi.string().required(),
        startSales: Joi.date().required(),
        endSales: Joi.date().required(),
    })
});

router.post("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        const { error, value } = createTicketSchema.validate(req.body);
        if (error) {
            throw new Error(error.details[0].message);
        }
        const {event, ticket, lots} = value;
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
            event_id: _event.id
        });

        for (let i = 0; i < ticket.quantity; i++) {
            const _ticket = await Ticket.create({
                uuid: uuidv4(),
                name: ticket.name,
                created_on: new Date(),
                price: ticket.price,
                sold: false,
                lots_id: _lots.id,
            });

            await TicketStatus.create({
                status: TicketStatusEnum.AVAILABLE,
                created_on: new Date(),
                ticket_id: _ticket.id
            });
        }
 

        res.status(200).json({ message: "Ingressos criado." });

    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }

});


const updateLotsSchema = Joi.object({
    lots: Joi.object({
        id: Joi.number().required(),
        description: Joi.string().required(),
        startSales: Joi.date().required(),
        endSales: Joi.date().required(),
    })
});

router.patch("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        const { error, value } = updateLotsSchema.validate(req.body);
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