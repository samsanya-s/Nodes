let lastClickTime = 0;
let firstClick = true;

// Регистрация
function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data["status"] == "success"){
            document.getElementById("loginError").style.display = "none";
            login();
        }
        else if (data["status"] == "error"){
            document.getElementById("loginError").style.display = "block";
        }
        else {
           console.error(data);
        }
    })
    .catch(error => console.error("Register error:", error));
}

// Вход
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    console.log(1);
    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password })
    })
    .then(response => response.json());
}

// Выход
function logout() {
    fetch('/logout', { method: 'POST' })
    .then(() => {
        document.getElementById('authDiv').style.display = 'block';
        document.getElementById('testDiv').style.display = 'none';
    })
    .catch(error => console.error("Logout error:", error));
}

// Логика замера времени нажатий
//document.getElementById('clickButton').addEventListener('click', () => {
//    const currentTime = Date.now();
//
//    if (firstClick) {
//        lastClickTime = currentTime;
//        firstClick = false;
//        return;
//    }
//
//    const timeElapsed = currentTime - lastClickTime;
//    lastClickTime = currentTime;
//    document.getElementById('timeElapsed').innerText = timeElapsed;
//
//    // Отправляем время на сервер
//    fetch('/save_time', {
//        method: 'POST',
//        headers: { 'Content-Type': 'application/json' },
//        body: JSON.stringify({ timeElapsed: timeElapsed })
//    })
//    .then(response => response.json())
//    .then(data => console.log("Data saved:", data))
//    .catch(error => console.error("Error saving data:", error));
//});
