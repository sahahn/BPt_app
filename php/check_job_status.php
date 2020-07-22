<?php

include 'remove_dr.php';

$user_name = "sahahn";
$cache_dr = "/var/www/html/data/ABCD/ABCD_ML_Cache/";

$user_dr = $cache_dr.$user_name;
$jobs_dr = $user_dr."/Jobs";
$project_jobs_dr = $jobs_dr."/".$_GET['project_id'];
$job_dr = $project_jobs_dr."/".$_GET['job_name'];

$error_file = $job_dr."/Error_Output.json";
$progress_file = $job_dr."/progress.txt";
$results_file = $job_dr."/results.pkl";
$logs_file = $job_dr."/ABCD_ML_Logs".$_GET['job_name']."/logs.txt";

// Make return array
$return = array();

// Init with unknown error, and no logs replace if not the case.
$return['status'] = "unknown error";
$return['logs'] = 'No saved logs found';

// Make sure the job dr itself exists
if (is_dir($job_dr)) {

    // If an error return the contents (dont delete the job directory)
    if (file_exists($error_file)) {
        $return['status'] = file_get_contents($error_file);
    }

    // If done set to done
    else if (file_exists($results_file)) {
        $return['status'] = 'done';
    }

    // If in progress, return progress
    else if (file_exists($progress_file)) {
        $return['status'] = file_get_contents($progress_file);
    }

    // Check for logs file
    if (file_exists($logs_file)) {
        $return['logs'] = file_get_contents($logs_file);
    }
} 

// Encode and return
echo json_encode($return);
?>