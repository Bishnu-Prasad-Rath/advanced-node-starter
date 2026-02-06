const util = require('util');

let client = null;

if (!process.env.CI) {
  const redis = require("redis");
  const redisUrl = "redis://127.0.0.1:6379";

  client = redis.createClient(redisUrl);

  client.on('error', (err) => {
    console.error('Redis error:', err);
  });

  // Promisify del if needed (older redis versions)
  if (client.del && typeof client.del === 'function') {
    client.del = util.promisify(client.del);
  }

  console.log('Redis connected (cleanCache)');
} else {
  console.log('CI mode: skipping Redis connection (cleanCache)');
}

module.exports = async (req, res, next) => {
  // Let the route handler finish
  await next();

  // Clear cache only if Redis is available and user exists
  if (client && req.user && req.user.id) {
    try {
      await client.del(req.user.id);
    } catch (e) {
      console.error('Redis del error:', e);
    }
  }
};
