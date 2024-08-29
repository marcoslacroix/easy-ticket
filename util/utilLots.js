const Lots = require("../models/lots");

async function findById(lotsId) {
    try {
        const lots = await Lots.findOne({
            where: {
                id: lotsId
            }
        })
        if (!lots) {
            throw new Error("Lote não encontrado");
        }
        return lots;
    } catch (error) {
        console.error("Error finding lots by id", error)
        throw error;
    }
}

async function findByIdAndEventId(lotsId, eventId) {
    try {
        const lots = await Lots.findOne({
            where: {
                id: lotsId,
                event_id: eventId
            }
        })
        if (!lots) {
            throw new Error("Lote não encontrado");
        }
        return lots;
    } catch(error) {
        console.error(error);
        throw error;
    }
}

module.exports = {
    findById,
    findByIdAndEventId
}