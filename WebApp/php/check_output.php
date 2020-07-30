<?php

// Replace with code to get username
$user_name = 'sahahn';
$cache_dr = "/var/www/html/data/ABCD/ABCD_ML_Cache/";
$user_directory = $cache_dr.$user_name;

// Just return out the content of the ML output file
echo(file_get_contents($user_directory.'/ML_Output'.$_POST['n'].'.json'));
?>