const chatStatus = document.querySelector("#chatStatus");
const chatMessages = document.querySelector("#chatMessages");
const chatInputText = document.querySelector("#chatInputText");
const btnChatSendMessage = document.querySelector("#chatSendMessage");
const btnChatSendGeo = document.querySelector("#chatSendGeo");

const LOCALMSG = 1; // код состояния 1 - сообщение отправлено пользователем
const REMOTEMSG = 2; // код состояния 2 - сообщение получено извне

const mapURI = 'http://www.openstreetmap.org/?'; // ссылка на веб-карту, к строке плюс lon=NN.NNNN&lat=NN.NNNN

let skipNextMessage = false; // флаг, что нужно пропустить следующее сообщение


let websocket = new WebSocket('wss://echo.websocket.org/');

const statusTitle = 'Чат с эхо-сервером';

// Задаем прослушиватели события websocket
websocket.onopen = (event) => {
    chatStatus.innerHTML = statusTitle + ": Соединение установлено";
    btnChatSendMessage.disabled = false;
    btnChatSendGeo.disabled = false;
};

websocket.onclose = (event) => {
    chatStatus.innerHTML = statusTitle + ": Соединение разорвано";
    btnChatSendMessage.disabled = true;
    btnChatSendGeo.disabled = true; 
}

websocket.onmessage = (event) => {
    // console.log('received msg: '+event.data);
    printMessage(event.data,REMOTEMSG);
}

websocket.onerror = (event) => {
    // console.error(error);
    chatStatus.innerHtml = statusTitle + ": Ошибка : " + error;
}


function sendGeo(lat, long) {
    // если входные координаты недостаточны, выходим
    if (!lat || !long) { return }

    // проверяем, открыт ли вебсокет
    if (websocket.readyState == 1)  {
    const mapLink = `📌 <a href="${mapURI}lat=${lat}&lon=${long}&zoom=13" target="_blank">Моя геометка</a>`;
    printMessage(mapLink,LOCALMSG);
    skipNextMessage = true;
    websocket.send(mapLink);
    };
}
// универсальная функция отправки сообщения
function sendMessage() {
    message = chatInputText.value;
    // если в строке ввода пусто или куча пробелов, то отправка не выполняется
    if (message == '' || message.trim() == '') {
        // на всякий очищаем строку ввода, если там была куча пробелов
        chatInputText.value = '';
        return;
    };

    // console.log('sending new message: ' + chatInputText.value);

    if (websocket.readyState == 1) {
        // отправляем сообщение только после проверки состояния, что сокет открыт (код состояния 1)
        websocket.send(message);
        printMessage(message,LOCALMSG)
        chatInputText.value = '';
    }
    else {
        chatStatus.innerHTML = statusTitle + ": Нет связи с сервером";
        // отключаем кнопки
        btnChatSendMessage.disabled = true;
        btnChatSendGeo.disabled = true;        
    }
}

// запись сообщения в окно чата
function printMessage(message, source) {
    // если флаг пропуска сл.сообщения skipNextMessage установлен и мы пытаемся напечатать сообщение удаленной стороны,
    // то пропускаем его, сбрасывая флаг skipNextMessage обратно в false;

    if (skipNextMessage && source == REMOTEMSG) {
        skipNextMessage = false;
        return;        
        }

    // создаем новый див с сообщением
    const newMessage = document.createElement("div");
    newMessage.innerHTML = message;

    // ставим класс на базовый стиль сообщений 
    newMessage.classList.add('message');

    // задаем стиль оформления в зависимости от источника сообщения
    switch (source) {
        case LOCALMSG:
            newMessage.classList.add("local");
            break;
        case REMOTEMSG:
            newMessage.classList.add("remote");
            break;
    };

    // добавляем новое сообщение в конец списка сообщений
    chatMessages.appendChild(newMessage);

    // прокручиваем окно чата до последнего сообщения
    chatMessages.scrollTop = chatMessages.scrollHeight;
}



// промис запроса геолокации к браузеру
function getGeo() {
    return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve(position);
                },
                (error) => {
                    // обработка кодов ошибок
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            reject("Ошибка геолокации. Разрешение на получение местоположения отклонено пользователем.");
                            break;
                        case error.POSITION_UNAVAILABLE:
                            reject("Ошибка геолокации. Информация о местоположении недоступна.");
                            break;
                        case error.TIMEOUT:
                            reject("Ошибка геолокации. Время запроса местоположения истекло.");
                            break;
                        case error.UNKNOWN_ERROR:
                            reject("Ошибка геолокации. Произошла неизвестная ошибка.");
                            break;
                    }
                },
                { timeout: 3000 } // Таймаут определения ошибки в мс
            );
        } else {
            reject('Информация о местоположении недоступна');
        }
    });
}


/* обработчики ввода */


// Установка обработчика на кнопку отправки геолокации "Гео-локация"

btnChatSendGeo.addEventListener("click", () => {
    getGeo()
    .then((position) => {
        // const dateStr = (new Date(position.timestamp)).toLocaleString();
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        // console.log(`Координаты пользователя: ${latitude}, ${longitude}`);
        sendGeo(latitude, longitude);        
    })
    .catch((error) => {
        printMessage(error,LOCALMSG);
    });


    });

// Установка обработчика отправки сообщения на кнопку "Отправить"
btnChatSendMessage.addEventListener("click", () => {
    sendMessage();
});

// Добавляем дополнительный обработчик на отправку сообщения по клавише Enter в строке ввода
chatInputText.addEventListener("keyup", (event) => {
    // console.log('pressed key: ' + event.keyCode);
    if (event.keyCode == 13) {
        //  нажат Enter, отправляем сообщение
        sendMessage();
    }
});
