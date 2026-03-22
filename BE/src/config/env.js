require('dotenv').config();

const getDefinedEnv = (key, errorMessage) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(errorMessage || `Missing environment variable: ${key}`);
  }
  return value;
};

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: getDefinedEnv('MONGODB_URI'),
  API_PUBLIC_KEY: getDefinedEnv('API_PUBLIC_KEY', 'API_PUBLIC_KEY is not defined'),
  API_SECRET_KEY: getDefinedEnv('API_SECRET_KEY', 'API_SECRET_KEY is not defined'),
  JWT_SECRET: getDefinedEnv('JWT_SECRET', 'JWT_SECRET is not defined'),
  JWT_REFRESH_SECRET: getDefinedEnv('JWT_REFRESH_SECRET', 'JWT_REFRESH_SECRET is not defined'),
  
  // Nomalize: allow no validation on startup if we don't strictly require email feature immediately, 
  // but for our rule we will require it, user provided so we can safely getDefinedEnv or process.env
  GMAIL_USER: process.env.GMAIL_USER || 'tieututhui0608@gmail.com',
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || 'dclc dend gvph zgoa',
  GMAIL_FROM: process.env.GMAIL_FROM || '"CauLongVui_Nodejs" <tieututhui0608@gmail.com>',
};

