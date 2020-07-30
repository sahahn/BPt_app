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

// Pass subject directory to python script
// and run in the background
//$cmd_p1 = "/bin/bash -c \". /etc/profile.d/conda.sh; conda activate ABCD_ML; ";
//$cmd_p2 = "/opt/conda/envs/ABCD_ML/bin/python /var/www/html/applications/Example-ABCD_ML/python/".$_POST['params']['script']." ";
//$cmd = $cmd_p1.$cmd_p2.$user_dr." '".$_POST['params']['n']."' > /dev/null &\"";

$cmd = "python ".$_POST['params']['script']." ".$user_dr." '".$_POST['params']['n']."' > /dev/null &\"";
exec($cmd);

// Return just blank
echo json_encode([]);;
?>