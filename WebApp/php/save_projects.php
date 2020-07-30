<?php

$user_name = 'sahahn';
$cache_dr = "/var/www/html/data/ABCD/ABCD_ML_Cache/";
$user_directory = $cache_dr.$user_name;

// Make cache directory if it doesn't exist
if (!is_dir($cache_dr)) {
    mkdir($cache_dr , 0777, true);
  }

// Make user directory if it doesn't exist
if(!is_dir($user_directory)){
    mkdir($user_directory, 0755);
}

// Save the passed projects
file_put_contents($user_directory.'/Projects.json', json_encode($_POST));
?>