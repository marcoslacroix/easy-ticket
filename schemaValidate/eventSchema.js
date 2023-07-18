
const Joi = require('joi');
const messages = require("../schemaValidate/messages");


const createSchema = Joi.object({
    company: Joi.object({
        id: Joi.number().required()
    }).required(),
    event: Joi.object({
        name: Joi.string().required().messages(messages),
        period: Joi.date().required().messages(messages),
        start: Joi.string().required().messages(messages),
        description: Joi.string().required().messages(messages),
        address: Joi.object({
            name: Joi.string().required().messages(messages),
            street: Joi.string().required().messages(messages),
            number: Joi.string().required().messages(messages),
            postal_code: Joi.string().required().messages(messages),
            neighborhood: Joi.string().required().messages(messages),
            city: Joi.string().required().messages(messages),
            state: Joi.string().required().messages(messages),
            acronymState: Joi.string().required().messages(messages),
        }).required()
    }).required()
});

const updateSchema = Joi.object({
    company: Joi.object({
        id: Joi.number().required().messages(messages),
    }).required(),
    event: Joi.object({
        id: Joi.number().required().messages(messages),
        name: Joi.string().required().messages(messages),
        period: Joi.date().required().messages(messages),
        start: Joi.string().required().messages(messages),
        description: Joi.string().required().messages(messages),
        address: Joi.object({
            name: Joi.string().required().messages(messages),
            street: Joi.string().required().messages(messages),
            number: Joi.string().required().messages(messages),
            postal_code: Joi.string().required().messages(messages),
            neighborhood: Joi.string().required().messages(messages),
            city: Joi.string().required().messages(messages),
            state: Joi.string().required().messages(messages),
            acronymState: Joi.string().required().messages(messages),
        }).required()
    }).required()
});

module.exports = {
    createSchema,
    updateSchema
};