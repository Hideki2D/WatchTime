const socket = io({ transports: ['websocket'] });
const video = document.getElementById('videoPlayer');
const roomContainer = document.getElementById('room-container');
const errorMessage = document.getElementById('error-message');
const roomId = window.location.pathname.split('/').pop();
//const customPlayPauseButton = document.getElementById('customPlayPause');
let isSyncing = false; 
let isPlayEventInProgress = false;
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const overlay = document.getElementById('overlay');
    const mainContent = document.getElementById('mainContent');
    const errorMessage = document.getElementById('error-message');
    const roomContainer = document.getElementById('room-container');
    //const roomId = window.location.pathname.split('/').pop();

    // Обрабатываем нажатие на кнопку Play/Pause
    // customPlayPauseButton.addEventListener('click', () => {
    //     if (video.paused) {
    //         play();
    //     } 
    //     else {
    //         pause();
    //     }
    // });

    // Показываем кнопку, если пользователь зашел по прямой ссылке
    if (!sessionStorage.getItem('visitedFromMain')) {
        overlay.style.display = 'flex';  // Показываем кнопку
        mainContent.classList.add('hidden');  // Скрываем основной контент
    }

    // Если пользователь перешел с главной страницы, скрываем кнопку
    sessionStorage.setItem('visitedFromMain', 'true');

    // Когда пользователь нажимает на кнопку
    startButton.addEventListener('click', () => {
        // Скрываем кнопку и показываем основной контент
        overlay.style.display = 'none';
        mainContent.classList.remove('hidden'); // Показываем контент
        // Set room name
        document.getElementById('room-name').textContent = roomId;
        // Входим в комнату после соединения
        socket.emit('joinRoom', roomId);

        // Обработчик события синхронизации
        socket.on('sync', (data) => {
            video.currentTime = data.time;

            if (data.playing) {
                video.play().catch(err => console.error("Play error:", err));
            } else {
                video.pause();
            }
        });

        // Обработчик ошибки комнаты
        socket.on('roomError', (message) => {
            errorMessage.style.display = 'flex';
        });

        // Обновляем плейлист
        socket.on('updatePlaylist', (url) => {
            roomContainer.style.display = 'block';
            loadHlsStream(url);
        });

        // Проверка наличия комнаты
        socket.emit('checkRoom', roomId);
        
        socket.on('roomExists', (exists) => {
            if (exists) {
                errorMessage.style.display = 'none';
                roomContainer.style.display = 'block';
                initializeRoom();
            } else {
                errorMessage.style.display = 'flex';
                roomContainer.style.display = 'none';
            }
        });
            // Search button event
    document.querySelector('.search-btn').addEventListener('click', () => {
        const inputUrl = document.querySelector('.search-input').value.trim();
        if (inputUrl) {
            Search(inputUrl);
        }
    });

    // Copy room ID button
    document.getElementById('copy-button').addEventListener('click', async () => {
        const roomId = document.getElementById('room-name').textContent.trim();
        try {
            await copyToClipboard(roomId).then(() => {
                const copyBtn = document.getElementById('copy-button');
                copyBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                `;
                setTimeout(() => {
                    copyBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    `;
                }, 2000);
            });

        } catch(error) {
            console.error(error);
        }
    });

        // Инициализация комнаты
        function initializeRoom() {
            console.log('Кімната успішно завантажена:', roomId);
        }

        // Обновляем кнопку при изменении состояния видео
        // video.addEventListener('play', () => {
        //     customPlayPauseButton.innerHTML = '⏸';
        // });

        // video.addEventListener('pause', () => {
        //     customPlayPauseButton.innerHTML = '▶️';
        // });
        // video.addEventListener('play', () => {
        //     video.paused = true;
        //     console.log("play ", video.paused, !isPlayEventInProgress);
        //     if (video.paused && !isPlayEventInProgress) {
        //         isPlayEventInProgress = true;
        //         socket.emit('play', video.currentTime);
        //         video.paused = false;
        //     }
        // });
        
        // video.addEventListener('pause', () => {
        //     video.paused = false;
        //     console.log("pause ", !video.paused, !isPlayEventInProgress);
        //     if (!video.paused && !isPlayEventInProgress) {
        //         socket.emit('pause', video.currentTime);
        //         video.paused = true;
        //     }
        // });
        
        // video.addEventListener('seeking', () => {
        //     socket.emit('seek', video.currentTime);
        // });
        

        socket.on('play', (time) => {
            console.log("Play");
            if (video.paused || Math.abs(video.currentTime - time) > 1) {  // Если видео на паузе или времени сильно различаются
                video.muted = true;
                video.currentTime = time;
                setPlay()
                    .then(() => {
                        video.muted = false;
                        isPlayEventInProgress = false;  // Завершаем процесс воспроизведения
                    })
                    .catch(err => console.error("Play error:", err));
            }
            else 
                 isPlayEventInProgress = false;
        });
        
        socket.on('pause', (time) => {
            if (!video.paused) {  // Если видео не на паузе
                video.currentTime = time;
                setPause();
            }
        });
        
        socket.on('seek', (time) => {
            console.log("seeked");
            if (Math.abs(video.currentTime - time) > 1) {  // Если время отличается, синхронизируем
                seekVideo(time);
            }
        });
    });

    // Функция для загрузки потока
    function loadHlsStream(url) {
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
        }
    }
});

