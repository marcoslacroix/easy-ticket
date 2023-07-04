const User = require('../models/user')

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

function getCompleteName(user) {
  return user.name + " " + user.last_name
}

async function deleteById(id, transaction) {
  await User.destroy({
    where: {
      id: id
    }, transaction
  });
}

module.exports = {
    getUserByEmail,
    deleteById,
    getCompleteName,
    validateEmailIsRegistered,
    validateUserRoles,
    getUserById
}