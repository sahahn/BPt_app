<?php

include '/var/www/html/data/config.php';

// Make user directory if it doesn't exist
if(!is_dir($user_dr)){
    mkdir($user_dr, 0777, true);
    echo $user_dr;
}

echo '2';

// Save the passed projects
file_put_contents($user_dr.'/Projects.json', json_encode($_POST));
?>