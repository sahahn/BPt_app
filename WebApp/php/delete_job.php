<?php

include '/var/www/html/data/config.php';
include 'remove_dr.php';

$jobs_dr = $user_dr."/Jobs";
$project_jobs_dr = $jobs_dr."/".$_POST['project_id'];
$job_dr = $project_jobs_dr."/".$_POST['job_name'];

echo 'Removed '.$job_dr;

// Remove the directory
removeDirectory($job_dr);
?>