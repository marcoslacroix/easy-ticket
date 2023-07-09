const {DataTypes} = require("sequelize");
const { sequelize } = require('../config/database');
const User = require("../models/user");
const Lots = require("../models/lots");
const TicketTypeEnum = require("../enum/TicketTypeEnum");
const TicketStatusEnum = require("../enum/TicketStatusEnum");


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
    created_on: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TicketStatusEnum)),
      allowNull: false,
      defaultValue: TicketStatusEnum.AVAILABLE,
      validate: {
          isIn: {
              args: [Object.values(TicketStatusEnum)],
              msg: 'Invalid status',
          },
      }
    },
    type: {
      type: DataTypes.ENUM(...Object.values(TicketTypeEnum)),
      allowNull: false,
      defaultValue: TicketTypeEnum.MALE,
      validate: {
          isIn: {
              args: [Object.values(TicketTypeEnum)],
              msg: 'Invalid type',
          },
      }
    },
    qr_code: {
      type: DataTypes.BLOB,
      allowNull: true
    },
    owner_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lots_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, 
  {
      freezeTableName: true,
      timestamps: false,
      tableName: 'ticket'
  }
  );

  Ticket.belongsTo(Lots, {
    foreignKey: 'lots_id',
    onDelete: 'CASCADE',
  });

  Ticket.belongsTo(User, {
    foreignKey: 'owner_user_id',
    onDelete: 'CASCADE',
  });



  module.exports = Ticket;