const env = require('./environment');

const corsOptions = {
  origin: env.frontendUrl,
  methods: ['GET', 'POST'],
  credentials: true,
};

module.exports = corsOptions;
