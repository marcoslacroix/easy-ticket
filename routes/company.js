const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { sequelize } = require('../config/database');
const UtilJsonWebToken = require("../util/utilJsonWebToken");

const GNRequest = require('../apis/gerencianet');
const CompanySchema = require("../schemaValidate/companySchema");
const Company = require("../models/company");
const CompanyPhone = require("../models/company_phone");
const UtilUser = require("../util/utilUser");
const UtilPayment = require("../util/utilPayment");
const UtilCompany = require("../util/utilCompany");
const CompanyDocument = require("../models/company_document");
const RolesEnum = require("../enum/RolesEnum");
const UtilCompanyPhone = require("../util/UtilCompanyPhone");
require('express-async-errors');

router.post("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
      await sequelize.transaction(async (t1) => {
        const { error, value } = CompanySchema.createSchema.validate(req.body);
        if (error) {
          throw new Error(error.details[0].message);
        }
        const decoded = UtilJsonWebToken.decodeToken(req);
        let user = await UtilUser.getUserById(decoded.userId);

        UtilUser.validateUserRoles(user, [RolesEnum.CREATE_COMPANY]);

        const { company, gerencianet } = value;
        const documentValue = company.document.value.replace(/[./\s-]/g, "");
        await UtilCompany.validateByIdentifierOrName(documentValue, company.name);
        const reqGN = await GNRequest({clientID: process.env.GN_CLIENT_ID, clientSecret: process.env.GN_CLIENT_SECRET});
        const splitResponse = await reqGN.post('/v2/gn/split/config', UtilPayment.parseSplitData(company.document.type, gerencianet.gn_account, documentValue));
        const _company = await Company.create({
          name: company.name,
          about: company.about,
          gn_account: gerencianet.gn_account,
          gn_account_identifier_payee_code: gerencianet.gn_account_identifier_payee_code,
          gn_split_config: splitResponse.data.id,
          created_on: new Date()
        });
        
        await CompanyDocument.create({
          type: company.document.type,
          value: documentValue,
          company_id: _company.id
        })

        await CompanyPhone.create({
          area_code: company.phone.areaCode,
          number: company.phone.number,
          type: company.phone.type,
          country: company.phone.country,
          company_id: _company.id
        });

        res.status(200).json({ message: "Empresa criada." });
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
});

function validateCompanyId(companyId) {
    if (!companyId) {
        throw new Error("Id da empresa não enviado");
    }
}

router.patch("/", UtilJsonWebToken.verifyToken, async function(req, res) {
    try {
        await sequelize.transaction(async (t1) => {
            const queryParams = req.query;
            const companyId = queryParams.companyId;
            validateCompanyId(companyId);
            const { error, value } = CompanySchema.updateSchema.validate(req.body);
            if (error) {
              throw new Error(error.details[0].message);
            }
            const decoded = UtilJsonWebToken.decodeToken(req);
            const user = await UtilUser.getUserById(decoded.userId);
            UtilUser.validateUserRoles(user, [RolesEnum.UPDATE_COMPANY]);
            const _company = await UtilCompany.findByCompanyId(companyId);
            UtilCompany.validaUserHasAccessToCompany(user, companyId);
            const {company} = value;

            await company.update({
                name: company.name
            });

            const companyPhone = await UtilCompanyPhone.getByCompanyId(_company.id);
            if (companyPhone) {
                companyPhone.update({
                    country: company.phone.country,
                    area_code: company.phone.area_code,
                    number: company.phone.number,
                    type: company.phone.type
                });
            }
            res.status(200).json({message: "Empresa atualizada com sucesso!"})
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message})
    }
});

router.delete("/:id", UtilJsonWebToken.verifyToken, async (req, res) => {
    try {
        await sequelize.transaction(async (t1) => {
            const { id } = req.params; 
            const decoded = UtilJsonWebToken.decodeToken(req);
            const user = await UtilUser.getUserById(decoded.userId);
            console.log(user.name);
            const company = await UtilCompany.findByCompanyId(id);
            UtilUser.validateUserRoles(user, [RolesEnum.DELETE_COMPANY]);
            await company.destroy();
            res.status(200).json("Empresa deletada");
        })
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message})
    }
 
});

module.exports = router;
