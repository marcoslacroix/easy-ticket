
const UtilToken = require("../util/utilToken");
const User = require("../models/user");
const { sequelize } = require('../config/database');
const UtilUser = require("../util/utilUser");
const UtilPassword = require("../util/utilPassword");
const UtilJsonWebToken = require("../util/utilJsonWebToken");
const UserSchema = require("../schemaValidate/userSchema");
const EmailSend = require("../email/send");


async function getUser(req) {
    const decoded = UtilJsonWebToken.decodeToken(req);
    const user = await UtilUser.getUserByEmail(decoded.email);

    return {
        name: user.name,
        lastName: user.last_name,
        email: user.email
    };
}

async function update(req) {
    return sequelize.transaction(async (t1)=> {
        const decoded = UtilJsonWebToken.decodeToken(req);
        const user = await UtilUser.getUserByEmail(decoded.email);
        const { name, lastname } = req.body;
        const _user = await user.update({
          name: name,
          last_name: lastname
        });
        return {
            name: _user.name,
            lastName: _user.lastName
        }
    });
}
async function create(req) {
    return sequelize.transaction(async (t1) => {
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
        
        // todo email
        //UtilUser.sendEmailUserCreated(_user);
        console.log("teste");
        return {
            email: _user.email,
            name: _user.name,
            lastName: _user.last_name
        }

    });
}

async function getUserRoles(req) {
    const decoded = UtilJsonWebToken.decodeToken(req);
    const user = await UtilUser.getUserById(decoded.userId);
    return user.roles;
}

async function changePassword(req) {
    return sequelize.transaction(async (t1) => {
        const decoded = UtilJsonWebToken.decodeToken(req);
        const user = await UtilUser.getUserById(decoded.userId);
        const {error, value} = UserSchema.updatePasswordSchema.validate(req.body);
        validateSchemaDto(error);
        await UtilUser.validatePassword(value, user);
        await user.update({
          password: await UtilToken.encryptPassword(value.newPassword)
        });
    });
}

function validateSchemaDto(error) {
    if (error) {
      throw new Error(error.details[0].message);
    }
}

module.exports = {
    create,
    getUser,
    getUserRoles,
    update,
    changePassword,
}