
require('../models/User');

jest.setTimeout(40000);
const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.Promise = global.Promise;

// Modern connection syntax (useMongoClient is deprecated)
mongoose.connect(keys.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});