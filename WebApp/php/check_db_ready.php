<?php
include '/var/www/html/data/config.php';

$datasets_loc = $data_dr.'datasets.json';

// Return the loaded datasets
if (file_exists($datasets_loc)) {
    echo json_encode(file_get_contents($datasets_loc));
}
else {
    echo json_encode('not ready');
}
?>