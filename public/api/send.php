<?php

require_once __DIR__ . '/../../vendor/autoload.php';
header("Content-Type: application/json; charset=utf-8");

$userInput = json_decode(file_get_contents("php://input"), true);

$client = new MongoDB\Client(getenv("MONGODB_URI"));
$collection = $client->selectCollection(
  getenv("MONGODB_DATABASE"),
  "scores"
);

$collection->insertOne([
  "nombre" => (string) $userInput["nombre"],
  "puntos" => (int) $userInput["puntos"],
  "tiempoRestante" => (int) $userInput["tiempoRestante"],
  "fechaCreacion" => new MongoDB\BSON\UTCDateTime()
]);

echo json_encode(["ok" => true]);