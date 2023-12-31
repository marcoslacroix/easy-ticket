const express = require("express");
const router = express.Router();
const UtilUser = require("../util/utilUser");
const UtilToken = require("../util/utilToken");
const UtilJsonWebToken = require("../util/utilJsonWebToken");


router.post('/', async (req, res)  => {
  try{
    const {email, password} = req.body;
    const user = await UtilUser.getUserByEmail(email);
    if (user) {
        const isPasswordMatch = await UtilToken.isPasswordMatch(password, user.password);
        if (email === user.email && isPasswordMatch) {
          const token = UtilJsonWebToken.sign(user);
          res.json({ token: token });
          return;
        }
      }
      res.status(401).json({ message: 'Email ou senha inválida' });
  } catch (error) {
    res.status(400).json({message: error.message})
  }
    
});


module.exports = router;