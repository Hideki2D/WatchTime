const socket = io({ transports: ['websocket'] });
const video = document.getElementById('videoPlayer');
const roomContainer = document.getElementById('room-container');
const errorMessage = document.getElementById('error-message');
const roomId = window.location.pathname.split('/').pop();
document.addEventListener('DOMContentLoaded', () => {
    let isSeeking = false;

    // Set room name
    document.getElementById('room-name').textContent = roomId;

    // Join room
    socket.emit('joinRoom', roomId);

    // Room error handling
    socket.on('roomError', (message) => {
        errorMessage.style.display = 'flex';
    });

    // Update playlist
    socket.on('updatePlaylist', (url) => {
        roomContainer.style.display = 'block';
        loadHlsStream(url);
    });

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
    function initializeRoom() {
        // Тут ініціалізація вашої кімнати
        console.log('Кімната успішно завантажена:', roomId);
    }

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

    // Video synchronization
    video.addEventListener('play', () => {
        socket.emit('play', video.currentTime);
    });

    video.addEventListener('pause', () => {
        socket.emit('pause', video.currentTime);
    });

    video.addEventListener('seeking', () => {
        if (!isSeeking) {
            socket.emit('seek', video.currentTime);
            isSeeking = true;
            setTimeout(() => (isSeeking = false), 500);
        }
    });

    socket.on('play', (time) => {
        if (video.paused) {
            video.currentTime = time;
            video.play();
        }
    });

    socket.on('pause', (time) => {
        if (!video.paused) {
            video.currentTime = time;
            video.pause();
        }
    });

    socket.on('seek', (time) => {
        if (Math.abs(video.currentTime - time) > 1) {
            video.currentTime = time;
        }
    });

    
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