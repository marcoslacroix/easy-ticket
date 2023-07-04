const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { sequelize } = require('../config/database');
const Company = require("../models/company");
const CompanyPhone = require("../models/company_phone");
const UtilCompany = require("../util/utilCompany");
const RolesEnum = require("../enum/RolesEnum");
const UtilUser = require("../util/utilUser");
const UtilCompanyPhone = require("../util/UtilCompanyPhone");
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
    try {
      await sequelize.transaction(async (t1) => {
        const { error, value } = createCompanySchema.validate(req.body);
        if (error) {
          throw new Error(error.details[0].message);
        }
        const decoded = UtilJsonWebToken.decodeToken(req);
        const user = await UtilUser.getUserById(decoded.userId);

        UtilUser.validateUserRoles(user, [RolesEnum.CREATE_COMPANY]);

        const { name, identifier, phone } = value;
        const identifierWithoutSpecialFields = identifier.replace(/[./]/g, "");
        await UtilCompany.validateByIdentifierOrName(identifierWithoutSpecialFields, name);
  
        const company = await Company.create({
          name: name,
          identifier: identifierWithoutSpecialFields,
          created_on: new Date()
        });
  
        await CompanyPhone.create({
          area_code: phone.areaCode,
          number: phone.number,
          type: phone.type,
          country: phone.country,
          company_id: company.id
        });
  
        res.status(200).json({ message: "Empresa criada." });
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
});


const updateCompanySchema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.object({
      areaCode: Joi.string().required(),
      type: Joi.string().required(),
      country: Joi.string().required(),
      number: Joi.string().required()
    }).required()
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
            const { error, value } = updateCompanySchema.validate(req.body);
            if (error) {
              throw new Error(error.details[0].message);
            }
            const decoded = UtilJsonWebToken.decodeToken(req);
            const user = await UtilUser.getUserById(decoded.userId);
            UtilUser.validateUserRoles(user, [RolesEnum.UPDATE_COMPANY]);
            const company = await UtilCompany.findByCompanyId(companyId);
            UtilCompany.validaUserHasAccessToCompany(user, company);
            const {name, phone} = value;

            await company.update({
                name: name
            });

            const companyPhone = await UtilCompanyPhone.getByCompanyId(company.id);
            if (companyPhone) {
                companyPhone.update({
                    country: phone.country,
                    area_code: phone.area_code,
                    number: phone.number,
                    type: phone.type
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
            const company = await UtilCompany.findByCompanyId(id);
            UtilUser.validateUserRoles(user, [RolesEnum.DELETE_COMPANY]);
            UtilCompany.validaUserHasAccessToCompany(user, company);
            res.status("400").json("Empresa deletada");
    
        })
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message})
    }
 
});

module.exports = router;
