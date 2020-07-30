<?php

include '/var/www/html/data/config.php';


// Make user directory if it doesn't exist
if(!is_dir($user_dr)){
    mkdir($user_dr, 0777, true);
}

// Save uploaded params
$save_loc = $user_dr.'/upload_public_params.json';
file_put_contents($save_loc, json_encode($_POST));

//$cmd_p1 = "/bin/bash -c \". /etc/profile.d/conda.sh; conda activate ABCD_ML; ";
//$cmd_p2 = "/opt/conda/envs/ABCD_ML/bin/python /var/www/html/applications/Example-ABCD_ML/python/user_upload_dist.py ";
//$cmd = $cmd_p1.$cmd_p2.$user_dr.'"';

$cmd = "python ".$python_loc."/user_upload_dist.py ".$user_dr.'"';
exec($cmd);

?>