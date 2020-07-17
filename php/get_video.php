<?php
header("Content-Type: video/mp4");
$file = file_get_contents($_GET['loc']);
echo base64_encode($file);
?>"