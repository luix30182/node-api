// Helpers for various tasks
//Dependencies
const crypto = require('crypto');
const config = require('../config');
//Container for all helpers
const helpers = {};

//Create a SHA256 hash
helpers.hash = function(str){
    if(typeof(str) == 'string' && str.length > 0){
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    }else{
        return false;
    }
}

// Parse a JSON strin to an Object in all cases, without throwing
helpers.parseJsonToObject = function(str){
    try{
        return JSON.parse(str);
    }catch(e){
        return {};
    }
}

//Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength){
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength){
        //Define all the posible characters thtat could go into the string
        const possibleCharacters = 'avcdefghijklmnopqrstuvwxyz1234567890';
        let str = '';
        for(i=0 ; i<strLength; i++){
            //Get a random character from the possibleCharacters string
            const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length)); 
            //Apend this character to the final string
            str += randomCharacter;
        }

        //Retrun to the final string
        return str;
    }else{
        return false;
    }
}

//Export the module
module.exports = helpers;