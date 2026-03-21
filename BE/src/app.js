const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes/index');
const paymentCallbackRoutes = require('./routes/payment-callback.route');
const errorMiddleware = require('./middlewares/error.middleware');

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allow images to be viewed cross-origin

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CauLongVui API' });
});

// Payment gateway callbacks (no API key required - called by VNPay/MoMo)
app.use('/api/v1', paymentCallbackRoutes);

// Main routes (API key required)
app.use('/api/v1', routes);

// Error Handling
app.use(errorMiddleware);

module.exports = app;
