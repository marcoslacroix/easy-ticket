const express = require('express');
const router = express.Router();
const UtilJsonWebToken = require("../util/utilJsonWebToken");
require('express-async-errors');
const companyService = require("../service/companyService");

router.post("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        let company = await companyService.create(req);
        res.status(201).json({company: company});
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
});

router.patch("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
      let company = await companyService.update(req);
      res.status(200).json({company: company})
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message})
    }
});

router.delete("/:id", UtilJsonWebToken.verifyToken, async (req, res) => {
    try {
        await companyService.companyDelete(req);
        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message})
    }
 
});

module.exports = router;
