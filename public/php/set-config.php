<?php
	require dirname(__FILE__) . "/../../dashboard/assets/util.php";
	
	session_start();
	usleep(500000);

	$conn = getConnection();

	$guildID = $_POST["guildID"];
	if(!is_numeric($guildID)) {
        die("Illegal guild ID type!");
	}
	if(!isset($_SESSION["token"])) {
        die("<script>alert('Error: you are not logged in!')</script>");
	}
	$userInfo = getUserInfo($_SESSION["token"]);
	
	if(!checkManageServer($guildID, $userInfo)) {
			die("<script>alert('You don\'t have the right permissions to edit this server\'s config!')</script>");
	}

	$premium = getPremium($guildID);
	
	$configNames = [
		"prefix",
		"rankingChannel",
		"defaultGame",
		"roleAwards",
		"leaderboardLayout",
		"leaderboardNoMoreToday",
		"leaderboardNoMoreWeek",
		"leaderboardNoMoreAlways",
		"leaderboardNoToday",
		"leaderboardNoWeek",
		"leaderboardNoAlways"
	];

	function stringToSeconds($str) {
		if($str == "minute") {
			return 60;
		}
		if($str == "hour") {
			return 3600;
		}
		if($str == "day") {
			return 86400;
		}
		if($str == "week") {
			return 604800;
		}
		if($str == "month") {
			return 2629800;
		}
		$num = substr($str, 0, -1);
		$last = substr($str, -1);

		if($last =="m") {
			return $num * 60;
		}
		if($last =="h") {
			return $num * 3600;
		}
		if($last =="d") {
			return $num * 86400;
		}
		if($last =="w") {
			return $num * 604800;
		}
	}

	foreach($_POST as $key => $value) {
		if($key == "awards") {
			$stmt = $conn->prepare("DELETE FROM roleAwards WHERE guildID=?");
			$stmt->bind_param("i", $guildID);
			$stmt->execute();
			$stmt->close();
			$done = [];
			$count = 0;
			foreach($value as $award) {
				$count++;
				if($count > 3 && !$premium) {
					continue;
				} else if($count > 10) {
					continue;
				}
				$re = '/^[0-9]{1,2}[mhdw]$|^minute$|^hour$|^day$|^week$/';
				if(preg_match($re, $award["time"]) == 1 && preg_match($re, $award["per"]) == 1 && !in_array($award["roleID"], $done)) {
					$done[] = $award["roleID"];
					$time = stringToSeconds($award["time"]);
					$per = stringToSeconds($award["per"]);
					$stmt = $conn->prepare("INSERT INTO roleAwards (guildID, roleID, game, time, per) VALUES (?, ?, ?, ?, ?)");
					$stmt->bind_param("iisii", $guildID, $award["roleID"], $award["game"], $time, $per);
					$stmt->execute();
					$stmt->close();
				}
			}
		} else if(in_array($key, $configNames)) {
			$stmt = $conn->prepare("UPDATE guildSettings SET $key=? WHERE guildID=?");
			$stmt->bind_param("si", $_POST[$key], $guildID);
			$stmt->execute();
			$stmt->close();
		}
	}
?>