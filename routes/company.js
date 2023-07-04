const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { sequelize } = require('../config/database');
const UtilToken = require("../util/utilToken");
const Company = require("../models/company");
const CompanyPhone = require("../models/company_phone");
const UtilCompany = require("../util/utilCompany");
const UtilJsonWebToken = require("../util/utilJsonWebToken");
require('express-async-errors');

const createCompanySchema = Joi.object({
    name: Joi.string().required(),
    identifier: Joi.string().required(),
    phone: Joi.object({
      areaCode: Joi.string().required(),
      type: Joi.string().required(),
      country: Joi.string().required(),
      number: Joi.string().required()
    }).required()
});

router.post("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { error, value } = createCompanySchema.validate(req.body);
        if (error) {
            throw new Error(error.details[0].message);
        }

        const { name, identifier, phone } = value;
        const identifierWithoutSpecialFields = identifier.replace(/[./]/g, "");
        let company = await UtilCompany.getCompanyByIdentifierOrName(identifierWithoutSpecialFields, name);
        if (company) {
            throw new Error("Nome ou Identifier já cadastrado no sistema");
        }

        company = await Company.create({
            name: name,
            identifier: identifierWithoutSpecialFields,
            created_on: new Date()
        }, { transaction } );

        await CompanyPhone.create({
            area_code: phone.areaCode,
            number: phone.number,
            type: phone.type,
            country: phone.country,
            company_id: company.id
        },  { transaction } );

        await transaction.commit(); 
        res.status(200).json({ message: "Empresa criada." });
    } catch(error) {
        if (transaction) {
            await transaction.rollback();
         }
        console.error(error);
        res.status(400).json({ error: error.message });
    }

});

router.patch("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    let userDocumentWithoutSpecialFields = identifier.replace(/[./]/g, "");
});

router.delete("/", UtilJsonWebToken.verifyToken, async (req, res) => {

});

module.exports = router;
