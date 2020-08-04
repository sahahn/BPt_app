<?php
include '/var/www/html/data/config.php';

$loaded_loc = $data_dr.'loaded.json';
if (file_exists($loaded_loc)) {
    echo file_get_contents($loaded_loc);
}
else {
    echo json_encode('not ready');
}
?>