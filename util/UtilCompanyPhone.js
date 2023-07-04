const { Op  } = require('sequelize');
const CompanyPhone = require('../models/company_phone');

async function getByCompanyId(companyId) {
    try {
        return await CompanyPhone.findOne({
            where: {
                company_id: companyId
            }
        })
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports = {
    getByCompanyId
}