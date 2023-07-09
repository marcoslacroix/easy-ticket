const Joi = require('joi');

const createSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    name: Joi.string().required(),
    lastname: Joi.string().required()
});

const updatePasswordSchema = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
    confirmPassword: Joi.string().required()
  });
  

module.exports = {
    createSchema,
    updatePasswordSchema
}