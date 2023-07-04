const {DataTypes} = require("sequelize");
const { sequelize } = require('../config/database');
const Company = require('./company'); 
const PhoneTypeEnum = require("../enum/PhoneTypeEnum");

const CompanyPhone = sequelize.define('CompanyPhone', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    area_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(PhoneTypeEnum)),
        allowNull: false,
        defaultValue: PhoneTypeEnum.MOBILE,
        validate: {
            isIn: {
                args: [Object.values(PhoneTypeEnum)],
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
      tableName: 'company_phone'
  }
  );

  CompanyPhone.belongsTo(Company, {
    foreignKey: 'company_id',
    onDelete: 'CASCADE',
  });

  module.exports = CompanyPhone;