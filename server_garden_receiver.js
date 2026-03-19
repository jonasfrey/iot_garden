// Garden Weather Station — data receiver
// Accepts POST /api/readings with JSON array of sensor readings
// Appends to a single JSON file on disk

let s_path_data = './.gitignored/garden_readings.json';
let s_path_echarts = './localhost/lib/echarts.esm.min.js';
let n_port = 8002;

// ensure directory and file exist
try {
    await Deno.stat(s_path_data);
} catch {
    await Deno.mkdir('./.gitignored', { recursive: true });
    await Deno.writeTextFile(s_path_data, '[]');
}

let f_handler = async function(o_request) {
    let o_url = new URL(o_request.url);
    let s_path = o_url.pathname;

    if (s_path === '/api/readings' && o_request.method === 'POST') {
        try {
            let a_o_incoming = await o_request.json();
            if (!Array.isArray(a_o_incoming)) {
                return new Response(JSON.stringify({ s_error: 'expected array' }), {
                    status: 400,
                    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
                });
            }
            let s_existing = await Deno.readTextFile(s_path_data);
            let a_o_existing = JSON.parse(s_existing);
            let o_ts_set = new Set(a_o_existing.map(function(o) { return o.n_ts_ms; }));
            let a_o_new = a_o_incoming.filter(function(o) { return !o_ts_set.has(o.n_ts_ms); });
            a_o_existing = a_o_existing.concat(a_o_new);
            await Deno.writeTextFile(s_path_data, JSON.stringify(a_o_existing, null, 2));
            let s_msg = `received ${a_o_incoming.length}, ${a_o_new.length} new, ${a_o_incoming.length - a_o_new.length} duplicates skipped, total ${a_o_existing.length}`;
            console.log(s_msg);
            return new Response(JSON.stringify({ s_msg: s_msg, n_total: a_o_existing.length }), {
                headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
            });
        } catch (o_error) {
            return new Response(JSON.stringify({ s_error: o_error.message }), {
                status: 500,
                headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
            });
        }
    }

    // serve readings as JSON for chart
    if (s_path === '/api/readings' && o_request.method === 'GET') {
        try {
            let a_n_byte = await Deno.readFile(s_path_data);
            return new Response(a_n_byte, {
                headers: { 'content-type': 'application/json' },
            });
        } catch {
            return new Response('[]', {
                headers: { 'content-type': 'application/json' },
            });
        }
    }

    // serve echarts library
    if (s_path === '/echarts.js') {
        try {
            let a_n_byte = await Deno.readFile(s_path_echarts);
            return new Response(a_n_byte, {
                headers: { 'content-type': 'application/javascript' },
            });
        } catch {
            return new Response('// echarts not found', { status: 404, headers: { 'content-type': 'application/javascript' } });
        }
    }

    // CORS preflight
    if (o_request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'access-control-allow-origin': '*',
                'access-control-allow-methods': 'POST, OPTIONS',
                'access-control-allow-headers': 'content-type',
            },
        });
    }

    // GUI page with file upload
    if (s_path === '/') {
        let n_count = 0;
        try {
            let s_existing = await Deno.readTextFile(s_path_data);
            n_count = JSON.parse(s_existing).length;
        } catch {}
        let s_html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Wetterstation</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='80' font-size='80'>☀</text></svg>">
<style>
body { font-family: monospace; margin: 20px; background: #1a1a1a; color: #ccc; }
h2 { margin-bottom: 10px; color: #eee; }
a { color: #6cf; }
.btn { display: inline-block; padding: 8px 16px; background: #333; color: #ddd; border: 1px solid #444; cursor: pointer; font-family: monospace; font-size: 14px; margin: 5px 5px 5px 0; }
.btn:hover { background: #444; }
#s_status { margin-top: 10px; white-space: pre-wrap; }
.chart { width: 100%; height: 300px; margin-top: 10px; }
.controls { margin-bottom: 10px; }
.data_section { padding: 10px 0; }
details { margin-bottom: 10px; }
summary { cursor: pointer; }
input[type="file"] { color: #ccc; }
</style>
</head><body>
<h2 id="t_title">Garden Weather Station</h2>
<p>${n_count} readings</p>
<details>
<summary class="btn" id="t_data">Data</summary>
<div class="data_section">
<input type="file" id="el_file" accept=".json">
<button class="btn" id="t_upload" onclick="f_upload()">Upload JSON</button>
<button class="btn" id="t_download" onclick="f_download()">Download All Data</button>
<div id="s_status"></div>
</div>
</details>
<div class="controls">
<button class="btn" id="t_1day" onclick="f_zoom_span(1)">1 Day</button>
<button class="btn" id="t_1week" onclick="f_zoom_span(7)">1 Week</button>
<button class="btn" id="t_1month" onclick="f_zoom_span(30)">1 Month</button>
<button class="btn" id="t_1year" onclick="f_zoom_span(365)">1 Year</button>
<button class="btn" id="t_all" onclick="f_zoom_span(0)">All</button>
</div>
<div id="el_chart_temperature" class="chart"></div>
<div id="el_chart_humidity" class="chart"></div>
<div id="el_chart_pressure" class="chart"></div>
<div id="el_chart_lux" class="chart"></div>
<script type="module">
import * as echarts from '/echarts.js';

let s_lang = 's_de_ch';

let o_t = {
    s_title:        { s: 'Garden Weather Station', s_de_ch: 'Gartä Wätterstation' },
    s_readings:     { s: 'Readings stored', s_de_ch: 'Mässige gspichärät' },
    s_data:         { s: 'Data', s_de_ch: 'Datä' },
    s_upload:       { s: 'Upload JSON', s_de_ch: 'JSON ufälade' },
    s_download:     { s: 'Download All Data', s_de_ch: 'Aui Date abäladä' },
    s_1day:         { s: '1 Day', s_de_ch: '1 Tag' },
    s_1week:        { s: '1 Week', s_de_ch: '1 Wuchä' },
    s_1month:       { s: '1 Month', s_de_ch: '1 Monat' },
    s_1year:        { s: '1 Year', s_de_ch: '1 Jahr' },
    s_all:          { s: 'All', s_de_ch: 'Aues' },
    s_temperature:  { s: 'Temperature', s_de_ch: 'Temperatur' },
    s_humidity:     { s: 'Humidity', s_de_ch: 'Füechtigkeit' },
    s_pressure:     { s: 'Pressure', s_de_ch: 'Druck' },
    s_light:        { s: 'Light', s_de_ch: 'Liächt' },
    s_no_file:      { s: 'No file selected.', s_de_ch: 'Ke Datei usgwäut.' },
    s_reading_file: { s: 'Reading file...', s_de_ch: 'Datei wird gläsä...' },
    s_uploading:    { s: 'Uploading', s_de_ch: 'Am ufäladä' },
    s_error_array:  { s: 'Error: file must contain a JSON array.', s_de_ch: 'Fehler: Datei muess äs JSON Array sii.' },
    s_sunday:       { s: 'Sunday', s_de_ch: 'Sunnti' },
    s_monday:       { s: 'Monday', s_de_ch: 'Mänti' },
    s_tuesday:      { s: 'Tuesday', s_de_ch: 'Zischti' },
    s_wednesday:    { s: 'Wednesday', s_de_ch: 'Mittwuch' },
    s_thursday:     { s: 'Thursday', s_de_ch: 'Donnsti' },
    s_friday:       { s: 'Friday', s_de_ch: 'Friti' },
    s_saturday:     { s: 'Saturday', s_de_ch: 'Samschti' },
    s_sun:          { s: 'Sun', s_de_ch: 'Su' },
    s_mon:          { s: 'Mon', s_de_ch: 'Mä' },
    s_tue:          { s: 'Tue', s_de_ch: 'Zi' },
    s_wed:          { s: 'Wed', s_de_ch: 'Mi' },
    s_thu:          { s: 'Thu', s_de_ch: 'Do' },
    s_fri:          { s: 'Fri', s_de_ch: 'Fr' },
    s_sat:          { s: 'Sat', s_de_ch: 'Sa' },
};

function t(s_key) { return o_t[s_key][s_lang] || o_t[s_key].s; }

// apply translations to DOM
document.getElementById('t_title').textContent = t('s_title');
document.getElementById('t_data').textContent = t('s_data');
document.getElementById('t_upload').textContent = t('s_upload');
document.getElementById('t_download').textContent = t('s_download');
document.getElementById('t_1day').textContent = t('s_1day');
document.getElementById('t_1week').textContent = t('s_1week');
document.getElementById('t_1month').textContent = t('s_1month');
document.getElementById('t_1year').textContent = t('s_1year');
document.getElementById('t_all').textContent = t('s_all');

async function f_load_charts() {
    let o_resp = await fetch('/api/readings');
    let a_o = await o_resp.json();
    if (a_o.length === 0) return;

    a_o.sort(function(a, b) { return a.n_ts_ms - b.n_ts_ms; });

    let a_s_day_name = [t('s_sun'), t('s_mon'), t('s_tue'), t('s_wed'), t('s_thu'), t('s_fri'), t('s_sat')];
    let n_now = Date.now();
    let n_ms_week = 7 * 24 * 60 * 60 * 1000;
    let n_ms_month = 30 * 24 * 60 * 60 * 1000;
    let n_ms_year = 365 * 24 * 60 * 60 * 1000;

    let a_s_time = a_o.map(function(o) {
        if (o.n_ts_ms <= 1000000000000) return String(o.n_ts_ms);
        let d = new Date(o.n_ts_ms);
        let n_age = n_now - o.n_ts_ms;
        let s_time = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
        let s_day = a_s_day_name[d.getDay()];
        if (n_age > n_ms_year) return s_day + ' ' + d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + s_time;
        if (n_age > n_ms_month) return s_day + ' ' + d.getDate() + '.' + (d.getMonth() + 1) + ' ' + s_time;
        if (n_age > n_ms_week) return s_day + ' ' + d.getDate() + '. ' + s_time;
        return s_day + ' ' + s_time;
    });

    // build day bands with labels
    let a_a_day_band = [];
    let a_s_day_full = [t('s_sunday'), t('s_monday'), t('s_tuesday'), t('s_wednesday'), t('s_thursday'), t('s_friday'), t('s_saturday')];
    if (a_o.length > 0 && a_o[0].n_ts_ms > 1000000000000) {
        let n_prev_day = -1;
        let n_day_count = 0;
        let n_band_start = 0;
        let s_band_label = '';
        for (let i = 0; i < a_o.length; i++) {
            let n_day = Math.floor(a_o[i].n_ts_ms / 86400000);
            if (n_day !== n_prev_day) {
                if (n_prev_day !== -1) {
                    a_a_day_band.push([
                        { xAxis: a_s_time[n_band_start], itemStyle: { color: n_day_count % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'transparent' } },
                        { xAxis: a_s_time[i - 1] },
                    ]);
                }
                let d = new Date(a_o[i].n_ts_ms);
                s_band_label = d.getDate() + ', ' + a_s_day_full[d.getDay()];
                n_band_start = i;
                n_prev_day = n_day;
                n_day_count++;
            }
        }
        a_a_day_band.push([
            { xAxis: a_s_time[n_band_start], itemStyle: { color: n_day_count % 2 === 1 ? 'rgba(255,255,255,0.05)' : 'transparent' } },
            { xAxis: a_s_time[a_o.length - 1] },
        ]);
    }

    // day start indices for markLine labels
    let a_o_day_starts = [];
    if (a_o.length > 0 && a_o[0].n_ts_ms > 1000000000000) {
        let n_prev_day = -1;
        for (let i = 0; i < a_o.length; i++) {
            let n_day = Math.floor(a_o[i].n_ts_ms / 86400000);
            if (n_day !== n_prev_day) {
                let d = new Date(a_o[i].n_ts_ms);
                a_o_day_starts.push({ xAxis: a_s_time[i], s_label: d.getDate() + ', ' + a_s_day_full[d.getDay()], b_month_start: d.getDate() === 1 });
                n_prev_day = n_day;
            }
        }
    }

    let a_o_chart_config = [
        { s_id: 'el_chart_temperature', s_name: t('s_temperature'), s_unit: '\u00b0C', s_key: 'n_temperature', s_color: '#ee6666' },
        { s_id: 'el_chart_humidity', s_name: t('s_humidity'), s_unit: '%', s_key: 'n_humidity', s_color: '#5470c6' },
        { s_id: 'el_chart_pressure', s_name: t('s_pressure'), s_unit: 'hPa', s_key: 'n_pressure', s_color: '#91cc75' },
        { s_id: 'el_chart_lux', s_name: t('s_light'), s_unit: 'lux', s_key: 'n_lux', s_color: '#fac858' },
    ];

    // default zoom: last 7 days
    let n_initial_start = 0;
    if (a_o.length > 0 && a_o[0].n_ts_ms > 1000000000000) {
        let n_cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        let n_first_idx = a_o.findIndex(function(o) { return o.n_ts_ms >= n_cutoff; });
        if (n_first_idx > 0) n_initial_start = (n_first_idx / a_o.length) * 100;
    }

    let a_o_chart = [];
    let b_syncing = false;
    for (let o_cfg of a_o_chart_config) {
        let o_chart = echarts.init(document.getElementById(o_cfg.s_id), 'dark');
        o_chart.setOption({
            animation: false,
            tooltip: { trigger: 'axis' },
            title: { text: o_cfg.s_name + ' (' + o_cfg.s_unit + ')', left: 'center', textStyle: { fontFamily: 'monospace', fontSize: 14 } },
            grid: { left: 50, right: 20, top: 40, bottom: 40 },
            dataZoom: [
                { type: 'inside', start: n_initial_start, end: 100 },
                { type: 'slider', height: 15, start: n_initial_start, end: 100 },
            ],
            xAxis: { type: 'category', data: a_s_time, axisLabel: { show: false } },
            yAxis: { type: 'value', name: o_cfg.s_unit },
            series: [{
                type: 'line',
                data: a_o.map(function(o) { return o[o_cfg.s_key]; }),
                smooth: true,
                symbol: 'circle', symbolSize: 3,
                itemStyle: { color: o_cfg.s_color },
                markArea: {
                    silent: true,
                    itemStyle: { color: 'rgba(255,255,255,0.05)' },
                    data: a_a_day_band,
                },
                markLine: {
                    silent: true,
                    symbol: 'none',
                    lineStyle: { color: 'rgba(255,255,255,0.1)', type: 'solid' },
                    label: {
                        show: true,
                        position: 'start',
                        formatter: function(o) { return o.data.s_label || ''; },
                        color: '#555',
                        fontSize: 13,
                        fontFamily: 'monospace',
                        rotate: 0,
                        offset: [4, -18],
                        align: 'left',
                    },
                    data: a_o_day_starts.map(function(o) {
                        let o_line = { xAxis: o.xAxis, s_label: o.s_label };
                        if (o.b_month_start) {
                            o_line.lineStyle = { width: 2, color: 'rgba(255,255,255,0.3)' };
                        }
                        return o_line;
                    }),
                },
            }],
        });
        a_o_chart.push(o_chart);

        o_chart.on('datazoom', function() {
            if (b_syncing) return;
            b_syncing = true;
            let o_zoom = o_chart.getOption().dataZoom[0];
            for (let o_other of a_o_chart) {
                if (o_other !== o_chart) {
                    o_other.dispatchAction({ type: 'dataZoom', start: o_zoom.start, end: o_zoom.end });
                }
            }
            b_syncing = false;
        });
    }

    window.addEventListener('resize', function() {
        for (let o_chart of a_o_chart) o_chart.resize();
    });

    window._a_o_chart = a_o_chart;
    window._a_o = a_o;
    window._b_syncing = false;
}

f_load_charts();

window.f_zoom_span = function(n_days) {
    let a_o_chart = window._a_o_chart;
    let a_o = window._a_o;
    if (!a_o_chart || !a_o || a_o.length === 0) return;
    if (n_days === 0) {
        for (let o_chart of a_o_chart) {
            o_chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
        }
        return;
    }
    let n_cutoff = Date.now() - n_days * 24 * 60 * 60 * 1000;
    let n_first_idx = a_o.findIndex(function(o) { return o.n_ts_ms >= n_cutoff; });
    if (n_first_idx === -1) n_first_idx = 0;
    let n_start = (n_first_idx / a_o.length) * 100;
    for (let o_chart of a_o_chart) {
        o_chart.dispatchAction({ type: 'dataZoom', start: n_start, end: 100 });
    }
};

window.f_upload = async function() {
    let el_file = document.getElementById('el_file');
    let el_status = document.getElementById('s_status');
    if (!el_file.files.length) { el_status.textContent = t('s_no_file'); return; }
    el_status.textContent = t('s_reading_file');
    try {
        let s_text = await el_file.files[0].text();
        let a_o = JSON.parse(s_text);
        if (!Array.isArray(a_o)) { el_status.textContent = t('s_error_array'); return; }
        el_status.textContent = t('s_uploading') + ' ' + a_o.length + '...';
        let o_resp = await fetch('/api/readings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: s_text,
        });
        let o_result = await o_resp.json();
        if (o_result.s_error) { el_status.textContent = 'Error: ' + o_result.s_error; }
        else { el_status.textContent = o_result.s_msg; location.reload(); }
    } catch (e) { el_status.textContent = 'Error: ' + e.message; }
};

window.f_download = async function() {
    let o_resp = await fetch('/api/readings');
    let s_text = await o_resp.text();
    let o_blob = new Blob([s_text], { type: 'application/json' });
    let el_a = document.createElement('a');
    el_a.href = URL.createObjectURL(o_blob);
    el_a.download = 'garden_readings.json';
    el_a.click();
    URL.revokeObjectURL(el_a.href);
};
</script>
</body></html>`;
        return new Response(s_html, {
            headers: { 'content-type': 'text/html; charset=utf-8' },
        });
    }

    return new Response('Not Found', { status: 404 });
};

Deno.serve({ port: n_port }, f_handler);
console.log(`Garden receiver listening on port ${n_port}`);
