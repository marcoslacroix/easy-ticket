const Joi = require('joi');

const createSchema = Joi.object({
    event: Joi.object({
        id: Joi.number().required()
    }).required(),
    tickets: Joi.array().items(
        Joi.object({
            quantity: Joi.number().required(),
            price: Joi.number().required(),
            type: Joi.string().required()
        })
    ).required(),
    lots: Joi.object({
        description: Joi.string().required(),
        startSales: Joi.date().required(),
        endSales: Joi.date().required(),
    }).required()
});

const updateLotsSchema = Joi.object({
    lots: Joi.object({
        id: Joi.number().required(),
        description: Joi.string().required(),
        startSales: Joi.date().required(),
        endSales: Joi.date().required(),
    })
});

const checkingSchema = Joi.object({
    uuid: Joi.string().required()
});

module.exports = {
    createSchema,
    updateLotsSchema,
    checkingSchema
}