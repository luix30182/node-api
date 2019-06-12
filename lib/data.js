// Library for storing and editing data

//Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for the module (to be exported)
const lib = {}

//base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// // Wite data to the file 
lib.create = (dir, file, data) => {
    return new Promise((resolve, reject) => {
        fs.open(lib.baseDir + dir + '/' + file + '.json','wx', (err, fileDescriptor) => {
            if(!err && fileDescriptor){
                // Convert data to string
                const stringData = JSON.stringify(data);
                //Write to file and close it
                fs.writeFile(fileDescriptor, stringData, (err) =>{
                    if(err) reject(new Error('Error writing to new file'));
                    fs.close(fileDescriptor, err => {
                        if(err) reject(new Error('Error colosing new file'));
                        resolve('File created');
                    });
                });
            }else{
                reject (new Error('Could not create new file, it may already exist'));
            }
        });
    });
};
//Read data from file
lib.read = (dir, file) => {
    return new Promise((resolve, reject) => {
        fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', (err, data) => {
            if(!err && data){
                const parsedData = helpers.parseJsonToObject(data);
                resolve(parsedData);
            }else{
                if(err) reject(err);
            }
        });
    });
};
// Update data from a file
lib.update = (dir, file, data) => {
    return new Promise((resolve, reject) => {
        //Open file for writing
        fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
            if(!err && fileDescriptor){
                const stringData = JSON.stringify(data);
                //Truncate the file
                fs.ftruncate(fileDescriptor, err => {
                    if(!err){
                        //Write to file and close it
                        fs.writeFile(fileDescriptor, stringData, err => {
                            if(!err){
                                fs.close(fileDescriptor, err => {
                                    if(!err) resolve(false);
                                    reject(new Error('Error closing existing file'));
                                });
                            }else{
                                reject( new Error('Error writing to existing file'));
                            }
                        });
                    }else{
                        reject( new Error('Error truncating file'));
                    }
                });
            }else{
                reject( new Error('Could not open the file for updating, it may not exist yet'));
            }
        });
    });
};
//Delete file
lib.delete = (dir, file) => {
    return new Promise((resolve, reject) => {
        fs.unlink(lib.baseDir + dir + '/' + file + '.json', err => {
            if(!err) {
                resolve(false);
            }else{
                reject(new Error('Error deliting file'));
            }
        });
    });
};
//Export the module
module.exports = lib;