<?php

include '/var/www/html/data/config.php';

$job_dr = $user_dr."/Jobs";
$project_job_dr = $job_dr."/".$_GET['project_id'];

// Make directories if they don't exist
// Main cache dr
if (!is_dir($data_dr)) {
    mkdir($data_dr , 0777, true);
  }

// User dr
if (!is_dir($user_dr)){
    mkdir($user_dr, 0755);
}

// Job dr
if (!is_dir($job_dr)){
    mkdir($job_dr, 0755);
}

// Project dr within job dr
if (!is_dir($project_job_dr)){
    mkdir($project_job_dr, 0755);
}

// Return the project job drs contents
echo json_encode(array_diff(scandir($project_job_dr), array('..', '.')));

?>