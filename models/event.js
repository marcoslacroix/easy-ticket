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
    period: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    start: {
      type: DataTypes.TIME,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    created_on: {
      type: DataTypes.DATE,
      allowNull: false
    },
    image: {
      type: DataTypes.BLOB,
      allowNull: true
    }
  }, 
  {
      freezeTableName: true,
      timestamps: false,
      tableName: 'event'
  }
  );
  
  
  module.exports = Event;