let counter = 3;
const overlay = document.getElementById('startOverlay');
mainContent = document.getElementById('mainContent');
const countdownElement = document.getElementById('countdown');
const startText = document.getElementById('startText');
const circleContainer = document.getElementById('circleContainer');
const circle = document.querySelector('.progress-ring__circle');
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;
setOverlay();

circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = `${circumference}`;

let nodes = [];
let last_nodes = [];
const count_last_nodes = 5;
let currentNode = null;
let imageShown = false;
let timerInterval = null;
let milisecondEplaced = 0; // Переменная для хранения времени
let secondEplaced = 0;
let minuteEplaced = 0;

// Загрузка данных узлов из JSON файла
fetch('static\\nodes.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Сеть ответила с ошибкой ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        nodes = data;

    })
    .catch(error => {
        console.error('Ошибка загрузки JSON:', error);
    });

function setOverlay(){
    counter = 3
//    mainContent.classList.add('hidden');
    overlay.classList.add('d-flex');
//    document.body.addEventListener('click', startCountdown, { once: true });
}

function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}

function startCountdown() {
    console.log(0);
    startText.classList.add('hidden');
    circleContainer.classList.remove('hidden');
    circleContainer.classList.add('circle-container');
    countdownElement.textContent = counter;
    setProgress(0); // Начинаем с полного заполнения

    const intervalDuration = 500;
    const countPerCircle = 100;
    var currentCount = 0;
    const countdownInterval = setInterval(() => {
        currentCount += intervalDuration / countPerCircle;
        if (currentCount > intervalDuration){
            counter--;
            currentCount -= intervalDuration;
        }
        if (counter > 0) {
            countdownElement.textContent = counter > 0 ? counter : '';
//            console.log(currentCount / intervalDuration * 100);
            setProgress(currentCount / intervalDuration * 100);
        } else {
            console.log(1);
            startText.classList.remove('hidden');
            circleContainer.classList.remove('circle-container');
            circleContainer.classList.add('hidden');
            overlay.classList.remove('d-flex');
//            mainContent.classList.remove('hidden');
            getRandomNode()
//                    overlay.style.display = 'none';

            clearInterval(countdownInterval);
        }
    }, intervalDuration / countPerCircle);
}

function getRandomNode() {
    let randomIndex = Math.floor(Math.random() * nodes.length);
    while (randomIndex in last_nodes) {
        randomIndex = Math.floor(Math.random() * nodes.length);
    }

    last_nodes.push(randomIndex);
    if (last_nodes.length > count_last_nodes) {
        last_nodes.shift();
    }
//    const randomIndex = 1;

    currentNode = nodes[randomIndex];
    document.getElementById('nodeName').textContent = currentNode.name;
    document.getElementById('nodeImage').style.display = 'none';
    document.getElementById('toggleButton').textContent = 'Показать узел';
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
        document.getElementById('timer').textContent = addLeadingNumberZeros(minuteEplaced, 2) + ":" + addLeadingNumberZeros(secondEplaced, 2) + ":" + addLeadingNumberZeros(milisecondEplaced, 2);
    }, 10); // Обновление каждую секунду
}


function addLeadingNumberZeros(number, totalLength) {
  return String(number).padStart(totalLength, '0');
}
function logout() {
    resetTimer();
    fetch('/logout', { method: 'GET' });
//    .catch(error => console.error("Logout error:", error));
}

function save_time(){
    fetch('/save_time', { method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ node: document.getElementById('nodeName').textContent, time: document.getElementById('textTime').textContent })
     }).catch(error => console.error("error:", error));
    setOverlay();
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
        this.textContent = 'Показать узел';
    }

    imageShown = !imageShown;
});

function hideOverlay(){
    document.getElementById("overlay").style.display = "none";
     document.getElementById("cardContainer").style.display = "none";
}

document.getElementById("success").addEventListener("click", function () {
      document.getElementById("textNode").textContent = document.getElementById("nodeName").textContent;
      document.getElementById("textTime").textContent = document.getElementById("timer").textContent;
      resetTimer();
      document.getElementById("overlay").style.display = "block";
      document.getElementById("cardContainer").style.display = "block";
    });

//    document.getElementById("overlay").addEventListener("click", function () {
//
//    });

document.getElementById("buttonOk").addEventListener("click", function () {
  hideOverlay();
  save_time();
});

document.getElementById("buttonCancel").addEventListener("click", function () {
  hideOverlay();
  setOverlay();
});

document.getElementById('cancel').addEventListener('click', setOverlay);
//document.getElementById('success').addEventListener('click', save_time);
document.getElementById("startOverlay").addEventListener('click', startCountdown);
