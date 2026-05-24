const express = require('express');
const cors    = require('cors');
const authRoutes         = require('./routes/authRoutes');
const bugRoutes          = require('./routes/bugRoutes');
const projectRoutes      = require('./routes/projectRoutes');
const userRoutes         = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',          authRoutes);
app.use('/api/bugs',          bugRoutes);
app.use('/api/projects',      projectRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/notifications', notificationRoutes);

module.exports = app;
