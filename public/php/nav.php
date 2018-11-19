<nav id="nav">
    <ul>
        <li class="special">
            <a href="#menu" class="menuToggle"><span>Menu</span></a>
            <div id="menu">
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/getting-started">Getting started</a></li>
                    <li><a href="/commands">Commands</a></li>
                    <li><a href="/profile">Profiles</a></li>
                    <li><a href="/server">Servers</a></li>
                    <li><a href="/dashboard">Dashboard</a></li>
                    <li><a href="/faq-support">FAQ/Support</a></li>
                    <li><a href="https://www.patreon.com/TimePlayed" target="_blank">Donate</a></li>
                </ul>
            </div>
        </li>
    </ul>
    <?php
        if(!isset($_SESSION)) {
            session_start();
        }
        
        if(!isset($_SESSION["token"])) {
            echo '<a class="login" href="/login?redirect=' . $_SERVER["REQUEST_URI"] . '">Login</a>';
        } else {
            echo '<a class="login" style="left: -5em" href="/logout?redirect=' . $_SERVER["REQUEST_URI"] .'">Logout</a>';
            echo '<p style="right: 20px" href="/logout?redirect=' . $_SERVER["REQUEST_URI"] .'">Logged in as <a href=/profile/me>' . $userInfo->username .'</a></p>';
        }
    ?>

</nav>