require('dotenv').config();
require("./instrument.js");
const Sentry = require("@sentry/node");
const express = require('express');
const logger = require('morgan');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const { BASE_URL = 'http://localhost:3000' } = process.env;

const v1 = require('./routers/v1');

var options = {
    explorer: true,
    swaggerOptions: {
        urls: [
            {
                url: `${BASE_URL}/docs/swagger_player.yaml`,
                name: 'Player V1'
            },
            {
                url: `${BASE_URL}/docs/swagger_admin.yaml`,
                name: 'Admin V1'
            },
            {
                url: `${BASE_URL}/docs/swagger_external.yaml`,
                name: 'External V1'
            }
        ]
    }
};

// Middleware
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use('/docs', express.static('./src/public/docs'));
app.use('/images', express.static('./src/public/images'));
app.use('/videos', express.static('./src/public/videos'));

// Routes
app.use('/api/v1', v1);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, options));

app.get('/', (req, res) => {
    res.json({
        status: true,
        message: 'Welcome to the API Chipmunk Kombat',
        error: null,
        data: null
    });
});

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

cron.schedule('0 11 * * *', () => {
    resetFullEnergyQuota();
});
