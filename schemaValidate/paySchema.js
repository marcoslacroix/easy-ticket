const Joi = require('joi');

const payObject = Joi.object({
    tickets: Joi.array().items(
      Joi.object({
        lots: Joi.number().required(),
        type: Joi.string().valid('MALE', 'FEMALE').required(),
        quantity: Joi.number().integer().required()
      })
    ).required(),
    customer: Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      document: Joi.string().required(),
      phones: Joi.array().items(
        Joi.object({
          country: Joi.string().required(),
          area: Joi.string().required(),
          number: Joi.string().required(),
          type: Joi.string().required()
        })
      ).required()
    }).required(),
    amount: Joi.object({
      value: Joi.number().required(),
      currency: Joi.string().required()
    }).required(),
    isQrCode: Joi.boolean(),
    payment_method: Joi.object({
      type: Joi.string().valid('CREDIT_CARD'),
      installments: Joi.number().integer(),
      card: Joi.object({
        number: Joi.string().creditCard(),
        exp_month: Joi.string().length(2),
        exp_year: Joi.string().length(4),
        security_code: Joi.string().length(3),
        holder: Joi.object({
          name: Joi.string()
        }),
        store: Joi.boolean()
      })
    })
  });

  module.exports = {payObject};