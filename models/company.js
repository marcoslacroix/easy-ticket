const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  about: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gn_account_identifier_payee_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gn_account: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gn_split_config: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image: {
    type: DataTypes.BLOB,
    allowNull: true,
  },
  created_on: {
    type: DataTypes.DATE,
    allowNull: false,
  }

}, 
{
    freezeTableName: true,
    timestamps: false,
    tableName: 'company'
}
);

module.exports = Company;