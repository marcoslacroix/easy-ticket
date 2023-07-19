
const jwt = require('jsonwebtoken');
require("../util/utilJsonWebToken");

function decodeToken(req) {
    let token = getTokenFromHeader(req);
    if (token) {
        token = token.replace('Bearer ', '');
        return jwt.verify(token, process.env.SECRET_KEY);
    }
}

function verifyToken(req, res, next) {
    const authorizationHeader  = getTokenFromHeader(req);
    let token = "";

    if (authorizationHeader) {
        token = authorizationHeader.split(' ')[1];
    }
  
    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }
  
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido' });
        }
  
        req.user = decoded;
        next();
    });
}

function sign(user) {
    return jwt.sign({ email: user.email, userId: user.id }, process.env.SECRET_KEY);
}

function getTokenFromHeader(req) {
    return req.headers['authorization'];
}

module.exports = {
    verifyToken,
    decodeToken, 
    sign
}