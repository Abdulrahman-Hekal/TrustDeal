const NodeCache = require("node-cache");
const logger = require("./logger.utils");

const cache = new NodeCache({
  stdTTL: Number.parseInt(process.env.CACHE_TTL || "600"),
  checkperiod: Number.parseInt(process.env.CACHE_CHECK_PERIOD || "300"),
});

cache.on("error", (err) => logger.error(`Caching error: ${err}`));

const CacheService = {
  get: (key) => cache.get(key),
  set: (key, value, ttl) => cache.set(key, value, ttl),
  del: (key) => cache.del(key),
  flush: () => cache.flushAll(),
  has: (key) => cache.has(key),
};

module.exports = CacheService;
