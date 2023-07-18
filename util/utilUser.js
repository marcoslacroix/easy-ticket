const User = require('../models/user')
const UtilPassword = require('../util/utilPassword');
const EmailSend = require("../email/send");

async function validateEmailIsRegistered(email) {
  try {
    const user = await User.findOne({
      where: {
        email: email
      }
    });

    if (user) {
      throw new Error(`Email: ${email} já cadastrado`);
    }
    return user;
  } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
  }
}

async function getUserByEmail(email) {
    try {
        const user = await User.findOne({
          where: {
            email: email
          }
        });

        if (!user) {
          throw new Error("Usuário não encontrado")
        }
        return user;
    } catch (error) {
        console.error('Error finding user by email:', error);
        throw error;
    }
}

function validateUserRoles(user, rolesEnum) {
  const hasAccess = rolesEnum.some(role => user?.roles?.includes(role));
  if (!hasAccess) {
      throw new Error("Usuário sem acesso para essa operação");
  }
}

function sendEmailUserCreated(_user) {
  const subject = `Bem-vindo(a), ${_user.name} ${_user.lastname}! Sua conta foi criada com sucesso.`;
      const htmlBody = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body>
          <h1>Bem-vindo(a), ${_user.name} ${_user.lastname}!</h1>
          <p>Sua conta foi criada com sucesso.</p>
          <p>Caso você não tenha criado uma conta, ignore este e-mail.</p>
          <p>Atenciosamente,<br>Equipe do Easy Ticket</p>
        </body>
      </html>`;
      EmailSend.sendMail(_user.email, subject, htmlBody);
}

async function getUserById(id) {
  try {
    const user = await User.findOne({
      where: {
        id: id
      }
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    return user;

  } catch (error) {
    console.error('Error finding user by id:', error);
    throw error;
  }
}

function validateStrongPassword(password) {
  const objectIsStrongPassword = UtilPassword.isStrongPassword(password);
    if (!objectIsStrongPassword.isValid){
      throw new Error(objectIsStrongPassword.messageError);
    };
}

async function validatePassword(value, user) {
  await UtilPassword.validateOldPassword(value, user.password);
  UtilPassword.validateNewPasswordWithConfirmPassword(value.newPassword, value.confirmPassword);
  validateStrongPassword(value.newPassword);
}


function getCompleteName(user) {
  return user.name + " " + user.last_name
}

async function deleteById(id) {
  await User.destroy({
    where: {
      id: id
    }
  });
}

module.exports = {
    getUserByEmail,
    deleteById,
    sendEmailUserCreated,
    validateStrongPassword,
    validatePassword,
    getCompleteName,
    validateEmailIsRegistered,
    validateUserRoles,
    getUserById
}