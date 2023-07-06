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
  image: {
    type: DataTypes.BLOB,
    allowNull: false,
  },
  created_on: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  identifier: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, 
{
    freezeTableName: true,
    timestamps: false,
    tableName: 'company'
}
);

module.exports = Company;