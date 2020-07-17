<?php

$user_name = 'sahahn';
$cache_dr = "/var/www/html/data/ABCD/ABCD_ML_Cache/";
$user_directory = $cache_dr.$user_name;

// Make sure cache dr exists
if (!is_dir($cache_dr)) {
    mkdir($cache_dr , 0777, true);
  }

// Make sure user directory exists
if(!is_dir($user_directory)){
    mkdir($user_directory, 0755);
}

$params_loc = $user_directory.'/user_param_dists.json';

// If the file doesn't exist, send back empty
if (!file_exists($params_loc)) {
    echo json_encode(array());
}

// Otherwise send the user params
else {
    echo file_get_contents($params_loc);
}

?>