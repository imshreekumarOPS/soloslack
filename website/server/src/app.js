const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes/index');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

// 404 handler (must be after routes)
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
