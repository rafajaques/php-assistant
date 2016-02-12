<?php

$args = getopt('p:r:');

$params = json_decode(file_get_contents($args['p']), true);
$outfile = fopen($args['r'], 'w');

$user_file = $params['file'];
$user_func = $params['function'];
$user_args = $params['arguments'];

require_once(dirname(__FILE__) . '/functions.php');

$result = _exec_php_call_user_function($user_file, $user_func, $user_args);

$result = json_encode($result);

fwrite($outfile, $result);