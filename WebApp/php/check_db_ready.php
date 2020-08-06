<?php
include '/var/www/html/data/config.php';

$loaded_loc = $data_dr.'loaded.json';
$all_events_loc = $data_dr.'all_events.json';

if (file_exists($loaded_loc)) {

    $return = array();
    $return['loaded'] = json_encode(file_get_contents($loaded_loc));
    $return['all_events'] = json_encode(file_get_contents($all_events_loc));
    echo json_encode($return);
}
else {
    echo json_encode('not ready');
}
?>