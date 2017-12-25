"use strict";

var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var util = require("util");
var config = require("./lib/config");
var logger = require("./lib/logger");
var routes = require("./routes");
var event = require("./routes/event");
var webhook = require("./routes/webhook");
var zapier = require("./routes/zapier");

var app = express();

// Register configs for the environments where the app functions
// , these can be stored in a separate file using a module like config

var APIKeys = {
    appId           : '6c225efe-4b7c-4b12-9ff9-196e5f0acd1b',
    clientId        : '5u6fn7eblat6hpucl3v63miz',
    clientSecret    : 'wLEeIcqKoT5KgI16LXJ9xmhG',
    appSignature    : '7GXqYpUGkTSY1KZr3iXExTZDzDuwagKReXn51hnWdzmf4GjgtwxxYIPfH1Pucu4i15OLi9ZlnktCVKh6osdyL3T5yRaDEnmhkfkFHk6l4TqxoCutNF3ZDHmiDCLQnr3kOZehR4oMMf6MPesNi0_rVW-oB_zLUOkrEPpmrIjCpaUFYlT615xLKtYpar_3OgXGAn_RsrAYXgeebuqydKtWqHbyR4G9MFQ3j2XLTM6a1lQJi6Uwwwjsg5RqXHZu_A2',
    authUrl         : 'https://auth.exacttargetapis.com/v1/requestToken?legacy=1'
};

// Simple custom middleware
function tokenFromJWT( req, res, next ) {
    // Setup the signature for decoding the JWT
    var jwt = new JWT({appSignature: APIKeys.appSignature});
    
    // Object representing the data in the JWT
    var jwtData = jwt.decode( req );

    // Bolt the data we need to make this call onto the session.
    // Since the UI for this app is only used as a management console,
    // we can get away with this. Otherwise, you should use a
    // persistent storage system and manage tokens properly with
    // node-fuel
    req.session.token = jwtData.token;
    next();
}

// app configuration
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// routing
app.use("/", routes);
app.use("/event", event);
app.use("/webhook", webhook);
app.use("/zapier", zapier);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    logger.info("404 Handlder");
	logger.debug(util.inspect(req));
	var err = new Error("Not Found");
	err.status = 404;
	next(err);
});

// development error handler
if (config.get("env") === "development") {
	app.use(function(err, req, res, next) {
        logger.info("Err Handler");
		logger.error(err);
		res.status(err.status || 500);
		if(req.accepts("html") === "html") {
			res.render("error", {
				message: err.message,
				error: err
			});
		}
		else {
			res.json( {
				message: err.message,
				error: err
			});
		}
	});
}

// HubExchange Routes
app.get('/', routes.index );
app.post('/login', tokenFromJWT, routes.login );
app.post('/logout', routes.logout );

// production error handler
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	logger.error(err);
	if(req.accepts("html") === "html") {
		res.render("error", {
			message: err.message,
			error: err
		});
	}
	else {
		res.json( { message: err.message });
	}
});

// launch the app server
app.listen(config.get("port"), function(){
	logger.info("Server listening on port " + config.get("port"));
})
