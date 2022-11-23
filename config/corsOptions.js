require ('dotenv').config();

const corsOptions = {
    origin: process.env.CLIENT_URL,
    optionsSuccessStatus: 200
}

module.exports = corsOptions;