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
  JWT_REFRESH_SECRET: getDefinedEnv('JWT_REFRESH_SECRET', 'JWT_REFRESH_SECRET is not defined')
};

