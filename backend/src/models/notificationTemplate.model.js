const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// notification_templates — generated from LMS 2.0 ER Design (37-table schema)

const NotificationTemplate = sequelize.define('NotificationTemplate', {
  template_key: { type: DataTypes.STRING(100), primaryKey: true },
  subject_template: { type: DataTypes.STRING(500), allowNull: false },
  body_template: { type: DataTypes.TEXT, allowNull: false },
  tokens_json: { type: DataTypes.TEXT, allowNull: true },
  updated_by: { type: DataTypes.BIGINT, allowNull: true },
}, { tableName: 'notification_templates', createdAt: false });

module.exports = NotificationTemplate;
