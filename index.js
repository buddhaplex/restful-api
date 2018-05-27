/*
 * Primary file for the API
 * 
 */
 
 // Dependencies
 const http = require('http');
 const https = require('https');
 const url = require('url');
 const StringDecoder = require('string_decoder').StringDecoder;
 const config = require('./config');
 const fs = require('fs');

 // Instantiate HTTP server
 const httpServer = http.createServer(function(req, res) {
    unifiedServer(req,res);
 });

 // Start the HTTP server 
 httpServer.listen(config.httpPort, function() {
   console.log("The server is listening on port "+config.httpPort);
 });

 // Instantiate HTTPS server
 const httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pem'),
  'cert' : fs.readFileSync('./https/cert.pem')
 };
 const httpsServer = https.createServer(httpsServerOptions, function(req, res) {
  unifiedServer(req,res);
});

 // Start HTTPS server
 httpsServer.listen(config.httpsPort, function() {
  console.log("The server is listening on port "+config.httpsPort);
});

 // unified server logic for http and https
 let unifiedServer = function(req,res){
    // get and parse url
  const parsedUrl = url.parse(req.url, true);

  // get path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // get query string as object
  const queryStringObject = parsedUrl.query;

  // get http method (get, post, delete, etc)
  const method = req.method.toLowerCase();

  // get headers as an object
  const headers = req.headers;

  // get payload if any
  let decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data',function(data){
    buffer += decoder.write(data);
  });
  req.on('end',function(){
    buffer += decoder.end();

    // choose handler request should go to. if not found, use not found handler.
    let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    //construct data object to send to handler
    let data = {
      'trimmedPath' : trimmedPath,
      'queryStringObject' : queryStringObject,
      'method' : method,
      'headers' : headers,
      'payload' : buffer
    };

    // route request to specified handler
    chosenHandler(data, function(statusCode, payload) {
      // define default status code when status on handler doesn't exist
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
      
      // use payload called back by handler, or default to following
      payload = typeof(payload) == 'object' ? payload : {};

      // convert payload to a string
      let payloadString = JSON.stringify(payload);

      // return response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // log request path
      console.log('Returning this response: ',statusCode, payloadString);
    });

  });
 };

 // define handlers 
 const handlers = {};

 // ping handler
handlers.ping = function(data,cb) {
  cb(200);
};

 // not found handler
 handlers.notFound = function(data, cb) {
  cb(404);
 };

 // defining a request router
 const router = {
  'ping' : handlers.ping
 };