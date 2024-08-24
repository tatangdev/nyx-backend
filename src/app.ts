import dotenv from 'dotenv';
dotenv.config();

import './instrument';
import * as Sentry from '@sentry/node';
import express, { Request, Response, NextFunction } from 'express';
import logger from 'morgan';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import YAML from 'yaml';
import cors from 'cors';
import v1 from './routers/v1';

const app = express();
const port = process.env.PORT || 3000;

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

// app.get('/', (req: Request, res: Response) => {
//     res.send('Hello World!');
// });

// Sentry error handler
Sentry.setupExpressErrorHandler(app);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        status: false,
        message: `Sorry, can't find the route ${req.originalUrl}`,
        error: null,
        data: null
    });
});

// 500 handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
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
