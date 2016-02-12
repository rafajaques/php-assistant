exec-php
========

Execute PHP function within NodeJS application

Install
-------

    $ npm install exec-php

Usage
-----

    var execPhp = require('exec-php');

    execPhp('path/to/php/file.php', '/path/to/php/bin/php', function(error, php, output){
        // php now contain user defined php functions.
        php.my_own_php_function(arg1, arg2, function(error, result, output, printed){
            // `result` is return value of `my_own_php_function` php function.
            
        });
    });

exec-php arguments
------------------

1. `String`. Path to user php file.
2. `String`. Path to machine php bin file.
3. `Function`. Callback function after creating `exec-php` object. This function will get called with below arguments :

The `Function` arguments called with this arguments:

1. `Mixed`. Error message.
2. `Object`. Exec-php object that contain all user php defined function.
3. `String`. Printed string when requiring user php file.
    
exec-php object
---------------

All user function defined on user php file will be appended to exec-php object.
Call it normally with the last argument is callback function. The callback 
function called with below arguments :

1. `Mixed`. Error message.
2. `Mixed`. Returned value of user php function.
3. `String`. Printed string of php file when requiring it.
4. `String`. Printed string of php function when calling it.

Example
-------

    // file.php
    <?php
        
        echo "One";
        function my_function($arg1, $arg2){
            echo "Two";
            return $arg1 + $arg2;
        }
    
    
    
    // app.js
    var execPhp = require('exec-php');
    
    execPhp('file.php', function(error, php, outprint){
        // outprint is now `One'.
        
        php.my_function(1, 2, function(err, result, output, printed){
            // result is now `3'
            // output is now `One'.
            // printed is now `Two'.
        });
    });

Note
----

All uppercase function name on PHP will be converted to lowercase on `exec-php`.

    // file.php
    <?php
    
        function MyFunction($a, $b){ return $a + $b; }
    
    // app.js 
    var execPhp = require('exec-php');
    
    execPhp('file.php', function(error, php, outprint){
        php.myfunction(1, 2, function(error, result){
            // result is now 3
        });
    });

ChangeLog
---------

1. 0.0.3  
   Handle PHP throw error exception.