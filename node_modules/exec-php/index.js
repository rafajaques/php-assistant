/**
 * Execute PHP function within NodeJS application
 * @package exec-php
 * @version 1.0
 */

var fs   = require('fs'),
    path = require('path');

var cli  = require('./lib/cli.js');

/**
 * Create exec-php object that contain user php functions.
 * @param {string} file, Path to user php file.
 * @param {string} bin, Path to php bin file.
 * @param {function} callback, Callback function.
 *  @arg {mixed} error message.
 *  @arg {object} methods Collection of user php functions.
 *  @arg {string} printed string on requiring user php file.
 */
module.exports = function(file, bin, callback){
    if(!callback){
        if(typeof bin === 'function'){
            callback = bin;
            bin = 'php';
        }else{
            callback = function(){};
        }
    }
    
    if(!bin)
        bin = 'php';
    
    file = path.resolve(path.dirname(module.parent.id), file);
    
    if(!fs.existsSync(file))
        throw new Error('File `' + file + '` not found.');
    
    // use cache if it's exists.
    var cache = require.cache[file];
    if(cache)
        return callback(false, cache, cache.__output);
    
    cache = {};
    cli.execute(file, bin, '_exec_php_get_user_functions', [function(error, result, output, printed){
        if(error)
            return callback(error);
        
        for(var i=0; i<result.length; i++){
            var func = result[i];
            cache[func] = (function(file, bin, func){
                return function(){
                    var args = Array.prototype.slice.call(arguments, 0);
                    cli.execute(file, bin, func, args);
                };
            })(file, bin, func);
        }
        
        cache.__output = output;
        require.cache[file] = cache;
        
        callback(false, cache, output);
    }]);
};