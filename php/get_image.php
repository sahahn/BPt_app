<?php
header("Content-Type: image/png");
$file = file_get_contents($_GET['loc']);
echo base64_encode($file);
?>"