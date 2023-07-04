const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Company = require('./company'); 

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  created_on: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  companies: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  roles: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, 
{
    freezeTableName: true,
    timestamps: false,
    tableName: 'user'
}
);

module.exports = User;
