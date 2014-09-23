var fs = require('fs'); 

var oven = require('openbadges-bakery');
var crypto = require('crypto');
var jaySchema = require('jayschema');
var js = new jaySchema;
var clc = require('cli-color');

//configuration:
var CONFIG = function(key){
	var attributes = {
		output_path: 'output_badges',
		input_path: 'unknown_badges',
		schema_directory: 'schema',
	};

	return attributes[key];
};

// an object to build out our findings on what images there are and what schema match those images:
var report = {
	images: [],
	findImage: function(filename){
		for (var i=0; i<this.images.length; i++){
			if (this.images[i].filename === filename)
				return i;
		}
		return -1;
	},
	newImageMatch: function(filename,assertion,schemaKey){
		// first, make sure we don't already have a record for this image. 
		// If we do, augment that image's list of schema matches.
		var existingIndex = this.findImage(filename);
		if (existingIndex>=0)
			this.images[existingIndex].matchingSchemaKeys.push(schemaKey);
		//if not existing, add a new record
		else
			this.images.push({
				filename: filename,
				assertion: assertion,
				matchingSchemaKeys: [schemaKey],
				nonMatches: []	
			});
	},
	newImageNonMatch: function(filename,assertion,schemaKey,errorMessage){
		newNonMatch = {
			schemaKey: schemaKey,
			errorMessage: errorMessage
		};
		// first, make sure we don't already have a record for this image.
		// If we do, augment that image's record of non-matches
		var existingIndex = this.findImage(filename);
		if (existingIndex>=0)
			this.images[existingIndex].nonMatches.push(newNonMatch);
		//if not existing, add a new record
		else
			this.images.push({
				filename: filename,
				assertion: assertion,
				matchingSchemaKeys: [],
				nonMatches: [newNonMatch]	
			});
	},
	imageCount: 0
};

//an object for us to store our understanding of what schema we have available to us:
var schemer = {
	schema: {
		plain_url: {
			filename: "plainuri.json"
		},
		v0_5: {
			filename: "OBI-v0.5-assertion.json"
		},
		v1_0strict: {
			filename: "OBI-v1.0-linked-badgeclass.json"
		},
		backpack_error_1_0: {
			filename: "backpack-error-from-valid-1.0.json"
		}
	},
	search_tree: {
		test: "backpack_error_1_0",
		noMatch: {
			test: "plain_url",
			noMatch: {
				test: "v1_0strict",
				noMatch: {
					test: "v0_5"
				}
			}
		}
	}
};

/* OPERATION CONTROL: Load schema into an object one by one, then test images against them in a known
// sequence instead of letting the async go wild.
*/
for (var key in schemer.schema){
	loadOneSchema(CONFIG('schema_directory'),schemer.schema[key].filename,key);
}


//callback has signature (err, data)
function loadOneSchema(inputPath, inputFile, destKey){
	fs.readFile(inputPath + "/" + inputFile, function (err,data){
		if(!err){ 
			try{ var jsonSchema = JSON.parse(data) }
			catch(e) { console.log(e); jsonSchema = undefined; }

			if(jsonSchema)
				schemer.schema[destKey].schema=jsonSchema;
			schemaLoadedCheck();
		}
		else log_error("Could not load schema "+ destKey + ":\n" + err);
	});
}


function schemaLoadedCheck(){
	var totalSchema = 0;
	var loadedSchema = 0;
	for (var key in schemer.schema){
		totalSchema++;
		if(typeof schemer.schema[key].schema === 'object')
			loadedSchema++;
	}
	if (loadedSchema===totalSchema)
		doneLoadingSchema();
}

function doneLoadingSchema(){
	console.log("Schema have successfully been loaded from directory: " + CONFIG('schema_directory'));
	listImagesToTest(CONFIG('input_path'));
}


//Figure out what iamges there are to test and start loading them:
function listImagesToTest(inputPath){
	// start the process by getting the filenames of the files to load, and figuring out how many there are
	fs.readdir(inputPath, function (err,files) {
		if(!err){

			files = cleanFileArray(files)
			report.imageCount = files.length;

			files.forEach(function (filename,index,array){
				fs.readFile(inputPath + '/' + filename, function (singleReadErr, imageData){
					processImage(singleReadErr, imageData, filename);
				});
			});	
		}
		else {
			log_error("Error determining how many images are in directory (" + inputPath + "): " + err);
		}
	});
}

