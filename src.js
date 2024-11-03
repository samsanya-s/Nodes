// Функция для обновления таблицы очков
function updateScoreboard() {
    const scoreboard = document.getElementById('scoreboard').getElementsByTagName('tbody')[0];
    scoreboard.innerHTML = ''; // Очистить таблицу

    const scores = JSON.parse(localStorage.getItem('scores')) || [];

    scores.forEach(score => {
        const row = scoreboard.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        cell1.textContent = score.username;
        cell2.textContent = score.score;
    });
}

// Функция для добавления нового очка
function addScore() {
    const username = document.getElementById('username').value;
    const score = document.getElementById('score').value;

    if (!username || score === '') {
        alert('Пожалуйста, заполните все поля.');
        return;
    }

    const scores = JSON.parse(localStorage.getItem('scores')) || [];
    scores.push({ username, score: parseInt(score, 10) });
    localStorage.setItem('scores', JSON.stringify(scores));

    document.getElementById('username').value = '';
    document.getElementById('score').value = '';

    updateScoreboard();
}

// Обновить таблицу при загрузке страницы
window.onload = updateScoreboard;
