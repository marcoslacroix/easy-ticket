const express = require('express');
const router = express.Router();
const UtilJsonWebToken = require("../util/utilJsonWebToken");
const eventService = require("../service/eventService");

router.post("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        let event = await eventService.create(req);
        res.status(201).json({event: event});
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.patch("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        let event = await eventService.update(req);
        res.status(200).json({ event: event });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.get("/", async function(req, res) { 
    const events = await eventService.findEvents();
    res.status(200).json({
        events
    });
})

module.exports = router;