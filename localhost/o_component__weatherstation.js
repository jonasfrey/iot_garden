// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { o_state, o_wsmsg__syncdata } from './index.js';
import { f_send_wsmsg_with_response } from './index.js';
import * as echarts from './lib/echarts.esm.min.js';

import {
    f_o_html_from_o_js,
} from "./lib/handyhelpers.js"

import {
    f_s_name_table__from_o_model,
    o_model__o_weatherreading,
    o_wsmsg__esp32_list_ports,
    o_wsmsg__esp32_compile,
    o_wsmsg__esp32_flash,
    o_wsmsg__esp32_install_libs,
    o_wsmsg__esp32_get_config,
    f_o_wsmsg,
} from './constructors.js';

let s_name_table = f_s_name_table__from_o_model(o_model__o_weatherreading);

let f_s_wifi_credentials_cpp = function(a_o_wifi) {
    let s_entries = a_o_wifi
        .filter(function(o) { return o.s_ssid; })
        .map(function(o) { return `    {"${o.s_ssid}", "${o.s_password}"}`; })
        .join(',\n');
    return `
struct O_Wifi {
    const char* s_ssid;
    const char* s_password;
};

const O_Wifi A_O_WIFI[] = {
${s_entries}
};
const int N_WIFI_COUNT = sizeof(A_O_WIFI) / sizeof(A_O_WIFI[0]);

bool f_try_connect_wifi() {
    WiFi.mode(WIFI_STA);
    for (int i = 0; i < N_WIFI_COUNT; i++) {
        Serial.printf("Trying WiFi: %s\\n", A_O_WIFI[i].s_ssid);
        WiFi.begin(A_O_WIFI[i].s_ssid, A_O_WIFI[i].s_password);
        int n_attempts = 0;
        while (WiFi.status() != WL_CONNECTED && n_attempts < 20) {
            f_led_flash(5, 30, 30);
            delay(200);
            Serial.print(".");
            n_attempts++;
        }
        if (WiFi.status() == WL_CONNECTED) {
            Serial.printf("\\nConnected to %s, IP: %s\\n", A_O_WIFI[i].s_ssid, WiFi.localIP().toString().c_str());
            return true;
        }
        WiFi.disconnect(true);
        Serial.println(" failed");
    }
    return false;
}`;
};

let f_s_wifi_header_comment = function(a_o_wifi) {
    return a_o_wifi
        .filter(function(o) { return o.s_ssid; })
        .map(function(o) { return o.s_ssid; })
        .join(', ');
};

