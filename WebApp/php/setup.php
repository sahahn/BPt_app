<?php
include '/var/www/html/data/config.php';

// Try to start database
echo exec("monetdbd start /var/www/html/db");
echo exec("monetdb start abcd");


$cmd_p1 = "/bin/bash -c \". /etc/profile.d/conda.sh; conda activate ML; ";
$cmd_p2 = "/opt/conda/envs/ML/bin/python ".$python_loc.'setup_info.py"';
$cmd = $cmd_p1.$cmd_p2;
exec($cmd);
?>