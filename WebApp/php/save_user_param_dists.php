<?php

include '/var/www/html/data/config.php';

// Make user directory if it doesn't exist
if(!is_dir($user_dr)){
    mkdir($user_dr, 0777, true);
}

// Save the passed user params
$params_loc = $user_dr.'/user_param_dists.json';
file_put_contents($params_loc, json_encode($_POST['user']));
?>