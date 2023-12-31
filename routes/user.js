const express = require('express');
const router = express.Router();
const UtilToken = require("../util/utilToken");
const User = require("../models/user");
const { sequelize } = require('../config/database');
const UtilUser = require("../util/utilUser");
const UtilPassword = require("../util/utilPassword");
const UtilJsonWebToken = require("../util/utilJsonWebToken");
const UserSchema = require("../schemaValidate/userSchema");
const EmailSend = require("../email/send");
require('express-async-errors');

router.post("/", async function(req, res) {
  try {
    await sequelize.transaction(async (t1) => {
      const { error, value } = UserSchema.createSchema.validate(req.body);
      validateSchemaDto(error);
      const { email, password, confirmPassword, name, lastname } = value;
      UtilPassword.validateNewPasswordWithConfirmPassword(password, confirmPassword);
      await UtilUser.validateEmailIsRegistered(email);
      UtilUser.validateStrongPassword(password);
  
      const _user = await User.create({
        email,
        password: await UtilToken.encryptPassword(password),
        name,
        created_on: new Date(),
        last_name: lastname
      });

      UtilUser.sendEmailUserCreated(_user);
      

      res.status(200).json({ message: "Usuário criado." });
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

function validateSchemaDto(error) {
  if (error) {
    throw new Error(error.details[0].message);
  }
}
4
router.patch("/change-password", UtilJsonWebToken.verifyToken, async function(req, res) {
  try {
    await sequelize.transaction(async (t1) => {
      const decoded = UtilJsonWebToken.decodeToken(req);
      const user = await UtilUser.getUserById(decoded.userId);
      const {error, value} = UserSchema.updatePasswordSchema.validate(req.body);
      validateSchemaDto(error);
      await UtilUser.validatePassword(value, user);
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
