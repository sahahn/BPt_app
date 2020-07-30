<?php

include '/var/www/html/data/config.php';

// Just return out the content of the ML output file
echo(file_get_contents($user_dr.'/ML_Output'.$_POST['n'].'.json'));
?>