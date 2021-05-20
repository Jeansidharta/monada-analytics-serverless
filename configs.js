const dotenv = require('dotenv');
const fs = require('fs');

module.exports = async ({ options, resolveConfigurationProperty }) => {
	// Load env vars into Serverless environment
	// You can do more complicated env var resolution with dotenv here
	const envVars = dotenv.parse(fs.readFileSync('.env'));
	return envVars;
};
