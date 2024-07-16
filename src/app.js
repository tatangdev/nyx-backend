require('dotenv').config();
const express = require('express');
const logger = require('morgan');
const swaggerUi = require('swagger-ui-express');
const app = express();
const port = process.env.PORT || 3000;
const fs = require("fs");
const YAML = require('yaml');
const cors = require('cors');

const file = fs.readFileSync('./swagger.yaml', 'utf8');
const swaggerDocument = YAML.parse(file);

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use('/images', express.static('./src/public/images'));
app.use('/videos', express.static('./src/public/videos'));

const v1 = require('./routers/v1');
app.use('/api/v1', v1);
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

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
    console.error(err.stack);
    res.status(500).json({
        status: false,
        message: 'Something broke!',
        error: err.message,
        data: null
    });
});

app.listen(port, () => {
    console.log(`Server running at port`, port);
});