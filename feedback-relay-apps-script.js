/**
 * AI Surf Report Builder feedback relay.
 *
 * Deploy as a Google Apps Script Web App.
 * Store the destination email in Script Properties as FEEDBACK_TO.
 * The destination email never appears in the public website source.
 */

var MIN_MESSAGE_LENGTH = 5;
var MAX_MESSAGE_LENGTH = 3000;
var MIN_FORM_AGE_MS = 1500;
var DAILY_LIMIT = 100;

function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var to = props.getProperty('FEEDBACK_TO');

    if (!to) {
      return jsonResponse({ ok: false, error: 'FEEDBACK_TO is not configured' }, 500);
    }

    var body = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var payload = JSON.parse(body);
    var message = String(payload.message || '').trim();
    var replyTo = String(payload.reply_to || '').trim();
    var source = String(payload.source || 'AI Surf Report Builder website').trim();
    var pageUrl = String(payload.page_url || '').trim();
    var pageOrigin = String(payload.page_origin || '').trim();
    var createdAt = String(payload.created_at || new Date().toISOString()).trim();
    var honeypot = String(payload.website || '').trim();
    var formAgeMs = Number(payload.form_age_ms || 0);

    if (honeypot) {
      return jsonResponse({ ok: true, ignored: true });
    }

    if (formAgeMs && formAgeMs < MIN_FORM_AGE_MS) {
      return jsonResponse({ ok: true, ignored: true });
    }

    if (message.length < MIN_MESSAGE_LENGTH) {
      return jsonResponse({ ok: false, error: 'Message too short' }, 400);
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return jsonResponse({ ok: false, error: 'Message too long' }, 400);
    }

    if (!checkDailyLimit_()) {
      return jsonResponse({ ok: false, error: 'Daily feedback limit reached' }, 429);
    }

    if (isDuplicate_(message, replyTo)) {
      return jsonResponse({ ok: true, duplicate: true });
    }

    var subject = 'AI Surf Report Builder feedback';
    var text =
      'Source: ' + source + '\n' +
      'Created: ' + createdAt + '\n' +
      'Page: ' + pageUrl + '\n' +
      'Origin: ' + pageOrigin + '\n' +
      'Reply to: ' + (replyTo || 'not provided') + '\n\n' +
      message;

    var options = {
      name: 'AI Surf Report Builder Feedback',
    };

    if (replyTo && isValidEmail_(replyTo)) {
      options.replyTo = replyTo;
    }

    MailApp.sendEmail(to, subject, text, options);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
}

function doGet() {
  return jsonResponse({ ok: true, service: 'AI Surf Report Builder feedback relay' });
}

function checkDailyLimit_() {
  var props = PropertiesService.getScriptProperties();
  var dateKey = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var key = 'FEEDBACK_COUNT_' + dateKey;
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    var current = Number(props.getProperty(key) || '0');
    if (current >= DAILY_LIMIT) {
      return false;
    }

    props.setProperty(key, String(current + 1));
    return true;
  } finally {
    lock.releaseLock();
  }
}

function isDuplicate_(message, replyTo) {
  var cache = CacheService.getScriptCache();
  var key = 'feedback_' + sha256Hex_(message + '|' + replyTo);
  if (cache.get(key)) {
    return true;
  }

  cache.put(key, '1', 3600);
  return false;
}

function sha256Hex_(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value);
  return bytes.map(function (byte) {
    var normalized = byte < 0 ? byte + 256 : byte;
    return ('0' + normalized.toString(16)).slice(-2);
  }).join('');
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function jsonResponse(data, statusCode) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);

  return output;
}
