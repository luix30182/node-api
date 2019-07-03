// Request handlers
//Dependencies
const _data = require('./data');
const helpers = require('./helpers');
//Define handlers
const handlers = {};
const config = require('../config');

//Users
handlers.users = function(data, callback) {
	const acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.includes(data.method)) {
		handlers._users[data.method](data, callback);
	} else {
		callback(405);
	}
};

//container for the users submethods
handlers._users = {};

//Users - post
//Required: firstName, lastName, phone, password, tosAgreement
//optional data: none
handlers._users.post = function(data, callback) {
	//Check that all required fields are filled out
	const firstName =
		typeof data.payload.firstName == 'string' && data.payload.firstName.trim().length > 0
			? data.payload.firstName.trim()
			: false;

	const lastName =
		typeof data.payload.lastName == 'string' && data.payload.lastName.trim().length > 0
			? data.payload.lastName.trim()
			: false;

	const phone =
		typeof data.payload.phone == 'string' && data.payload.phone.trim().length > 9 ? data.payload.phone.trim() : false;

	const password =
		typeof data.payload.password == 'string' && data.payload.password.trim().length > 0
			? data.payload.password.trim()
			: false;

	const tosAgreement =
		typeof data.payload.tosAgreement == 'boolean' && data.payload.tosAgreement == true ? true : false;

	if (firstName && lastName && password && tosAgreement) {
		//Make sure that the user doesn't already exist
		_data
			.read('users', phone)
			.then(data => {
				callback(400, 'Error', 'A user with that phone number already exist');
			})
			.catch(err => {
				//hash the password
				const hashedPassword = helpers.hash(password);
				if (hashedPassword) {
					//Create user object
					const userObject = {
						firstName: firstName,
						lastName: lastName,
						phone: phone,
						hashedPassword: hashedPassword,
						tosAgreement: true
					};
					//Store the user
					_data
						.create('users', phone, userObject)
						.then(res => {
							console.log(res);
							callback(200);
						})
						.catch(err => {
							console.log(err);
							callback(400, { Error: 'Could not create the new User' });
						});
				} else {
					console.log('Error', 'Could not hash the user password');
				}
			});
	} else {
		callback(400, { Error: 'missing required fields' });
	}
};
//Users - get
//Require data: phone
//Optional data: none
handlers._users.get = function(data, callback) {
	//Check that the phone number is valid
	const phone =
		typeof data.queryStringObject.phone == 'string' && data.queryStringObject.phone.trim().length > 9
			? data.queryStringObject.phone.trim()
			: false;
	if (phone) {
		//Lookup for the user
		//Get the token from the headers
		const token = typeof data.headers.token == 'string' ? data.headers.token : false;
		handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
			if (tokenIsValid) {
				_data
					.read('users', phone)
					.then(data => {
						if (data) {
							delete data.hashedPassword;
							callback(200, data);
						}
					})
					.catch(() => {
						callback(400);
					});
			} else {
				callback(403, {
					Error: 'Missing required token in header, or token is invalid'
				});
			}
		});
	} else {
		callback(400, { Error: 'Missing required field' });
	}
};
//Users - put
//Required data: phone
//Optional data: firstName, lastName, password (at least one must be specified)
/* @TODO onlye let an authenticated user update their object. Don't let them access anyone */
handlers._users.put = function(data, callback) {
	const phone =
		typeof data.payload.phone == 'string' && data.payload.phone.trim().length > 9 ? data.payload.phone.trim() : false;

	//Check optional fields
	const firstName =
		typeof data.payload.firstName == 'string' && data.payload.firstName.trim().length > 0
			? data.payload.firstName.trim()
			: false;

	const lastName =
		typeof data.payload.lastName == 'string' && data.payload.lastName.trim().length > 0
			? data.payload.lastName.trim()
			: false;

	const password =
		typeof data.payload.password == 'string' && data.payload.password.trim().length > 0
			? data.payload.password.trim()
			: false;

	//Error if the phone is invalid
	if (phone) {
		if (firstName || lastName || password) {
			//Get the token from the headers
			const token = typeof data.headers.token == 'string' ? data.headers.token : false;
			handlers.tokens.verifyToken(token, phone, function(tokenIsValid) {
				if (tokenIsValid) {
					//Lookup user
					_data
						.read('users', phone)
						.then(userData => {
							if (userData) {
								//Update the fields necessary
								if (firstName) {
									userData.firstName = firstName;
								}
								if (lastName) {
									userData.lastName = lastName;
								}
								if (password) {
									userData.hashedPassword = helpers.hash(password);
								}
								//Store the new updates
								_data
									.update('users', phone, userData)
									.then(() => {
										callback(200);
									})
									.catch(err => {
										console.log(err);
										callback(500, { Error: 'Could not update the user' });
									});
							}
						})
						.catch(() => {
							callback(400, { Error: 'The specified user does not exist' });
						});
				} else {
					callback(403, {
						Error: 'Missing required token in header, or token is invalid'
					});
				}
			});
		} else {
			//Error if nothing is send to update
			callback(400, { Error: 'Missing fields to update' });
		}
	} else {
		callback(400, { Error: 'Missing required field' });
	}
};
//Users - delete
//Required field: phone
handlers._users.delete = function(data, callback) {
	//Check that the phone numner is valid
	const phone =
		typeof data.queryStringObject.phone == 'string' && data.queryStringObject.phone.trim().length > 9
			? data.queryStringObject.phone.trim()
			: false;
	if (phone) {
		//Get the token from the headers
		const token = typeof data.headers.token == 'string' ? data.headers.token : false;
		//Verify that the given token is valid for the phone number
		handlers.tokens.verifyToken(token, phone, function(tokenIsValid) {
			if (tokenIsValid) {
				//Lookup for the user
				_data
					.read('users', phone)
					.then(data => {
						if (data) {
							_data
								.delete('users', phone)
								.then(() => {
									callback(200);
								})
								.catch(() => {
									callback(500, {
										Error: 'Could not delete the specified user'
									});
								});
						}
					})
					.catch(() => {
						callback(400, { Error: 'Could not find the specified user' });
					});
			} else {
				callback(403, {
					Error: 'Missing required token in header, or token is invalid'
				});
			}
		});
	} else {
		callback(400, { Error: 'Missing required field' });
	}
};

