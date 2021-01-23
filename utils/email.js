require("dotenv").config();

const { SMTPClient } = require("emailjs");

const {
  MAIL_SUBJECT,
  MAIL_SENDER_NAME,
  GMAIL_USER,
} = process.env;

const sendEmail = ({ text, html }) => {
  const client = new SMTPClient({
    host: '0.0.0.0',
  });
  const message = {
    from: `${MAIL_SENDER_NAME} <${GMAIL_USER}>`,
    to: `${MAIL_SENDER_NAME} <${GMAIL_USER}>`,
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
