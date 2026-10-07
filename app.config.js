// google-services.json (Firebase, for push alerts) is not in the repository:
// each fork uses its own Firebase project. Without it the app still builds and
// runs; tracked tokens are then re-checked on the phone only.
const fs = require("fs");
const path = require("path");

module.exports = ({ config }) => {
  if (fs.existsSync(path.join(__dirname, "google-services.json"))) return config;
  const { googleServicesFile, ...android } = config.android || {};
  return { ...config, android };
};
