<?php
include '/var/www/html/data/config.php';

// If existing ready, delete it
$ready_loc = $data_dr.'ready';
if (file_exists($ready_loc)) {
    unlink($ready_loc);
}

$cmd_p1 = "/bin/bash -c \". /etc/profile.d/conda.sh; conda activate ML; ";
$cmd_p2 = "/opt/conda/envs/ML/bin/python ".$python_loc."setup_db.py > /dev/null &\"";
$cmd = $cmd_p1.$cmd_p2;
exec($cmd);
?>