// A library to fetch files from a named directory and put them in an array
var fs = require('fs');

/* FileCollection Object keeps track of loaded files, files left to load, 
and is responsible for sending the call back to the original module once all files have 
been loaded.
*/
var FileCollection = function (){
	this.item_type = '';
	this.file_path = '';
	this.filesToLoad = -1;
	this.files = [];
	this.errors = [];

	this.addFile = function(err, newFile){
		if(err)
			this.errors.push(err);
		else {
			if (this.item_type === 'json' || this.item_type === 'schema'){
				if (this.validateJSON(newFile))
					this.files.push(JSON.parse(newFile));
				else
					this.errors.push(new Error(1,"JSON item type didn't parse right: \n" + newFile));
			}
			else{
				this.files.push(newFile);
			}
		}
		this.updated();
	};

	this.validateJSON = function(newFile){
		try {
			newFileJSON = JSON.parse(newFile);
		}
		catch(e){
			return false;
		}
		return true;
	};

	this.updated = function(){
		console.log( "Type: " + this.item_type + ": " +
			this.files.length + " files and " +
			this.errors.length + " errors out of " + 
			this.filesToLoad + " total files to load"
		);
		if (this.files.length + this.errors.length === this.filesToLoad){
			allFilesLoaded(this);
		}
	};
};








/* Order of Opertations: 
external script calls loadAllFiles, passing in a callback: 
callback(string,[{},{}])

The given file directory is read, the number of files is stored in my_files.filesToLoad, 
and then files are added to my_files.files. After each file is added, we test if 
there are enough files yet, and once there are, we ping allFilesLoaded with the results.
*/
var moduleCallback;

//module entry point
function loadAllFiles(itemType,source_directory,callback){
	var my_files = new FileCollection();

	var addAFile = function(err, newFile){
		my_files.addFile(err, newFile);
	};

	my_files.item_type = itemType;
	my_files.file_path = source_directory;

	//set eventual callback;
	moduleCallback = callback;

	// start the process by getting the filenames of the files to load, and figuring out how many there are
	fs.readdir(source_directory, function (err,files) {
		if(!err){
			my_files.filesToLoad = files.length;

			files.forEach(function (filename,index,array){
				fs.readFile(my_files.file_path + '/' + filename, addAFile);
			});	
		}
		else {
			log_error(err);
		}
	});
}

//return results to calling module when all files have loaded
function allFilesLoaded(my_files){
	var errorReturn = (my_files.errors.length > 0) ? my_files.errors : null;
	moduleCallback(my_files.item_type, my_files.files, errorReturn);
}




module.exports.loadAllFiles = loadAllFiles; 


