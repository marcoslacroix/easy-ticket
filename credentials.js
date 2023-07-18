const path = require('path');
let isDebug = false;
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
	isDebug = true;
}

module.exports = {
	// PRODUÇÃO = false
	// HOMOLOGAÇÃO = true,
	sandbox: isDebug ? true : false,
	client_id: process.env.GN_CLIENT_ID,
	client_secret: process.env.GN_CLIENT_SECRET,
	pix_cert: path.resolve(__dirname, `../certs/${process.env.GN_CERT}`),
};