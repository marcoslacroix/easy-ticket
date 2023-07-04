const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/database');
const User = require('./user'); 

const UserDocument = sequelize.define('UserDocument', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
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
      tableName: 'user_document'
  }
  );

  UserDocument.belongsTo(User, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE',
  });

  module.exports = UserDocument;