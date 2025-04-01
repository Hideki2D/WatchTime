function GetPureVoicesString(str)
{
    var decodedString = decodeUnicode(str);
    var splitedStrings = decodedString.split("<");
    return splitedStrings[0];
}

function decodeUnicode(str) {
    str = decodeHtmlEntities(str);
    return decodeURIComponent(str.replace(/\\u[\dA-F]{4}/gi, match => {
      return String.fromCharCode(parseInt(match.replace('\\u', ''), 16));
    }));
  }

  function decodeHtmlEntities(str) {
    let textarea = document.createElement("textarea");
    textarea.innerHTML = str;
    return textarea.value;
}


function cleanFileUrl(url) {
  // Убираем экранированные символы и слэш в начале
  return url.replace(/\\\//g, '/').replace(/\\"/g, '').replace(/^\/\//, '');
}