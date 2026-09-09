const nodemailer = require('nodemailer');
const env = require('../config/env');
const { Employee } = require('../models');

let transporter;

/** LMS-066: OAuth2 client-credentials against Exchange Online. Basic auth is not supported by the tenant. */
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: false,
      auth: {
        type: 'OAuth2',
        user: env.smtp.fromAddress,
        clientId: env.smtp.clientId,
        clientSecret: env.smtp.clientSecret,
        tenantId: env.smtp.tenantId,
      },
    });
  }
  return transporter;
}

async function send({ recipientId, subject, body }) {
  const recipient = await Employee.findByPk(recipientId);
  if (!recipient) throw new Error(`Cannot email: employee ${recipientId} not found.`);

  await getTransporter().sendMail({
    from: env.smtp.fromAddress,
    to: recipient.work_email,
    subject,
    html: body,
  });
}

module.exports = { send };
