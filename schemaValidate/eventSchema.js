
const Joi = require('joi');

const createSchema = Joi.object({
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

const updateSchema = Joi.object({
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

module.exports = {
    createSchema,
    updateSchema
};