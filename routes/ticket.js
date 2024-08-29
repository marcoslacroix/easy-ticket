const express = require('express');
const router = express.Router();
const UtilJsonWebToken = require("../util/utilJsonWebToken");
const ticketService = require("../service/ticketService");

router.post("/checkin", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        await ticketService.checkin(req);
        res.sendStatus(204);
    } catch(error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.get("/get-ticket-by-uuid", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        const ticket = await ticketService.findByUuid(req);
        res.status(200).json(ticket)
    } catch(error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
})

router.get("/get-qrcode", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        const qrCode = await ticketService.getQrcode(req);
        res.status(200).json({qrCode: qrCode});
    } catch(error) {
        console.error(error);
        res.status(400).json({error: error.message});
    }
});

router.post("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        let _lots = await ticketService.createTickets(req);
        res.status(201).json({
            lote: _lots
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.patch("/change-status", UtilJsonWebToken.verifyToken, async function (req, res) {
    try {
        await ticketService.updateStatus(req);
        res.sendStatus(204);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
})

router.get("/available", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        const available = await ticketService.getAvailable(req);
        res.status(200).json(
            {
                lots: available.lots,
                quantityTicketsUserAlreadyBougthForThisEvent: available.quantityTicketsUserAlreadyBougthForThisEvent
            }
        )
    } catch (error) {
        console.error(error);
        res.status(400).json({error: error.message});
    }
})

router.get("/my-tickets", UtilJsonWebToken.verifyToken, async function (req, res) {
    try {
        const tickets = await ticketService.findMyTickets(req);
        res.status(200).json({
            tickets: tickets
        })
    } catch(error) {
        console.error(error);
        res.status(400).json({error: error.message});
    }
});

router.patch("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        let lots = await ticketService.update(req);
        res.status(200).json({
            lots: lots
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;