let f_s_ino_code__garden = function(o_config) {
    return `// ESP32-S3 Garden Mode — auto-generated
// Stores readings to LittleFS flash (ring buffer), serves JSON when hotspot available
// WiFi: ${f_s_wifi_header_comment(o_config.a_o_wifi)}  |  Interval: ${o_config.n_interval_s}s

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <BH1750.h>
#include <time.h>
#include <LittleFS.h>

const int N_PIN_LED = 2;

void f_led_flash(int n_count, int n_on_ms, int n_off_ms) {
    for (int i = 0; i < n_count; i++) {
        digitalWrite(N_PIN_LED, HIGH);
        delay(n_on_ms);
        digitalWrite(N_PIN_LED, LOW);
        if (i < n_count - 1) delay(n_off_ms);
    }
}

// BME280 I2C bus (SDA=6, SCL=7)
const int N_SDA_BME = 6;
const int N_SCL_BME = 7;
// BH1750 I2C bus (SDA=3, SCL=8)
const int N_SDA_BH = 3;
const int N_SCL_BH = 8;

const unsigned long N_INTERVAL_MS = ${o_config.n_interval_s * 1000}UL;
const int N_WIFI_CHECK_INTERVAL = 10;
const char* S_DATA_PATH = "/readings.bin";
const char* S_META_PATH = "/meta.bin";
const int N_MAX_READINGS = 60000;
const char* S_SERVER_URL = "${o_config.s_server_url || 'https://wetterstation.jonasfrey.deno.net/api/readings'}";
const int N_BATCH_SIZE = 100;

struct O_Reading {
    float n_temperature;
    float n_humidity;
    float n_pressure;
    float n_lux;
    unsigned long long n_ts_ms;
};

struct O_Meta {
    int n_write_idx;
    int n_count;
    int n_sent_count;
};

O_Meta o_meta = {0, 0, 0};

${f_s_wifi_credentials_cpp(o_config.a_o_wifi)}

TwoWire WireBME = TwoWire(0);
TwoWire WireBH  = TwoWire(1);

Adafruit_BME280 bme;
BH1750 lightMeter;
WebServer server(80);
bool b_bh1750_ok = false;
bool b_serving = false;
bool b_ntp_synced = false;

unsigned long long f_n_ts_ms_utc() {
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (unsigned long long)tv.tv_sec * 1000ULL + tv.tv_usec / 1000ULL;
}

void f_sync_ntp() {
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    Serial.print("NTP sync");
    int n_tries = 0;
    while (time(NULL) < 1000000000 && n_tries < 20) {
        delay(500);
        Serial.print(".");
        n_tries++;
    }
    if (time(NULL) >= 1000000000) {
        Serial.printf(" ok (UTC %llu)\\n", f_n_ts_ms_utc());
        b_ntp_synced = true;
    } else {
        Serial.println(" failed!");
    }
}

void f_save_meta() {
    File file = LittleFS.open(S_META_PATH, "w");
    if (file) {
        file.write((uint8_t*)&o_meta, sizeof(O_Meta));
        file.close();
    }
}

void f_load_meta() {
    File file = LittleFS.open(S_META_PATH, "r");
    if (file && file.size() == sizeof(O_Meta)) {
        file.read((uint8_t*)&o_meta, sizeof(O_Meta));
        file.close();
    } else {
        if (file) file.close();
        o_meta = {0, 0, 0};
    }
}

void f_take_reading() {
    O_Reading o_r;
    o_r.n_temperature = bme.readTemperature();
    o_r.n_humidity    = bme.readHumidity();
    o_r.n_pressure    = bme.readPressure() / 100.0F;
    o_r.n_lux         = b_bh1750_ok ? lightMeter.readLightLevel() : -1;
    o_r.n_ts_ms       = b_ntp_synced ? f_n_ts_ms_utc() : millis();

    File file = LittleFS.open(S_DATA_PATH, "r+");
    if (!file) {
        file = LittleFS.open(S_DATA_PATH, "w");
    }
    if (!file) {
        Serial.println("Failed to open data file!");
        return;
    }
    file.seek(o_meta.n_write_idx * sizeof(O_Reading));
    file.write((uint8_t*)&o_r, sizeof(O_Reading));
    file.close();

    o_meta.n_write_idx = (o_meta.n_write_idx + 1) % N_MAX_READINGS;
    if (o_meta.n_count < N_MAX_READINGS) o_meta.n_count++;
    f_save_meta();

    Serial.printf("Reading %d: T=%.1f°C  H=%.1f%%  P=%.1fhPa  L=%.1flux\\n",
                  o_meta.n_count, o_r.n_temperature, o_r.n_humidity, o_r.n_pressure, o_r.n_lux);
    f_led_flash(1, 50, 0);
}

void f_handle_root() {
    size_t n_total = LittleFS.totalBytes();
    size_t n_used = LittleFS.usedBytes();
    String s_html = "<html><head><title>Garden Station</title></head><body>";
    s_html += "<h2>Garden Weather Station</h2>";
    s_html += "<p>Readings stored: " + String(o_meta.n_count) + " / " + String(N_MAX_READINGS) + "</p>";
    s_html += "<p>Flash: " + String(n_used / 1024) + " / " + String(n_total / 1024) + " KB used</p>";
    s_html += "<p>Uptime: " + String(millis() / 60000) + " min</p>";
    s_html += "<h3>Current Readings</h3>";
    float n_t = bme.readTemperature();
    float n_h = bme.readHumidity();
    float n_p = bme.readPressure() / 100.0F;
    float n_l = b_bh1750_ok ? lightMeter.readLightLevel() : -1;
    s_html += "<p>Temperature: " + String(n_t, 1) + " &deg;C</p>";
    s_html += "<p>Humidity: " + String(n_h, 1) + " %</p>";
    s_html += "<p>Pressure: " + String(n_p, 1) + " hPa</p>";
    s_html += "<p>Light: " + String(n_l, 1) + " lux</p>";
    s_html += "<hr>";
    s_html += "<p><a href=\\"/send\\">Send data to server</a></p>";
    s_html += "<p><a href=\\"#\\" onclick=\\"if(confirm('Really clear all stored data?')) window.location='/clear'; return false;\\">Clear stored data</a></p>";
    s_html += "</body></html>";
    server.send(200, "text/html", s_html);
}

void f_handle_data() {
    File file = LittleFS.open(S_DATA_PATH, "r");
    if (!file || o_meta.n_count == 0) {
        if (file) file.close();
        server.send(200, "application/json", "[]");
        return;
    }
    server.sendHeader("Content-Disposition", "attachment; filename=\\"garden_data.json\\"");
    server.setContentLength(CONTENT_LENGTH_UNKNOWN);
    server.send(200, "application/json", "");
    server.sendContent("[");

    // read oldest to newest
    int n_start = (o_meta.n_count < N_MAX_READINGS) ? 0 : o_meta.n_write_idx;
    O_Reading o_r;
    for (int i = 0; i < o_meta.n_count; i++) {
        int n_idx = (n_start + i) % N_MAX_READINGS;
        file.seek(n_idx * sizeof(O_Reading));
        if (file.read((uint8_t*)&o_r, sizeof(O_Reading)) != sizeof(O_Reading)) break;
        if (i > 0) server.sendContent(",");
        char s_buf[256];
        snprintf(s_buf, sizeof(s_buf),
            "{\\"n_temperature\\":%.2f,\\"n_humidity\\":%.2f,\\"n_pressure\\":%.2f,\\"n_lux\\":%.2f,\\"n_ts_ms\\":%llu}",
            o_r.n_temperature, o_r.n_humidity, o_r.n_pressure, o_r.n_lux, o_r.n_ts_ms);
        server.sendContent(s_buf);
    }
    server.sendContent("]");
    file.close();
}

void f_send_unsent() {
    int n_unsent = o_meta.n_count - o_meta.n_sent_count;
    if (n_unsent <= 0) {
        Serial.println("No unsent readings.");
        return;
    }
    File file = LittleFS.open(S_DATA_PATH, "r");
    if (!file) return;

    int n_start = (o_meta.n_count < N_MAX_READINGS) ? 0 : o_meta.n_write_idx;
    int n_skip = o_meta.n_sent_count;
    int n_sent = 0;
    int n_errors = 0;
    HTTPClient http;

    while (n_sent < n_unsent) {
        int n_batch = min(N_BATCH_SIZE, n_unsent - n_sent);
        String s_json = "[";
        O_Reading o_r;
        for (int i = 0; i < n_batch; i++) {
            int n_idx = (n_start + n_skip + n_sent + i) % N_MAX_READINGS;
            file.seek(n_idx * sizeof(O_Reading));
            file.read((uint8_t*)&o_r, sizeof(O_Reading));
            if (i > 0) s_json += ",";
            char s_buf[256];
            snprintf(s_buf, sizeof(s_buf),
                "{\\"n_temperature\\":%.2f,\\"n_humidity\\":%.2f,\\"n_pressure\\":%.2f,\\"n_lux\\":%.2f,\\"n_ts_ms\\":%llu}",
                o_r.n_temperature, o_r.n_humidity, o_r.n_pressure, o_r.n_lux, o_r.n_ts_ms);
            s_json += s_buf;
        }
        s_json += "]";

        http.begin(S_SERVER_URL);
        http.addHeader("Content-Type", "application/json");
        int n_code = http.POST(s_json);
        http.end();

        if (n_code == 200) {
            n_sent += n_batch;
            o_meta.n_sent_count += n_batch;
            f_save_meta();
            Serial.printf("Auto-sent batch: %d/%d unsent\\n", n_sent, n_unsent);
            f_led_flash(2, 30, 30);
        } else {
            n_errors++;
            Serial.printf("Auto-send POST failed: HTTP %d\\n", n_code);
            if (n_errors >= 3) break;
        }
    }
    file.close();
    Serial.printf("Auto-send complete: %d sent, %d errors\\n", n_sent, n_errors);
}

void f_handle_send() {
    if (o_meta.n_count == 0) {
        server.send(200, "text/html", "<html><body><p>No data to send.</p><a href=\\"/\\">Back</a></body></html>");
        return;
    }
    File file = LittleFS.open(S_DATA_PATH, "r");
    if (!file) {
        server.send(500, "text/html", "<html><body><p>Failed to open data file.</p><a href=\\"/\\">Back</a></body></html>");
        return;
    }

    int n_start = (o_meta.n_count < N_MAX_READINGS) ? 0 : o_meta.n_write_idx;
    int n_sent = 0;
    int n_errors = 0;
    HTTPClient http;

    while (n_sent < o_meta.n_count) {
        int n_batch = min(N_BATCH_SIZE, o_meta.n_count - n_sent);
        String s_json = "[";
        O_Reading o_r;
        for (int i = 0; i < n_batch; i++) {
            int n_idx = (n_start + n_sent + i) % N_MAX_READINGS;
            file.seek(n_idx * sizeof(O_Reading));
            file.read((uint8_t*)&o_r, sizeof(O_Reading));
            if (i > 0) s_json += ",";
            char s_buf[256];
            snprintf(s_buf, sizeof(s_buf),
                "{\\"n_temperature\\":%.2f,\\"n_humidity\\":%.2f,\\"n_pressure\\":%.2f,\\"n_lux\\":%.2f,\\"n_ts_ms\\":%llu}",
                o_r.n_temperature, o_r.n_humidity, o_r.n_pressure, o_r.n_lux, o_r.n_ts_ms);
            s_json += s_buf;
        }
        s_json += "]";

        http.begin(S_SERVER_URL);
        http.addHeader("Content-Type", "application/json");
        int n_code = http.POST(s_json);
        http.end();

        if (n_code == 200) {
            n_sent += n_batch;
            Serial.printf("Sent batch: %d/%d\\n", n_sent, o_meta.n_count);
            f_led_flash(2, 30, 30);
        } else {
            n_errors++;
            Serial.printf("POST failed: HTTP %d\\n", n_code);
            if (n_errors >= 3) break;
        }
    }
    file.close();

    if (n_errors == 0) {
        server.sendHeader("Location", String(S_SERVER_URL).substring(0, String(S_SERVER_URL).lastIndexOf("/api")));
        server.send(302);
    } else {
        String s_html = "<html><body>";
        s_html += "<p>Sent " + String(n_sent) + " readings, " + String(n_errors) + " errors.</p>";
        s_html += "<a href=\\"/\\">Back</a></body></html>";
        server.send(200, "text/html", s_html);
    }
}

void f_handle_clear() {
    LittleFS.remove(S_DATA_PATH);
    LittleFS.remove(S_META_PATH);
    o_meta = {0, 0, 0};
    server.send(200, "text/html", "<html><body><p>Data cleared.</p><a href=\\"/\\">Back</a></body></html>");
}

void setup() {
    Serial.begin(115200);
    pinMode(N_PIN_LED, OUTPUT);
    delay(1000);
    Serial.println("\\n=== Garden Weather Station ===");

    if (!LittleFS.begin(true)) {
        Serial.println("LittleFS mount failed!");
        while (1) delay(1000);
    }
    f_load_meta();
    Serial.printf("Flash: %u / %u KB used, existing readings: %d\\n",
                  LittleFS.usedBytes() / 1024, LittleFS.totalBytes() / 1024, o_meta.n_count);

    WireBME.begin(N_SDA_BME, N_SCL_BME);
    WireBH.begin(N_SDA_BH, N_SCL_BH);

    uint8_t n_bme_addr = 0x76;
    if (!bme.begin(n_bme_addr, &WireBME)) {
        n_bme_addr = 0x77;
        if (!bme.begin(n_bme_addr, &WireBME)) {
            Serial.printf("BME280 not found (scanned 0x76, 0x77)\\n");
            while (1) delay(1000);
        }
    }
    Serial.printf("BME280 found at 0x%02X\\n", n_bme_addr);

    b_bh1750_ok = lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, 0x23, &WireBH);
    if (!b_bh1750_ok) {
        Serial.println("BH1750 not found, lux will be -1");
    }

    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(false);

    server.on("/", f_handle_root);
    server.on("/data", f_handle_data);
    server.on("/send", f_handle_send);
    server.on("/clear", f_handle_clear);

    Serial.printf("Interval: %lums, max readings: %d\\n", N_INTERVAL_MS, N_MAX_READINGS);
}

void loop() {
    f_take_reading();

    // Try connecting to any known hotspot
    if (WiFi.status() != WL_CONNECTED) {
        if (f_try_connect_wifi()) {
            if (!b_ntp_synced) {
                f_sync_ntp();
            }
            f_send_unsent();
            if (!b_serving) {
                server.begin();
                b_serving = true;
            }
            // Serve while hotspot stays on, keep taking readings on interval
            unsigned long n_last_reading = millis();
            while (WiFi.status() == WL_CONNECTED) {
                server.handleClient();
                if ((millis() - n_last_reading) >= N_INTERVAL_MS) {
                    f_take_reading();
                    n_last_reading = millis();
                }
                delay(N_WIFI_CHECK_INTERVAL);
            }
            Serial.println("Hotspot disconnected.");
            server.stop();
            b_serving = false;
            WiFi.disconnect(true);
        }
    }

    delay(N_INTERVAL_MS);
}
`;
};

