const {DataTypes} = require("sequelize");
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    created_on: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    response: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  }, 
  {
      freezeTableName: true,
      timestamps: false,
      tableName: 'order'
  }
  );

module.exports = Order;