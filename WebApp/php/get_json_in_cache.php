<?php
$cache_dr = "/var/www/html/data/ABCD/ABCD_ML_Cache/";

if (!is_dir($cache_dr)) {
    mkdir($cache_dr , 0777, true);
  }

$input_cache_loc = $cache_dr.$_GET['loc'];

if (!file_exists($input_cache_loc)) {
    echo '';
} else {
    echo file_get_contents($input_cache_loc);
}

?>