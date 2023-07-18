const CompanyDocument = require("../models/company_document");

async function findByCompany(company) {
    try {
        const companyDocument = await CompanyDocument.findOne({
            where: {
              company_id: company
            }
          });

        if (!companyDocument || !companyDocument.value) {
            throw new Error("Empresa sem documento cadastrado");
        }

        return companyDocument;
    } catch (error) {
        console.error("Error finding companyDocument ", error)
        throw error;
    }
}

module.exports = {
    findByCompany
}