const {DataTypes} = require("sequelize");
const { sequelize } = require('../config/database');
const Event = require("../models/event");

const EventAddress = sequelize.define('EventAddress', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    street: {
        type: DataTypes.STRING,
        allowNull: false
    },
    number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    postal_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    neighborhood: {
        type: DataTypes.STRING,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    state: {
        type: DataTypes.STRING,
        allowNull: false
    },
    acronymState: {
        type: DataTypes.STRING,
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
      tableName: 'event_address'
  }
  );
  
  EventAddress.belongsTo(Event, {
    foreignKey: 'event_id',
    onDelete: 'CASCADE',
  });

  module.exports = EventAddress;