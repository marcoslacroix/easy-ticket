const Joi = require('joi');
const messages = require("../schemaValidate/messages");


const createSchema = Joi.object({
    event: Joi.object({
        id: Joi.number().required().messages(messages),
    }).required().messages(messages),
    tickets: Joi.array().items(
        Joi.object({
            quantity: Joi.number().required().messages(messages),
            price: Joi.number().required().messages(messages),
            type: Joi.string().required().messages(messages),
        })
    ).required().messages(messages),
    lots: Joi.object({
        description: Joi.string().required().messages(messages),
        startSales: Joi.date().required().messages(messages),
        endSales: Joi.date().required().messages(messages),
    }).required().messages(messages),
});

const updateLotsSchema = Joi.object({
    lots: Joi.object({
        id: Joi.number().required().messages(messages),
        description: Joi.string().required().messages(messages),
        startSales: Joi.date().required().messages(messages),
        endSales: Joi.date().required().messages(messages),
    })
});

const checkinSchema = Joi.object({
    uuid: Joi.string().required().messages(messages),
    event: Joi.number().required().messages(messages),
});

module.exports = {
    createSchema,
    updateLotsSchema,
    checkinSchema
}