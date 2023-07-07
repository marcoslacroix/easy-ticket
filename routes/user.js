const express = require('express');
const router = express.Router();
const Joi = require('joi');
const UtilToken = require("../util/utilToken");
const User = require("../models/user");
const { sequelize } = require('../config/database');
const UserDocument = require("../models/user_document");
const UserPhone = require("../models/user_phone");
const UtilUser = require("../util/utilUser");
const UtilPassword = require("../util/utilPassword");
const UtilDocument = require("../util/utilDocument");
const UtilJsonWebToken = require("../util/utilJsonWebToken");
require('express-async-errors');

const createUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    name: Joi.string().required(),
    lastname: Joi.string().required()
});

router.post("/", async function(req, res) {
  try {
    await sequelize.transaction(async (t1) => {
      const { error, value } = createUserSchema.validate(req.body);
      validateSchemaDto(error);
      const { email, password, name, lastname } = value;
      await UtilUser.validateEmailIsRegistered(email);
      validateStrongPassword(password)
  
      await User.create({
        email,
        password: await UtilToken.encryptPassword(password),
        name,
        created_on: new Date(),
        last_name: lastname
      });
  
      res.status(200).json({ message: "Usuário criado." });
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

const updatePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().required(),
  confirmPassword: Joi.string().required()
});

function validateStrongPassword(password) {
  const objectIsStrongPassword = UtilPassword.isStrongPassword(password);
    if (!objectIsStrongPassword.isValid){
      throw new Error(objectIsStrongPassword.messageError);
    };
}

function validatePassword(value, user) {
  UtilPassword.validateOldPassword(value.oldPassword, user.password);
  UtilPassword.validaDifferentPassword(value.newPassword, value.confirmPassword);
  validateStrongPassword(value.newPassword);
}

function validateSchemaDto(error) {
  if (error) {
    throw new Error(error.details[0].message);
  }
}
router.patch("/change-password", UtilJsonWebToken.verifyToken, async function(req, res) {
  try {
    await sequelize.transaction(async (t1) => {
      const decoded = UtilJsonWebToken.decodeToken(req);
      const user = await UtilUser.getUserById(decoded.userId);
      const {error, value} = updatePasswordSchema.validate(req.body);
      validateSchemaDto(error);
      validatePassword(value, user);
      await user.update({
        password: await UtilToken.encryptPassword(value.newPassword)
      });
      res.status(200).json({message: "Senha alterada com sucesso!"});
    });
  } catch(error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
  
});

router.patch("/", UtilJsonWebToken.verifyToken, async function(req, res) {
  try {
    await sequelize.transaction(async (t1)=> {
      const decoded = UtilJsonWebToken.decodeToken(req);
      const user = await UtilUser.getUserByEmail(decoded.email);
      const { name, lastname } = req.body;
      await user.update({
        name: name,
        last_name: lastname
      });
      res.json({ message: "Usuário atualizado." });
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

router.delete("/", UtilJsonWebToken.verifyToken, async (req, res) => {
  try {
    await sequelize.transaction(async (t1) => {
      const decoded = UtilJsonWebToken.decodeToken(req);
      const user = await UtilUser.getUserByEmail(decoded.email);
      await user.destroy();
      res.json({ message: 'Usuário excluído com sucesso' });
    });
  } catch (error) {
    res.status(400).json({ error: error.message});
  }
});

router.get('/get-user', UtilJsonWebToken.verifyToken, async (req, resp) => {
  try {
    const decoded = UtilJsonWebToken.decodeToken(req);
    const user = await UtilUser.getUserByEmail(decoded.email);
    resp.json(UserDto.parseUserDto(user));
  } catch (error) {
    res.status(400).json({ error: error.message});
  }
});

module.exports = router;
