const express = require("express");
const router = express.Router();
const UtilUser = require("../util/utilUser");
const UtilToken = require("../util/utilToken");
const UtilJsonWebToken = require("../util/utilJsonWebToken");


router.post('/', async (req, res)  => {
    const {email, password} = req.body;
    const user = await UtilUser.getUserByEmail(email);
    if (user) {
        const isPasswordMatch = await UtilToken.isPasswordMatch(password, user.password);
        if (email === user.email && isPasswordMatch) {
          const token = UtilJsonWebToken.sign(email);
          res.json({ token: token });
          return;
        }
      }
      res.status(401).json({ message: 'Credenciais inválidas' });
});


module.exports = router;