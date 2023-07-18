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

module.exports = {
    findById
}