const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/database');
const DocumentTypeEnum = require("../enum/DocumentTypeEnum");
const User = require('./user'); 

const UserDocument = sequelize.define('UserDocument', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(DocumentTypeEnum)),
        allowNull: false,
        defaultValue: DocumentTypeEnum.CPF,
        validate: {
            isIn: {
                args: [Object.values(DocumentTypeEnum)],
                msg: 'Invalid status',
            },
        }
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