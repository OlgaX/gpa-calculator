<?php
//sanitize form values
//and save them into $_POST_sanitized array
//-----------------------------------------------
$_POST_sanitized = array();

array_walk($_POST, 'sanitize_data');

function sanitize_data($value, $key) {
  global $_POST_sanitized;
  if ($key === 'email') {
    $_POST_sanitized[$key] = (filter_var($value, FILTER_VALIDATE_EMAIL)) ? $value : '';
  }
  else $_POST_sanitized[$key] = trim(strip_tags($value));
}

//extract $_POST_sanitized values into variables
//-----------------------------------------------
extract( $_POST_sanitized );

//write data into the leads.txt file
//-----------------------------------------------
if (!empty($email))
file_put_contents('../uploads/leads.txt', $email. '|' . date('m-d-Y') . '|' . $form . '|' . $result. PHP_EOL , FILE_APPEND);
