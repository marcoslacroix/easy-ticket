const {DataTypes} = require("sequelize");
const { sequelize } = require('../config/database');
const Company = require('./company'); 
const User = require('./user'); 

const Charge = sequelize.define('Charge', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    charge_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_on: {
        type: DataTypes.DATE,
        allowNull: false
    },
    txid: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
  }, 
  {
      freezeTableName: true,
      timestamps: false,
      tableName: 'charge'
  }
  );

  Charge.belongsTo(Company, {
    foreignKey: 'company_id',
    onDelete: 'CASCADE',
  });

  Charge.belongsTo(User, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE',
  });

  module.exports = Charge;