<?php

include '/var/www/html/data/config.php';

// Make directory if it doesnt exist
if(!is_dir($user_dr)){
    mkdir($user_dr, 0755);
}

// Save the passed parameters to the user's directory
file_put_contents($user_dr.'/ML_Params'.$_POST['params']['n'].'.json', json_encode($_POST));

// Generate the py command - run in foreground
$cmd_p1 = "/bin/bash -c \". /etc/profile.d/conda.sh; conda activate ML; ";
$cmd_p2 = "/opt/conda/envs/ML/bin/python ".$python_loc.$_POST['params']['script']." ".$user_dr." '".$_POST['params']['n']."'".'"';
$cmd = $cmd_p1.$cmd_p2;
exec($cmd);

// Once done, echo the contents of the output file
echo(file_get_contents($user_dr.'/ML_Output'.$_POST['params']['n'].'.json'));
?>