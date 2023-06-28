const UserPhone = require('../models/user_phone')

async function findAllByUserId(userId) {
    try {
        return await UserPhone.findAll({
          where: {
            user_id: userId
          }
        });
    } catch (error) {
        console.error('Erro na busca dos telefones: ', error);
        throw error;
    }
}

module.exports = {
    findAllByUserId
}