let f_s_ino_code__bme280_test = function() {
    return `// ESP32-S3 BME280 Test — auto-generated
#include <Wire.h>
#include <Adafruit_BME280.h>

const int N_SDA_BME = 6;
const int N_SCL_BME = 7;

TwoWire WireBME = TwoWire(0);
Adafruit_BME280 bme;

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\\n=== BME280 Test ===");
    WireBME.begin(N_SDA_BME, N_SCL_BME);

    uint8_t n_bme_addr = 0x76;
    if (!bme.begin(n_bme_addr, &WireBME)) {
        n_bme_addr = 0x77;
        if (!bme.begin(n_bme_addr, &WireBME)) {
            Serial.printf("BME280 not found (scanned 0x76, 0x77)\\n");
            Serial.println("Check wiring: SDA=6, SCL=7, VCC=3V3, GND=GND");
            while (1) delay(1000);
        }
    }
    Serial.printf("BME280 found at 0x%02X\\n", n_bme_addr);
}

void loop() {
    float n_temperature = bme.readTemperature();
    float n_humidity    = bme.readHumidity();
    float n_pressure    = bme.readPressure() / 100.0F;

    Serial.printf("T=%.1f°C  H=%.1f%%  P=%.1fhPa\\n",
                  n_temperature, n_humidity, n_pressure);
    delay(2000);
}
`;
};

