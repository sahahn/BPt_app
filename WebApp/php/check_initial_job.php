<?php

include '/var/www/html/data/config.php';
include 'remove_dr.php';

$jobs_dr = $user_dr."/Jobs";
$project_jobs_dr = $jobs_dr."/".$_GET['project_id'];
$job_dr = $project_jobs_dr."/".$_GET['job_name'];

// Make up to project job dr if not a dr
if (!is_dir($project_jobs_dr)){
    mkdir($job_dr, 0777, true);
}

$error_file = $job_dr."/Error_Output.json";
$progress_file = $job_dr."/progress.txt";

// Make sure the job dr itself exists
if (is_dir($job_dr)) {

    // If an error return the contents then delete the job_dr
    if (file_exists($error_file)) {
        echo file_get_contents($error_file);
        removeDirectory($job_dr);
    }

    // If not done, then return progress if any
    else if (file_exists($progress_file)) {
        echo json_encode("started");
    }

    else {
        echo json_encode("waiting");
    }

} 
else {
    echo json_encode("not started");
}

?>