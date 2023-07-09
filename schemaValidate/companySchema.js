const Joi = require('joi');

const createSchema = Joi.object({
    company: Joi.object({
        name: Joi.string().required(),
        identifier: Joi.string().required(),
        about: Joi.string().required(),
        phone: Joi.object({
            areaCode: Joi.string().required(),
            type: Joi.string().required(),
            country: Joi.string().required(),
            number: Joi.string().required()
        }).required()
    }).required()
});

const updateSchema = Joi.object({
    company: Joi.object({
        name: Joi.string().required(),
        phone: Joi.object({
          areaCode: Joi.string().required(),
          type: Joi.string().required(),
          country: Joi.string().required(),
          number: Joi.string().required()
        }).required()
    }).required()
});

module.exports = {
    createSchema,
    updateSchema
}