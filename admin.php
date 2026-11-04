<?php
/**
 * Enterprise Admin Portal - Server-Side Monitoring Component (`admin.php`)
 * Description: Renders server status, environment metadata, and mock audit logs.
 */
$configFile = file_get_contents('config.json');
$config = json_decode($configFile, true);

$dbFile = file_get_contents('database.mock.json');
$db = json_decode($dbFile, true);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Enterprise Admin Portal</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container" style="max-width: 600px; text-align: left;">
        <h2>Enterprise Admin Portal</h2>
        <p><strong>System Status:</strong> <span style="color: green;">Online</span></p>
        <p><strong>Environment:</strong> <?php echo htmlspecialchars($config['environment']); ?></p>
        <p><strong>API Endpoint:</strong> <?php echo htmlspecialchars($config['apiEndpoint']); ?></p>
        
        <hr>
        <h3>Active Users (Mock DB)</h3>
        <ul>
            <?php foreach ($db['users'] as $user): ?>
                <li><?php echo htmlspecialchars($user['username']); ?> (Role: <?php echo htmlspecialchars($user['role']); ?>)</li>
            <?php endforeach; ?>
        </ul>

        <hr>
        <a href="index.html">&larr; Return to Game Dashboard</a>
    </div>
</body>
</html>