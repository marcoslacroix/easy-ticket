const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { sequelize } = require('../config/database');
const UtilJsonWebToken = require("../util/utilJsonWebToken");

const UtilUser = require("../util/utilUser");
const UtilCompany = require("../util/utilCompany");
const Event = require("../models/event");
const EventAddress = require("../models/event_address");
const RolesEnum = require("../enum/RolesEnum");

const createEventSchema = Joi.object({
    company: Joi.object({
        id: Joi.number().required()
    }).required(),
    event: Joi.object({
        name: Joi.string().required(),
        period: Joi.date().required(),
        start: Joi.string().required(),
        description: Joi.string().required(),
        address: Joi.object({
            name: Joi.string().required(),
            street: Joi.string().required(),
            number: Joi.string().required(),
            postal_code: Joi.string().required(),
            neighborhood: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().required(),
            acronymState: Joi.string().required()
        }).required()
    }).required()
});

router.post("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        await sequelize.transaction(async (t1) => {
            const { error, value } = createEventSchema.validate(req.body);
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

const updateEventSchema = Joi.object({
    company: Joi.object({
        id: Joi.number().required()
    }).required(),
    event: Joi.object({
        id: Joi.number().required(),
        name: Joi.string().required(),
        period: Joi.date().required(),
        start: Joi.string().required(),
        description: Joi.string().required(),
        address: Joi.object({
            name: Joi.string().required(),
            street: Joi.string().required(),
            number: Joi.string().required(),
            postal_code: Joi.string().required(),
            neighborhood: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().required(),
            acronymState: Joi.string().required()
        }).required()
    }).required()
});

router.patch("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        await sequelize.transaction(async (t1) => {
            const { error, value } = updateEventSchema.validate(req.body);
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

module.exports = router;