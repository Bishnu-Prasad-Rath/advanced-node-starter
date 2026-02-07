require('../models/User');

jest.setTimeout(120000);
const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.Promise = global.Promise;

beforeAll(async () => {
  // Skip DB connection on CI (GitHub Actions)
  if (process.env.CI === 'true') {
    return;
  }

  await mongoose.connect(keys.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});
