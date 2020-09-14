<?php
include '/var/www/html/data/config.php';

// Get base path to dataset info
$base = $data_dr.'Data_Info/'.$_GET['dataset']."/";

// Return as array
$return = array();
$return['variables'] = file_get_contents($base.'loaded.json');
$return['events'] = file_get_contents($base.'eventnames.json');
echo json_encode($return);
?>