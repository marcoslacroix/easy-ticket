const Joi = require('joi');
const messages = require("../schemaValidate/messages");


const createSchema = Joi.object({
    gerencianet: Joi.object({
        gn_account_identifier_payee_code: Joi.string().min(30).required().messages(messages),
        gn_account: Joi.string().max(25).required().messages(messages),
    }),
    company: Joi.object({
        name: Joi.string().required().messages(messages),
        about: Joi.string().required().messages(messages),
        document: Joi.object({
            type: Joi.string().valid('CPF', 'CNPJ').required().messages(messages),
            value: Joi.string().required().messages(messages),
        }),
        phone: Joi.object({
            areaCode: Joi.string().required().messages(messages),
            type: Joi.string().required().messages(messages),
            country: Joi.string().required().messages(messages),
            number: Joi.string().required().messages(messages),
        }).required()
    }).required()
});

const updateSchema = Joi.object({
    company: Joi.object({
        name: Joi.string().required().messages(messages),
        phone: Joi.object({
          areaCode: Joi.string().required().messages(messages),
          type: Joi.string().required().messages(messages),
          country: Joi.string().required().messages(messages),
          number: Joi.string().required().messages(messages),
        }).required()
    }).required()
});

module.exports = {
    createSchema,
    updateSchema
}