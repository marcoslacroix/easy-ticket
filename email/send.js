require('dotenv').config();
const nodemailer = require("nodemailer");

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

let isSendingEmail = false;
function sendMail(to, subject, html) {
    if (isSendingEmail) {
        console.log("Email sending is already in progress. Skipping this request.");
        return;
    }

    isSendingEmail = true;
    try {
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
        
            isSendingEmail = false;
        });
    } catch (error) {
        isSendingEmail = false;
        console.log(error);
    }
      
}
module.exports = {
    sendMail
}