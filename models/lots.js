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
    active: {
        type: DataTypes.BOOLEAN,
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