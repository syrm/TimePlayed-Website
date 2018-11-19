<?php
    function getUserInfo($token) {

        $userInfo = curl_init();
		curl_setopt_array($userInfo, array(
			CURLOPT_URL => 'https://discordapp.com/api/v6/users/@me',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => array(
                "Authorization: Bearer {$token}"
            )
		));
		$resp = json_decode(curl_exec($userInfo));
        curl_close($userInfo);

        $guilds = curl_init();
		curl_setopt_array($guilds, array(
			CURLOPT_URL => 'https://discordapp.com/api/v6/users/@me/guilds',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => array(
                "Authorization: Bearer {$token}"
            )
		));
		$resp->guilds = json_decode(curl_exec($guilds));
        curl_close($guilds);

        return $resp;
    }
    function getConnection() {
        $servername = "192.168.1.3";
        $username = "lan";
        $password = "oW13TnW6";
        $dbname = "timeplayed";
        // Create connection
        $conn = new mysqli($servername, $username, $password, $dbname);
        return $conn;
    }
    function discordRequest($path) {
        $path = "https://discordapp.com/api/" . $path;
        $request = curl_init();
		curl_setopt_array($request, array(
            CURLOPT_URL => $path,
            CURLOPT_HTTPHEADER => array("Authorization: Bot NDMzNjI1Mzk5Mzk4ODkxNTQx.DsWYYw.PRMvTjQjBbZkkv-4FuM2yHBcITI"),
            CURLOPT_RETURNTRANSFER => true
		));
        $response = json_decode(curl_exec($request), true);
        curl_close($request);
        return $response;
    }
    function checkPrivate($id) {
        $conn = getConnection();
        $stmt = $conn->prepare("SELECT count(*) FROM privateUsers WHERE userID=?");
		$stmt->bind_param("i", $_GET['id']);
        $stmt->execute();
        $val = $stmt->get_result()->fetch_assoc()["count(*)"] > 0;
        $stmt->close();
        return $val;
    }
    function getPremium($guildID) {
		$conn = getConnection();
        $stmt = $conn->prepare("SELECT count(*) FROM premium WHERE guildID=?");
        $stmt->bind_param("i", $guildID);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $stmt->close();
		return $result["count(*)"] > 0;
	}
?>