
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const UtilJsonWebToken = require("../util/utilJsonWebToken");
const UtilUser = require("../util/utilUser");
const UtilCompany = require("../util/utilCompany");
const Event = require("../models/event");
const EventAddress = require("../models/event_address");
const RolesEnum = require("../enum/RolesEnum");
const EventSchema = require("../schemaValidate/eventSchema");
const CompanyDocument = require("../models/company_document");
const UtilEvent = require("../util/utilEvent");

async function create(req) {
    return sequelize.transaction(async (t1) => {
        const { error, value } = EventSchema.createSchema.validate(req.body);
        if (error) {
            throw new Error(error.details[0].message);
        }
        const {event} = value;
        const decoded = UtilJsonWebToken.decodeToken(req);
        const user = await UtilUser.getUserById(decoded.userId);
        validateCompanyId(user);

        UtilUser.validateUserRoles(user, [RolesEnum.CREATE_EVENT]);
        const _company = await UtilCompany.findByCompanyId(user.company_id);

        const _company_document = await CompanyDocument.findOne({
            where: {
                company_id: user.company_id
            }
        })

        validateCompanyGnAccount(_company);
        validateCompanyDocument(_company_document);

        const _event  = await Event.create({
            name: event.name,
            period: event.period,
            start: event.start,
            company_id: _company.id,
            created_on: new Date(),
            description: event.description
        });

        await EventAddress.create({
            name: event.address.name,
            street: event.address.street,
            number: event.address.number,
            postal_code: event.address.postalCode,
            neighborhood: event.address.neighborhood,
            city: event.address.city,
            state: event.address.state,
            acronymState: event.address.acronymState,
            event_id: _event.id
        });

        return {
            id: _event.id,
            name: _event.name,
            period: _event.period,
            start: _event.start,
            company_id: _event.company_id,
            description: _event.description
        }
    })
}

function validateCompanyDocument(_company_document) {
    if (!_company_document || !_company_document.value) {
        throw new Error("Empresa sem cpf/cnpj");
    }
}

function validateCompanyGnAccount(_company) {
    if (!_company.gn_account) {
        throw new Error("Empresa sem gn_account");
    }
}

function validateCompanyId(user) {
    if (!user.company_id) {
        throw new Error("Usuário sem empresa");
    }
}

async function findEvents() {
    const currentDate = new Date();
    const currentDateFormatted = currentDate.toISOString().split('T')[0];

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
        order: [
            ['period', 'DESC']
        ]
    });

    const events = [];
    for (const event of _allEventsGreaterOrEqualCurrentDate) {
        const eventDto = await UtilEvent.parseEventDto(event);
        events.push(eventDto);
    }
    return events;
}

async function update(req) {
    return sequelize.transaction(async (t1) => {
        const { error, value } = EventSchema.updateSchema.validate(req.body);
        if (error) {
            throw new Error(error.details[0].message);
        }
        const {company, event} = value;
        const decoded = UtilJsonWebToken.decodeToken(req);
        const user = await UtilUser.getUserById(decoded.userId);
        UtilUser.validateUserRoles(user, [RolesEnum.CREATE_EVENT]);
        if (!user.company_id) {
            throw new Error("Usuário sem empresa");
        }
        
        const _event = await Event.update(
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
        return {
            name: _event.name,
            period: _event.period,
            start: _event.start,
            company_id: _event.company_id,
            description: _event.description,
        }
    })
}
module.exports = {
    create,
    findEvents,
    update
}