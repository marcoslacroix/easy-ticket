const Joi = require('joi');
const messages = require("../schemaValidate/messages");

const ticketsPaymentByCard = Joi.object({
  company: Joi.number().required().messages(messages),
  tickets: Joi.array().items(
    Joi.object({
      lots: Joi.number().required().messages(messages),
      type: Joi.string().valid('MALE', 'FEMALE').required().messages(messages),
      quantity: Joi.number().integer().required().messages(messages),
    })
  ).required(),
  card: Joi.object({
    brand: Joi.string().required().messages(messages),
    number: Joi.string().required().messages(messages),
    cvv: Joi.string().required().messages(messages),
    expiration_month: Joi.string().required().messages(messages),
    expiration_year: Joi.string().required().messages(messages),

  }).required(),
  payment: Joi.object({
    credit_card: Joi.object({
      installments: Joi.number().messages(messages),
      billing_address: Joi.object({
        street: Joi.string().required().messages(messages),
        number: Joi.number().required().messages(messages),
        neighborhood: Joi.string().required().messages(messages),
        zipcode: Joi.string().required().messages(messages),
        city: Joi.string().required().messages(messages),
        state: Joi.string().required().messages(messages),
      }),
      customer: Joi.object({
        name: Joi.string().required().messages(messages),
        email: Joi.string().required().messages(messages),
        cpf: Joi.string().required().messages(messages),
        birth: Joi.string().required().messages(messages),
        phone_number: Joi.string().required().messages(messages),
      })
    }).required()
  }).required()
});

const ticketsPayment = Joi.object({
  company: Joi.number().required().messages(messages),
  tickets: Joi.array().items(
    Joi.object({
      lots: Joi.number().required().messages(messages),
      type: Joi.string().valid('MALE', 'FEMALE').required().messages(messages),
      quantity: Joi.number().integer().required().messages(messages),
    })
  ).required(),
});

  module.exports = {
    ticketsPaymentByCard,
    ticketsPayment
  };