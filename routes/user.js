const express = require('express');
const router = express.Router();
const UtilJsonWebToken = require("../util/utilJsonWebToken");
require('express-async-errors');
const userService = require("../service/userService");

router.post("/", async function(req, res) {
  try {
    const user = await userService.create(req);
    console.log("user: ", user);
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});


router.patch("/change-password", UtilJsonWebToken.verifyToken, async function(req, res) {
  try {
    await userService.changePassword(req);
    res.sendStatus(204);
  } catch(error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
  
});

router.patch("/", UtilJsonWebToken.verifyToken, async function(req, res) {
  try {
    const user = await userService.update(req)
    res.status(200).json({ user: user });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

router.get("/get-roles", UtilJsonWebToken.verifyToken, async function(req, res) {
  try {
    console.log("start getting roles");
    const roles = await userService.getUserRoles(req);
    console.log("roles: ", roles);
    res.status(200).json({roles: roles});
  } catch(error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/get-user', UtilJsonWebToken.verifyToken, async function (req, res) {
  try {
    const user = await userService.getUser(req);
    res.status(200).json({user: user});
  } catch (error) {
    res.status(400).json({ error: error.message});
  }
});

module.exports = router;