//deletes hidden filenames from array (those that start with '.')
function cleanFileArray(filenameArray){
	var i = 0;
	var illegalPattern = /^\..+$/;
	while (i< filenameArray.length){
		if (illegalPattern.test(filenameArray[i])) {
			filenameArray.splice(i,1);
		}
		else 
			i++;
	}
	return filenameArray;
}


/* The MEAT and POTATOES:
// Process each image against all the schema in an order that makes sense and gives us a useful 
*/

function processImage(readErr, imageData, filename){
	console.log("TODO: processImage(" + readErr + " errors, " + filename + ")");
	if(!readErr){
		// extract the assertion and start testing it against schema.
		oven.extract(imageData, function (extractErr,assertion){
			if(extractErr){
				log_error("Could not extract assertion from image " + filename + ": " + extractErr.message);
			}
			else{
				try { assertion = JSON.parse(assertion); }
				catch(e) { console.log(clc.yellow("JSON.parse fail: " + assertion));}
				var search_tree = schemer.search_tree;
				findSchemaMatch(assertion, search_tree, filename);
			}
		});
	}
}

/* Find a schema match by cycling through a search tree:
 * Receives a search tree object with properties:
 	* test: string of schema key to test
 	* match: new search_tree for additional matches
 	* noMatch: new search_tree, still try to find first match
 * searches recursively, building out the results into report
*/
function findSchemaMatch(assertion, search_tree, filename){
	var schemaKey = search_tree.test;
	// console.log(clc.yellow('==============================================='));
	// console.log(clc.yellow("Going to validate, my dawg... The schema is: "));
	// console.log(typeof schemer.schema[schemaKey].schema + "\n" + JSON.stringify(schemer.schema[schemaKey].schema));
	// console.log(clc.yellow("Going to validate, my dawg... The assertion is: "));
	// console.log(typeof assertion + "\n" + JSON.stringify(assertion));


	js.validate(assertion, schemer.schema[schemaKey].schema, function (validateErr){
		if(validateErr){
			// log_error("Validation failed: " + typeof validateErr + "\n" + validateErr + clc.yellow(validateErr.message));
			report.newImageNonMatch(filename,assertion,schemaKey,sanitizeJaySchemaError(validateErr));
			if(typeof search_tree.noMatch != 'undefined' && typeof search_tree.noMatch.test != 'undefined'){
				findSchemaMatch(assertion, search_tree.noMatch, filename);
				return;
			}
		}
		//for matching schema
		else {
			report.newImageMatch(filename,assertion,schemaKey);
			if(typeof search_tree.match != 'undefined' && typeof search_tree.match.test != 'undefined'){
				findSchemaMatch(assertion, search_tree.match, filename);
				return;
			}
		}
		//if search tree hasn't turned up another schema to search by...
		evaluateCompleteness();
	});
}

/* The method of determining whether or not this is complete is by detecting if all images have been reported on, 
// at least minimally. This will probably miss a final test or two. TODO: Improve this!
*/
function evaluateCompleteness(){
	if (report.images.length === report.imageCount){
		generateReport();
	}
}

function generateReport(){
	var totals = {};
	function addToTotal(key){
		if (typeof totals[key] != 'undefined')
			totals[key]++;
		else
			totals[key]=1;
	}

	for (var i=0; i<report.images.length;i++){
		img = report.images[i]
		if (img.matchingSchemaKeys.length === 0)
			addToTotal("noMatch");
		for (var j=0;j<img.matchingSchemaKeys.length;j++){
			addToTotal(img.matchingSchemaKeys[j]);
		}
		console.log(
			'\n\n=========== IMAGE NUMBER ' + i + ' ===========' +
			'\nfilename: ' + img.filename + 
			'\nassertion: \n' + clc.green(JSON.stringify(img.assertion,null, "  ")) +
			'\nmatchingSchemaKeys: ' + img.matchingSchemaKeys
		);
		if(img.nonMatches.length>0){
			console.log('nonMatches:');
			for (var j=0;j<img.nonMatches.length;j++){
				nm = img.nonMatches[j]
				console.log('Schema: ' +nm.schemaKey);
				console.log(clc.red(JSON.stringify(nm.errorMessage, null, "  ")));
			}
		}
		console.log('======================================');
	}


	console.log(clc.magentaBright(JSON.stringify(totals)));
}



//General Utilities:
function log_error(err){
	console.log(err);
	// errors.push(err);
}

function sanitizeJaySchemaError(error){
	for (var i=0; i< error.length; i++){
		error[i].stack=undefined;
	}
	return error;
}

