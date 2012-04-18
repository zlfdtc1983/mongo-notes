//dep and globals
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.Types.ObjectId;
	
// Constractor
var NoteStore = function(){}

// Initialize Object
NoteStore.prototype.init = function(connUrl) {
	
	var NotesSchema = new Schema({
	    title:      { type: String, required: true, index: true },
	    content:   	{ type: String, required: true }, 
	    updatedOn:  { type: Date,   required: true }, 
	    tags: 		[ String ]
	  });

	// Index on tags
	NotesSchema.index({ tags: 1 });

	// Connect    
	this.Db = mongoose.connect(connUrl); 
	
	// Create a model
	this.NoteModel = mongoose.model('note', NotesSchema);

	return this;

};

// getRecentNotes
NoteStore.prototype.getRecentNotes = function(maxNumOfNotes, callback) {

  	var query = this.NoteModel.find();
  		query.select('title');
  		query.desc('updatedOn');
  		query.limit(maxNumOfNotes);

  	query.exec(function(err, items) {
    	if (err) throw err;
    	else callback(items);
  	});

};


// getNotesByTitle
NoteStore.prototype.getNotesByTitle = function(titleArg, callback) {

	var likeArg = new RegExp(titleArg, 'i'); 

  	var query = this.NoteModel.find();
  		query.select('title');
  		query.or([ { 'title': likeArg }, { 'tags': likeArg } ]);
  		query.asc('title');

  	console.dir(query);

  	query.exec(function(err, items) {
    	if (err) throw err;
    	else callback(items);
  	});

};

// getTags
NoteStore.prototype.getTags = function(callback) {

  	var query = this.NoteModel.find({});
  		query.select('tags');

  	query.exec(function(err, items) {
    	if (err) {
    		throw err;
    	} else {
    		var results = [];
    		items.forEach(function(item){
    			if (item.tags){
	    			item.tags.forEach(function(tag) { 
	    				var cleanTag = tag.toLowerCase().trim();
	    				if (results.indexOf(cleanTag) === -1){
	    					results.push(cleanTag);
	    				}
	    			});
    			}
		  	});
    		callback(results);
    	}
  	});
};

// getNote
NoteStore.prototype.getNote = function(id, callback) {

  	var query = this.NoteModel.findById(new ObjectId(id));

  	query.exec(function(err, items) {
    	if (err) throw err;
    	else callback(items);
  	});

};

// deleteNote
NoteStore.prototype.deleteNote = function(id, callback) {

	this.NoteModel.remove({ _id: new ObjectId(id)  }, function(error){
		if (error) throw error;
        callback();
	}); //Message

};

// saveNote
NoteStore.prototype.saveNote = function(noteIn, callback) {

	if (noteIn.id && noteIn.id.length > 0) {
		
		//Update
		var conditions = { _id: noteIn.id };
		var options = { multi: false };
		var update = { $set: { title: noteIn.title, 
		                       content: noteIn.content,
		                       updatedOn: new Date(),
		                       tags: noteIn.tags 
		                     }
		             };

		this.NoteModel.update(conditions, update, options, function(err, numAffected) {
			if (err) {
				throw err;
			} else {
				console.log('Affected: ' + numAffected);
				callback({ 'result' : numAffected });
			}
		});

	} else {

		//New
		note = new this.NoteModel();
		note.title = noteIn.title;
		note.content = noteIn.content;
		note.updatedOn = new Date();
		note.tags = noteIn.tags;

		note.save(function(err){		
			if (err) {
				throw err;
			} else {
				callback({ 'result' : 1 });
			}
		});//save

	} // save or update

};

// clearNotes
NoteStore.prototype.clearNotes = function(callback) {

	console.info('Clearing all notes: ' + new Date());

	this.NoteModel.remove({}, function(error){
		if (error) throw error;
        callback();
	}); //Message

};



// Export
exports.NoteStore = NoteStore;













