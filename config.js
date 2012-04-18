
var ConfigProvider = function() {
	this.appName = 'Mongo Notes';
	this.loadedOn = new Date();
	this.locals = {};
	this.app = {
		port: 3000,
		host: 'localhost'
	};
	this.db = {
		uri: 'mongodb://localhost:27017/notes'
	};
	this.header = {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*",
		"X-Powered-By": "me"
	};
	this.promo = {
		fullName: "Mark Chmarny",
		githubUser: "mchmarny",
		githubProject: "mongo-notes",
		twitterUser: "mchmarny",
		blogUrl: "http://mark.chmarny.com",
		linkedInUrl: "http://www.linkedin.com/in/chmarny"
	}
};

ConfigProvider.prototype.init = function() {

	// If running on Cloud Foundry
	if (process.env.VCAP_SERVICES) {

		try {
			var cfVars = JSON.parse(process.env.VCAP_SERVICES);
			console.dir(cfVars);
			var cfDb = cfVars['mongodb-1.8'][0]['credentials'];

			this.locals = process.env;
			this.app.port = process.env.VMC_APP_PORT;
	    	this.app.host = process.env.VCAP_APP_HOST;
	    	this.db.uri = "mongodb://" + cfDb.username + ":" + cfDb.password + "@" + cfDb.hostname + ":" + cfDb.port + "/" + cfDb.db;
    	} catch (e) {
    		console.error(e);
    	}

	}

	return this;

};

exports.ConfigProvider = ConfigProvider;