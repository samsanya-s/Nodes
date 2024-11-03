let nodes = [];
let currentNode = null;
let imageShown = false;
let timerInterval = null;
let milisecondEplaced = 0; // Переменная для хранения времени
let secondEplaced = 0;
let minuteEplaced = 0;

// Загрузка данных узлов из JSON файла
fetch('nodes.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Сеть ответила с ошибкой ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        nodes = data;
        getRandomNode(); // Получаем случайный узел при загрузке
    })
    .catch(error => {
        console.error('Ошибка загрузки JSON:', error);
    });

function getRandomNode() {
    const randomIndex = Math.floor(Math.random() * nodes.length);
    currentNode = nodes[randomIndex];
    document.getElementById('nodeName').textContent = currentNode.name;
    document.getElementById('nodeImage').style.display = 'none';
    document.getElementById('toggleButton').textContent = 'Показать картинку узла';
    imageShown = false;

    // Сброс таймера при новом узле
    resetTimer();
    startTimer();
}

function resetTimer() {
    clearInterval(timerInterval);
    milisecondEplaced = 0; // Сброс времени
    secondEplaced = 0;
    minuteEplaced = 0;
    document.getElementById('timer').textContent = 'Время: 00:00:00'; // Обновление отображения
}

function startTimer() {
    timerInterval = setInterval(() => {
        milisecondEplaced++;
        if (milisecondEplaced >= 100){
            milisecondEplaced -= 100;
            secondEplaced++;
        }
        if (secondEplaced >= 60){
            secondEplaced -= 60;
            minuteEplaced++;
        }
        document.getElementById('timer').textContent = 'Время: ' + addLeadingNumberZeros(minuteEplaced, 2) + ":" + addLeadingNumberZeros(secondEplaced, 2) + ":" + addLeadingNumberZeros(milisecondEplaced, 2);
    }, 10); // Обновление каждую секунду
}

document.getElementById('toggleButton').addEventListener('click', function() {
    const nodeImage = document.getElementById('nodeImage');

    if (!imageShown) {
        // Показать изображение узла
        nodeImage.src = currentNode.image;
        nodeImage.style.display = 'block';
        this.textContent = 'Показать инструкцию';
    } else {
        // Показать изображение с инструкцией
        nodeImage.src = currentNode.instruction;
        this.textContent = 'Показать картинку узла';
    }

    imageShown = !imageShown;
});

document.getElementById('nextNode').addEventListener('click', getRandomNode);
function addLeadingNumberZeros(number, totalLength) {
  return String(number).padStart(totalLength, '0');
}
