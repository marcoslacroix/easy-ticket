const {DataTypes} = require("sequelize");
const sequelize = require('../config/database');
const Event = require('./event'); 

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
    price: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
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
  
  module.exports = Ticket;