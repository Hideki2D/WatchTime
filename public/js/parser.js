const proxiUrl = 'https://watch-time.koyeb.app/:3000/proxy?url=';
const reqUrl = 'https://uakino.me/engine/ajax/playlists.php?news_id=$id&xfield=playlist&time=1736247302';
// const url = proxuUrl + encodeURIComponent("https://uakino.me/engine/ajax/playlists.php?news_id=18489&xfield=playlist&time=1736247302");
// fetch(url)
// .then(res => res.text())
// .then(data => GetSeries(data))
// .catch(err => console.error("Ошибка запроса:", err));
let url;
function Search(str)
{
  url = str;
  //url = document.querySelector('.SearchUrl').value;
  fetch(proxiUrl + url)
  .then(res => res.text())
  .then(data => ProcessigSearchResults(data))
  .catch(err => console.error("Ошибка запроса:", err));
 // var id = url.split('/').pop().split('-')[0];;;
  //console.log(id);
  //var fullUrl = proxuUrl + encodeURIComponent(reqUrl.replace("$id", id));
  // console.log(fullUrl);
  // fetch(fullUrl)
  // .then(res => res.text())
  // .then(data => GetSeries(data))
  // .catch(err => console.error("Ошибка запроса:", err));
}

function GetVideosByUrl(url)
{
 
  // url = document.querySelector('.SearchUrl').value;
  // fetch(proxuUrl + url)
  // .then(res => res.text())
  // .then(data => ProcessigSearchResults(data))
  // .catch(err => console.error("Ошибка запроса:", err));
  var id = url.split('/').pop().split('-')[0];;;
  console.log(id);
  var fullUrl = proxiUrl + encodeURIComponent(reqUrl.replace("$id", id));
  console.log(fullUrl);
  fetch(fullUrl)
  .then(res => res.text())
  .then(data => GetSeries(data))
  .catch(err => console.error("Ошибка запроса:", err));
}

function ProcessigSearchResults(data)
{ 
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/html');
  console.log(doc);
  const content = doc.querySelector("#dle-content");
  console.log(content);
  const titles = content.querySelectorAll(".movie-title");
  const imgs = content.querySelectorAll(".movie-img img");
  imgs.forEach((img, i)=> {
    console.log(img);
  });
  let searchResults = [];
  titles.forEach((title, i)=> {
    console.log(title);
    let result = {};
    result["title"] = title.innerHTML;
    result["url"] = title.getAttribute("href");
    result["img"] = imgs[i].getAttribute("src");
    searchResults.push(result);
  });
  searchResults.forEach((res, i) => {
    console.log(res);
  });

  SetupFromSearchQuery(searchResults);
}

function GetSeries(data)
{
  GetVoicesNames(data);
  GetVideoFillesUrls(data);
}

async function GetVideoFillesUrls(data)
{
    let series = {};
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
   // Объект для хранения собранных данных
    // Ищем все элементы <li> внутри div с классом playlists-items
    let liElements = doc.querySelectorAll('div[class*="playlists-items"] ul');
    console.log(liElements);
    if(liElements.length < 1){
      console.log("Идите Нахуй");
      SetupVoicesFromUrl(url);
      return;
    }
    let liSeries;
    if(liElements.length > 1){
      liSeries = liElements[1].querySelectorAll('li');
      console.log(liElements);
      // Обрабатываем каждый элемент <li>
      // Обрабатываем каждый элемент <li>
      liSeries.forEach(li => {
        // Получаем значения атрибутов data-id, data-voice и data-file
        let dataId = cleanFileUrl(li.getAttribute('data-id'));
        let dataFile = cleanFileUrl(li.getAttribute('data-file'));
        //let dataVoice = cleanFileUrl(decodeUnicode(li.outerHTML.match(/data-voice="([^"]+)"\>/)[1])).replace(/["=]/g, '');;
        let dataVoice =extractVoice(decodeUnicode(li.outerHTML));
        // Очищаем кавычки, если они есть в значениях
        dataFile = dataFile.replace(/\&quot;/g, '');
  
        // Если такого ключа в объекте series ещё нет, создаем его
        if (!series[dataVoice]) {
          series[dataVoice] = {
            id: dataId,
            fullname: dataVoice, // Можно сохранить и data-id для каждого голоса, если нужно
            files: []
          };
        }
  
        // Добавляем значение data-file в массив для соответствующего data-voice
        series[dataVoice].files.push(dataFile);
      });
      // Выводим результат
      console.log(series);
      //SetupVideo(await getM3U8(series['Amanogawa'].files[0]));
      SetupVoices(series);
    }
    else {
      liSeries = liElements[0].querySelectorAll('li');
      liSeriesArray = Array.from(liSeries);
      liSeriesArray.pop();
      liSeriesArray.forEach(li => {
        // Получаем значения атрибутов data-id, data-voice и data-file
        console.log(li);
        let dataId = cleanFileUrl(li.getAttribute('data-id'));
        let dataFile = cleanFileUrl(li.getAttribute('data-file'));
        //let dataVoice = cleanFileUrl(decodeUnicode(li.outerHTML.match(/data-voice="([^"]+)"\>/)[1])).replace(/["=]/g, '');;
        let dataVoice =extractVoice(decodeUnicode(li.outerHTML));
        // Очищаем кавычки, если они есть в значениях
        dataFile = dataFile.replace(/\&quot;/g, '');
  
        // Если такого ключа в объекте series ещё нет, создаем его
        if (!series[dataVoice]) {
          series[dataVoice] = {
            id: dataId,
            fullname: dataVoice, // Можно сохранить и data-id для каждого голоса, если нужно
            files: []
          };
        }
  
        // Добавляем значение data-file в массив для соответствующего data-voice
        series[dataVoice].files.push(dataFile);
      });

      // Выводим результат
      console.log(series);
      //SetupVideo(await getM3U8(series['Amanogawa'].files[0]));
      SetupVoices(series);
    }
}

function extractVoice(str) 
{
  console.log(str);
  const startIndex = str.indexOf('data-voice="') + ('data-voice=').length;
  var newStr = str.substring(startIndex + 3);
  var str2 = newStr.substring(0, newStr.indexOf('\\'));
  const cleanedStr = str2
  .replace(/"/g, '') // Удаляем все кавычки
  .replace(/=/g, '') // Удаляем все знаки равно
  .replace(/\s+/g, ' '); // Удаляем лишние пробелы (заменяем один или более пробелов на один пробел)

  return cleanedStr;
  
}

function GetVoicesNames(page)
{
    const parser = new DOMParser();
    const doc = parser.parseFromString(page, 'text/html');
    console.log(doc);   
    const allRecords = doc.querySelectorAll('[class*="playlists-items"] li');
    console.log(allRecords);
    const firstLevelRecrods = Array.from(allRecords).filter(li => {
        // Если ближайший родительский li найден, значит этот li вложенный
        return !li.parentElement.closest('li');
      });
    const filteredRecrods = Array.from(firstLevelRecrods).filter(li => li.children.length === 0);
    console.log(filteredRecrods);
    const titles = [];
    // Проходим по каждому элементу и извлекаем текстовое содержимое
    filteredRecrods.forEach(item => {
    titles.push(item.textContent.trim());
    });
    var decodedTitles = titles.map(GetPureVoicesString);
    // Выводим массив названий в консоль
    console.log(decodedTitles);
  
}
