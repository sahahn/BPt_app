<?php

include '/var/www/html/data/config.php';

if (!is_dir($data_dr)) {
    mkdir($data_dr , 0777, true);
}

$input_cache_loc = $cache_dr.$_GET['loc'];

if (!file_exists($input_cache_loc)) {
    echo '';
} else {
    echo file_get_contents($input_cache_loc);
}

?>