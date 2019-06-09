/*Primary file for the API*/
//Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

//Instantitate the HTTP server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});
//Start the server
const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
}
httpServer.listen(config.httpPort,() => {
    console.log(`The server is listening on port ${config.httpPort}`);
})
//Instantiate the HTTPS server
const httpsServer = https.createServer(httpsServerOptions,(req, res) => {
    unifiedServer(req, res);
  });
//Start the HTTPS server
httpsServer.listen(config.httpsPort,() => {
    console.log(`The server is listening on port ${config.httpsPort}`);
})
//All the server login for http and https 
const unifiedServer = function(req, res){
    //Get the url and parse it
    const parseUrl = url.parse(req.url, true);
    //Get the path
    const path = parseUrl.pathname;
    const trimPath = path.replace(/^\/+|\/+$/g,'');
    //Get the query string as an object
    const queryStringObject = parseUrl.query;
    //Get the HTTP method
    const method = req.method.toLowerCase();
    //Get the headers as an object
    const headers = req.headers;
    //Get the payload, if any 
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data',(data)=>{
        buffer += decoder.write(data);
    });
    req.on('end',()=>{
        buffer += decoder.end();
        //Choose the handler, if not found use notFound handler
        const choosenHandler = typeof(router[trimPath]) !== 'undefined' ? router[trimPath] : handlers.notFound;
        //Construct the data object to send the handler
        const data = {
            'trimPath': trimPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        };
        //Route the request to the handler specified in the router
        choosenHandler(data, function(statusCode, payload){
            //Use the status code called back by the handler default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            //Use the payload called back by the handler, or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};
            //Convert the payload to a string
            const payloadString = JSON.stringify(payload);
            //Return the response
            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            res.end(payloadString); 
            //Log the request path
            console.log('Returning this response', statusCode, payloadString);
        });
    });
}

//Define handlers
const handlers = {};
//Sample handler
handlers.sample = function(data, callback){
    //Call back a http status code, and a payload object
    callback(406,{'name':'sample handler'});
};
//Not found handler
handlers.notFound = function(data, callback){
    callback(404);
};
//Define a request router
const router = {
    'sample': handlers.sample
}