// Кастомный HLS плеер с возможностью перехвата событий
class CustomHLSPlayer {
    constructor(videoElementId, hlsUrl, options = {}) {
      // Сохраняем ссылки на элементы
      this.videoElement = document.getElementById(videoElementId);
      this.hlsUrl = hlsUrl;
      this.options = options;
      
      // Создаем контейнер для плеера и элементов управления
      this.createPlayerElements();
      
      // Инициализируем HLS.js
      this.initHLS();
      
      // Привязываем обработчики событий
      this.bindEvents();
      
      // Пользовательские колбэки для перехвата событий
      this.onBeforePlay = options.onBeforePlay || (() => true);
      this.onBeforePause = options.onBeforePause || (() => true);
      this.onBeforeSeek = options.onBeforeSeek || ((time) => true);
      this.onVolumeChange = options.onVolumeChange || ((volume) => true);
    }
    
    createPlayerElements() {
      // Создаем контейнер для плеера
      const container = document.createElement('div');
      container.className = 'custom-hls-player';
      container.style.position = 'relative';
      container.style.width = '100%';
      container.style.maxWidth = '800px';
      container.style.margin = '0 auto';
      container.style.backgroundColor = '#000';
      container.style.borderRadius = '4px';
      container.style.overflow = 'hidden';
      
      // Оборачиваем видеоэлемент
      this.videoElement.parentNode.insertBefore(container, this.videoElement);
      container.appendChild(this.videoElement);
      
      // Стили для видео
      this.videoElement.style.width = '100%';
      this.videoElement.style.display = 'block';
      
      // Создаем панель управления
      const controls = document.createElement('div');
      controls.className = 'player-controls';
      controls.style.position = 'absolute';
      controls.style.bottom = '0';
      controls.style.width = '100%';
      controls.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      controls.style.display = 'flex';
      controls.style.alignItems = 'center';
      controls.style.padding = '10px';
      controls.style.boxSizing = 'border-box';
      
      // Кнопка воспроизведения/паузы
      this.playButton = document.createElement('button');
      this.playButton.innerHTML = '▶';
      this.playButton.style.backgroundColor = 'transparent';
      this.playButton.style.border = 'none';
      this.playButton.style.color = 'white';
      this.playButton.style.fontSize = '16px';
      this.playButton.style.cursor = 'pointer';
      this.playButton.style.marginRight = '10px';
      this.playButton.title = 'Воспроизвести';
      
      // Полоса прогресса
      const progressContainer = document.createElement('div');
      progressContainer.style.flex = '1';
      progressContainer.style.height = '8px';
      progressContainer.style.backgroundColor = '#444';
      progressContainer.style.borderRadius = '4px';
      progressContainer.style.cursor = 'pointer';
      progressContainer.style.position = 'relative';
      
      this.progressBar = document.createElement('div');
      this.progressBar.style.height = '100%';
      this.progressBar.style.backgroundColor = '#f00';
      this.progressBar.style.width = '0%';
      this.progressBar.style.borderRadius = '4px';
      progressContainer.appendChild(this.progressBar);
      
      // Время
      this.timeDisplay = document.createElement('div');
      this.timeDisplay.style.color = 'white';
      this.timeDisplay.style.fontSize = '14px';
      this.timeDisplay.style.marginLeft = '10px';
      this.timeDisplay.textContent = '0:00 / 0:00';
      
      // Элемент управления громкостью
      const volumeContainer = document.createElement('div');
      volumeContainer.style.display = 'flex';
      volumeContainer.style.alignItems = 'center';
      volumeContainer.style.marginLeft = '15px';
      
      this.volumeButton = document.createElement('button');
      this.volumeButton.innerHTML = '🔊';
      this.volumeButton.style.backgroundColor = 'transparent';
      this.volumeButton.style.border = 'none';
      this.volumeButton.style.color = 'white';
      this.volumeButton.style.fontSize = '16px';
      this.volumeButton.style.cursor = 'pointer';
      this.volumeButton.style.marginRight = '5px';
      
      this.volumeSlider = document.createElement('input');
      this.volumeSlider.type = 'range';
      this.volumeSlider.min = '0';
      this.volumeSlider.max = '1';
      this.volumeSlider.step = '0.1';
      this.volumeSlider.value = '1';
      this.volumeSlider.style.width = '60px';
      
      volumeContainer.appendChild(this.volumeButton);
      volumeContainer.appendChild(this.volumeSlider);
      
      // Добавляем все элементы управления в панель
      controls.appendChild(this.playButton);
      controls.appendChild(progressContainer);
      controls.appendChild(this.timeDisplay);
      controls.appendChild(volumeContainer);
      
      // Добавляем панель управления в контейнер
      container.appendChild(controls);
      
      // Сохраняем ссылки на элементы
      this.container = container;
      this.controls = controls;
      this.progressContainer = progressContainer;
      
      // Скрываем стандартные элементы управления видео
      this.videoElement.controls = false;
    }
    
    initHLS() {
      if (Hls.isSupported()) {
        this.hls = new Hls();
        this.hls.loadSource(this.hlsUrl);
        this.hls.attachMedia(this.videoElement);
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed');
        });
        
