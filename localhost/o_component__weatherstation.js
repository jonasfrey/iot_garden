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

let f_s_ino_code = function(o_config) {
    let s_read_and_send = `
    // Read sensors
    float n_temperature = bme.readTemperature();
    float n_humidity    = bme.readHumidity();
    float n_pressure    = bme.readPressure() / 100.0F;
    float n_lux         = lightMeter.readLightLevel();

    Serial.printf("T=%.1f°C  H=%.1f%%  P=%.1fhPa  L=%.1flux\\n",
                  n_temperature, n_humidity, n_pressure, n_lux);

    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(S_SERVER);
        http.addHeader("Content-Type", "application/json");

        char s_json[256];
        snprintf(s_json, sizeof(s_json),
            "{\\"n_temperature\\":%.2f,\\"n_humidity\\":%.2f,\\"n_pressure\\":%.2f,\\"n_lux\\":%.2f}",
            n_temperature, n_humidity, n_pressure, n_lux);

        int n_code = http.POST(s_json);
        Serial.printf("HTTP %d\\n", n_code);
        http.end();
    } else {
        Serial.println("WiFi disconnected, skipping upload.");
    }`;

    if (o_config.b_deep_sleep) {
        let s_spike = '';
        if (o_config.b_powerbank_keepalive) {
            s_spike = `
// Power bank keep-alive: stay awake with WiFi between readings
// instead of deep sleep, use delay loop with periodic WiFi spikes
const int N_SPIKE_INTERVAL_S = ${o_config.n_spike_interval_s || 30};

void f_spike_current() {
    // WiFi TX draws ~200-500mA — enough to keep any power bank alive
    Serial.println("Spike: keeping power bank alive");
    WiFi.mode(WIFI_STA);
    WiFi.begin(S_SSID, S_PASSWORD);
    delay(2000);
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
}`;
        }

        let s_sleep_block = '';
        if (o_config.b_powerbank_keepalive) {
            s_sleep_block = `
    // Power bank mode: stay awake, spike current every ${o_config.n_spike_interval_s || 30}s
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    Serial.println("Waiting (power bank keep-alive mode)...");
    Serial.flush();
    unsigned long n_wait_start = millis();
    unsigned long n_last_spike = millis();
    while ((millis() - n_wait_start) < (N_SLEEP_US / 1000)) {
        if ((millis() - n_last_spike) >= (N_SPIKE_INTERVAL_S * 1000UL)) {
            f_spike_current();
            n_last_spike = millis();
        }
        delay(100);
    }
    ESP.restart();`;
        } else {
            s_sleep_block = `
    esp_sleep_enable_timer_wakeup(N_SLEEP_US);
    Serial.println("Entering deep sleep...");
    Serial.flush();
    esp_deep_sleep_start();`;
        }

        return `// ESP32-S3 Weather Station — auto-generated
// WiFi: ${o_config.s_ssid}  |  Server: ${o_config.s_server_ip}:${o_config.n_port}
// Interval: ${o_config.n_interval_s}s  |  Deep sleep: ${o_config.b_powerbank_keepalive ? 'no (power bank mode)' : 'yes'}

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <BH1750.h>

const char* S_SSID     = "${o_config.s_ssid}";
const char* S_PASSWORD = "${o_config.s_password}";
const char* S_SERVER   = "http://${o_config.s_server_ip}:${o_config.n_port}/api/weatherreading";

// BME280 I2C bus (SDA=6, SCL=7)
const int N_SDA_BME = 6;
const int N_SCL_BME = 7;
// BH1750 I2C bus (SDA=3, SCL=8)
const int N_SDA_BH = 3;
const int N_SCL_BH = 8;

const uint64_t N_SLEEP_US = ${o_config.n_interval_s}000000ULL;

TwoWire WireBME = TwoWire(0);
TwoWire WireBH  = TwoWire(1);

Adafruit_BME280 bme;
BH1750 lightMeter;
${s_spike}

void setup() {
    Serial.begin(115200);
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

    if (!lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, 0x23, &WireBH)) {
        Serial.println("BH1750 not found!");
        while (1) delay(1000);
    }

    WiFi.mode(WIFI_STA);
    WiFi.begin(S_SSID, S_PASSWORD);
    Serial.print("Connecting to WiFi");
    int n_attempts = 0;
    while (WiFi.status() != WL_CONNECTED && n_attempts < 40) {
        delay(500);
        Serial.print(".");
        n_attempts++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println(" connected!");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println(" failed!");
    }
${s_read_and_send}
${s_sleep_block}
}

void loop() {
    // Never reached — restarts via deep sleep or ESP.restart()
}
`;
    } else {
        return `// ESP32-S3 Weather Station — auto-generated
// WiFi: ${o_config.s_ssid}  |  Server: ${o_config.s_server_ip}:${o_config.n_port}
// Interval: ${o_config.n_interval_s}s  |  Deep sleep: no

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <BH1750.h>

const char* S_SSID     = "${o_config.s_ssid}";
const char* S_PASSWORD = "${o_config.s_password}";
const char* S_SERVER   = "http://${o_config.s_server_ip}:${o_config.n_port}/api/weatherreading";

// BME280 I2C bus (SDA=6, SCL=7)
const int N_SDA_BME = 6;
const int N_SCL_BME = 7;
// BH1750 I2C bus (SDA=3, SCL=8)
const int N_SDA_BH = 3;
const int N_SCL_BH = 8;

const unsigned long N_INTERVAL_MS = ${o_config.n_interval_s * 1000}UL;

TwoWire WireBME = TwoWire(0);
TwoWire WireBH  = TwoWire(1);

Adafruit_BME280 bme;
BH1750 lightMeter;

void setup() {
    Serial.begin(115200);
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

    if (!lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, 0x23, &WireBH)) {
        Serial.println("BH1750 not found!");
        while (1) delay(1000);
    }

    WiFi.mode(WIFI_STA);
    WiFi.begin(S_SSID, S_PASSWORD);
    Serial.print("Connecting to WiFi");
    int n_attempts = 0;
    while (WiFi.status() != WL_CONNECTED && n_attempts < 40) {
        delay(500);
        Serial.print(".");
        n_attempts++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println(" connected!");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println(" failed!");
    }
}

void loop() {
${s_read_and_send}

    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("Reconnecting WiFi...");
        WiFi.begin(S_SSID, S_PASSWORD);
    }

    delay(N_INTERVAL_MS);
}
`;
    }
};


