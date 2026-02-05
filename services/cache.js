// ------------------------------
//  Redis + Mongoose Cache Layer
//  FULL UPDATED VERSION (2025)
// ------------------------------

const mongoose = require("mongoose");
const util = require("util");
const redis = require("redis");

// ----- Setup Redis Client (Redis v2.8.0 style) -----
const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);

// Promisify 'get' because Redis v2 uses callbacks
client.get = util.promisify(client.get);

// Store original exec() so we can override it
const exec = mongoose.Query.prototype.exec;

// ------------------------------------------
// Add .cache() function to all mongoose queries
// ------------------------------------------
mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || "");  // optional namespace
  return this;
};

// ------------------------------------------
//  Override exec() to plug into Redis
// ------------------------------------------
mongoose.Query.prototype.exec = async function () {
  
  // If caching NOT enabled → normal DB query
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  // Create unique key for this query
  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.model.collection.name
  });

  // Try reading from Redis
  const cacheValue = await client.get(key);

  if (cacheValue) {
    console.log("✨ Serving From Redis Cache ✨");

    const doc = JSON.parse(cacheValue);

    // If result is array → return array of mongoose docs
    return Array.isArray(doc)
      ? doc.map((d) => new this.model(d))
      : new this.model(doc);
  }

  // Otherwise, run query on MongoDB
  console.log("🔥 Serving From MongoDB 🔥");

  const result = await exec.apply(this, arguments);

  // Store result in Redis
  client.set(key, JSON.stringify(result));

  return result;
};

// ------------------------------------------
// Optional Helper: Clear Cache by Key
// ------------------------------------------
module.exports.clearCache = function (hashKey) {
  client.del(JSON.stringify(hashKey));
};
