<?php

include '/var/www/html/data/config.php';

// Make directory if it doesnt exist
if(!is_dir($user_dr)){
    mkdir($user_dr, 0755);
}

// Save the passed parameters to the user's directory
file_put_contents($user_dr.'/ML_Params'.$_POST['params']['n'].'.json', json_encode($_POST));

// Pass subject directory to python script and run, waiting to finish
//$cmd_p1 = "/bin/bash -c \". /etc/profile.d/conda.sh; conda activate ABCD_ML; ";
//$cmd_p2 = "/opt/conda/envs/ABCD_ML/bin/python /var/www/html/applications/Example-ABCD_ML/python/".$_POST['params']['script']." ";
//$cmd = $cmd_p1.$cmd_p2.$user_dr." '".$_POST['params']['n']."'".'"';

$cmd = "python ".$_POST['params']['script']." ".$user_dr." '".$_POST['params']['n']."'".'"';
exec($cmd);

// Once done, echo the contents of the output file
echo(file_get_contents($user_dr.'/ML_Output'.$_POST['params']['n'].'.json'));
?>