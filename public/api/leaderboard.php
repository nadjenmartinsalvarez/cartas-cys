<?php

require_once __DIR__ . '/../../vendor/autoload.php';
header("Content-Type: application/json; charset=utf-8");

$client = new MongoDB\Client(getenv("MONGODB_URI"));
$database = $client->selectCollection(
  getenv("MONGODB_DATABASE"),
  "scores"
);