require("dotenv").config();

const { SMTPClient } = require("emailjs");

const {
  SMTP_HOST,
  SMTP_USERNAME,
  SMTP_PASSWORD,
  MAIL_SUBJECT,
  MAIL_SENDER,
  MAIL_SENDER_NAME,
  MAIL_RECEIVER,
  MAIL_RECEIVER_NAME,
} = process.env;

const sendEmail = ({ text, html }) => {
  const client = new SMTPClient({
    host: SMTP_HOST || '0.0.0.0',
    user: SMTP_USERNAME,
    password: SMTP_PASSWORD,
    ssl: true,
  });
  const message = {
    from: `${MAIL_SENDER_NAME} <${MAIL_SENDER}>`,
    to: MAIL_RECEIVER ? `${MAIL_RECEIVER_NAME} <${MAIL_RECEIVER}>` : `${MAIL_SENDER_NAME} <${MAIL_SENDER}>`,
    subject: MAIL_SUBJECT,
    text,
    attachment: [{ data: html, alternative: true }],
  };
  // send the message and get a callback with an error or details of the message that was sent
  return new Promise((resolve, reject) => {
    client.send(message, function (err, message) {
      if (err) reject(err);
      resolve(message);
    });
  });
};

module.exports = { sendEmail };
