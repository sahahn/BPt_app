<?php

include '/var/www/html/data/config.php';

// Make sure cache dr exists
if (!is_dir($data_dr)) {
    mkdir($data_dr , 0777, true);
  }

// Make sure user directory exists
if(!is_dir($user_dr)){
    mkdir($user_dr, 0755);
}

$params_loc = $user_dr.'/user_param_dists.json';

// If the file doesn't exist, send back empty
if (!file_exists($params_loc)) {
    echo json_encode(array());
}

// Otherwise send the user params
else {
    echo file_get_contents($params_loc);
}

?>