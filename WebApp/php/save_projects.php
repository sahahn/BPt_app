<?php

include '/var/www/html/data/config.php';

if (!is_dir($data_dr)) {
    mkdir($data_dr , 0777, true);
    echo $data_dr;
}

// Make user directory if it doesn't exist
if(!is_dir($user_dr)){
    mkdir($user_dr, 0777, true);
}

echo(json_encode($_POST['projects'][0]['strat_choices']));

// Save the passed projects
file_put_contents($user_dr.'/Projects.json', json_encode($_POST));
?>