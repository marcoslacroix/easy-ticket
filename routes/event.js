const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { literal, fn, col } = require('sequelize');
const { sequelize } = require('../config/database');
const UtilJsonWebToken = require("../util/utilJsonWebToken");
const Lots = require("../models/lots");
const EventDTO = require("../dto/eventDto");
const UtilUser = require("../util/utilUser");
const Ticket = require('../models/ticket');
const UtilCompany = require("../util/utilCompany");
const Event = require("../models/event");
const EventAddress = require("../models/event_address");
const RolesEnum = require("../enum/RolesEnum");
const EventSchema = require("../schemaValidate/eventSchema");
const CompanyDocument = require("../models/company_document");
const Company = require("../models/company");
const EventAddressDto = require('../dto/eventAddressDto');
const TicketType = require('../enum/TicketTypeEnum');
const TicketStatusEnum = require('../enum/TicketStatusEnum');


router.post("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        await sequelize.transaction(async (t1) => {
            const { error, value } = EventSchema.createSchema.validate(req.body);
            if (error) {
                throw new Error(error.details[0].message);
            }
            const {company, event} = value;
            const decoded = UtilJsonWebToken.decodeToken(req);
            const user = await UtilUser.getUserById(decoded.userId);
            UtilUser.validateUserRoles(user, [RolesEnum.CREATE_EVENT]);
            UtilCompany.validaUserHasAccessToCompany(user, company.id);
            const _company = await UtilCompany.findByCompanyId(company.id);

            const _company_document = await CompanyDocument.findOne({
                where: {
                    company_id: company.id
                }
            })

            if (!_company.gn_account) {
                throw new Error("Empresa sem gn_account");
            }
            if (!_company_document || !_company_document.value) {
                throw new Error("Empresa sem cpf/cnpj");
            }

            const _event  = await Event.create({
                name: event.name,
                period: event.period,
                start: event.start,
                company_id: company.id,
                created_on: new Date(),
                description: event.description
            });

            await EventAddress.create({
                name: event.address.name,
                street: event.address.street,
                number: event.address.number,
                postal_code: event.address.postal_code,
                neighborhood: event.address.neighborhood,
                city: event.address.city,
                state: event.address.state,
                acronymState: event.address.acronymState,
                event_id: _event.id
            });

            res.status(200).json({ message: "Evento criado." });
        })
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.patch("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        await sequelize.transaction(async (t1) => {
            const { error, value } = EventSchema.updateSchema.validate(req.body);
            if (error) {
                throw new Error(error.details[0].message);
            }
            const {company, event} = value;
            const decoded = UtilJsonWebToken.decodeToken(req);
            const user = await UtilUser.getUserById(decoded.userId);
            UtilUser.validateUserRoles(user, [RolesEnum.CREATE_EVENT]);
            UtilCompany.validaUserHasAccessToCompany(user, company.id);
            
            await Event.update(
                {
                    name: event.name,
                    period: event.period,
                    start: event.start,
                    company_id: company.id,
                    description: event.description,
                },
                {
                    where: {
                        id: event.id
                    }
                },
            );

            res.status(200).json({ message: "Evento atualizado." });
        })
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

router.get("/", async function(req, res) {
    
    const currentDate = new Date();
    const currentDateFormatted = currentDate.toISOString().split('T')[0];

    const page = parseInt(req.query.page) || 1; // Página atual (padrão: 1)
    const pageSize = parseInt(req.query.pageSize) || 10; // Tamanho da página (padrão: 10)

    const _allEventsGreaterOrEqualCurrentDate = await Event.findAll({
        where: {
            [Op.or]: [
                sequelize.where(sequelize.fn('DATE', sequelize.col('period')), currentDateFormatted),
                {
                  period: {
                    [Op.gte]: currentDateFormatted
                  }
                }
            ]
        },
        offset: (page - 1) * pageSize, // Calcula o deslocamento com base na página atual e no tamanho da página
        limit: pageSize // Define o limite para o tamanho da página
    });

    const totalElements = await Event.count({
        where: {
            [Op.or]: [
                sequelize.where(sequelize.fn('DATE', sequelize.col('period')), currentDateFormatted),
                {
                    period: {
                        [Op.gte]: currentDateFormatted
                    }
                }
            ]
        }
    });
    
    const totalPages = Math.ceil(totalElements / pageSize);

    const events = [];

    for (const event of _allEventsGreaterOrEqualCurrentDate) {
        const _eventAddress = await EventAddress.findOne( {
            where: {
                event_id: event.id
            }
        });

        const _lots = await Lots.findAll({
            where: {
                active: true,
                event_id: event.id,
/*                 start_sales: {
                    [Op.gte]: new Date()
                },
                end_sales: {
                    [Op.lte]: new Date()
                } */
            }
        })

        let lots = [];

        for (const lote of _lots) {
            const tickets = [];
            const ticketFemale = await Ticket.findAll({
                where: {
                    type: TicketType.FEMALE,
                    status: TicketStatusEnum.AVAILABLE,
                    lots_id: lote.id
                }
            })

            if (ticketFemale.length > 0) {
                const ticket = {
                    quantity: ticketFemale.length,
                    type: TicketType.FEMALE,
                    price: ticketFemale[0]?.price
                }
                tickets.push(ticket)
            }

            const ticketMale = await Ticket.findAll({
                where: {
                    type: TicketType.MALE,
                    status: TicketStatusEnum.AVAILABLE,
                    lots_id: lote.id
                }
            })

            if (ticketMale.length > 0) {
                const ticket = {
                    quantity: ticketMale.length,
                    type: TicketType.FEMALE,
                    price: ticketMale[0]?.price
                }
                tickets.push(ticket)
            }
            
            if (tickets.length > 0 ) {
                lots.push(tickets)
            }
        }

        const eventAddress = new EventAddressDto(
            _eventAddress.name,
            _eventAddress.street,
            _eventAddress.number,
            _eventAddress.postal_code,
            _eventAddress.neighborhood,
            _eventAddress.city,
            _eventAddress.state,
            _eventAddress.acronymState,
        );

        const eventDTO = new EventDTO(
            event.id,
            event.name,
            event.period,
            event.companyId,
            event?.start?.substring(0, 5),
            event.description,
            event.image,
            eventAddress,
            lots
        );
        
        events.push(eventDTO);
    }
    res.status(200).json({
        events,
        totalPages,
        totalElements
    });
})

module.exports = router;