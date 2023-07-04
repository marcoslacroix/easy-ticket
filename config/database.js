const { Sequelize } = require('sequelize');
const conn = {};

const sequelize = new Sequelize('easy-ticket', 'root', 'live0102', {
  host: 'localhost',
  dialect: 'mysql',
  operatorsAliases: 'false',
  logging: false
});

conn.sequelize = sequelize;
conn.Sequelize = Sequelize;

module.exports = conn;
