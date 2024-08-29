const UtilUser = require("../util/utilUser");
const UtilToken = require("../util/utilToken");
const UtilJsonWebToken = require("../util/utilJsonWebToken");

async function getToken(req) {
    const {email, password} = req.body;
    const user = await UtilUser.getUserByEmail(email);
    if (user) {
        const isPasswordMatch = await UtilToken.isPasswordMatch(password, user.password);
        if (email.toLowerCase() === user.email.toLowerCase() && isPasswordMatch) {
          const token = UtilJsonWebToken.sign(user);
          return token;
        }
    }
}

module.exports = {
    getToken
}