<?php

include '/var/www/html/data/config.php';
include 'remove_dr.php';

$job_dr = $user_dr."/Jobs";
$project_job_dr = $job_dr."/".$_POST['project_id'];

removeDirectory($project_job_dr);
?>
