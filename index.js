var fs = require('fs'); 

var oven = require('openbadges-bakery');
var crypto = require('crypto');
var jay = require('jayschema');
var fileStorage = require('./fileStorage.js');

var output_path = 'output_badges';
var input_path = 'unknown_badges';
var errors = [];
var number_of_files = 0;

// this lets us know when both the schema and the assertions to process have been loaded
var componentsLoaded = 0;
var numberOfComponents = 2;

var schema; 
var images;

//Start here: load schemas and files, then when that's ready, start processing:
//loadAllFiles(type, directory, callback)
fileStorage.loadAllFiles('schema','schema',processLoadedObject);
fileStorage.loadAllFiles('images','unknown_badges', processLoadedObject);

function processLoadedObject(type, loadedObject, errors){
	console.log("LOADING "+ type + " --- CALLBACK RECEIVED.");
	if (type = 'schema')
		schema=loadedObject;
	else if (type = 'images')
		images=loadedObject;
	componentsLoaded++;
	if (componentsLoaded === numberOfComponents)
		loadingDone();
	if(errors)
		console.log("LOADING "+ type + " --- CALLBACK RECEIVED, BUT..... THERE WERE SOME ERRORS: \n" + errors);
}


function loadingDone(){
	return;
}


// function FilesToProcess(){
// 	this.filesToLoad = 6;
// 	this.files=[];
// 	this.loadedFile = function(err, newFileData){
// 		if(!err){
// 			this.files.push=newFileData;
// 			this.updated();
// 		}
// 		else
// 			log_error("I couldn't load a file: " + err);
// 	};
// 	this.updated = function(){
// 		if (this.files.length === this.filesToLoad){
// 			loadComponent();
// 		}
// 	};

// }
// var unknown_badges = new FilesToProcess();



// function loadComponent(){
// 	stuffLoaded++;
// 	if (componentsLoaded === 2)
// 		startProcessing();
// }


// /* 
// main()!
// Start execution here!
// */
// fs.readdir(input_path,read_image_dir);


// function startProcessing(){
// 	log_error("-=-=-=- FILES & SCHEMA LOADED; STARTING PROCESSING -=-=-=-");
// }




// //utils
// function log_error(err){
// 	console.log(err);
// 	errors.push(err);
// }


// //image file utilities
// function read_image_dir(err,files) {
// 	if(!err){
// 		number_of_files = files.length;
// 		files.forEach(read_image_for_extraction);	
// 	}
// 	else {
// 		log_error(err);
// 	}
// }

// function read_image_for_extraction(filename,index,array){
// 	fs.readFile(input_path + '/' + filename, unknown_badges.loadedFile);
// }






// function extract_assertion(err, data){
// 	if(!err){
// 		var assertion = oven.extract(data,modify_assertion)
// 	}
// 	else {
// 		log_error(err);
// 	}

// }


// function modify_assertion(extract_err,data){
// 	if (extract_err)
// 		log_error(extract_err);
// 	else {
// 		try{
// 			a = JSON.parse(data);
// 		}
// 		catch(err){
// 			log_error(err);
// 			return;
// 		}
// 		// switch (make_sure_assertion_has_recipient(a)) {
// 		// 	case 'unhashed':
// 		// 		a.recipient.identity = "test@example.com";
// 		// 		break;
// 		// 	case 'hashed': 
// 		// 		var digest = crypto.createHash('sha256').update('test@example.com'+ a.recipient.salt).digest('hex');
// 		// 		a.recipient.identity = "sha256$" + digest;
// 		// 		break;
// 		// 	default: 
// 		// 		log_error("Didn't get an assertion recipient type understood by modify_assertion");
// 		// 		break;
// 		// }

// 	}
// }

// // find matching schema for assertion
// function get_schema_matches(badge_contents){
// 	if (typeof badge_contents === 'string'){

// 	}
// }


// //accepts parsed JSON object of the assertion
// function make_sure_assertion_has_recipient(assertion){
// 	if (!assertion.recipient){
// 			log_error("Assertion has no recipient. Assertion data: \n " + JSON.stringify(assertion));
// 			return 'no recipient';
// 		}
// 	else if (typeof assertion.recipient === 'string')
// 	else if (assertion.recipient.type != "email"){
// 		log_error("Assertion has a non-email recipient identity type. Assertion data: \n " + JSON.stringify(assertion));
// 		return 'non-email';
// 	}
// 	else if (assertion.recipient.hashed === false) {
// 		return 'unhashed';
// 	}
// 	else if (assertion.recipient.hashed === true && typeof assertion.recipient.salt === 'string'){
// 		return 'hashed';
// 	}
// 	else{
// 		log_error("I couldn't understand this assertion. Assertion data: \n" + JSON.stringify(assertion));
// 		return 'unknown';
// 	}
// }



// function save_file_to_output_directory(reconstructed_file){
// 	return;
// }