//Tokens
handlers.tokens = function(data, callback) {
	const acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.includes(data.method)) {
		handlers._tokens[data.method](data, callback);
	} else {
		callback(405);
	}
};

//Container for all the tokens methods
handlers._tokens = {};
//Tokens - post
//Required data: phone, password
//Optional data: none
handlers._tokens.post = function(data, callback) {
	const phone =
		typeof data.payload.phone == 'string' && data.payload.phone.trim().length > 9 ? data.payload.phone.trim() : false;
	const password =
		typeof data.payload.password == 'string' && data.payload.password.trim().length > 0
			? data.payload.password.trim()
			: false;

	if (phone && password) {
		//Lookuo the user who matches that phone number
		_data
			.read('users', phone)
			.then(userData => {
				if (userData) {
					//Hash the sent password and comapre it to the user stored hash password
					const hashedPassword = helpers.hash(password);
					if (hashedPassword === userData.hashedPassword) {
						//If valid, create a new token with a random name, Set expiration date   1 hour in the future
						const tokenId = helpers.createRandomString(20);
						const expires = Date.now() + 1000 * 60 * 60;
						const tokenObject = {
							phone: phone,
							id: tokenId,
							expires: expires
						};

						//Store the token
						_data
							.create('tokens', tokenId, tokenObject)
							.then(() => {
								callback(200, tokenObject);
							})
							.catch(() => {
								callback(400, { Error: 'Could not create the new token' });
							});
					} else {
						callback(400, { Error: 'Password not match' });
					}
				}
			})
			.catch(err => {
				console.log(err);
				callback(400, { Error: 'Could not find the specified user' });
			});
	} else {
		callback(400, { Error: 'missing required fields' });
	}
};
//Tokens - get
//Required data: id
//Optional data_ none
handlers._tokens.get = function(data, callback) {
	//Check that the id  is valid
	const id =
		typeof data.queryStringObject.id == 'string' && data.queryStringObject.id.trim().length == 20
			? data.queryStringObject.id.trim()
			: false;
	if (id) {
		//Lookup for the user
		_data
			.read('tokens', id)
			.then(data => {
				if (data) {
					callback(200, data);
				}
			})
			.catch(() => {
				callback(400);
			});
	} else {
		callback(400, { Error: 'Missing required field' });
	}
};
//Tokens - put
//Required fields: id, extend
//Optional data: none
handlers._tokens.put = function(data, callback) {
	const id = typeof data.payload.id == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
	const extend = typeof data.payload.extend == 'boolean' && data.payload.extend == true ? true : false;
	if (id && extend) {
		//Look up the token
		_data
			.read('tokens', id)
			.then(tokenData => {
				if (tokenData) {
					//Check to the make sure the token isn't already expired
					if (tokenData.expires > Date.now()) {
						//Set the expiration an hour from now
						tokenData.expires = Date.now() + 1000 * 60 * 60;
						//Store the new update
						_data
							.update('tokens', id, tokenData)
							.then(() => {
								callback(200);
							})
							.catch(() => {
								callback(400, {
									Error: "Could not update the token's expiration"
								});
							});
					} else {
						callback(400, {
							Error: 'The token has already expired and cannot be extended'
						});
					}
				} else {
					callback(400, { Error: 'especified token does not exist' });
				}
			})
			.catch(() => {
				callback(400, { Error: 'especified token does not exist' });
			});
	} else {
		callback(400, { Error: 'missing required fields or fields iare invalid' });
	}
};
//Tokens - delete
//Required data: id
// optional data: none
handlers._tokens.delete = function(data, callback) {
	//Check that the id is valid
	const id =
		typeof data.queryStringObject.id == 'string' && data.queryStringObject.id.trim().length == 20
			? data.queryStringObject.id.trim()
			: false;
	if (id) {
		//Lookup for the user
		_data
			.read('tokens', id)
			.then(data => {
				if (data) {
					_data
						.delete('tokens', id)
						.then(() => {
							callback(200);
						})
						.catch(() => {
							callback(500, { Error: 'Could not delete the specified token' });
						});
				}
			})
			.catch(() => {
				callback(400, { Error: 'Could not find the specified token' });
			});
	} else {
		callback(400, { Error: 'Missing required field' });
	}
};

//Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback) {
	//Look up the token
	_data
		.read('tokens', id)
		.then(data => {
			if (data.phone == phone && data.expires > Date.now()) {
				callback(true);
			} else {
				callback(false);
			}
		})
		.catch(() => {
			callback(false);
		});
};

//Cheks
handlers.checks = function(data, callback) {
	const acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.includes(data.method)) {
		handlers._checks[data.method](data, callback);
	} else {
		callback(405);
	}
};

//Container for all the checks methods
handlers._checks = {};

//Checks - post
// Required data: protocol, url, mthod, successCodes, timeOutSecods
handlers._checks.post = function(data, callback) {
	//Validate inputs
	const protocol =
		typeof data.payload.protocol == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1
			? data.payload.protocol
			: false;
	const url = typeof data.payload.url == 'string' && data.payload.url.length > 0 ? data.payload.url : false;
	const method =
		typeof data.payload.method == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
			? data.payload.method
			: false;
	const successCodes =
		typeof data.payload.successCodes == 'object' &&
		data.payload.successCodes instanceof Array &&
		data.payload.successCodes.length > 0
			? data.payload.successCodes
			: false;
	const timeoutSeconds =
		typeof data.payload.timeoutSeconds == 'number' &&
		data.payload.timeoutSeconds % 1 === 0 &&
		data.payload.timeoutSeconds >= 1 &&
		data.payload.timeoutSeconds <= 5
			? data.payload.timeoutSeconds
			: false;
	if (protocol && url && method && successCodes && timeoutSeconds) {
		// Get the token from the headers
		const token = typeof data.headers.token == 'string' ? data.headers.token : false;
		//Lookup the user data
		_data
			.read('tokens', token)
			.then(tokenData => {
				const userPhone = tokenData.phone;
				_data
					.read('users', userPhone)
					.then(data => {
						console.log(data);
						const userChecks = typeof data.checks == 'object' && data.checks instanceof Array ? data.checks : [];
						//Verify that the user has less then the number of max checjs per user
						if (userChecks.length < config.maxChecks) {
							const checkId = helpers.createRandomString(20);
							// Create the check object, and include the user's phone
							const checkObject = {
								id: checkId,
								userPhone: userPhone,
								protocol: protocol,
								url: url,
								method: method,
								successCodes: successCodes,
								timeoutSeconds: timeoutSeconds
							};

							_data
								.create('checks', checkId, checkObject)
								.then(() => {
									// Add the check id to the user's object
									data.checks = userChecks;
									data.checks.push(checkId);
									//Save the new user data
									_data
										.update('users', userPhone, data)
										.then(() => {
											callback(200, checkObject);
										})
										.catch(() => {
											callback(500, { Error: 'Could not update the user with the new check' });
										});
								})
								.catch(e => {
									console.log(e);
									callback(500, { Error: 'Could not create new check' });
								});
						} else {
							callback(400, { Error: `The user already has the maximum number of checks (${config.maxChecks})` });
						}
					})
					.catch(() => {
						callback(403);
					});
			})
			.catch(() => {
				callback(403);
			});
	} else {
		callback(400, { Error: 'Missing required inputs, or inputs are invalid' });
	}
};

