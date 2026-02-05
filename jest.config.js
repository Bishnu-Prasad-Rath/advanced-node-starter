module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["./tests/setup.js"],
  modulePathIgnorePatterns: [
    "node_modules/puppeteer", 
    "node_modules/puppeteer-core"
  ],
  transform: {}
};