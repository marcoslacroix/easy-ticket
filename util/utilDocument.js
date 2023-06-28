const UserDocument = require('../models/user_document')

async function findByValue(value) {
    try {
        return await UserDocument.findOne({
          where: {
            value: value
          }
        });
    } catch (error) {
        console.error('Error finding document:', error);
        throw error;
    }
}

async function findByUserId(userId) {
  try {
    return await UserDocument.findOne({
      where: {
        user_id: userId
      }
    })
  } catch (error) {
    console.error('Error finding document:', error);
    throw error;
  }
}

module.exports = {
    findByValue,
    findByUserId
}