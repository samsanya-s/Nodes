<?php
$servername = "localhost"; // Ваш сервер базы данных
$username = "username"; // Ваше имя пользователя базы данных
$password = "password"; // Ваш пароль базы данных
$dbname = "database"; // Ваша база данных

// Создаем соединение
$conn = new mysqli($servername, $username, $password, $dbname);

// Проверяем соединение
if ($conn->connect_error) {
    die("Ошибка подключения: " . $conn->connect_error);
}

$timeTaken = $_POST['timeTaken'];
$ip = $_SERVER['REMOTE_ADDR'];

$sql = "INSERT INTO results (ip_address, time_taken) VALUES ('$ip', '$timeTaken')";

if ($conn->query($sql) === TRUE) {
    echo "Запись успешно добавлена";
} else {
    echo "Ошибка: " . $sql . "<br>" . $conn->error;
}

$conn->close();
?>
