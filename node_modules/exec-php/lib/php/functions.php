<?php
/**
 * Collection of cli functions.
 * @package exec-cli
 * @version 1.0
 */

/**
 * Call user functions.
 * @param {string} file, Path to user php file.
 * @param {string} function, Function name to call.
 * @param {array} arguments, List of function arguments.
 * @return array(
 *    result: function calling result.
 *    output: printed string on requiring user file.
 *    printed: printed string on calling user function.
 * )
 */
function _exec_php_call_user_function($file, $function, $arguments){
    $result = array();
    
    ob_start();
    require_once($file);
    $result['output'] = ob_get_contents();
    ob_end_clean();
    
    ob_start();
    $result['result'] = call_user_func_array($function, $arguments);
    $result['printed'] = ob_get_contents();
    ob_end_clean();
    
    return $result;
}

/**
 * Get list of user functions.
 * @return user defined function.
 */
function _exec_php_get_user_functions(){
    $funcs = get_defined_functions();
    $result = array();
    $expfn = array('_exec_php_get_user_functions', '_exec_php_call_user_function');
    foreach($funcs['user'] as $func){
        if(!in_array($func, $expfn))
            $result[] = $func;
    }
    return $result;
}