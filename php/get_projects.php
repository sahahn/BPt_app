<?php

$user_name = 'sahahn';
$cache_dr = "/var/www/html/data/ABCD/ABCD_ML_Cache/";
$user_directory = $cache_dr.$user_name;

// Make directory if dont exist
if (!is_dir($cache_dr)) {
    mkdir($cache_dr , 0777, true);
  }

if(!is_dir($user_directory)){
    mkdir($user_directory, 0755);
}

$projects_loc = $user_directory.'/Projects.json';

if (!file_exists($projects_loc)) {
    echo json_encode([]);
} else {
    echo file_get_contents($projects_loc);
}

?>