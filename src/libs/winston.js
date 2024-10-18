const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(), // Logs to console
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }) // Logs errors to file
    ]
});

module.exports = logger;