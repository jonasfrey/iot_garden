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
    f_o_wsmsg,
} from './constructors.js';

let s_name_table = f_s_name_table__from_o_model(o_model__o_weatherreading);

let f_s_ino_code = function(o_config) {
    return `// ESP32-S3 Weather Station — auto-generated
// WiFi: ${o_config.s_ssid}  |  Server: ${o_config.s_server_ip}:${o_config.n_port}
// Interval: ${o_config.n_interval_s}s  |  Deep sleep: ${o_config.b_deep_sleep ? 'yes' : 'no'}

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <BH1750.h>

const char* S_SSID     = "${o_config.s_ssid}";
const char* S_PASSWORD = "${o_config.s_password}";
const char* S_SERVER   = "http://${o_config.s_server_ip}:${o_config.n_port}/api/weatherreading";

const int N_SDA = 8;
const int N_SCL = 9;
const unsigned long N_INTERVAL_MS = ${o_config.n_interval_s * 1000}UL;

Adafruit_BME280 bme;
BH1750 lightMeter;

void setup() {
    Serial.begin(115200);
    Wire.begin(N_SDA, N_SCL);

    if (!bme.begin(0x76, &Wire)) {
        Serial.println("BME280 not found!");
        while (1) delay(1000);
    }

    if (!lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, 0x23, &Wire)) {
        Serial.println("BH1750 not found!");
        while (1) delay(1000);
    }

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
        Serial.println("WiFi disconnected, reconnecting...");
        WiFi.begin(S_SSID, S_PASSWORD);
    }

${o_config.b_deep_sleep ? `    esp_sleep_enable_timer_wakeup(N_INTERVAL_MS * 1000ULL);
    Serial.println("Entering deep sleep...");
    Serial.flush();
    esp_deep_sleep_start();` : `    delay(N_INTERVAL_MS);`}
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
