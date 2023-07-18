
const bcrypt = require("bcrypt")

async function isPasswordMatch(password, userPassword) {
    return await bcrypt.compare(password, userPassword);
}

async function encryptPassword(password) {
    try {
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      console.error(error);
      throw error;
    }
}

module.exports = {
    encryptPassword, 
    isPasswordMatch,
}