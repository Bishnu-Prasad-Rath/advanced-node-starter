const util = require("util");

const ENABLE_REDIS = process.env.ENABLE_REDIS === "true";

let client = null;

if (ENABLE_REDIS) {
  const redis = require("redis");
  const redisUrl = "redis://127.0.0.1:6379";

  client = redis.createClient(redisUrl);

  client.on("error", (err) => {
    console.error("Redis error:", err);
  });

  // Promisify del (redis v2)
  if (client.del && typeof client.del === "function") {
    client.del = util.promisify(client.del);
  }

  console.log("Redis enabled (middlewares/cleanCache)");
} else {
  console.log("Redis disabled (middlewares/cleanCache)");
}

module.exports = async (req, res, next) => {
  await next();

  if (client && req.user && req.user.id) {
    try {
      await client.del(req.user.id);
    } catch (e) {
      console.error("Redis del error:", e);
    }
  }
};
