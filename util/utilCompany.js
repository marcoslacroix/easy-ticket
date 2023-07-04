const { Op  } = require('sequelize');
const Company = require('../models/company');

async function getCompanyByIdentifierOrName(identifier, name) {
    try {
        return await Company.findOne({
            where: {
                [Op.or]: [
                    { name: name },
                    { identifier: identifier }
                ]
            }
          });
    } catch(error) {
        console.error('Error finding company by identifier:', error);
        throw error;
    }
}

module.exports = {
    getCompanyByIdentifierOrName
}