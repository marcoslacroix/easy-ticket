const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('easy-ticket', 'root', 'live0102', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;
