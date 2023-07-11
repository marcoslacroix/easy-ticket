const nodemailer = require("nodemailer");
require('dotenv').config();

// Configurações de autenticação do Outlook
const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function sendMail(to, subject, html) {
    const mailOptions = {
        from: process.env.EMAIL,
        to: to,
        subject: subject,
        html: html,
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Erro ao enviar o e-mail:", error);
        } else {
          console.log("E-mail enviado com sucesso:", info.response);
        }
    });
}
module.exports = {
    sendMail
}