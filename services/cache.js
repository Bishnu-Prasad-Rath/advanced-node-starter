// ------------------------------
//  Redis + Mongoose Cache Layer
//  FULL UPDATED VERSION (2025)
// ------------------------------

const mongoose = require("mongoose");
const util = require("util");

let client = null;
let exec = mongoose.Query.prototype.exec;

// ------------------------------------------
// Setup Redis ONLY if not running in CI
// ------------------------------------------
if (!process.env.CI) {
  const redis = require("redis");

  const redisUrl = "redis://127.0.0.1:6379";
  client = redis.createClient(redisUrl);

  // Promisify 'get' because Redis v2 uses callbacks
  client.get = util.promisify(client.get);

  client.on("error", (err) => {
    console.error("Redis error:", err);
  });

  console.log("Redis connected");
} else {
  console.log("CI mode: skipping Redis connection");
}

// ------------------------------------------
// Add .cache() function to all mongoose queries
// ------------------------------------------
mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || "");
  return this;
};

// ------------------------------------------
// Override exec() to plug into Redis
// ------------------------------------------
mongoose.Query.prototype.exec = async function () {

  // If caching NOT enabled or Redis disabled → normal DB query
  if (!this.useCache || !client) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.model.collection.name
  });

  const cacheValue = await client.get(key);

  if (cacheValue) {
    console.log("✨ Serving From Redis Cache ✨");

    const doc = JSON.parse(cacheValue);
    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }

  console.log("🔥 Serving From MongoDB 🔥");

  const result = await exec.apply(this, arguments);

  client.set(key, JSON.stringify(result));
  return result;
};

// ------------------------------------------
// Optional Helper: Clear Cache by Key
// ------------------------------------------
module.exports.clearCache = function (hashKey) {
  if (client) {
    client.del(JSON.stringify(hashKey));
  }
};