// Checks get
// Required data: id
// Optional data: none
handlers._checks.get = function(data, callback) {
	//Check that the phone number is valid
	const id =
		typeof data.queryStringObject.id == 'string' && data.queryStringObject.id.trim().length == 20
			? data.queryStringObject.id.trim()
			: false;
	if (id) {
		//Lookup the check
		_data
			.read('checks', id)
			.then(userData => {
				//Lookup for the user
				//Get the token from the headers
				const token = typeof data.headers.token == 'string' ? data.headers.token : false;
				handlers._tokens.verifyToken(token, userData.userPhone, function(tokenIsValid) {
					if (tokenIsValid) {
						// Return the check data
						callback(200, userData);
					} else {
						callback(403);
					}
				});
			})
			.catch(e => {
				console.log(e);
				callback(400);
			});
	} else {
		callback(400, { Error: 'Missing required field' });
	}
};

// Checks put
//Required data: id
//Optional data: protocol, url, method, successCodes, timeputSeconds (one must be send)
handlers._checks.put = function(data, callback) {
	const id = typeof data.payload.id == 'string' && data.payload.id.length == 20 ? data.payload.id.trim() : false;

	//Check optional fields
	const protocol =
		typeof data.payload.protocol == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1
			? data.payload.protocol
			: false;
	const url = typeof data.payload.url == 'string' && data.payload.url.length > 0 ? data.payload.url : false;
	const method =
		typeof data.payload.method == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
			? data.payload.method
			: false;
	const successCodes =
		typeof data.payload.successCodes == 'object' &&
		data.payload.successCodes instanceof Array &&
		data.payload.successCodes.length > 0
			? data.payload.successCodes
			: false;
	const timeoutSeconds =
		typeof data.payload.timeoutSeconds == 'number' &&
		data.payload.timeoutSeconds % 1 === 0 &&
		data.payload.timeoutSeconds >= 1 &&
		data.payload.timeoutSeconds <= 5
			? data.payload.timeoutSeconds
			: false;
	// Check if id is valid
	if (id) {
		// Check one or more optional fields has been send
		if (protocol || url || method || successCodes || timeoutSeconds) {
			// Lookup the check
			_data
				.read('checks', id)
				.then(checkData => {
					const token = typeof data.headers.token == 'string' ? data.headers.token : false;

					handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
						if (tokenIsValid) {
							//Update the check whete necessary
							if (protocol) {
								checkData.protocol = protocol;
							}
							if (url) {
								checkData.url = url;
							}
							if (method) {
								checkData.method = method;
							}
							if (successCodes) {
								checkData.successCodes = successCodes;
							}
							if (timeoutSeconds) {
								checkData.timeoutSeconds = timeoutSeconds;
							}
							_data
								.update('checks', id, checkData)
								.then(() => {
									callback(200);
								})
								.catch(err => {
									console.log(err);
									callback(500, { Error: 'Could not update the check' });
								});
						} else {
							callback(403);
						}
					});
				})
				.catch(e => {
					callback(400, { Error: 'Check Id did not exist' });
				});
		} else {
			callback(400, { Error: 'Missing fields to update' });
		}
	} else {
		callback(400, { Error: 'Missing required field' });
	}
};

//Ping handler
handlers.ping = function(data, callback) {
	callback(200);
};
//Not found handler
handlers.notFound = function(data, callback) {
	callback(404);
};

// Export the module
module.exports = handlers;
