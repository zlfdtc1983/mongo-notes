
// Dependencies
var express = require('express')
  , routes = require('./routes')
  , ConfigProvider = require('./config').ConfigProvider
  , NoteStore = require('./data').NoteStore;

// Create app
var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Configure Env Vars
var appConfig = new ConfigProvider().init();

// Geo Store Config  
var noteStore = new NoteStore().init(appConfig.db.uri);

// Default Route
app.get('/', function(req, res){
  res.render('index.jade', { 
        locals: {
            title: appConfig.appName,
            promo: appConfig.promo
        }
    });
});

// Default Search
app.get('/v.1/notes/recent/:max', function(req, res){
  noteStore.getRecentNotes(req.params.max, function(items){
      res.writeHead(200, appConfig.header);
      res.end(JSON.stringify(items));
  });
});

// Search by title
app.get('/v.1/notes/search/:title', function(req, res){
  noteStore.getNotesByTitle(req.params.title, function(items){
      res.writeHead(200, appConfig.header);
      res.end(JSON.stringify(items));
  });
});

// Get Tags
app.get('/v.1/notes/tags/all', function(req, res){
  noteStore.getTags(function(items){
      res.writeHead(200, appConfig.header);
      res.end(JSON.stringify(items));
  });
});

// Get by Id
app.get('/v.1/notes/:id', function(req, res){
  noteStore.getNote(req.params.id, function(items){
      res.writeHead(200, appConfig.header);
      res.end(JSON.stringify(items));
  });
});

// Delete by Id
app.del('/v.1/notes/:id', function(req, res){
  noteStore.deleteNote(req.params.id, function(items){
      res.writeHead(200, appConfig.header);
      res.end(JSON.stringify(items));
  });
});


// Save
app.post('/v.1/notes/', function(req, res){
  console.dir(req.body);
  noteStore.saveNote(req.body, function(items){
      res.writeHead(200, appConfig.header);
      res.end(JSON.stringify(items));
  });
});

// Reset
app.get('/v.1/notes/reset/:code', function(req, res){
  var resetCode = req.params.code;
  var requiredCode = new Date().getDate();
  if (parseInt(resetCode) ==  requiredCode){
    noteStore.clearNotes(function(items){
        res.writeHead(200, appConfig.header);
        res.end(JSON.stringify(items));
    });
  }else{
    res.redirect('/');
  }
});


// Init the server
app.listen(appConfig.app.port);

// Confirm the load
console.info("Started: http://%s:%d/ in %s mode", appConfig.app.host, appConfig.app.port, app.settings.env);
