const btn = document.querySelector('#btn');
const infoTimezone = document.querySelector('#infoTimezone');
const infoLocalDate = document.querySelector('#infoLocaldate');
const infoTZPrint = (message) => { infoTimezone.innerHTML = message; };
const infoLocalDatePrint = (message) => { infoLocalDate.innerHTML = message; };

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

// промис, возвращающий параметры таймзоны пользователя по координатам через API сайта ipgeolocation.io

function fetchTimezone(lat, long) {
    return new Promise((resolve, reject) => {
        fetchURL = `https://api.ipgeolocation.io/timezone?apiKey=32bcd4a6e4b548968e7afcdb682ac679`
                  +`&lat=${lat}`
                  +`&long=${long}`;

        fetch(fetchURL)
            .then((response) => {
                // console.log(response);
                if (response.ok) {                    
                    resolve(response.json());
                } else {
                    reject(response.status);
                }
            })
            .catch((error) => {
                reject(error);
            });
    });
    
}

// MAIN: обработчик кнопки
btn.addEventListener('click', () => {
    // лоадер-заглушка и очистка предыдущих значений на странице
    infoTZPrint('Выполняем запрос к Timezone API');
    infoLocalDatePrint('');

    // вызов промиса, получающего гелолокацию пользователя от браузера
    getGeo()
        .then((position) => {
            const dateStr = (new Date(position.timestamp)).toLocaleString();
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            // infoTZPrint(`Координаты пользователя: ${latitude}, ${longitude} (${dateStr})`);
            
            // вызов промиса, запрашивающего Timezone API
            fetchTimezone(latitude, longitude)
            .then((response) => {
                // console.log('Ответ получен', response);
                infoTZPrint('Ваша временная зона: <b>'+response.timezone+'</b>');
                infoLocalDatePrint('Местное время: <b>'+response.date_time_txt+'</b>');
            })
            .catch((error) => {
                infoTZPrint('Ошибка получения таймзоны от api.ipgeolocation.io: ', error);
            })
        })
        .catch((error) => {
            infoTZPrint('Ошибка получения геолокации. '+error);
        });

})

