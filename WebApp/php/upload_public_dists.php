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

// Save uploaded params
$save_loc = $user_directory.'/upload_public_params.json';
file_put_contents($save_loc, json_encode($_POST));

$cmd_p1 = "/bin/bash -c \". /etc/profile.d/conda.sh; conda activate ABCD_ML; ";
$cmd_p2 = "/opt/conda/envs/ABCD_ML/bin/python /var/www/html/applications/Example-ABCD_ML/python/user_upload_dist.py ";
$cmd = $cmd_p1.$cmd_p2.$user_directory.'"';
exec($cmd);

?>