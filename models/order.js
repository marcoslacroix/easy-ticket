const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/database');
const User = require("../models/user");
const Company = require("../models/company");

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
    error: {
      type: DataTypes.STRING,
      allowNull: true
    },
    user_id: {
      type: DataTypes.INTEGER,
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

Order.belongsTo(User, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE',
});

module.exports = Order;