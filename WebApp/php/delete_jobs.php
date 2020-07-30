<?php

include 'remove_dr.php';

$user_name = "sahahn";
$cache_dr = "/var/www/html/data/ABCD/ABCD_ML_Cache/";
$user_dr = $cache_dr.$user_name;
$job_dr = $user_dr."/Jobs";
$project_job_dr = $job_dr."/".$_POST['project_id'];

removeDirectory($project_job_dr);
?>
