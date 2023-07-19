const Event = require("../models/event");
const EventAddress = require("../models/event_address");

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

async function parseEventDto(event) {
    const _eventAddress = await EventAddress.findOne( {
        where: {
            event_id: event.id
        }
    });

    const eventAddress = {
        name: _eventAddress.name,
        street: _eventAddress.street,
        number: _eventAddress.number,
        postal_code: _eventAddress.postal_code,
        neighborhood: _eventAddress.neighborhood,
        city: _eventAddress.city,
        state: _eventAddress.state,
        acronymState: _eventAddress.acronymState,
    }

    const eventDTO = {
        id: event.id,
        name: event.name,
        period: event.period,
        companyId: event.company_id,
        start: event?.start?.substring(0, 5),
        description: event.description,
        image: event.image,
        eventAddress: eventAddress
    }

    return eventDTO;
}

module.exports = {
    findById,
    parseEventDto
}