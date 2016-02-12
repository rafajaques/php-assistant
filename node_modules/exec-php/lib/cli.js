/**
 * Execute user php function.
 * @package exec-php
 * @version 1.0
 */

var exec = require('child_process').exec,
    fs   = require('fs'),
    path = require('path'),
    tmp  = require('tmp');

/**
 * Execute the script and get the result.
 * @param {string} file, User php file.
 * @param {string} bin, Path to php bin file.
 * @param {string} func, User php function name to call.
 * @param {array} args, List of function array, with the last arg is callback function.
 */
exports.execute = function(file, bin, func, args){
    if(!args || !args.length)
        args = [function(){}];
    
    if(typeof args[args.length-1] !== 'function')
        args.push(function(){});
    
    var user_fn_args = args.slice(0, -1),
        user_fn_cb   = args[args.length-1];
    
    tmp.file(function(error, tmpParam, fd){
        var tmpParamData = {
                'arguments': user_fn_args,
                'file'     : file,
                'function' : func
            };
        
        tmpParamData = JSON.stringify(tmpParamData);
        
        fs.writeFileSync(tmpParam, tmpParamData);

        tmp.file(function(error, tmpResult, fds){
            
            var cli = path.join(__dirname, 'php', 'cli.php'),
                cmd = [bin, cli, '-p' + tmpParam, '-r' + tmpResult].join(' ');
            
            var opt = {cwd: path.dirname(file)};
            
            exec(cmd, opt, function(error, stdout, stderr){
                if(error || stderr)
                    return user_fn_cb((error||stderr));
                
                var data = JSON.parse(fs.readFileSync(tmpResult));
                
                fs.unlink(tmpParam);
                fs.unlink(tmpResult);
                
                user_fn_cb(false, data.result, data.output, data.printed);
            });
        });
    });
};