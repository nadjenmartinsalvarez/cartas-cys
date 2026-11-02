<?php

require_once __DIR__ . '/../../vendor/autoload.php';
header("Content-Type: application/json; charset=utf-8");

$client = new MongoDB\Client(getenv("MONGODB_URI"));
$collection = $client->selectCollection(
  getenv("MONGODB_DATABASE"),
  "scores"
);

$top5 = $collection.find(
  [
    "puntos" => ["$gt" => 0]
  ],
  [
    "sort" => ["puntos" => -1],
    "limit" => 5
  ]
);

$scores = [];

foreach ($top5 as $contender) {

}