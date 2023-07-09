const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { Op } = require('sequelize');
const { literal, fn, col } = require('sequelize');
const { sequelize } = require('../config/database');
const UtilJsonWebToken = require("../util/utilJsonWebToken");

const EventDTO = require("../dto/eventDto");
const UtilUser = require("../util/utilUser");
const UtilCompany = require("../util/utilCompany");
const Event = require("../models/event");
const EventAddress = require("../models/event_address");
const RolesEnum = require("../enum/RolesEnum");
const EventSchema = require("../schemaValidate/eventSchema");

router.post("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        await sequelize.transaction(async (t1) => {
            const { error, value } = EventSchema.createSchema.validate(req.body);
            if (error) {
                throw new Error(error.details[0].message);
            }
            const {company, event} = value;
            const decoded = UtilJsonWebToken.decodeToken(req);
            const user = await UtilUser.getUserById(decoded.userId);
            UtilUser.validateUserRoles(user, [RolesEnum.CREATE_EVENT]);
            UtilCompany.validaUserHasAccessToCompany(user, company.id);
            
            const _event  = await Event.create({
                name: event.name,
                period: event.period,
                start: event.start,
                company_id: company.id,
                created_on: new Date(),
                description: event.description
            });

            await EventAddress.create({
                name: event.address.name,
                street: event.address.street,
                number: event.address.number,
                postal_code: event.address.postal_code,
                neighborhood: event.address.neighborhood,
                city: event.address.city,
                state: event.address.state,
                acronymState: event.address.acronymState,
                event_id: _event.id
            });

            res.status(200).json({ message: "Evento criado." });
        })
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.patch("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        await sequelize.transaction(async (t1) => {
            const { error, value } = EventSchema.updateSchema.validate(req.body);
            if (error) {
                throw new Error(error.details[0].message);
            }
            const {company, event} = value;
            const decoded = UtilJsonWebToken.decodeToken(req);
            const user = await UtilUser.getUserById(decoded.userId);
            UtilUser.validateUserRoles(user, [RolesEnum.CREATE_EVENT]);
            UtilCompany.validaUserHasAccessToCompany(user, company.id);
            
            await Event.update(
                {
                    name: event.name,
                    period: event.period,
                    start: event.start,
                    company_id: company.id,
                    description: event.description,
                },
                {
                    where: {
                        id: event.id
                    }
                },
            );

            res.status(200).json({ message: "Evento atualizado." });
        })
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.get("/", async function(req, res) {
    
    const currentDate = new Date();
    const currentDateFormatted = currentDate.toISOString().split('T')[0];
    const _allEventsGreaterOrEqualCurrentDate = await Event.findAll({
        where: {
            [Op.or]: [
                sequelize.where(sequelize.fn('DATE', sequelize.col('period')), currentDateFormatted),
                {
                  period: {
                    [Op.gte]: currentDateFormatted
                  }
                }
            ]
        }
    });

    const events = [];

    for (const event of _allEventsGreaterOrEqualCurrentDate) {
        const eventDTO = new EventDTO(
            event.id,
            event.name,
            event.period,
            event.companyId,
            event.start,
            event.description,
            event.createdOn,
            event.image
        );
        
        events.push(eventDTO);
    }
    res.status(200).json({
        events
    });
})

module.exports = router;