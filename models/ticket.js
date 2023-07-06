const {DataTypes} = require("sequelize");
const { sequelize } = require('../config/database');
const Event = require('./event'); 
const User = require("../models/user");
const Lots = require("../models/lots");
const Company = require("../models/company");

const Ticket = sequelize.define('Ticket', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    created_on: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    sold: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    owner_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    reserved_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lots_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, 
  {
      freezeTableName: true,
      timestamps: false,
      tableName: 'ticket'
  }
  );

  Ticket.belongsTo(Event, {
    foreignKey: 'event_id',
    onDelete: 'CASCADE',
  });

  Ticket.belongsTo(Lots, {
    foreignKey: 'lots_id',
    onDelete: 'CASCADE',
  });

  Ticket.belongsTo(User, {
    foreignKey: 'reserved_user_id',
    onDelete: 'CASCADE',
  });

  Ticket.belongsTo(User, {
    foreignKey: 'owner_user_id',
    onDelete: 'CASCADE',
  });

  Ticket.belongsTo(Company, {
    foreignKey: 'company_id',
    onDelete: 'CASCADE',
  });

  
  module.exports = Ticket;