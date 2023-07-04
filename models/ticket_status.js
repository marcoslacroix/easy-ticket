const {DataTypes} = require("sequelize");
const { sequelize } = require('../config/database');
const Ticket = require('./ticket'); 
const TicketStatusEnum = require("../enum/TicketStatusEnum");

const 
TicketStatus = sequelize.define('TicketStatus', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    meta_data: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    created_on: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
  }, 
  {
      freezeTableName: true,
      timestamps: false,
      tableName: 'ticket_status'
  }
  );

  TicketStatus.belongsTo(Ticket, {
    foreignKey: 'ticket_id',
    onDelete: 'CASCADE',
  });
  
  module.exports = TicketStatus;