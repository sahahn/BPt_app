<?php

include '/var/www/html/data/config.php';

// Make dr if doesnt exist
$temp_directory = $user_dr."/temp";
if(!is_dir($temp_directory)){
    mkdir($temp_directory, 0755);
}

// Save the passed parameters to the user's directory
$params_loc = $temp_directory.'/ML_Params_'.$_POST['params']['n'].'.json';
file_put_contents($params_loc, json_encode($_POST));

// Generate the py command to run in the background
$cmd_p1 = "/bin/bash -c \". /etc/profile.d/conda.sh; conda activate ML; ";
$cmd_p2 = "/opt/conda/envs/ML/bin/python ".$python_loc.$_POST['params']['script']." ";
$cmd_p3 = $user_dr." '".$_POST['params']['n']."' > /dev/null &\"";
$cmd = $cmd_p1.$cmd_p2.$cmd_p3;
exec($cmd);

// Return just blank
echo json_encode([]);;
?>