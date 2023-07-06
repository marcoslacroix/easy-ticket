const Event = require("../models/event");

async function findById(eventId) {
    try {
        const event = await Event.findOne({
            where: {
                id: eventId
            }
        })
        if (!event) {
            throw new Error("Evento não encontrado");
        }
        return event;
    } catch (error) {
        console.error("Error finding event by id", error)
        throw error;
    }
}


module.exports = {
    findById
}