var fs = require('fs'); 

var oven = require('openbadges-bakery');
var crypto = require('crypto');
var jaySchema = require('jayschema');
var js = new jaySchema;
var clc = require('cli-color');

var fileStorage = require('./fileStorage.js');

var output_path = 'output_badges';
var input_path = 'unknown_badges';
var errors = [];
var number_of_files = 0;

// this lets us know when both the schema and the assertions to process have been loaded
var componentsLoaded = 0;
var numberOfComponents = 2;

var schema; 
var images=[];
var report=[];
var errors=[];

//Operation Control: 
//Start here: load schemas and files, then when that's ready, start processing:
//loadAllFiles(type, directory, callback)
fileStorage.loadAllFiles('schema','schema',processLoadedObject);
fileStorage.loadAllFiles('images','unknown_badges', processLoadedObject);

function processLoadedObject(type, loadedObject, errors){
	console.log("LOADING "+ type + " --- CALLBACK RECEIVED.");
	if (type === 'schema'){
		schema=loadedObject;
	}
	else if (type === 'images'){
		images=loadedObject;
	}
	componentsLoaded++;
	if (componentsLoaded === numberOfComponents){
		loadingDone();
	}
	if(errors){
		console.log("LOADING "+ type + " --- CALLBACK RECEIVED, BUT..... THERE WERE SOME ERRORS: \n" + errors);
	}
}


function loadingDone(){
	//create an empty array
	for (var i=0; i < images.length; i++){
		report.push({
			image: images[i],
			assertion:{},
			matchingSchema:[],
			nonMatchingSchema:[],
			errors: []
		});
	}
	images.forEach(extractAssertion);
}

function evaluateCompleteness(){
	var numberOfSchema = schema.length;
	for (var i=0;i<report.length;i++){
		// break if any image has not yet been tested against the appropriate number of schema.
		if (report[i].errors.length===0 && report[i].matchingSchema.length+report[i].nonMatchingSchema.length < numberOfSchema)
			return;
	}
	//finish if all images have been processed.
	processReport();
}

function processReport(){
	for (var i=0;i<report.length;i++){
		console.log(
			"\n\n==========================================\n" + 
			"Report for Image #" + i + ":\n" +
			report[i].assertion + "\n" +
			"Matching Schema: "
		);
		if (report[i].matchingSchema.length >0){
			for (var b=0; b<report[i].matchingSchema.length; b++){
				console.log(
					"#" + report[i].matchingSchema[b].index 
					 + " " + schema[report[i].matchingSchema[b].index].title
				);
			}
		}
		console.log( "\nNon-matching Schema: ");
		if (report[i].nonMatchingSchema.length>0){
			for (var b=0; b<report[i].nonMatchingSchema.length; b++){
				report[i].nonMatchingSchema[b].errors = sanitizeJaySchemaError(report[i].nonMatchingSchema[b].errors)
				console.log(
					"#" + report[i].nonMatchingSchema[b].index + " " + schema[report[i].nonMatchingSchema[b].index].title + "\n" +
					clc.yellow(JSON.stringify(report[i].nonMatchingSchema[b].errors))
				);
			}
		}
	}
}

function sanitizeJaySchemaError(error){
	for (var i=0; i< error.length; i++){
		error[i].stack=undefined;
	}
	return error;
}


// Badge Utilities:
function extractAssertion(image,index,array){
	oven.extract(image,function(err,assertion){
		if(err){ 
			log_error("Could not extract assertion from image #" + index + ": " + err.message); 
			report[index].errors.push(err.message);
		}
		else{
			report[index].assertion=assertion;
			matchAssertionToSchema(assertion,index,array);
		}
	});
}

function matchAssertionToSchema(assertion,imageIndex,array){
	for (var schemaIndex=0; schemaIndex<schema.length; schemaIndex++){
		//log_error("SCHEMA INDEX: " + schemaIndex);
		validateIt(assertion,schemaIndex,imageIndex,array);
	}
}

function validateIt(assertion,schemaIndex,imageIndex,array){
	js.validate(JSON.parse(assertion),schema[schemaIndex],function(validationErrors){

		// for non-matching schema
		if(validationErrors){
			//log_error("Jeeves here: Reporting a validation error: " + typeof validationErrors + "\n" + validationErrors + validationErrors.message);
			report[imageIndex].nonMatchingSchema.push({
				index: schemaIndex,
				errors: validationErrors
			});
		}
		//for matching schema
		else {
			report[imageIndex].matchingSchema.push({
				index: schemaIndex
			});
			manipulateAssertion(imageIndex,schemaIndex);
		}
		evaluateCompleteness();
	});
}

function manipulateAssertion(imageIndex,schemaIndex){
	log_error("NOT IMPLEMENTED: Processing Image #" + imageIndex + " based on Schema #" + schemaIndex);
} 




//General Utilities:
function log_error(err){
	console.log(err);
	errors.push(err);
}








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