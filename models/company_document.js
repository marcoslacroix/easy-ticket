const {DataTypes} = require("sequelize");
const { sequelize } = require('../config/database');
const Company = require('./company'); 
const DocumentTypeEnum = require("../enum/DocumentTypeEnum");

const CompanyDocument = sequelize.define('CompanyDocument', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(DocumentTypeEnum)),
        allowNull: false,
        defaultValue: DocumentTypeEnum.CNPJ,
        validate: {
            isIn: {
                args: [Object.values(DocumentTypeEnum)],
                msg: 'Invalid status',
            },
        }
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
  }, 
  {
      freezeTableName: true,
      timestamps: false,
      tableName: 'company_document'
  }
  );

  CompanyDocument.belongsTo(Company, {
    foreignKey: 'company_id',
    onDelete: 'CASCADE',
  });

  module.exports = CompanyDocument;