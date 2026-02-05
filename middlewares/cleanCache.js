const redis = require("redis");

const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);

module.exports = async (req, res, next) => {
  // Wait for route handler to finish first
  await next();

  // Then clear cache for this user
  client.del(req.user.id);
};
