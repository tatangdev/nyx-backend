require('dotenv').config();
require("./instrument.js");
const Sentry = require("@sentry/node");
const express = require('express');
const logger = require('morgan');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const YAML = require('yaml');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

const v1 = require('./routers/v1');

const file = fs.readFileSync('./swagger.yaml', 'utf8');
const swaggerDocument = YAML.parse(file);

// Middleware
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use('/images', express.static('./src/public/images'));
app.use('/videos', express.static('./src/public/videos'));

// Routes
app.use('/api/v1', v1);
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// app.get('/', (req, res) => {
//     res.send('Hello World!');
// });

// Sentry error handler
Sentry.setupExpressErrorHandler(app);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        status: false,
        message: `Sorry, can't find the route ${req.originalUrl}`,
        error: null,
        data: null
    });
});

// 500 handler
app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({
        status: false,
        message: 'Something broke!',
        error: err.message,
        data: null
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at port`, port);
});

const cron = require('node-cron');
const { approveTasks } = require('./cron/tasks.js');

cron.schedule('*/10 * * * *', () => {
    approveTasks();
});