        this.hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            switch(data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Fatal network error, trying to recover');
                this.hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Fatal media error, trying to recover');
                this.hls.recoverMediaError();
                break;
              default:
                console.log('Fatal error, cannot recover');
                this.hls.destroy();
                break;
            }
          }
        });
      } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Для Safari, который имеет встроенную поддержку HLS
        this.videoElement.src = this.hlsUrl;
      } else {
        console.error('HLS is not supported in this browser');
      }
    }
    
    bindEvents() {
      // Обработчик клика на кнопку воспроизведения/паузы
      this.playButton.addEventListener('click', () => {
        if (this.videoElement.paused) {
          // Перехватываем событие перед воспроизведением
          const shouldContinue = this.onBeforePlay();
          if (shouldContinue !== false) {
            this.videoElement.play();
          }
        } else {
          // Перехватываем событие перед паузой
          const shouldContinue = this.onBeforePause();
          if (shouldContinue !== false) {
            this.videoElement.pause();
          }
        }
      });
      
      // Обновление кнопки воспроизведения/паузы
      this.videoElement.addEventListener('play', () => {
        this.playButton.innerHTML = '❚❚';
        this.playButton.title = 'Пауза';
      });
      
      this.videoElement.addEventListener('pause', () => {
        this.playButton.innerHTML = '▶';
        this.playButton.title = 'Воспроизвести';
      });
      
      // Обработчик для полосы прогресса
      this.progressContainer.addEventListener('click', (e) => {
        const rect = this.progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const newTime = pos * this.videoElement.duration;
        
        // Перехватываем событие перед перемоткой
        const shouldContinue = this.onBeforeSeek(newTime);
        if (shouldContinue !== false) {
          this.videoElement.currentTime = newTime;
        }
      });
      
      // Обновление полосы прогресса
      this.videoElement.addEventListener('timeupdate', () => {
        const progress = (this.videoElement.currentTime / this.videoElement.duration) * 100;
        this.progressBar.style.width = `${progress}%`;
        
        // Обновление отображения времени
        const currentMinutes = Math.floor(this.videoElement.currentTime / 60);
        const currentSeconds = Math.floor(this.videoElement.currentTime % 60);
        const durationMinutes = Math.floor(this.videoElement.duration / 60) || 0;
        const durationSeconds = Math.floor(this.videoElement.duration % 60) || 0;
        
        this.timeDisplay.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')} / ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
      });
      
      // Обработчик изменения громкости
      this.volumeSlider.addEventListener('input', () => {
        const newVolume = parseFloat(this.volumeSlider.value);
        
        // Перехватываем событие изменения громкости
        const shouldContinue = this.onVolumeChange(newVolume);
        if (shouldContinue !== false) {
          this.videoElement.volume = newVolume;
          this.updateVolumeIcon(newVolume);
        }
      });
      
      // Нажатие на кнопку громкости для включения/выключения звука
      this.volumeButton.addEventListener('click', () => {
        const newMuted = !this.videoElement.muted;
        this.videoElement.muted = newMuted;
        
        if (newMuted) {
          this.volumeButton.innerHTML = '🔇';
        } else {
          this.updateVolumeIcon(this.videoElement.volume);
        }
      });
      
      // Скрытие/отображение элементов управления при наведении
      this.container.addEventListener('mouseenter', () => {
        this.controls.style.opacity = '1';
      });
      
      this.container.addEventListener('mouseleave', () => {
        if (!this.videoElement.paused) {
          this.controls.style.opacity = '0';
        }
      });
      
      // Устанавливаем начальную прозрачность элементов управления
      this.controls.style.opacity = '1';
      this.controls.style.transition = 'opacity 0.3s';
    }
    
    updateVolumeIcon(volume) {
      if (volume === 0 || this.videoElement.muted) {
        this.volumeButton.innerHTML = '🔇';
      } else if (volume < 0.5) {
        this.volumeButton.innerHTML = '🔉';
      } else {
        this.volumeButton.innerHTML = '🔊';
      }
    }
    
    // Публичные методы для управления плеером
    play() {
      const shouldContinue = this.onBeforePlay();
      if (shouldContinue !== false) {
        this.videoElement.play();
      }
    }
    
    pause() {
      const shouldContinue = this.onBeforePause();
      if (shouldContinue !== false) {
        this.videoElement.pause();
      }
    }
    
    seek(time) {
      const shouldContinue = this.onBeforeSeek(time);
      if (shouldContinue !== false) {
        this.videoElement.currentTime = time;
      }
    }
    
    setVolume(volume) {
      const newVolume = Math.max(0, Math.min(1, volume));
      const shouldContinue = this.onVolumeChange(newVolume);
      if (shouldContinue !== false) {
        this.videoElement.volume = newVolume;
        this.volumeSlider.value = newVolume;
        this.updateVolumeIcon(newVolume);
      }
    }
    
    toggleMute() {
      this.videoElement.muted = !this.videoElement.muted;
      this.updateVolumeIcon(this.videoElement.volume);
    }
    
    // Метод для обновления URL потока
    updateSource(newHlsUrl) {
      this.hlsUrl = newHlsUrl;
      if (Hls.isSupported()) {
        this.hls.destroy();
        this.hls = new Hls();
        this.hls.loadSource(this.hlsUrl);
        this.hls.attachMedia(this.videoElement);
      } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        this.videoElement.src = this.hlsUrl;
      }
    }
    
    // Методы для установки колбэков
    setBeforePlayCallback(callback) {
      this.onBeforePlay = callback;
    }
    
    setBeforePauseCallback(callback) {
      this.onBeforePause = callback;
    }
    
    setBeforeSeekCallback(callback) {
      this.onBeforeSeek = callback;
    }
    
    setVolumeChangeCallback(callback) {
      this.onVolumeChange = callback;
    }
    
    // Метод для уничтожения плеера и освобождения ресурсов
    destroy() {
      if (this.hls) {
        this.hls.destroy();
      }
      // Удаляем созданные элементы и возвращаем видео в исходное состояние
      this.videoElement.controls = true;
      if (this.container && this.container.parentNode) {
        this.container.parentNode.insertBefore(this.videoElement, this.container);
        this.container.parentNode.removeChild(this.container);
      }
    }
  }