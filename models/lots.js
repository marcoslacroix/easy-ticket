const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/database');
const Event = require("../models/event");
const Company = require("../models/company");

const Lots = sequelize.define('Lots', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    created_on: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    start_sales: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_sales: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    event_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
  }, 
  {
      freezeTableName: true,
      timestamps: false,
      tableName: 'lots'
  });

  Lots.belongsTo(Event, {
    foreignKey: 'event_id',
    onDelete: 'CASCADE',
  });

  Lots.belongsTo(Company, {
    foreignKey: 'company_id',
    onDelete: 'CASCADE',
  });
  
  module.exports = Lots;