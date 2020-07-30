<?php

include 'remove_dr.php';

$user_name = "sahahn";
$cache_dr = "/var/www/html/data/ABCD/ABCD_ML_Cache/";

$user_dr = $cache_dr.$user_name;
$jobs_dr = $user_dr."/Jobs";
$project_jobs_dr = $jobs_dr."/".$_POST['project_id'];
$job_dr = $project_jobs_dr."/".$_POST['job_name'];

echo 'Removed '.$job_dr;

// Remove the directory
removeDirectory($job_dr);
?>