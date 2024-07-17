const router = require('express').Router();
const auth = require('../../controllers/v1/player/auth.controller');
const jwt = require('jsonwebtoken');

// auth
router.post('/login', auth.login);
router.get('/whoami', validate, auth.whoami);

function validate(req, res, next) {
    let token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({
            status: false,
            message: "You are not authorized to access this resource",
            error: null,
            data: null
        });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({
                status: false,
                message: "You are not authorized to access this resource",
                error: err,
                data: null
            });
        }

        req.player = decoded;
        next();
    });
}

module.exports = router;