function SetupVideoConnect(inputUrl)
{
    if (inputUrl) 
    {
        socket.emit("setPlaylist", roomId, inputUrl);
    }
}
// Update these functions from videoPlayer.js to use new class names
function SetupVoices(series) {
    const voicesContainer = document.querySelector('.voices-buttons');
    voicesContainer.innerHTML = '';
    
    for (const [key, value] of Object.entries(series)) {
        const button = document.createElement('button');
        button.className = 'voice-button';
        button.textContent = value.fullname;
        button.addEventListener('click', () => SetupSeries(value.files));
        voicesContainer.appendChild(button);
    }
}

function SetupSeries(files) {
    const episodesContainer = document.querySelector('.episodes-buttons');
    episodesContainer.innerHTML = '';
    
    files.forEach((file, index) => {
        const button = document.createElement('button');
        button.className = 'episode-button';
        button.textContent = `Серія ${index + 1}`;
        button.addEventListener('click', async () => LoadPlayer(await getM3U8(file)));
        episodesContainer.appendChild(button);
    });
}

function SetupFromSearchQuery(results) {
    const searchResults = document.querySelector('.search-results');
    searchResults.innerHTML = '';
    
    results.forEach((res) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result';
        
        const img = document.createElement('img');
        img.className = 'title-img';
        img.src = `https://uakino.me/${res.img}`;
        img.alt = res.title;
        
        const title = document.createElement('a');
        title.className = 'title';
        title.textContent = res.title;
        
        resultItem.appendChild(img);
        resultItem.appendChild(title);
        resultItem.onclick = () => GetVideosForResult(res.url);
        
        searchResults.appendChild(resultItem);
    });
}

async function copyToClipboard(textToCopy) {
    // Navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
    } else {
        // Use the 'out of viewport hidden text area' trick
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
            
        // Move textarea out of the viewport so it's not visible
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
            
        document.body.prepend(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
        } catch (error) {
            console.error(error);
        } finally {
            textArea.remove();
        }
    }
}

function play()
{
    console.log("Пытаемся проиграть");
    if (!isPlayEventInProgress) {
        console.log("у нас получилось проиграть");
        isPlayEventInProgress = true;
        socket.emit('play', video.currentTime);
       // video.paused = false;
        //video.play();
        isPlayEventInProgress = false;
    }
}

function pause()
{
    console.log("Пытаемся остановить проигрывание");
    if (!isPlayEventInProgress) {
        console.log("у нас получилось остановить проигрывание");
        socket.emit('pause', video.currentTime);
        //video.pause();
        //video.paused = true;
    }
}

function seek(e)
{
    console.log("Пытаемся перемотать видео");
    if (!isPlayEventInProgress) {
        console.log("у нас получилось перемотать видео");
        socket.emit('seek', e);
        //video.pause();
        //video.paused = true;
    }
}