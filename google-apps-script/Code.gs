/**
 * English StrandLab — Google Apps Script Web App
 *
 * Worksheets (IDEAS.md):
 *   Input | Vocabulary | Output | Fluency
 *
 * Deploy as Web App → Execute as: Me → Who has access: Anyone
 * Script property: SYNC_TOKEN = your shared secret
 *
 * Actions:
 *   setup    — create tabs + headers
 *   loadAll  — return all rows (GET or POST)
 *   saveLesson — upsert one lesson across 4 tabs
 *   saveAll  — replace/upsert full dataset from the app
 */

var TZ = "Asia/Ho_Chi_Minh";

var INPUT_SHEET = "Input";
var VOCAB_SHEET = "Vocabulary";
var OUTPUT_SHEET = "Output";
var FLUENCY_SHEET = "Fluency";

var INPUT_HEADERS = [
  "lesson_id",
  "lesson_number",
  "lesson_title",
  "content",
  "topic",
  "topic_label",
  "cefr_level",
  "created_at",
  "updated_at",
  "lesson_status",
  "last_reviewed_at",
  "next_review_at",
  "review_count",
];

var VOCAB_HEADERS = [
  "lesson_id",
  "lesson_number",
  "lesson_title",
  "word",
  "meaning",
  "source_sentence",
  "explanation",
  "error_reason",
  "mastery_level",
  "created_at",
  "updated_at",
  "row_id",
];

var OUTPUT_HEADERS = [
  "lesson_id",
  "lesson_number",
  "lesson_title",
  "original_text",
  "error_summary",
  "improved_text",
  "mastery_level",
  "created_at",
  "updated_at",
];

var FLUENCY_HEADERS = [
  "lesson_id",
  "lesson_number",
  "lesson_title",
  "speaking_4min",
  "speaking_3min",
  "speaking_2min",
  "mastery_level",
  "created_at",
  "updated_at",
];

function doGet(e) {
  return handle_(e && e.parameter ? e.parameter : {});
}

function doPost(e) {
  var body = {};
  try {
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return json_({ ok: false, error: "JSON body không hợp lệ" });
  }
  var params = Object.assign({}, (e && e.parameter) || {}, body);
  return handle_(params);
}

function handle_(params) {
  try {
    assertToken_(params.token);
    var action = String(params.action || "loadAll");

    if (action === "setup") {
      setupSheets_();
      return json_({
        ok: true,
        spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      });
    }

    if (action === "loadAll" || action === "load") {
      ensureSheets_();
      return json_({
        ok: true,
        inputs: readObjects_(INPUT_SHEET, INPUT_HEADERS),
        vocabulary: readObjects_(VOCAB_SHEET, VOCAB_HEADERS),
        outputs: readObjects_(OUTPUT_SHEET, OUTPUT_HEADERS),
        fluency: readObjects_(FLUENCY_SHEET, FLUENCY_HEADERS),
        updatedAt: Date.now(),
        spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      });
    }

    if (action === "saveLesson") {
      ensureSheets_();
      if (params.input) upsertById_(INPUT_SHEET, INPUT_HEADERS, params.input, "lesson_id");
      if (params.output) upsertById_(OUTPUT_SHEET, OUTPUT_HEADERS, params.output, "lesson_id");
      if (params.fluency) upsertById_(FLUENCY_SHEET, FLUENCY_HEADERS, params.fluency, "lesson_id");
      if (params.vocabulary) {
        replaceLessonVocab_(params.input && params.input.lesson_id, params.vocabulary);
      }
      return json_({
        ok: true,
        spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      });
    }

    if (action === "saveAll") {
      ensureSheets_();
      replaceAll_(INPUT_SHEET, INPUT_HEADERS, params.inputs || []);
      replaceAll_(VOCAB_SHEET, VOCAB_HEADERS, params.vocabulary || []);
      replaceAll_(OUTPUT_SHEET, OUTPUT_HEADERS, params.outputs || []);
      replaceAll_(FLUENCY_SHEET, FLUENCY_HEADERS, params.fluency || []);
      return json_({
        ok: true,
        spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      });
    }

    return json_({ ok: false, error: "action không hỗ trợ: " + action });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function assertToken_(token) {
  var expected = PropertiesService.getScriptProperties().getProperty("SYNC_TOKEN");
  if (!expected) throw new Error("Chưa set Script property SYNC_TOKEN");
  if (!token || token !== expected) throw new Error("Token không hợp lệ");
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("StrandLab")
    .addItem("Setup tabs (Input / Vocabulary / Output / Fluency)", "setupSheets_")
    .addToUi();
}

function setupSheets_() {
  ensureSheet_(INPUT_SHEET, INPUT_HEADERS);
  ensureSheet_(VOCAB_SHEET, VOCAB_HEADERS);
  ensureSheet_(OUTPUT_SHEET, OUTPUT_HEADERS);
  ensureSheet_(FLUENCY_SHEET, FLUENCY_HEADERS);
}

function ensureSheets_() {
  setupSheets_();
}

function ensureSheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  var range = sh.getRange(1, 1, 1, headers.length);
  var existing = range.getValues()[0];
  var needs = false;
  for (var i = 0; i < headers.length; i++) {
    if (String(existing[i] || "") !== headers[i]) {
      needs = true;
      break;
    }
  }
  if (needs) range.setValues([headers]);
  sh.setFrozenRows(1);
  return sh;
}

function readObjects_(name, headers) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) return [];
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var out = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (!row.join("")) continue;
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c];
    }
    out.push(obj);
  }
  return out;
}

function upsertById_(name, headers, obj, idKey) {
  var sh = ensureSheet_(name, headers);
  var id = String(obj[idKey] || "");
  if (!id) throw new Error("Thiếu " + idKey);
  var values = sh.getDataRange().getValues();
  var idCol = headers.indexOf(idKey);
  var rowIndex = -1;
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) === id) {
      rowIndex = r + 1;
      break;
    }
  }
  var line = headers.map(function (h) {
    return obj[h] != null ? obj[h] : "";
  });
  if (rowIndex > 0) {
    sh.getRange(rowIndex, 1, 1, headers.length).setValues([line]);
  } else {
    sh.appendRow(line);
  }
}

function replaceLessonVocab_(lessonId, rows) {
  if (!lessonId) return;
  var sh = ensureSheet_(VOCAB_SHEET, VOCAB_HEADERS);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) {
    (rows || []).forEach(function (obj) {
      sh.appendRow(
        VOCAB_HEADERS.map(function (h) {
          return obj[h] != null ? obj[h] : "";
        })
      );
    });
    return;
  }
  var idCol = VOCAB_HEADERS.indexOf("lesson_id");
  for (var r = values.length - 1; r >= 1; r--) {
    if (String(values[r][idCol]) === String(lessonId)) {
      sh.deleteRow(r + 1);
    }
  }
  (rows || []).forEach(function (obj) {
    sh.appendRow(
      VOCAB_HEADERS.map(function (h) {
        return obj[h] != null ? obj[h] : "";
      })
    );
  });
}

function replaceAll_(name, headers, rows) {
  var sh = ensureSheet_(name, headers);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, headers.length).clearContent();
  if (!rows || !rows.length) return;
  var matrix = rows.map(function (obj) {
    return headers.map(function (h) {
      return obj[h] != null ? obj[h] : "";
    });
  });
  sh.getRange(2, 1, matrix.length, headers.length).setValues(matrix);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
