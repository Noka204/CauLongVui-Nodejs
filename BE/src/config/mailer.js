const nodemailer = require('nodemailer');
const env = require('./env');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 10000,
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('Nodemailer verification failed:', error);
  } else {
    // console.log('Server is ready to take our messages');
  }
});

module.exports = transporter;
