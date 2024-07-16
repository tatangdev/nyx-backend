const jwt = require('jsonwebtoken');

module.exports = {
    validate: (req, res, next) => {
        let token = req.headers['authorization'];
        if (!token) {
            return res.status(401).json({
                status: false,
                message: "Token not found",
                error: null,
                data: null
            });
        }

        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: false,
                    message: "Token is not valid",
                    error: err,
                    data: null
                });
            }

            req.user = decoded;
            next();
        });
    }
};