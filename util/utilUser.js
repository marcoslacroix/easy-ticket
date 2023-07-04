const User = require('../models/user')

async function getUserByEmail(email) {
    try {
        return await User.findOne({
          where: {
            email: email
          }
        });
    } catch (error) {
        console.error('Error finding user by email:', error);
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
    getCompleteName
}