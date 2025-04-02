let FullUrl;
async function getM3U8(url) {
    try {
        let proxiedUrl;
        if(url.startsWith("https://") || url.startsWith("http://"))
            proxiedUrl = proxiUrl + url;
        else
            proxiedUrl = proxiUrl + "https://" +  url;
        let response = await fetch(proxiedUrl);
        let text = await response.text();
        console.log(text);
        // Ищем ссылку на m3u8
        let match = text.match(/file:\s*"(https:\/\/[^"]+\.m3u8)"/);
        if (match) {
            console.log("Ссылка на m3u8:", match[1]);
            return match[1];
        } else {
            console.log("Ссылка на m3u8 не найдена.");
            return null;
        }
    } catch (error) {
        console.error("Ошибка загрузки страницы:", error);
    }
  }
  
  function SetupVoices(series)
  {
    document.querySelector('.VoicesButtons').innerHTML = "";
     for (const [key, value] of Object.entries(series)) 
     {
        let button = document.createElement("button");
        button.className = "voice-button"; // Добавляем класс
        button.textContent = value.fullname; // Текст внутри кнопки

        document.querySelector('.VoicesButtons').appendChild(button);
        button.addEventListener("click", () => SetupSeries(value.files));
     }
  }

   async function SetupVoicesFromUrl(url)
  {
    console.log(url);
    const parser = new DOMParser();
    let proxiedUrl;
    if(url.startsWith("https://") || url.startsWith("http://"))
        proxiedUrl = proxiUrl + url;
    else
        proxiedUrl = proxiUrl + "https://" +  url;
    //console.log(proxiedUrl);
    let response = await fetch(proxiedUrl);
    console.log(response.status);
    if(response.status != 200)
    {
            console.log("Not 200");
            fetch(proxiUrl + FullUrl).then(res => res.text()).then(async data => {
            let anotherHtml = parser.parseFromString(data, 'text/html');
            console.log(anotherHtml);
            let anotherLink = anotherHtml.querySelector(".box.full-text.visible iframe");
            let src = anotherLink.getAttribute("src");
            console.log(src);
            LoadPlayer(await getM3U8(src));
        });

        // let anotherUrl = anotherLink.getAttribute("value");
        // console.log(anotherUrl);
        return;
    }
    const doc = parser.parseFromString(await response.text(), 'text/html');
    //console.log(doc);
    const videoUrl = doc.querySelector(".box.full-text.visible iframe").getAttribute("src");
   //console.log(videoUrl.getAttribute("src"));
    LoadPlayer(await getM3U8(videoUrl));
  }

  function SetupFromSearchQuery(results)
  {
    var searchResultsDiv = document.querySelector('.SearchResults');
    searchResultsDiv.innerHTML = "";
    results.forEach((res, index) => {
        let divRes = document.createElement("div");
        divRes.classList.add("result");
        let img = document.createElement("img");
        img.classList.add("title-img");
        img.setAttribute("src", `https://uakino.me/${res.img}`);
        let title = document.createElement("a");
        title.classList.add("title");
        title.innerHTML = res.title;
        divRes.appendChild(img);
        divRes.appendChild(title);
        divRes.onclick = function() { GetVideosForResult(res.url); };
        searchResultsDiv.appendChild(divRes);
    });
  }

  function SetupSeries(files)
  {
    document.querySelector('.SeriesButtons').innerHTML = "";
    files.forEach((file, index) =>
    {
        let button = document.createElement("button");
        button.className = "episode-button"; // Добавляем класс
        button.textContent = `Серія ${index + 1}`; // Текст внутри кнопки

        document.querySelector('.SeriesButtons').appendChild(button);
        button.addEventListener("click", async () => LoadPlayer(await getM3U8(file)));
    });
  }

  function LoadPlayer(src, mp4 = false)
  {
    SetupVideoConnect(src);
    var video = document.getElementById('videoPlayer');
    var videoSrc = src;
    if(mp4)
    {
        var videoSource = video.querySelector('source');
        videoSource.setAttribute("src", src);
        video.setAttribute("src", src);
        video.play();
        return;
    }
      if (Hls.isSupported()) {
          var hls = new Hls();
          hls.loadSource(videoSrc);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, function() {
              video.play();
          });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = videoSrc;
          video.addEventListener('loadedmetadata', function() {
              video.play();
          });
      } else {
          alert("Ваш браузер не поддерживает HLS.");
      }
  }
function GetVideosForResult(url)
{
    console.log(url);
    GetVideosByUrl(url);
    FullUrl = url;
}