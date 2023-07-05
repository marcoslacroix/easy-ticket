const UserDocument = require('../models/user_document')

async function validateByValue(value) {
    try { 
      const userDocument = await UserDocument.findOne({
        where: {
          value: value
        }
      });

      if (userDocument) {
          throw new Error(`Identificador: ${value} já registrado`);
      }
      
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
    validateByValue,
    findByUserId
}