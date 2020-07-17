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

// Make sure the job dr itself exists
if (is_dir($job_dr)) {

    // If an error return the contents then delete the job_dr
    if (file_exists($error_file)) {
        echo file_get_contents($error_file);
        removeDirectory($job_dr);
    }

    // If results, return done
    else if (file_exists($results_file)) {
        echo json_encode('done');
    }

    // Return the contents of progress if not yet done
    else if (file_exists($progress_file)) {
        echo json_encode(file_get_contents($progress_file));
    }

    else {
        echo json_encode("unknown error");
    }

} 
else {
    echo json_encode("unknown error");
}

?>