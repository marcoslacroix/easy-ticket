const express = require("express");
const router = express.Router();

const loginService = require("../service/loginService");

router.post('/', async (req, res)  => {
  try{
      const token = await loginService.getToken(req);
      if (token) {
        res.json({ token: token });
      } else {
        res.status(401).json({ message: 'Email ou senha inválida' });
      }
  } catch (error) {
    res.status(400).json({message: error.message})
  }
    
});

module.exports = router;