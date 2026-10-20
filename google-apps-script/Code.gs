/**
 * StrandLab Footnote — Google Apps Script data source.
 * Sheets: Input, Vocabulary, Output, Fluency, ReviewLog.
 * Set Script property SYNC_TOKEN before deploying this Web App.
 *
 * reset          clears and recreates the five Footnote tables
 * loadAll        reads all rows
 * saveInput      upserts Input by entry_id
 * saveVocabulary upserts Vocabulary by vocab_id
 * saveOutput     upserts Output by output_id
 * saveFluency    upserts Fluency by fluency_id
 * appendReview   appends ReviewLog and updates Input review dates
 */

var TZ = "Asia/Bangkok";
var TABLES = {
  Input: ["entry_id", "created_at", "title", "description", "content_mode", "content_markdown", "chat_url", "learning_status", "last_review_at", "next_review_at"],
  Vocabulary: ["vocab_id", "entry_id", "word", "type", "meaning", "familiarity_level", "error_reason", "last_tested_at", "next_review_at", "updated_at"],
  Output: ["output_id", "entry_id", "content", "familiarity_level", "updated_at"],
  Fluency: ["fluency_id", "entry_id", "content", "familiarity_level", "updated_at"],
  ReviewLog: ["review_id", "entry_id", "started_at", "completed_at", "review_scope", "results_summary", "review_outcome", "next_review_at", "saved_at"]
};

function doGet(e) { return handle_(e && e.parameter ? e.parameter : {}); }

function doPost(e) {
  var body = {};
  try { body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {}; }
  catch (err) { return json_({ ok: false, error: "VALIDATION_ERROR: invalid JSON body" }); }
  return handle_(Object.assign({}, (e && e.parameter) || {}, body));
}

function handle_(params) {
  try {
    assertToken_(params.token);
    var action = String(params.action || "loadAll");
    if (action === "reset") return reset_();
    if (action === "setup") return setup_();
    if (action === "loadAll" || action === "load") return loadAll_();
    if (action === "saveInput") return saveRow_("Input", params.entry, "entry_id");
    if (action === "saveVocabulary") return saveRow_("Vocabulary", params.vocabulary, "vocab_id");
    if (action === "saveOutput") return saveRow_("Output", params.output, "output_id");
    if (action === "saveFluency") return saveRow_("Fluency", params.fluency, "fluency_id");
    if (action === "appendReview") return appendReview_(params.review);
    if (action === "updateVocabularyReviewState") return saveRow_("Vocabulary", params.vocabulary, "vocab_id");
    throw new Error("VALIDATION_ERROR: unsupported action " + action);
  } catch (err) { return json_({ ok: false, error: String(err.message || err) }); }
}

function assertToken_(token) {
  var expected = PropertiesService.getScriptProperties().getProperty("SYNC_TOKEN");
  if (!expected) throw new Error("DATA_SOURCE_ERROR: Script property SYNC_TOKEN is missing");
  if (!token || String(token) !== String(expected)) throw new Error("UNAUTHORIZED: invalid token");
}

function setup_() { ensureAllTables_(); return json_({ ok: true, tables: Object.keys(TABLES), spreadsheetUrl: spreadsheet_().getUrl() }); }

function reset_() {
  var ss = spreadsheet_();
  // Clear known tables in place so reset also works when the spreadsheet has
  // only one sheet. Unknown/user-owned sheets are left untouched.
  Object.keys(TABLES).forEach(function(name) {
    var old = ss.getSheetByName(name);
    if (old) old.clear();
  });
  ensureAllTables_();
  return json_({ ok: true, reset: true, tables: Object.keys(TABLES), spreadsheetUrl: ss.getUrl() });
}

function loadAll_() {
  ensureAllTables_();
  return json_({ ok: true, inputs: readObjects_("Input"), vocabulary: readObjects_("Vocabulary"), outputs: readObjects_("Output"), fluency: readObjects_("Fluency"), reviews: readObjects_("ReviewLog"), updatedAt: Date.now(), spreadsheetUrl: spreadsheet_().getUrl() });
}

function appendReview_(review) {
  requireObject_(review, "review");
  var entryId = String(review.entry_id || "");
  if (!entryId) throw new Error("VALIDATION_ERROR: review.entry_id is required");
  ensureAllTables_();
  var input = findRow_("Input", "entry_id", entryId);
  if (!input) throw new Error("NOT_FOUND: entry_id " + entryId);
  appendRow_("ReviewLog", review);
  var patch = { entry_id: entryId };
  if (review.completed_at != null) patch.last_review_at = review.completed_at;
  if (review.next_review_at != null) patch.next_review_at = review.next_review_at;
  updateById_("Input", patch, "entry_id");
  return json_({ ok: true, review: review, entry_review_state: { last_review_at: patch.last_review_at || input.last_review_at || null, next_review_at: patch.next_review_at || input.next_review_at || null } });
}

function saveRow_(name, row, idKey) {
  requireObject_(row, name.toLowerCase());
  var id = String(row[idKey] || "");
  if (!id) throw new Error("VALIDATION_ERROR: " + name + "." + idKey + " is required");
  ensureAllTables_();
  upsertById_(name, row, idKey);
  return json_({ ok: true, table: name, record: row });
}

function requireObject_(value, label) { if (!value || Object.prototype.toString.call(value) !== "[object Object]") throw new Error("VALIDATION_ERROR: " + label + " must be an object"); }
function spreadsheet_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function ensureAllTables_() { Object.keys(TABLES).forEach(function(name) { ensureTable_(name, TABLES[name]); }); }

function ensureTable_(name, headers) {
  var ss = spreadsheet_();
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return sheet;
}

function readObjects_(name) {
  var sheet = spreadsheet_().getSheetByName(name), headers = TABLES[name];
  if (!sheet || sheet.getLastRow() < 2) return [];
  var values = sheet.getRange(1, 1, sheet.getLastRow(), headers.length).getValues();
  return values.slice(1).filter(function(row) { return row.join("") !== ""; }).map(function(row) {
    var item = {}; headers.forEach(function(header, index) { item[header] = row[index] === "" ? null : row[index]; }); return item;
  });
}

function findRow_(name, idKey, id) { return readObjects_(name).find(function(row) { return String(row[idKey]) === String(id); }) || null; }

function upsertById_(name, row, idKey) {
  var sheet = ensureTable_(name, TABLES[name]), headers = TABLES[name];
  var values = sheet.getLastRow() ? sheet.getRange(1, 1, sheet.getLastRow(), headers.length).getValues() : [];
  var idColumn = headers.indexOf(idKey), existingRow = -1;
  for (var index = 1; index < values.length; index++) { if (String(values[index][idColumn]) === String(row[idKey])) { existingRow = index + 1; break; } }
  var line = headers.map(function(header) { return row[header] == null ? "" : row[header]; });
  if (existingRow > 0) sheet.getRange(existingRow, 1, 1, headers.length).setValues([line]); else sheet.appendRow(line);
}

function updateById_(name, patch, idKey) { var current = findRow_(name, idKey, patch[idKey]); if (!current) throw new Error("NOT_FOUND: " + patch[idKey]); upsertById_(name, Object.assign({}, current, patch), idKey); }
function appendRow_(name, row) { ensureTable_(name, TABLES[name]).appendRow(TABLES[name].map(function(header) { return row[header] == null ? "" : row[header]; })); }

function onOpen() {
  SpreadsheetApp.getUi().createMenu("StrandLab Footnote").addItem("Reset Footnote tables", "reset_").addItem("Ensure Footnote tables", "setup_").addToUi();
}

function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