let f_s_ino_code__wifi_test = function(o_config) {
    return `// ESP32-S3 WiFi Connection Test — auto-generated
#include <WiFi.h>
${f_s_wifi_credentials_cpp(o_config.a_o_wifi)}

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\\n=== WiFi Test ===");

    if (f_try_connect_wifi()) {
        Serial.printf("Signal strength: %d dBm\\n", WiFi.RSSI());
    } else {
        Serial.printf("Failed! Status: %d\\n", WiFi.status());
        Serial.println("3=disconnected, 4=connect_failed, 6=wrong_password, 7=no_ssid_avail");
    }
}

void loop() {
    delay(5000);
    Serial.printf("WiFi status: %d, IP: %s\\n",
        WiFi.status(),
        WiFi.localIP().toString().c_str());
}
`;
};

let o_component__weatherstation = {
    name: 'component-weatherstation',
    template: (await f_o_html_from_o_js({
        class: "weatherstation",
        a_o: [
            {
                class: "weatherstation__config",
                a_o: [
                    {
                        s_tag: "div",
                        innerText: "ESP32-S3 Weather Station Config",
                        class: "section_title",
                    },
                    {
                        class: "a_o_input",
                        a_o: [
                            {
                                class: "o_input_group",
                                a_o: [
                                    { s_tag: "div", innerText: "WiFi Networks" },
                                    {
                                        s_tag: "div",
                                        'v-for': "(o_wifi, n_idx) in o_config.a_o_wifi",
                                        class: "wifi_entry",
                                        a_o: [
                                            { s_tag: "input", type: "text", 'v-model': "o_wifi.s_ssid", placeholder: "SSID" },
                                            { s_tag: "input", type: "password", 'v-model': "o_wifi.s_password", placeholder: "password" },
                                            {
                                                s_tag: "span",
                                                class: "interactable",
                                                'v-if': "o_config.a_o_wifi.length > 1",
                                                'v-on:click': "o_config.a_o_wifi.splice(n_idx, 1)",
                                                innerText: "x",
                                            },
                                        ]
                                    },
                                    {
                                        s_tag: "div",
                                        class: "interactable",
                                        'v-on:click': "o_config.a_o_wifi.push({ s_ssid: '', s_password: '' })",
                                        innerText: "+ Add WiFi network",
                                    },
                                ]
                            },
                            {
                                class: "o_input_group",
                                a_o: [
                                    { s_tag: "div", innerText: "Server URL (receive readings)" },
                                    { s_tag: "input", type: "text", 'v-model': "o_config.s_server_url", placeholder: "http://192.168.1.100:8002/api/readings" },
                                ]
                            },
                            {
                                class: "o_input_group",
                                a_o: [
                                    { s_tag: "div", innerText: "Reading Interval (seconds)" },
                                    { s_tag: "input", type: "number", 'v-model.number': "o_config.n_interval_s", placeholder: "2" },
                                ]
                            },
                            {
                                class: "o_input_group",
                                a_o: [
                                    { s_tag: "div", innerText: "Battery capacity (mAh)" },
                                    { s_tag: "input", type: "number", 'v-model.number': "o_config.n_battery_mah", placeholder: "6600" },
                                ]
                            },
                            {
                                s_tag: "div",
                                innerText: "{{ s_runtime_estimate }}",
                            },
                        ]
                    },
                    {
                        s_tag: "div",
                        class: "interactable",
                        'v-on:click': "f_generate_code__garden",
                        innerText: "Generate .ino Code",
                    },
                    {
                        s_tag: "div",
                        class: "interactable",
                        'v-on:click': "f_generate_code__bme280_test",
                        innerText: "Generate .ino (simple BME280 test)",
                    },
                    {
                        s_tag: "div",
                        class: "interactable",
                        'v-on:click': "f_generate_code__wifi_test",
                        innerText: "Generate .ino Code (WiFi connect test only)",
                    },
                    {
                        s_tag: "div",
                        'v-if': "s_code",
                        class: "code_output",
                        a_o: [
                            {
                                s_tag: "div",
                                class: "interactable",
                                'v-on:click': "f_copy_code",
                                innerText: "{{ s_copied ? 'Copied!' : 'Copy to clipboard' }}",
                            },
                            {
                                s_tag: "pre",
                                innerText: "{{ s_code }}",
                            },
                        ]
                    },
                ]
            },
            {
                class: "weatherstation__flash",
                a_o: [
                    {
                        s_tag: "div",
                        innerText: "Compile & Flash",
                        class: "section_title",
                    },
                    {
                        class: "flash_actions",
                        a_o: [
                            {
                                s_tag: "div",
                                class: "interactable",
                                'v-on:click': "f_install_libs",
                                ':class': "{ loading: b_installing_libs }",
                                innerText: "{{ b_installing_libs ? 'Installing...' : 'Install Libraries' }}",
                            },
                            {
                                s_tag: "div",
                                class: "interactable",
                                'v-on:click': "f_list_ports",
                                innerText: "Refresh Ports",
                            },
                            {
                                s_tag: "div",
                                class: "interactable",
                                'v-on:click': "f_compile",
                                ':class': "{ loading: b_compiling, disabled: !s_code }",
                                innerText: "{{ b_compiling ? 'Compiling...' : 'Compile' }}",
                            },
                            {
                                s_tag: "div",
                                class: "interactable",
                                'v-on:click': "f_flash",
                                ':class': "{ loading: b_flashing, disabled: !b_compiled || !s_port_selected }",
                                innerText: "{{ b_flashing ? 'Flashing...' : 'Flash to ESP32' }}",
                            },
                        ]
                    },
                    {
                        class: "port_select",
                        'v-if': "a_o_port.length > 0",
                        a_o: [
                            {
                                s_tag: "div",
                                class: "port_label",
                                innerText: "Select port:",
                            },
                            {
                                s_tag: "div",
                                'v-for': "o_port in a_o_port",
                                class: "interactable port_option",
                                ':class': "{ active: s_port_selected === o_port.s_address }",
                                'v-on:click': "s_port_selected = o_port.s_address",
                                innerText: "{{ o_port.s_address }} {{ o_port.s_label ? '(' + o_port.s_label + ')' : '' }}",
                            },
                        ]
                    },
                    {
                        s_tag: "div",
                        'v-if': "s_flash_log",
                        class: "flash_log",
                        a_o: [
                            {
                                s_tag: "pre",
                                innerText: "{{ s_flash_log }}",
                            },
                        ]
                    },
                ]
            },
            {
                class: "weatherstation__charts",
                a_o: [
                    {
                        s_tag: "div",
                        innerText: "Sensor Data",
                        class: "section_title",
                    },
                    {
                        s_tag: "div",
                        innerText: "No readings yet.",
                        'v-if': "a_o_weatherreading.length === 0",
                    },
                    {
                        s_tag: "div",
                        ref: "el_chart",
                        class: "chart_container",
                        'v-show': "a_o_weatherreading.length > 0",
                    },
                ]
            },
        ]
    })).outerHTML,
    data: function() {
        return {
            o_state: o_state,
            o_config: {
                a_o_wifi: [{ s_ssid: '', s_password: '' }],
                s_server_url: 'https://wetterstation.jonasfrey.deno.net/api/readings',
                n_interval_s: 2,
                n_battery_mah: 6600,
            },
            s_code: '',
            s_copied: false,
            o_chart: null,
            // flash state
            a_o_port: [],
            s_port_selected: '',
            b_compiling: false,
            b_compiled: false,
            b_flashing: false,
            b_installing_libs: false,
            s_flash_log: '',
        };
    },
    computed: {
        a_o_weatherreading: function() {
            return o_state[s_name_table] || [];
        },
        s_runtime_estimate: function() {
            let n_mah = this.o_config.n_battery_mah || 0;
            if (n_mah <= 0) return 'Enter battery capacity to estimate runtime';
            // garden mode: always on, ~80 mA idle, periodic WiFi attempts ~250 mA for ~10s per cycle
            let n_cycle_s = this.o_config.n_interval_s || 60;
            let n_wifi_attempt_s = 10;
            let n_avg_ma = (n_wifi_attempt_s * 250 + (n_cycle_s - n_wifi_attempt_s) * 80) / n_cycle_s;
            let n_hours = n_mah / n_avg_ma;
            if (n_hours < 24) return 'Est. runtime: ~' + Math.round(n_hours) + ' hours (' + n_avg_ma.toFixed(0) + ' mA avg)';
            let n_days = n_hours / 24;
            if (n_days < 365) return 'Est. runtime: ~' + Math.round(n_days) + ' days (' + n_avg_ma.toFixed(0) + ' mA avg)';
            let n_years = n_days / 365;
            return 'Est. runtime: ~' + n_years.toFixed(1) + ' years (' + n_avg_ma.toFixed(0) + ' mA avg)';
        },
    },
    watch: {
        a_o_weatherreading: {
            handler: function() {
                this.f_update_chart();
            },
            deep: true,
        },
    },
    methods: {
        f_generate_code__garden: function() {
            this.s_code = f_s_ino_code__garden(this.o_config);
            this.b_compiled = false;
        },
        f_generate_code__bme280_test: function() {
            this.s_code = f_s_ino_code__bme280_test();
            this.b_compiled = false;
        },
        f_generate_code__wifi_test: function() {
            this.s_code = f_s_ino_code__wifi_test(this.o_config);
            this.b_compiled = false;
        },
        f_copy_code: async function() {
            try {
                await navigator.clipboard.writeText(this.s_code);
                this.s_copied = true;
                setTimeout(function() { this.s_copied = false; }.bind(this), 2000);
            } catch (o_err) {
                console.error('Copy failed:', o_err);
            }
        },
        f_list_ports: async function() {
            this.s_flash_log = 'Scanning ports...';
            try {
                let o_resp = await f_send_wsmsg_with_response(
                    f_o_wsmsg(o_wsmsg__esp32_list_ports.s_name, {})
                );
                if (o_resp.s_error) throw new Error(o_resp.s_error);
                this.a_o_port = o_resp.v_result || [];
                if (this.a_o_port.length > 0 && !this.s_port_selected) {
                    this.s_port_selected = this.a_o_port[0].s_address;
                }
                this.s_flash_log = 'Found ' + this.a_o_port.length + ' port(s)';
            } catch (o_err) {
                this.s_flash_log = 'Error listing ports: ' + o_err.message;
            }
        },
        f_install_libs: async function() {
            this.b_installing_libs = true;
            this.s_flash_log = 'Installing Arduino libraries...';
            try {
                let o_resp = await f_send_wsmsg_with_response(
                    f_o_wsmsg(o_wsmsg__esp32_install_libs.s_name, {}),
                    120000
                );
                if (o_resp.s_error) throw new Error(o_resp.s_error);
                this.s_flash_log = (o_resp.v_result.a_s_log || []).join('\n');
            } catch (o_err) {
                this.s_flash_log = 'Error installing libraries: ' + o_err.message;
            } finally {
                this.b_installing_libs = false;
            }
        },
        f_compile: async function() {
            if (!this.s_code) return;
            this.b_compiling = true;
            this.b_compiled = false;
            this.s_flash_log = 'Compiling...';
            try {
                let o_resp = await f_send_wsmsg_with_response(
                    f_o_wsmsg(o_wsmsg__esp32_compile.s_name, { s_code: this.s_code }),
                    180000
                );
                if (o_resp.s_error) throw new Error(o_resp.s_error);
                let o_result = o_resp.v_result;
                if (o_result.b_success) {
                    this.b_compiled = true;
                    this.s_flash_log = 'Compilation successful!\n' + o_result.s_stdout;
                } else {
                    this.s_flash_log = 'Compilation failed:\n' + o_result.s_stderr;
                }
            } catch (o_err) {
                this.s_flash_log = 'Compile error: ' + o_err.message;
            } finally {
                this.b_compiling = false;
            }
        },
        f_flash: async function() {
            if (!this.b_compiled || !this.s_port_selected) return;
            this.b_flashing = true;
            this.s_flash_log = 'Flashing to ' + this.s_port_selected + '...';
            try {
                let o_resp = await f_send_wsmsg_with_response(
                    f_o_wsmsg(o_wsmsg__esp32_flash.s_name, { s_port: this.s_port_selected }),
                    120000
                );
                if (o_resp.s_error) throw new Error(o_resp.s_error);
                let o_result = o_resp.v_result;
                if (o_result.b_success) {
                    this.s_flash_log = 'Flash successful!\n' + o_result.s_stdout;
                } else {
                    this.s_flash_log = 'Flash failed:\n' + o_result.s_stderr;
                }
            } catch (o_err) {
                this.s_flash_log = 'Flash error: ' + o_err.message;
            } finally {
                this.b_flashing = false;
            }
        },
        f_update_chart: function() {
            if (!this.o_chart || this.a_o_weatherreading.length === 0) return;

            let a_o = this.a_o_weatherreading.slice().sort(function(a, b) {
                return a.n_ts_ms_created - b.n_ts_ms_created;
            });

            let a_s_time = a_o.map(function(o) {
                return new Date(o.n_ts_ms_created).toLocaleTimeString();
            });

            this.o_chart.setOption({
                tooltip: { trigger: 'axis' },
                legend: { data: ['Temperature (\u00b0C)', 'Humidity (%)', 'Pressure (hPa)', 'Light (lux)'] },
                grid: { left: 60, right: 60, top: 60, bottom: 40 },
                xAxis: { type: 'category', data: a_s_time },
                yAxis: [
                    { type: 'value', name: '\u00b0C / % / hPa', position: 'left' },
                    { type: 'value', name: 'lux', position: 'right' },
                ],
                series: [
                    { name: 'Temperature (\u00b0C)', type: 'line', data: a_o.map(function(o) { return o.n_temperature; }), smooth: true },
                    { name: 'Humidity (%)', type: 'line', data: a_o.map(function(o) { return o.n_humidity; }), smooth: true },
                    { name: 'Pressure (hPa)', type: 'line', data: a_o.map(function(o) { return o.n_pressure; }), smooth: true },
                    { name: 'Light (lux)', type: 'line', yAxisIndex: 1, data: a_o.map(function(o) { return o.n_lux; }), smooth: true },
                ],
            });
        },
    },
    mounted: function() {
        let o_self = this;
        o_self.$nextTick(function() {
            if (o_self.$refs.el_chart) {
                o_self.o_chart = echarts.init(o_self.$refs.el_chart);
                o_self.f_update_chart();
                window.addEventListener('resize', function() {
                    if (o_self.o_chart) o_self.o_chart.resize();
                });
            }
        });
        // load config defaults from .env
        f_send_wsmsg_with_response(
            f_o_wsmsg(o_wsmsg__esp32_get_config.s_name, {})
        ).then(function(o_resp) {
            if (o_resp.v_result) {
                let o_r = o_resp.v_result;
                if (o_r.s_ssid && !o_self.o_config.a_o_wifi[0].s_ssid) {
                    o_self.o_config.a_o_wifi[0].s_ssid = o_r.s_ssid;
                }
                if (o_r.s_password && !o_self.o_config.a_o_wifi[0].s_password) {
                    o_self.o_config.a_o_wifi[0].s_password = o_r.s_password;
                }
            }
        });
        // auto-detect ports on mount
        o_self.f_list_ports();
    },
    beforeUnmount: function() {
        if (this.o_chart) {
            this.o_chart.dispose();
            this.o_chart = null;
        }
    },
};

export { o_component__weatherstation };
