require('dotenv').config();
const express = require('express');
const logger = require('morgan');
const app = express();
const port = process.env.PORT || 3000;

app.use(logger('dev'));
app.use(express.json());
app.use('/images', express.static('./src/public/images'));
app.use('/videos', express.static('./src/public/videos'));

const v1 = require('./routers/v1');
app.use('/api/v1', v1);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server running at port`, port);
});