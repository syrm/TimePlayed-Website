<?php
	// Start the session
	session_start();
	error_reporting(E_ERROR);
	// Init DB connection
	$servername = "192.168.1.3";
	$username = "lan";
	$password = "oW13TnW6";
	$dbname = "timeplayed";
	// Create connection
	$conn = new mysqli($servername, $username, $password, $dbname);

	$userInfo = getUserInfo($_SESSION["token"]);

	// Check connection
	if ($conn->connect_error) {
		die("Connection failed! Please contact a server admin and paste this code: <br>\n<code>" . $conn->connect_error . "</code>");
	}

	$userID = $_GET["id"];

	if($userID === "" || !preg_match("/[0-9]{17,18}/", $userID)) {
		die("Invalid or no ID formatting!");
	}
	$stmt = $conn->prepare("SELECT game, DATE_FORMAT(startDate, '%d-%m-%Y %H:%i'), DATE_FORMAT(endDate, '%d-%m-%Y %H:%i') FROM playtime WHERE userID=?");
	$stmt->bind_param("i", $userID);
	$stmt->execute();
	$results = $stmt->get_result();

	$fields = $results->field_count;
	
	header('Content-Type: text/csv');
	header('Content-Disposition: attachment; filename="playtime_export_' . $userInfo->username . date("_Y_m_d") . '"');

	$fp = fopen('php://output', 'wb');
	$headers = array('Game', 'Start date', 'End date');
	fputcsv($fp, $headers);
	while($row = $results->fetch_assoc()) {
		fputcsv($fp, $row);
	}
	fclose($fp);
	
?>