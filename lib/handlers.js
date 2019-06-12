// Request handlers
//Dependencies
const _data = require('./data');
const helpers = require('./helpers');
//Define handlers
const handlers = {};

//Users
handlers.users = function(data, callback){
    const acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.includes(data.method)){
        handlers._users[data.method](data, callback);
    }else{
        callback(405);
    }
}

//container for the users submethods
handlers._users = {};

//Users - post 
//Required: firstName, lastName, phone, password, tosAgreement
//optional data: none
handlers._users.post = function(data, callback){
    //Check that all required fields are filled out
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;

    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;

    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 9 ? data.payload.phone.trim() : false;

    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if( firstName && lastName && password && tosAgreement){
        //Make sure that the user doesn't already exist
        _data.read('users',phone)
        .then(data => {
            callback(400,'Error', 'A user with that phone number already exist');
        })
        .catch(err => {
            //hash the password
            const hashedPassword = helpers.hash(password);
            if(hashedPassword){
                    //Create user object
                const userObject = {
                    'firstName' : firstName,
                    'lastName' : lastName,
                    'phone' : phone,
                    'hashedPassword' : hashedPassword,
                    'tosAgreement' : true
                }
                //Store the user
                _data.create('users',phone,userObject)
                .then((res) => {
                    console.log(res);
                    callback(200);
                })
                .catch(err => {
                    console.log(err);
                    callback (400, {'Error': 'Could not create the new User'});
                });
            }else{
                console.log('Error','Could not hash the user password')
            }
        });
    }else{
        callback(400, {'Error': 'missing required fields'});
    }
}
//Users - get 
//Require data: phone
//Optional data: none
/* @TODO onlye let an authenticated user access their object. Don't let them access anyone */
handlers._users.get = function(data, callback){
    //Check that the phone number is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length > 9 ?  data.queryStringObject.phone.trim() : false;
    if(phone){
        //Lookup for the user
        _data.read('users', phone)
        .then((data) => {
            if(data){
                delete data.hashedPassword;
                callback(200,data);
            }
        })
        .catch(() => {
            callback(400);
        });
    }else{
        callback(400, {'Error': 'Missing required field'});
    }
}
//Users - put 
//Required data: phone
//Optional data: firstName, lastName, password (at least one must be specified)
/* @TODO onlye let an authenticated user update their object. Don't let them access anyone */
handlers._users.put = function(data, callback){
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 9 ?  data.payload.phone.trim() : false;

    //Check optional fields
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;

    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;

    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    //Error if the phone is invalid
    if(phone){
        if(firstName || lastName || password){
            //Lookup user
            _data.read('users',phone)
            .then((userData) =>{
                if(userData){
                    //Update the fields necessary
                    if(firstName){
                        userData.firstName = firstName;
                    }
                    if(lastName){
                        userData.lastName = lastName;
                    }
                    if(password){
                        userData.hashedPassword = helpers.hash(password);
                    }
                    //Store the new updates
                    _data.update('users',phone, userData)
                    .then(() => {
                        callback(200);
                    })
                    .catch(err =>{
                        console.log(err);
                        callback(500,{'Error': 'Could not update the user'});
                    });
                }
            })
            .catch(() => {
                callback(400, {'Error': 'The specified user does not exist'})
            });
        }else{
            //Error if nothing is send to update
            callback(400,{'Error': 'Missing fields to update'});
        }
    }else{
        callback(400,{'Error': 'Missing required field'});
    }


}
//Users - delete
//Required field: phone 
/* @TODO onlye let an authenticated user delete their object. Don't let them access anyone */
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = function(data, callback){ 
    //Check that the phone numner is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length > 9 ?  data.queryStringObject.phone.trim() : false;
    if(phone){
        //Lookup for the user
        _data.read('users', phone)
        .then((data) => {
            if(data){
                _data.delete('users',phone)
                .then(() => {
                    callback(200);
                })
                .catch(() => {
                    callback(500, {'Error': 'Could not delete the specified user'});
                });
            }
        })
        .catch(() => {
            callback(400,  {'Error': 'Could not find the specified user'});
        });
    }else{
        callback(400, {'Error': 'Missing required field'});
    }
}

//Tokens
handlers.tokens = function(data, callback){
    const acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.includes(data.method)){
        handlers._tokens[data.method](data, callback);
    }else{
        callback(405);
    }
}

//Container for all the tokens methods
handlers._tokens = {};
//Tokens - post
//Required data: phone, password
//Optional data: none
handlers._tokens.post = function(data,callback){
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length > 9 ? data.payload.phone.trim() : false;

    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(phone && password){
        //Lookuo the user who matches that phone number
        _data.read('users',phone)
        .then(userData => {
            if(userData){
                //Hash the sent password and comapre it to the user stored hash password
                const hashedPassword = helpers.hash(password);
                if(hashedPassword === userData.hashedPassword){
                    //If valid, create a new token with a random name, Set expiration date   1 hour in the future
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    const tokenObject = {
                        'phone' : phone,
                        'id' : tokenId,
                        'expires' : expires
                    }

                    //Store the token
                    _data.create('tokens', tokenId ,tokenObject)
                    .then(() => {
                        callback(200, tokenObject)
                    })
                    .catch(()=>{callback(400,{'Error' : 'Could not create the new token'})})
                }else{
                    callback(400,{'Error': 'Password not match'})
                }
            }
        })
        .catch(err => {
            console.log(err)
            callback(400,{'Error': 'Could not find the specified user'})
        });
    }else{
        callback(400, {'Error':'missing required fields'});
    }
}
//Tokens - get
//Required data: id
//Optional data_ none 
handlers._tokens.get = function(data,callback){
//Check that the id  is valid
const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ?  data.queryStringObject.id.trim() : false;
console.log(data.queryStringObject.id.trim().length)
if(id){
    //Lookup for the user
    _data.read('tokens', id)
    .then((data) => {
        if(data){
            callback(200,data);
        }
    })
    .catch(() => {
        callback(400);
    });
}else{
    callback(400, {'Error': 'Missing required field'});
}
}
//Tokens - put
handlers._tokens.put = function(data,callback){

}
//Tokens - delete
handlers._tokens.delete = function(data,callback){

}

//Ping handler
handlers.ping = function(data, callback){
    callback(200);
}
//Not found handler
handlers.notFound = function(data, callback){
    callback(404);
};

// Export the module
module.exports = handlers;