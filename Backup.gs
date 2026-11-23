/**
 * Backup.gs
 * Tự động sao lưu toàn bộ file Google Sheets mỗi Chủ nhật vào thư mục Backup_THCN trên Drive,
 * giữ 8 bản sao lưu gần nhất. Chi phí: 0đ.
 */

var BACKUP_FOLDER_NAME = 'Backup_THCN';
var BACKUP_KEEP_COUNT = 8;

function runWeeklyBackup() {
  var ss = getActiveSpreadsheet_();
  var props = PropertiesService.getScriptProperties();
  var folder = getOrCreateBackupFolder_(props);

  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd_HHmm');
  var backupName = ss.getName() + '_BACKUP_' + stamp;
  var sourceFile = DriveApp.getFileById(ss.getId());
  var copied = sourceFile.makeCopy(backupName, folder);

  pruneOldBackups_(folder, BACKUP_KEEP_COUNT);

  return {
    fileId: copied.getId(),
    fileName: backupName,
    folderName: folder.getName()
  };
}

function getOrCreateBackupFolder_(props) {
  var folderId = props.getProperty(PROP_KEYS.BACKUP_FOLDER_ID);
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      // Thư mục đã bị xóa, tạo mới bên dưới
    }
  }
  var iter = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME);
  var folder = iter.hasNext() ? iter.next() : DriveApp.createFolder(BACKUP_FOLDER_NAME);
  props.setProperty(PROP_KEYS.BACKUP_FOLDER_ID, folder.getId());
  return folder;
}

function pruneOldBackups_(folder, keepCount) {
  var files = [];
  var iter = folder.getFiles();
  while (iter.hasNext()) {
    var f = iter.next();
    files.push({ file: f, created: f.getDateCreated().getTime() });
  }
  files.sort(function (a, b) { return b.created - a.created; });
  for (var i = keepCount; i < files.length; i++) {
    files[i].file.setTrashed(true);
  }
}

function installWeeklyBackupTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'runWeeklyBackup') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('runWeeklyBackup')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(2)
    .create();
}
