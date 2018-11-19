<?php
	session_start();

	require "util.php";

	$conn = getConnection();

	if(!isset($_GET["id"])) {
		die("No ID value specified!");
	}

	$userInfo = getUserInfo($_SESSION["token"]);

	if(isset($_SESSION["token"]) && $userInfo->id == $_GET["id"]) {
		if($_POST["privacy"] == "private") {
			$stmt = $conn->prepare("INSERT IGNORE INTO privateUsers (userID) VALUES (?)");
			$stmt->bind_param("i", $_GET['id']);
			$stmt->execute();
			$stmt->close();
		} else if($_POST["privacy"] == "public") {
			$stmt = $conn->prepare("DELETE FROM privateUsers WHERE userID=?");
			$stmt->bind_param("i", $_GET['id']);
			$stmt->execute();
			$stmt->close();
		}
		header("Location: " . urldecode($_GET["redirect"]));
		die();
	} else {
		echo "Unauthorized request!";
	}
?>