//Create and export configuration variables

//Container for all the enviroments
const enviroments = {};

//Staging (default) enviroment
enviroments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
};

enviroments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production'
};

// Determinate wich enviroment was passed as a command-line argument
let currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
    
//Check that current enviroment is one of the enviroments above, if not, default to staging
const enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.staging;

// Export the module
module.exports = enviromentToExport;