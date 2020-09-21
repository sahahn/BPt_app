<?php
include '/var/www/html/data/config.php';

$lock_loc = $data_dr.'lock';
$ready_loc = $data_dr.'ready';
$error_loc = $data_dr.'process_datasets_errors.txt';
$loaded_loc = $data_dr.'datasets.json';
$all_events_loc = $data_dr.'all_events.json';

$return = array();

// If lock, return not ready, status = 0
if (file_exists($lock_loc)) {
    $return['status'] = "0";
}

// If no lock
else {

    // Either error
    if (file_exists($error_loc)) {
        $return['status'] = "-1";
        $return['error_msg'] = utf8_encode(file_get_contents($error_loc));
    }

    // Ready
    else if (file_exists($ready_loc)) {
        $return['status'] = "1";
        $return['datasets'] = file_get_contents($loaded_loc);
        $return['all_events'] = file_get_contents($all_events_loc);
    }

    // Or not ready
    else {
        $return['status'] = "0";
    }
}

echo json_encode($return);
?>