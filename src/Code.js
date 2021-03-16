// [環境変数]
// 議事録を作成するフォルダのID "FOLDERID"
// 議事録のフォーマットファイルのID "FILEID"
// slack Incoming WebHooksのURL "POSTURL"
​
var FOLDERID = PropertiesService.getScriptProperties().getProperty("FOLDERID");
var FILEID = PropertiesService.getScriptProperties().getProperty("FILEID");
var POSTURL = PropertiesService.getScriptProperties().getProperty("POSTURL");
​
​function doGet(e) {
  return HtmlService.createHtmlOutputFromFile("Index");
}
​
function doPost(e) {  
  var name = e.parameter.name;
  var mtgname = handler(name);
  var message = "【準備中】完了ページ\n" + "作成した議事録:" + mtgname;

  return ContentService.createTextOutput(message);  
}
​
​function handler(name) {
  // 議事録のフォーマットと作業フォルダを取得する
  var topFolderPath = DriveApp.getFolderById(FOLDERID);
  var formatFilePath = DriveApp.getFileById(FILEID);

  // 現在時刻からファイル名を生成
  date = nowDate();
  var yyyymmdd = date.year + date.month + date.day;
  var mtgname = yyyymmdd + '_' + name;

  // 「yyyy年mm月」フォルダを確認
  var monthFolder = prepareMonthFolder(topFolderPath, date.year, date.month);

  // 「yyyyddmm_(会議名)」 フォルダを新規作成する
  var dayFolder = monthFolder.createFolder(mtgname);
  var dayFolderUrl = dayFolder.getUrl();

  // 議事録フォーマットをコピーして、適切なフォルダに議事録を作成する
  var newFile = formatFilePath.makeCopy(mtgname, dayFolder);
  var newFileUrl = newFile.getUrl();

  // slackに投稿
  post2slack(mtgname, newFileUrl, dayFolderUrl);

  return mtgname;
}
​​
function nowDate() {
  var today = new Date();
  var year = today.getFullYear();
  var month = '' + (today.getMonth() + 1);
  var day = '' + today.getDate();

  if (month.length < 2)
    month = '0' + month;
  if (day.length < 2)
    day = '0' + day;

  return {
    year:year,
    month:month,
    day:day,
  };
}
​
function prepareMonthFolder(path, year, month) {
  var yyyymm = year + '年' + month + '月';
  var folders = DriveApp.getFolders();
  var monthFolderExist = false;
  var monthFolder;

  // 「yyyy年mm月」のフォルダが存在しない場合は新規作成
  while (folders.hasNext()) {
    var folder = folders.next();
    if (folder.getName() == yyyymm) {
      monthFolderExist = true;
      monthFolder = folder;
    }
  }
  if (!monthFolderExist) {
    monthFolder = path.createFolder(yyyymm);
  }

  return monthFolder
}
​
function post2slack(name, fileUrl, folderUrl) {
  // slackへの投稿文
  var message = '議事録を準備しました\n\n' + '会議名:' + name + '\n' + '議事:' + fileUrl + "\n" + "フォルダ:" + folderUrl;

  var jsonData = {
    'text':message
  };
  var payload = JSON.stringify(jsonData);
  var options = {
    'method':'post',
    'contentType':'application/json',
    'payload':payload
  };

  UrlFetchApp.fetch(POSTURL, options);
}
