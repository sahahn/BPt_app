<?php
include '/var/www/html/data/config.php';

// Try to start database
exec("/bin/bash -c \"monetdbd start /var/www/html/db\"");
echo exec("/bin/bash -c \"monetdb start abcd\"");

echo "run";

$cmd_p1 = "/bin/bash -c \". /etc/profile.d/conda.sh; conda activate ML; ";
$cmd_p2 = "/opt/conda/envs/ML/bin/python ".$python_loc.'setup_info.py"';
$cmd = $cmd_p1.$cmd_p2;
exec($cmd);
?>