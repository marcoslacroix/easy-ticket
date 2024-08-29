const { Op  } = require('sequelize');
const Company = require('../models/company');
const CompanyDocument = require("../models/company_document");

function validateGnAccount(_company) {
    if (!_company.gn_account) {
        throw new Error("Empresa sem gn account!");
    }
}

function validateGnAccountIdentifierPayeeCode(_company) {
    if (!_company.gn_account_identifier_payee_code) {
        throw new Error("Empresa sem gn_account_identifier_payee_code");
      }
}

async function validateByIdentifierOrName(identifier) {
    try {
        const companyDocument = await CompanyDocument.findOne({
            where: {
                value: identifier
            }
        });
        if (companyDocument) {
            throw new Error("Identificador já cadastrado no sistema");
        }

    } catch(error) {
        console.error('Error finding company by identifier:', error);
        throw error;
    }
}

function validaUserHasAccessToCompany(user, companyId) {
    const hasAccess = user.company_id == companyId;
    if (!hasAccess) {
        throw new Error("Usuário não tem acesso a essa empresa")
    }
}

async function findByCompanyId(companyId) {
    try {
        const company = await Company.findOne({
            where: {
                id: companyId
            }
        })
        if (!company) {
            throw new Error("Empresa não encontrada");
        }
        return company;
    } catch (error) {
        console.error("Error finding company by id", error)
        throw error;
    }
}

module.exports = {
    validateByIdentifierOrName,
    findByCompanyId,
    validateGnAccount,
    validateGnAccountIdentifierPayeeCode,
    validaUserHasAccessToCompany
}