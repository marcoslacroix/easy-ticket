const Joi = require('joi');
const messages = require("../schemaValidate/messages");

const createSchema = Joi.object({
    name: Joi.string().required().messages(messages),
    lastname: Joi.string().required().messages(messages),
    email: Joi.string().email().required().messages(messages),
    password: Joi.string().required().messages(messages),
    confirmPassword: Joi.string().required().messages(messages),
});

const updatePasswordSchema = Joi.object({
    oldPassword: Joi.string().required().messages(messages),
    newPassword: Joi.string().required().messages(messages),
    confirmPassword: Joi.string().required().messages(messages),
  });
  

module.exports = {
    createSchema,
    updatePasswordSchema
}