let f_s_ino_code__garden = function(o_config) {
    return `// ESP32-S3 Garden Mode — auto-generated
// Stores readings in RAM, serves JSON when phone hotspot is available
// WiFi: ${o_config.s_ssid}  |  Interval: ${o_config.n_interval_s}s

#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <BH1750.h>

const char* S_SSID     = "${o_config.s_ssid}";
const char* S_PASSWORD = "${o_config.s_password}";

// BME280 I2C bus (SDA=6, SCL=7)
const int N_SDA_BME = 6;
const int N_SCL_BME = 7;
// BH1750 I2C bus (SDA=3, SCL=8)
const int N_SDA_BH = 3;
const int N_SCL_BH = 8;

const unsigned long N_INTERVAL_MS = ${o_config.n_interval_s * 1000}UL;
const int N_WIFI_TIMEOUT_MS = 5000;
const int N_WIFI_CHECK_INTERVAL = 10;
const unsigned long N_SPIKE_INTERVAL_MS = ${(o_config.n_spike_interval_s || 30) * 1000}UL;

struct O_Reading {
    float n_temperature;
    float n_humidity;
    float n_pressure;
    float n_lux;
    unsigned long n_ms;
};

const int N_MAX_READINGS = 10000;
O_Reading a_o_reading[N_MAX_READINGS];
int n_reading_count = 0;

TwoWire WireBME = TwoWire(0);
TwoWire WireBH  = TwoWire(1);

Adafruit_BME280 bme;
BH1750 lightMeter;
WebServer server(80);
bool b_bh1750_ok = false;
bool b_serving = false;

void f_take_reading() {
    if (n_reading_count >= N_MAX_READINGS) {
        Serial.println("Storage full!");
        return;
    }
    O_Reading o_r;
    o_r.n_temperature = bme.readTemperature();
    o_r.n_humidity    = bme.readHumidity();
    o_r.n_pressure    = bme.readPressure() / 100.0F;
    o_r.n_lux         = b_bh1750_ok ? lightMeter.readLightLevel() : -1;
    o_r.n_ms          = millis();
    a_o_reading[n_reading_count] = o_r;
    n_reading_count++;
    Serial.printf("Reading %d: T=%.1f°C  H=%.1f%%  P=%.1fhPa  L=%.1flux\\n",
                  n_reading_count, o_r.n_temperature, o_r.n_humidity, o_r.n_pressure, o_r.n_lux);
}

void f_handle_root() {
    String s_html = "<html><head><title>Garden Station</title></head><body>";
    s_html += "<h2>Garden Weather Station</h2>";
    s_html += "<p>Readings stored: " + String(n_reading_count) + " / " + String(N_MAX_READINGS) + "</p>";
    s_html += "<p>Uptime: " + String(millis() / 60000) + " min</p>";
    s_html += "<p><a href=\\"/data\\">Download JSON</a></p>";
    s_html += "<p><a href=\\"/clear\\">Clear stored data</a></p>";
    s_html += "</body></html>";
    server.send(200, "text/html", s_html);
}

void f_handle_data() {
    String s_json = "[";
    for (int i = 0; i < n_reading_count; i++) {
        if (i > 0) s_json += ",";
        s_json += "{\\"n_temperature\\":" + String(a_o_reading[i].n_temperature, 2);
        s_json += ",\\"n_humidity\\":" + String(a_o_reading[i].n_humidity, 2);
        s_json += ",\\"n_pressure\\":" + String(a_o_reading[i].n_pressure, 2);
        s_json += ",\\"n_lux\\":" + String(a_o_reading[i].n_lux, 2);
        s_json += ",\\"n_ms\\":" + String(a_o_reading[i].n_ms);
        s_json += "}";
    }
    s_json += "]";
    server.sendHeader("Content-Disposition", "attachment; filename=\\"garden_data.json\\"");
    server.send(200, "application/json", s_json);
}

void f_handle_clear() {
    n_reading_count = 0;
    server.send(200, "text/html", "<html><body><p>Data cleared.</p><a href=\\"/\\">Back</a></body></html>");
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\\n=== Garden Weather Station ===");

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
    server.on("/clear", f_handle_clear);

    Serial.printf("Interval: %lums, max readings: %d\\n", N_INTERVAL_MS, N_MAX_READINGS);
}

void loop() {
    f_take_reading();

    // Try connecting to hotspot
    if (WiFi.status() != WL_CONNECTED) {
        WiFi.begin(S_SSID, S_PASSWORD);
        unsigned long n_start = millis();
        while (WiFi.status() != WL_CONNECTED && (millis() - n_start) < N_WIFI_TIMEOUT_MS) {
            delay(250);
        }

        if (WiFi.status() == WL_CONNECTED) {
            Serial.printf("Hotspot connected! IP: %s\\n", WiFi.localIP().toString().c_str());
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
        } else {
            WiFi.disconnect(true);
        }
    }

    // Keep WiFi attempting connection to maintain current draw (~80-120mA)
    // This prevents power bank auto-shutoff
    if (WiFi.status() != WL_CONNECTED) {
        WiFi.mode(WIFI_STA);
        WiFi.begin(S_SSID, S_PASSWORD);
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

const char* S_SSID     = "${o_config.s_ssid}";
const char* S_PASSWORD = "${o_config.s_password}";

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\\n=== WiFi Test ===");
    Serial.printf("Connecting to: '%s'\\n", S_SSID);

    WiFi.mode(WIFI_STA);
    WiFi.begin(S_SSID, S_PASSWORD);

    int n_attempts = 0;
    while (WiFi.status() != WL_CONNECTED && n_attempts < 40) {
        delay(500);
        Serial.printf(".");
        n_attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\\nConnected! IP: %s\\n", WiFi.localIP().toString().c_str());
        Serial.printf("Signal strength: %d dBm\\n", WiFi.RSSI());
    } else {
        Serial.printf("\\nFailed! Status: %d\\n", WiFi.status());
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
                                    { s_tag: "div", innerText: "WiFi SSID" },
                                    { s_tag: "input", type: "text", 'v-model': "o_config.s_ssid", placeholder: "MyNetwork" },
                                ]
                            },
                            {
                                class: "o_input_group",
                                a_o: [
                                    { s_tag: "div", innerText: "WiFi Password" },
                                    { s_tag: "input", type: "password", 'v-model': "o_config.s_password", placeholder: "password" },
                                ]
                            },
                            {
                                class: "o_input_group",
                                a_o: [
                                    { s_tag: "div", innerText: "Server IP" },
                                    { s_tag: "input", type: "text", 'v-model': "o_config.s_server_ip", placeholder: "192.168.1.100" },
                                ]
                            },
                            {
                                class: "o_input_group",
                                a_o: [
                                    { s_tag: "div", innerText: "Server Port" },
                                    { s_tag: "input", type: "number", 'v-model.number': "o_config.n_port", placeholder: "8000" },
                                ]
                            },
                            {
                                class: "o_input_group",
                                a_o: [
                                    { s_tag: "div", innerText: "Reading Interval (seconds)" },
                                    { s_tag: "input", type: "number", 'v-model.number': "o_config.n_interval_s", placeholder: "60" },
                                ]
                            },
                            {
                                class: "o_input_group",
                                a_o: [
                                    { s_tag: "label", a_o: [
                                        { s_tag: "input", type: "checkbox", 'v-model': "o_config.b_deep_sleep" },
                                        { s_tag: "span", innerText: " Deep sleep between readings (battery-friendly)" },
                                    ]},
                                ]
                            },
                            {
                                class: "o_input_group",
                                'v-if': "o_config.b_deep_sleep",
                                a_o: [
                                    { s_tag: "label", a_o: [
                                        { s_tag: "input", type: "checkbox", 'v-model': "o_config.b_powerbank_keepalive" },
                                        { s_tag: "span", innerText: " Power bank keep-alive (spike current to prevent auto-shutoff)" },
                                    ]},
                                ]
                            },
                            {
                                class: "o_input_group",
                                'v-if': "o_config.b_deep_sleep && o_config.b_powerbank_keepalive",
                                a_o: [
                                    { s_tag: "div", innerText: "Spike interval (seconds)" },
                                    { s_tag: "input", type: "number", 'v-model.number': "o_config.n_spike_interval_s", placeholder: "30" },
                                ]
                            },
                        ]
                    },
                    {
                        s_tag: "div",
                        class: "interactable",
                        'v-on:click': "f_generate_code",
                        innerText: "Generate .ino Code",
                    },
                    {
                        s_tag: "div",
                        class: "interactable",
                        'v-on:click': "f_generate_code__garden",
                        innerText: "Generate .ino (garden mode)",
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
                s_ssid: '',
                s_password: '',
                s_server_ip: '',
                n_port: 8000,
                n_interval_s: 60,
                b_deep_sleep: true,
                b_powerbank_keepalive: false,
                n_spike_interval_s: 30,
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
        f_generate_code: function() {
            this.s_code = f_s_ino_code(this.o_config);
            this.b_compiled = false;
        },
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
                if (o_r.s_ssid && !o_self.o_config.s_ssid) o_self.o_config.s_ssid = o_r.s_ssid;
                if (o_r.s_password && !o_self.o_config.s_password) o_self.o_config.s_password = o_r.s_password;
                if (o_r.n_port && !o_self.o_config.n_port) o_self.o_config.n_port = o_r.n_port;
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
