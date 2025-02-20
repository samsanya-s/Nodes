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
let work_steck_nodes = []
let last_nodes = [];
const count_last_nodes = 5;
let currentNode = null;
let imageShown = false;
let timerInterval = null;
let milisecondEplaced = 0; // Переменная для хранения времени
let secondEplaced = 0;
let minuteEplaced = 0;
let type_r = document.getElementById("type_r").textContent;
let sel_nodes = document.getElementById("sel_nodes").textContent.split(",").map(Number);

//// Преобразуем строки времени в миллисекунды
function parseTimeToMs(time) {
    let minus = 1;
    if (time[0] == "-"){
        minus = -1;
    }
    const [minutes, seconds, milliseconds] = time.split(':').map(Number);
    return minus*(Math.abs(minutes * 60 * 100) + (seconds * 100) + milliseconds);
}


let path_text = "";
if (type_r == 2){
    path_text = 'static\\nodes.json';
}
else if (type_r == 1){
    path_text = 'static\\listNodes.json';
}
// Загрузка данных узлов из JSON файла
fetch(path_text)
    .then(response => {
        if (!response.ok) {
            throw new Error('Сеть ответила с ошибкой ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        let filteredData = data.filter(item => sel_nodes.includes(item.value));
        nodes = filteredData;
    })
    .catch(error => {
        console.error('Ошибка загрузки JSON:', error);
    });


function setOverlay(){
    counter = 3

    overlay.classList.add('d-flex');
}

function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}

function getRandomNode() {

    if (!work_steck_nodes.length ){
        for (let i = 0; i < nodes.length; i++){
             work_steck_nodes[i] = i;
            }
    }

    let n = Math.floor(Math.random() * (work_steck_nodes.length - 1));
    let randomIndex = work_steck_nodes[n];
    work_steck_nodes.splice(n, 1);

    if (type_r == 2){
        currentNode = nodes[randomIndex];
        document.getElementById('nodeName').textContent = currentNode.name;
        document.getElementById('nodeImage').style.display = 'none';
        document.getElementById('toggleButton').textContent = 'Показать узел';
        imageShown = false;
    }
    else{
        if (type_r == 1){
            let currentCard = nodes[randomIndex];
            for (let i = 0; i < 3; i++){
                document.getElementById(`point${i + 1}`).textContent = currentCard[i];
            }

        }
    }
    resetTimer();
    startTimer();
}

function startCountdown() {
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
            setProgress(currentCount / intervalDuration * 100);
        } else {
            startText.classList.remove('hidden');
            circleContainer.classList.remove('circle-container');
            circleContainer.classList.add('hidden');
            overlay.classList.remove('d-flex');
            getRandomNode()
            clearInterval(countdownInterval);
        }
    }, intervalDuration / countPerCircle);
}

function resetTimer() {
    clearInterval(timerInterval);
    milisecondEplaced = 0; // Сброс времени
    secondEplaced = 0;
    minuteEplaced = 0;
    document.getElementById('timer').textContent = '00:00:00'; // Обновление отображения
    document.getElementById('timer').style.color = "black";
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

            if (type_r == 1 && minuteEplaced == 1){
//            console.log(1);
                document.getElementById('timer').style.color = "red";
            }
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
    let node_text = "";
    let time_text = document.getElementById('textTime').textContent;
    if (type_r == 2){
        node_text = document.getElementById('nodeName').textContent;

    }
    else if (type_r == 1){
        node_text = "3 узла";
    }
    fetch('/save_time', { method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ node: node_text, time: time_text })
     }).catch(error => console.error("error:", error));
    setOverlay();
}

function hideOverlay(){
    document.getElementById("overlay").style.display = "none";
     document.getElementById("cardContainer").style.display = "none";
     document.getElementById('averageTime').textContent = "";
}

async function fetchAverageTime(node_name) {
    try {
        const response = await fetch("/get_time?node=" + node_name); // Запрос к серверу Flask
        if (!response.ok) {
            throw new Error('Ошибка сети');
        }
        const data = await response.json(); // Получаем JSON-ответ
        if (data.time){
            let cur_time = parseTimeToMs(document.getElementById("textTime").textContent);
            console.log(cur_time);
            if (cur_time > data.time){
                document.getElementById('averageTime').textContent = "медленее на " +  (cur_time - data.time) + "мс";
                document.getElementById('averageTime').style.color = "red";
            }
            else{
                document.getElementById('averageTime').textContent = "быстрее на " +  (data.time - cur_time) + "мс";
                document.getElementById('averageTime').style.color = "green";
            }
        }


    } catch (error) {
        console.error('Ошибка получения данных:', error);
    }
}

document.getElementById("success").addEventListener("click", function () {

        document.getElementById("textTime").textContent = document.getElementById("timer").textContent;
        if (type_r == 2){
            document.getElementById("textNode").textContent = document.getElementById("nodeName").textContent;
            fetchAverageTime(document.getElementById("nodeName").textContent);
        }
        else if (type_r == 1){
            fetchAverageTime("3 узла");
            if (parseTimeToMs(document.getElementById("timer").textContent) > 5999){
                document.getElementById("textBlock").textContent = "Карточка не выполнена";
                document.getElementById("textBlock").style.color = "red";
                 document.getElementById("textTime").style.color = "red";
            }
            else{
                 document.getElementById("textBlock").textContent = "Карточка выполнена";
                document.getElementById("textBlock").style.color = "green";
                document.getElementById("textTime").style.color = "green";
            }
        }
      resetTimer();
      document.getElementById("overlay").style.display = "block";
      document.getElementById("cardContainer").style.display = "block";
    });

document.getElementById("buttonOk").addEventListener("click", function () {
  hideOverlay();
  save_time();
});

document.getElementById("buttonCancel").addEventListener("click", function () {
  hideOverlay();
  setOverlay();
});

document.getElementById('cancel').addEventListener('click', function () {
        setOverlay();
        resetTimer();
});

document.getElementById("startOverlay").addEventListener('click', startCountdown);