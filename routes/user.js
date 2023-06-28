const express = require('express');
const router = express.Router();
const Joi = require('joi');
const UtilToken = require("../util/utilToken");
const User = require("../models/user");
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
    lastname: Joi.string().required(),
    document: Joi.object({
      type: Joi.string().required(),
      value: Joi.string().required()
    }).required(),
    phone: Joi.object({
      areaCode: Joi.string().required(),
      type: Joi.string().required,
      country: Joi.string().required,
      number: Joi.string().required()
    }).required()
});

router.post("/", async function(req, res) {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      throw new Error(error.details[0].message);
    }

    const { email, password, name, lastname, document, phone } = value;

    let userDocumentWithoutSpecialFields = document.value.replace(/[./]/g, "");
    let userDocument = await UtilDocument.findByValue(userDocumentWithoutSpecialFields, res);
    if (userDocument) {
      throw new Error(`Identificador: ${userDocumentWithoutSpecialFields} já registrado`);
    }

    let user = await UtilUser.getUserByEmail(email);
    if (user) {
      throw new Error(`Email: ${email} já cadastrado`);
    }

    const objectIsStrongPassword = UtilPassword.isStrongPassword(password);
    if (!objectIsStrongPassword.isValid){
      throw new Error(objectIsStrongPassword.messageError);
    };

    const encryptPassword = await UtilToken.encryptPassword(password);
    user = await User.create({
      email,
      password: encryptPassword,
      name,
      created_on: new Date(),
      last_name: lastname
    });

    userDocument = await UserDocument.create({
      type: document.type,
      value: userDocumentWithoutSpecialFields,
      user_id: user.id
    });

    await UserPhone.create({
      area_code: phone.areaCode,
      number: phone.number,
      type: phone.type,
      country: phone.country,
      user_id: user.id
    });

    res.status(200).json({ message: "Usuário criado." });
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

router.patch("/change-password", UtilJsonWebToken.verifyToken, async function(req, res) {
  try {
    const decoded = UtilJsonWebToken.decodeToken(req);
    const user = await UtilUser.getUserByEmail(decoded.email);
    if (!user) {
      throw new Error("Usuário não encontrado")
    }
    const {error, value} = updatePasswordSchema.validate(req.body);
    if (error) {
      throw new Error(error.details[0].message);
    }
    if (!UtilToken.isPasswordMatch(value.oldPassword, user.password)) {
      throw new Error("Senha antiga invalida");
    }
    if (value.newPassword != value.confirmPassword) {
      throw new Error("As senhas devem ser iguais.");
    }
    const objectIsStrongPassword = UtilPassword.isStrongPassword(value.newPassword);
    if (!objectIsStrongPassword.isValid){
      throw new Error(objectIsStrongPassword.messageError);
    };
    const encryptPassword = await UtilToken.encryptPassword(value.newPassword);
    await user.update({
      password: encryptPassword
    });
    res.status(200).json({message: "Senha alterada com sucesso!"});
  } catch(error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
  
});

router.patch("/", UtilJsonWebToken.verifyToken, async function(req, res) {
  try {
    const decoded = UtilJsonWebToken.decodeToken(req);
    const user = await UtilUser.getUserByEmail(decoded.email);
    if (!user) {
      throw new Error("Usuário não encontrado")
    }
    const { name, lastname } = req.body;
    await user.update({
      name: name,
      last_name: lastname
    });

    res.json({ message: "Perfil atualizado." });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

router.delete("/", UtilJsonWebToken.verifyToken, async (req, res) => {
  try {
    const decoded = UtilJsonWebToken.decodeToken(req);
    const user = await UtilUser.getUserByEmail(decoded.email);
    if (!user) {
      throw new Error("Usuário não encontrado")
    }
    await UtilUser.deleteById(user.id);
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    res.status(400).json({ error: error.message});
  }
});

router.get('/get-user', UtilJsonWebToken.verifyToken, async (req, resp) => {
  try {
    const decoded = UtilJsonWebToken.decodeToken(req);
    const user = await UtilUser.getUserByEmail(decoded.email);
    if (!user) {
      throw new Error("Usuário não encontrado")
    }
    resp.json(UserDto.parseUserDto(user));
  } catch (error) {
    res.status(400).json({ error: error.message});
  }
});

module.exports = router;
