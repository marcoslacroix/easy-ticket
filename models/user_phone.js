const {DataTypes} = require("sequelize");
const sequelize = require('../config/database');
const User = require('./user'); 

const UserPhone = sequelize.define('UserPhone', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    area_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
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
      tableName: 'user_phone'
  }
  );

  UserPhone.belongsTo(User, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE',
  });

  module.exports = UserPhone;