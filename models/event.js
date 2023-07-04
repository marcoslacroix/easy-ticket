const {DataTypes} = require("sequelize");
const { sequelize } = require('../config/database');

const Event = sequelize.define('Event', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    data: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, 
  {
      freezeTableName: true,
      timestamps: false,
      tableName: 'event'
  }
  );
  
  module.exports = Event;