/**
 * mock_gas.js (v3)
 * Môi trường giả lập đầy đủ Google Apps Script (SpreadsheetApp, MailApp, LockService, CacheService,
 * PropertiesService, Utilities, DriveApp, ContentService, ScriptApp, Session)
 * để chạy test trực tiếp các file .gs thật bằng JavaScriptCore (jsc).
 */

(function (global) {
  'use strict';

  function createMockSheet(name) {
    var grid = [];
    var formats = {};
    var protections = [];
    var frozenRows = 0;
    var tabColor = null;
    var condRules = [];

    function ensureSize(maxR, maxC) {
      while (grid.length < maxR) grid.push([]);
      for (var r = 0; r < maxR; r++) {
        while (grid[r].length < maxC) grid[r].push('');
      }
    }

    var sheet = {
      _name: name,
      _grid: grid,
      _formats: formats,
      _tabColor: null,
      _condRules: condRules,
      getName: function () { return name; },
      clear: function () { grid.length = 0; },
      setTabColor: function (hex) { tabColor = hex; this._tabColor = hex; },
      getTabColor: function () { return tabColor; },
      setConditionalFormatRules: function (rules) { condRules = rules || []; this._condRules = condRules; },
      getLastRow: function () {
        for (var r = grid.length - 1; r >= 0; r--) {
          for (var c = 0; c < grid[r].length; c++) {
            if (grid[r][c] !== '' && grid[r][c] !== null && grid[r][c] !== undefined) {
              return r + 1;
            }
          }
        }
        return 0;
      },
      getLastColumn: function () {
        var max = 0;
        for (var r = 0; r < grid.length; r++) {
          for (var c = grid[r].length - 1; c >= 0; c--) {
            if (grid[r][c] !== '' && grid[r][c] !== null && grid[r][c] !== undefined) {
              if (c + 1 > max) max = c + 1;
              break;
            }
          }
        }
        return max;
      },
      getMaxRows: function () { return Math.max(grid.length, 200); },
      setFrozenRows: function (n) { frozenRows = n; },
      getFrozenRows: function () { return frozenRows; },
      getProtections: function () { return protections; },
      protect: function () {
        var p = {
          _desc: '',
          _warningOnly: false,
          setDescription: function (d) { this._desc = d; return this; },
          getDescription: function () { return this._desc; },
          setWarningOnly: function (b) { this._warningOnly = b; return this; }
        };
        protections.push(p);
        return p;
      },
      getRange: function (row, col, numRows, numCols) {
        var nr = numRows || 1;
        var nc = numCols || 1;
        return {
          getSheet: function () { return sheet; },
          getRow: function () { return row; },
          getValues: function () {
            ensureSize(row + nr - 1, col + nc - 1);
            var out = [];
            for (var r = 0; r < nr; r++) {
              var rowArr = [];
              for (var c = 0; c < nc; c++) {
                rowArr.push(grid[row - 1 + r][col - 1 + c]);
              }
              out.push(rowArr);
            }
            return out;
          },
          setValues: function (vals) {
            ensureSize(row + nr - 1, col + nc - 1);
            for (var r = 0; r < nr; r++) {
              for (var c = 0; c < nc; c++) {
                grid[row - 1 + r][col - 1 + c] = vals[r][c];
              }
            }
            return this;
          },
          setFormulas: function (vals) { return this.setValues(vals); },
          setNumberFormat: function (fmt) {
            for (var r = 0; r < nr; r++) {
              for (var c = 0; c < nc; c++) {
                formats[(row + r) + ':' + (col + c)] = fmt;
              }
            }
            return this;
          },
          setFontWeight: function () { return this; },
          setBackground: function () { return this; },
          setFontColor: function () { return this; },
          setDataValidation: function () { return this; }
        };
      }
    };
    return sheet;
  }

  function resetGasMock() {
    var sheets = {};
    var sheetOrder = [];
    var activeSheet = null;
    var cacheStore = {};
    var propsStore = {};
    var driveFolders = {};
    var triggers = [];
    var sentEmails = [];
    var uuidCounter = 0;

    function createSS() {
      return {
        getId: function () { return 'SS_MOCK_001'; },
        getName: function () { return 'CSDL Phỏng vấn THCN'; },
        getUrl: function () { return 'https://docs.google.com/spreadsheets/d/SS_MOCK_001/edit'; },
        getSheetByName: function (n) { return sheets[n] || null; },
        getSheets: function () { return sheetOrder.map(function (n) { return sheets[n]; }); },
        insertSheet: function (n) {
          var s = createMockSheet(n);
          sheets[n] = s;
          sheetOrder.push(n);
          return s;
        },
        deleteSheet: function (s) {
          var n = s.getName();
          delete sheets[n];
          sheetOrder = sheetOrder.filter(function (x) { return x !== n; });
        },
        setActiveSheet: function (s) { activeSheet = s; },
        moveActiveSheet: function (pos1Based) {
          if (!activeSheet) return;
          var name = activeSheet.getName();
          sheetOrder = sheetOrder.filter(function (x) { return x !== name; });
          var idx = Math.max(0, Math.min(pos1Based - 1, sheetOrder.length));
          sheetOrder.splice(idx, 0, name);
        },
        toast: function () {}
      };
    }

    var ss = createSS();
    ss.insertSheet('Sheet1');

    global.SpreadsheetApp = {
      ProtectionType: { SHEET: 'SHEET' },
      getActiveSpreadsheet: function () { return ss; },
      flush: function () {},
      newDataValidation: function () {
        return { requireCheckbox: function () { return { build: function () { return {}; } }; } };
      },
      newConditionalFormatRule: function () {
        var r = {
          whenTextContains: function () { return r; },
          setBackground: function () { return r; },
          setFontColor: function () { return r; },
          setRanges: function () { return r; },
          build: function () { return { rule: true }; }
        };
        return r;
      },
      getUi: function () {
        return {
          Button: { OK: 'OK', CANCEL: 'CANCEL' },
          ButtonSet: { OK: 'OK', OK_CANCEL: 'OK_CANCEL' },
          createMenu: function () {
            var m = {
              addItem: function () { return m; },
              addSeparator: function () { return m; },
              addToUi: function () {}
            };
            return m;
          },
          alert: function () {},
          showModalDialog: function () {}
        };
      }
    };

    global.MailApp = {
      sendEmail: function (to, subject, body) {
        sentEmails.push({ to: to, subject: subject, body: body });
      }
    };

    global.LockService = {
      getScriptLock: function () {
        return {
          tryLock: function () { return true; },
          waitLock: function () {},
          releaseLock: function () {}
        };
      }
    };

    global.CacheService = {
      getScriptCache: function () {
        return {
          get: function (k) { return Object.prototype.hasOwnProperty.call(cacheStore, k) ? cacheStore[k] : null; },
          put: function (k, v) { cacheStore[k] = String(v); },
          remove: function (k) { delete cacheStore[k]; }
        };
      }
    };

    global.PropertiesService = {
      getScriptProperties: function () {
        return {
          getProperty: function (k) { return Object.prototype.hasOwnProperty.call(propsStore, k) ? propsStore[k] : null; },
          setProperty: function (k, v) { propsStore[k] = String(v); }
        };
      }
    };

    global.ContentService = {
      MimeType: { JSON: 'application/json' },
      createTextOutput: function (txt) {
        return {
          _text: txt,
          _mime: 'text/plain',
          setMimeType: function (m) { this._mime = m; return this; },
          getContent: function () { return this._text; }
        };
      }
    };

    global.Session = {
      getScriptTimeZone: function () { return 'Asia/Ho_Chi_Minh'; },
      getEffectiveUser: function () {
        return { getEmail: function () { return 'daothuan90@gmail.com'; } };
      }
    };

    global.Utilities = {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      getUuid: function () {
        uuidCounter++;
        return 'uuid-' + uuidCounter + '-' + Math.floor(Math.random() * 1e9).toString(36);
      },
      computeDigest: function (_alg, str) {
        var bytes = [];
        var h1 = 0x811c9dc5;
        for (var k = 0; k < 32; k++) {
          var acc = h1 ^ (k * 31);
          for (var i = 0; i < str.length; i++) {
            acc = ((acc ^ str.charCodeAt(i)) * 16777619) >>> 0;
          }
          bytes.push((acc >>> ((k % 4) * 8)) & 0xff);
          h1 = (acc + k * 7919) >>> 0;
        }
        return bytes;
      },
      base64EncodeWebSafe: function (bytes) {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        var out = '';
        for (var i = 0; i < bytes.length; i += 3) {
          var b0 = bytes[i] & 0xff;
          var b1 = (i + 1 < bytes.length) ? (bytes[i + 1] & 0xff) : 0;
          var b2 = (i + 2 < bytes.length) ? (bytes[i + 2] & 0xff) : 0;
          out += chars[b0 >> 2];
          out += chars[((b0 & 3) << 4) | (b1 >> 4)];
          out += chars[((b1 & 15) << 2) | (b2 >> 6)];
          out += chars[b2 & 63];
        }
        return out;
      },
      formatDate: function (d) {
        return d.toISOString().replace(/[:.]/g, '').slice(0, 15);
      }
    };

    var fileSeq = 0;
    function makeFolder(name) {
      var id = 'FOLDER_' + name;
      var files = [];
      var f = {
        _files: files,
        getId: function () { return id; },
        getName: function () { return name; },
        getFiles: function () {
          var active = files.filter(function (x) { return !x._trashed; });
          var idx = 0;
          return {
            hasNext: function () { return idx < active.length; },
            next: function () { return active[idx++]; }
          };
        }
      };
      driveFolders[id] = f;
      return f;
    }

    global.DriveApp = {
      getFolderById: function (id) {
        if (!driveFolders[id]) throw new Error('Not found');
        return driveFolders[id];
      },
      getFoldersByName: function (name) {
        var found = Object.keys(driveFolders)
          .map(function (k) { return driveFolders[k]; })
          .filter(function (f) { return f.getName() === name; });
        var idx = 0;
        return {
          hasNext: function () { return idx < found.length; },
          next: function () { return found[idx++]; }
        };
      },
      createFolder: function (name) { return makeFolder(name); },
      getFileById: function () {
        return {
          makeCopy: function (copyName, folder) {
            fileSeq++;
            var createdAt = new Date(Date.now() + fileSeq * 1000);
            var copyObj = {
              _trashed: false,
              getId: function () { return 'FILE_' + fileSeq; },
              getName: function () { return copyName; },
              getDateCreated: function () { return createdAt; },
              setTrashed: function (b) { this._trashed = b; }
            };
            folder._files.push(copyObj);
            return copyObj;
          }
        };
      }
    };

    global.ScriptApp = {
      WeekDay: { SUNDAY: 'SUNDAY' },
      getProjectTriggers: function () { return triggers.slice(); },
      deleteTrigger: function (t) { triggers = triggers.filter(function (x) { return x !== t; }); },
      newTrigger: function (fn) {
        return {
          timeBased: function () {
            return {
              onWeekDay: function () {
                return {
                  atHour: function () {
                    return {
                      create: function () {
                        var t = { getHandlerFunction: function () { return fn; } };
                        triggers.push(t);
                        return t;
                      }
                    };
                  }
                };
              }
            };
          }
        };
      }
    };

    return {
      ss: ss,
      cacheStore: cacheStore,
      propsStore: propsStore,
      driveFolders: driveFolders,
      sentEmails: sentEmails
    };
  }

  global.resetGasMock = resetGasMock;
})(typeof globalThis !== 'undefined' ? globalThis : this);
