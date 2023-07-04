const { Op  } = require('sequelize');
const Company = require('../models/company');

async function validateByIdentifierOrName(identifier, name) {
    try {
        const company = await Company.findOne({
            where: {
                [Op.or]: [
                    { name: name },
                    { identifier: identifier }
                ]
            }
          });

        if (company) {
            throw new Error("Nome ou Identifier já cadastrado no sistema");
        }

        return company;
    } catch(error) {
        console.error('Error finding company by identifier:', error);
        throw error;
    }
}

function validaUserHasAccessToCompany(user, company) {
    const hasAccess = user?.companies?.includes(company.id);
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
    validaUserHasAccessToCompany
}