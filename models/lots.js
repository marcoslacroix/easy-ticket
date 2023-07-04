const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/database');

const Lots = sequelize.define('Lots', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    created_on: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, 
  {
      freezeTableName: true,
      timestamps: false,
      tableName: 'lots'
  }
  );
  
  module.exports = Lots;