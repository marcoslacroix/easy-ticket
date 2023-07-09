const { Sequelize } = require('sequelize');
const { createNamespace } = require('cls-hooked');
const namespace = createNamespace('sequelize-transaction');
Sequelize.useCLS(namespace);

const sequelize = new Sequelize('easy-ticket', 'root', 'live0102', {
  host: 'localhost',
  dialect: 'mysql',
  operatorsAliases: 'false',
  logging: true
});

module.exports = { sequelize };
