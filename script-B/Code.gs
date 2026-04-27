/**
 * Surf Report Builder — Personal Storage Web App
 * ------------------------------------------------
 * Deploy this as a Web App in YOUR Google account, attached to YOUR Google Sheet.
 * Your AI tool will POST report data here using the URL you get after deploying.
 *
 * SETUP (one time):
 *   1. Open your Google Sheet.
 *   2. Extensions → Apps Script.
 *   3. Replace any starter code with this entire file.
 *   4. Change SHARED_SECRET below to your own random string. Keep it private.
 *   5. Save (disk icon).
 *   6. Deploy → New deployment → Type: Web app.
 *      - Description: anything (e.g. "Surf Report Builder v1")
 *      - Execute as: Me
 *      - Who has access: Anyone
 *        (This is required so your AI can POST. The shared secret is what
 *         actually protects your data — anyone without it gets rejected.)
 *   7. Authorize when prompted.
 *   8. Copy the Web App URL it shows you.
 *   9. Paste BOTH the URL and SHARED_SECRET into your generated report prompts
 *      where they ask for them.
 *
 * REDEPLOYING AFTER CHANGES:
 *   Apps Script Web Apps are versioned. Edits to this code do NOT take effect
 *   until you Deploy → Manage deployments → pencil icon → New version → Deploy.
 *
 * IF YOU SUSPECT YOUR SECRET HAS LEAKED:
 *   1. Change SHARED_SECRET to a new random string.
 *   2. Save and redeploy (Deploy → Manage deployments → New version).
 *   3. Update the secret in every prompt that uses it.
 *   The Web App URL itself doesn't need to change — just the secret.
 *
 * SAFETY:
 *   - Your shared secret is the only thing protecting your sheet. Treat it like
 *     a password.
 *   - This script never reads from your sheet, only appends. It cannot delete
 *     or overwrite existing rows.
 *   - It does not send any data anywhere except your own sheet.
 */

const SHARED_SECRET = 'jbc*nxp1xgu3cgv2JYR';

// Schema: each record_type maps to a tab name and an ordered column list.
// Headers are written automatically the first time a tab receives data.
//
// Adding a column later: just add it here, then redeploy. Old rows will have
// blank values in the new column — that's fine, no migration needed.
//
// All tabs use `session_id` as a soft join key when applicable. It's just a
// timestamp-based string the AI generates per report (e.g. "2026-04-25T0630").
// You can sort or filter by it in the spreadsheet to group related rows.
const SCHEMA = {
  session_report: {
    tab: 'sessions',
    columns: [
      'session_id', 'session_date', 'target_session_time',
      'report_generated_at', 'report_type', 'break_name',
      'report_summary', 'predicted_size', 'predicted_shape',
      'predicted_wind', 'predicted_tide', 'confidence',
      'main_swell_direction', 'main_swell_period',
      'local_buoy_snapshot', 'missing_or_offline_sources',
      'created_at',
    ],
  },
  long_range_report: {
    tab: 'long_range_reports',
    columns: [
      'report_id', 'report_generated_at', 'horizon_days',
      'break_name', 'executive_radar', 'confidence_summary',
      'data_gaps', 'created_at',
    ],
  },
  long_range_event: {
    tab: 'long_range_events',
    columns: [
      'report_id', 'event_class', 'source_region',
      'first_arrival_window', 'peak_window', 'direction_window',
      'period_estimate', 'size_category', 'confidence',
      'reaches_break', 'local_filtering_notes', 'created_at',
    ],
  },
  buoy_observation: {
    tab: 'buoy_observations',
    columns: [
      'session_id', 'station_id', 'station_role',
      'observed_at', 'wave_height_ft', 'dominant_period_s',
      'mean_direction_deg', 'wind_speed_kt', 'wind_direction_deg',
      'water_temp_f', 'source_url', 'freshness_class', 'created_at',
    ],
  },
  tide_observation: {
    tab: 'tide_observations',
    columns: [
      'session_id', 'station_id', 'observed_at',
      'tide_height_ft', 'tide_state', 'next_high_at', 'next_low_at',
      'source_url', 'freshness_class', 'created_at',
    ],
  },
  wind_observation: {
    tab: 'wind_observations',
    columns: [
      'session_id', 'station_id', 'observed_at',
      'wind_speed_kt', 'wind_gust_kt', 'wind_direction_deg',
      'source_url', 'freshness_class', 'created_at',
    ],
  },
  validation: {
    tab: 'validations',
    columns: [
      'session_id', 'session_date', 'target_session_time',
      'report_generated_at', 'report_type', 'report_summary',
      'predicted_size', 'predicted_shape', 'predicted_wind',
      'predicted_tide', 'confidence', 'main_swell_direction',
      'main_swell_period', 'local_buoy_snapshot',
      'missing_or_offline_sources', 'reality_score', 'user_notes',
      'actual_size', 'actual_shape', 'actual_wind', 'board_used',
      'created_at',
    ],
  },
  external_observation: {
    tab: 'external_observations',
    columns: [
      'session_id', 'observed_at', 'source_url', 'source_type',
      'description', 'grade', 'created_at',
    ],
  },
  analog_match: {
    tab: 'analog_matches',
    columns: [
      'session_id', 'matched_session_id', 'similarity_notes',
      'matched_reality_score', 'created_at',
    ],
  },
  source_health: {
    tab: 'source_health',
    columns: [
      'station_id', 'source_url', 'checked_at', 'status',
      'last_observation_at', 'minutes_stale', 'notes', 'created_at',
    ],
  },
};

// ---- Web App entry points ----

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'Empty request body.' });
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (err) {
      return jsonResponse({ ok: false, error: 'Body is not valid JSON.' });
    }

    if (!payload.shared_secret || payload.shared_secret !== SHARED_SECRET) {
      return jsonResponse({ ok: false, error: 'Auth failed.' });
    }

    const recordType = payload.record_type;
    if (!recordType || !SCHEMA[recordType]) {
      return jsonResponse({
        ok: false,
        error: 'Unknown or missing record_type.',
        accepted_record_types: Object.keys(SCHEMA),
      });
    }

    const data = payload.data;
    if (!data || typeof data !== 'object') {
      return jsonResponse({ ok: false, error: 'Missing data object.' });
    }

    const result = appendRecord(recordType, data);
    var response = { ok: true };
    for (var key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        response[key] = result[key];
      }
    }
    return jsonResponse(response);
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Server error: ' + String(err) });
  }
}

function doGet() {
  return jsonResponse({
    ok: true,
    message: 'Surf Report Builder storage endpoint. POST JSON to write data.',
    accepted_record_types: Object.keys(SCHEMA),
  });
}

// ---- Internals ----

function appendRecord(recordType, data) {
  const def = SCHEMA[recordType];
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Script lock so two near-simultaneous writes can't race on header creation.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let sheet = ss.getSheetByName(def.tab);
    if (!sheet) {
      sheet = ss.insertSheet(def.tab);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(def.columns);
      sheet.setFrozenRows(1);
    }

    if (def.columns.indexOf('created_at') !== -1 && !data.created_at) {
      data.created_at = new Date().toISOString();
    }

    // Build row in column order. Unknown keys in `data` are ignored silently
    // (returned in ignored_keys for debugging). Missing columns become blank.
    const row = def.columns.map(col => {
      const v = data[col];
      if (v === undefined || v === null) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return v;
    });
    sheet.appendRow(row);

    return {
      tab: def.tab,
      row_number: sheet.getLastRow(),
      ignored_keys: Object.keys(data).filter(k => def.columns.indexOf(k) === -1),
    };
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
