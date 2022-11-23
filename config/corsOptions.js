require ('dotenv').config();

const allowedOrigins = [
    process.env.CLIENT_URL
];

var corsOptions = function (req, callback) {
    if (allowedOrigins.indexOf(req.header('Origin')) !== -1) {
      corsOptions = { origin: true }
    } else {
      corsOptions = { origin: false }
    }
    callback(null, corsOptions)
  }

module.exports = corsOptions;