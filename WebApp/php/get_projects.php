<?php

include '/var/www/html/data/config.php';


// Make directories if they don't exist
if (!is_dir($data_dr)) {
    mkdir($data_dr , 0777, true);
}

if(!is_dir($user_dr)){
    mkdir($user_dr, 0755);
}

$projects_loc = $user_dr.'/Projects.json';

if (!file_exists($projects_loc)) {
    echo json_encode([]);
} else {
    echo file_get_contents($projects_loc);
}

?>