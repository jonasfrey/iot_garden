// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { createApp, reactive, markRaw } from './lib/vue.esm-browser.js';
import { createRouter, createWebHashHistory } from './lib/vue-router.esm-browser.js';
import {
    a_o_model,
    f_s_name_table__from_o_model,
    o_wsmsg__f_v_crud__indb,
    o_wsmsg__syncdata,
    o_wsmsg__logmsg,
    a_o_wsmsg,
    f_o_wsmsg,
    f_o_logmsg,
    f_apply_crud_to_a_o,
    s_name_prop_id,
    s_o_logmsg_s_type__log,
    s_o_logmsg_s_type__error,
    s_o_logmsg_s_type__warn,
    s_o_logmsg_s_type__info,
    f_o_relation_map__from_a_o_model,
    f_denormalize_o_state,
    f_denormalize_o_instance,
    f_o_model__from_params,
} from './constructors.js';

import {
    f_o_html_from_o_js,
} from "./lib/handyhelpers.js"
import { o_component__data } from './o_component__data.js';
import { o_component__filebrowser } from './o_component__filebrowser.js';
import { o_component__weatherstation } from './o_component__weatherstation.js';
import './css_helper.js';

import { o_logmsg__run_command } from "./runtimedata.js";



let o_state = reactive({
    b_loaded: false,
    a_o_route : [
        {
            path: '/',
            redirect: '/data',
        },
        {
            path: '/data',
            name: 'data',
            component: markRaw(o_component__data),
        },
        {
            path: '/filebrowser',
            name: 'filebrowser',
            component: markRaw(o_component__filebrowser),
        },
        {
            path: '/weatherstation',
            name: 'weatherstation',
            component: markRaw(o_component__weatherstation),
        },
    ],
    a_o_model,
    a_o_logmsg: [
        f_o_logmsg('Welcome to the app!', false, true, 'success', Date.now(), 5000),
    ],
    n_ts_ms_now: Date.now(),
    b_utterance_muted: true,
    o_logmsg__run_command
});

// auto-derive reactive keys for each model table so Vue tracks them before the server sends data
for (let o_model of a_o_model) {
    o_state[f_s_name_table__from_o_model(o_model)] = [];
}

// precompute relation map once for denormalized access (e.g. o_student.a_o_course)
let o_relation_map = f_o_relation_map__from_a_o_model(a_o_model, s_name_prop_id);
// store on o_state so set_state_data handler can access it for denormalization
o_state.o_relation_map = o_relation_map;

let o_socket = null;
let a_f_handler = [];
let n_ms__reconnect_delay = 1000;

let f_register_handler = function(f_handler) {
    a_f_handler.push(f_handler);
    return function() {
        let n_idx = a_f_handler.indexOf(f_handler);
        if (n_idx !== -1) a_f_handler.splice(n_idx, 1);
    };
};

let n_ms__wsmsg_timeout = 10000;

let f_send_wsmsg_with_response = async function(o_wsmsg, n_ms__timeout){
    let n_ms = n_ms__timeout || n_ms__wsmsg_timeout;
    return new Promise(function(resolve, reject) {
        let n_id__timeout = setTimeout(function(){
            f_unregister();
            reject(new Error(`wsmsg '${o_wsmsg.s_name}' timed out after ${n_ms}ms (uuid: ${o_wsmsg.s_uuid})`));
        }, n_ms);
        let f_handler_response = function(o_wsmsg2){
            if(o_wsmsg2.s_uuid === o_wsmsg.s_uuid){
                clearTimeout(n_id__timeout);
                f_unregister();
                resolve(o_wsmsg2);
            }
        }
        let f_unregister = f_register_handler(f_handler_response);
        o_socket.send(JSON.stringify(o_wsmsg))
    });
}


let n_ms__reconnect_cap = 60000;
let b_reconnecting = false;

let f_push_toast = function(s_message, s_type, n_ttl_ms){
    o_state.a_o_logmsg.push(
        f_o_logmsg(s_message, false, true, s_type, Date.now(), n_ttl_ms || 5000)
    );
};

let f_connect = async function() {
    return new Promise(function(resolve, reject) {
        try {
            let s_protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            o_socket = new WebSocket(s_protocol + '//' + window.location.host);

            o_socket.onopen = async function() {
                o_state.s_status = 'connected';
                o_state.b_connected = true;
                if(b_reconnecting){
                    f_push_toast('Reconnected to server', s_o_logmsg_s_type__info, 3000);
                    b_reconnecting = false;
                }
                n_ms__reconnect_delay = 1000;

                o_socket.send(JSON.stringify(
                    f_o_wsmsg(
                        o_wsmsg__logmsg.s_name,
                        f_o_logmsg(
                            'Hello from client!',
                            true,
                            false,
                            s_o_logmsg_s_type__log
                        )
                    )
                ));
                resolve();
            };

            o_socket.onmessage = async function(o_evt) {
                let o_wsmsg = JSON.parse(o_evt.data);

                // run UUID handlers first — server responses {v_result, s_uuid} have no s_name
                // so they must reach promise handlers before the definition lookup
                for (let f_handler of a_f_handler) {
                    f_handler(o_wsmsg);
                }

                let o_wsmsg__existing = a_o_wsmsg.find(function(o) { return o.s_name === o_wsmsg.s_name; });
                if(!o_wsmsg__existing){
                    return;
                }

                if(o_wsmsg__existing.f_v_client_implementation){
                    let v = await o_wsmsg__existing.f_v_client_implementation(o_wsmsg, o_wsmsg__existing, o_state);
                    if(o_wsmsg__existing.b_expecting_response){
                        o_socket.send(JSON.stringify({
                            v_result: v,
                            s_uuid: o_wsmsg.s_uuid,
                        }));
                    }
                }
            };

            o_socket.onerror = function() {
                f_push_toast('WebSocket error — connection to server lost', s_o_logmsg_s_type__error, 8000);
            };

            o_socket.onclose = function() {
                o_state.s_status = 'disconnected';
                o_state.b_connected = false;
                b_reconnecting = true;
                let n_sec = Math.round(n_ms__reconnect_delay / 1000);
                f_push_toast(
                    `Server disconnected — retrying in ${n_sec}s`,
                    s_o_logmsg_s_type__warn,
                    n_ms__reconnect_delay
                );
                setTimeout(async function() {
                    try {
                        await f_connect();
                    } catch {
                        // f_connect rejects on construction error, backoff continues via next onclose
                    }
                }, n_ms__reconnect_delay);
                n_ms__reconnect_delay = Math.min(n_ms__reconnect_delay * 2, n_ms__reconnect_cap);
            };

        } catch (o_error) {
            reject(o_error);
        }
    });
};

await f_connect();

let o_router = createRouter({
    history: createWebHashHistory(),
    routes: o_state.a_o_route,
});


globalThis.o_state = o_state;

setInterval(function(){ o_state.n_ts_ms_now = Date.now(); }, 1000);

let o_app = createApp({
    data: function() {
        return o_state;
    },
    template: 
    (await f_o_html_from_o_js(
        {
            a_o: [
                {
                    s_tag: "canvas", 
                    id: "background"
                },
                {
                    class: "nav", 
                    a_o: [
                        {
                            's_tag': "router-link",
                            'class': "interactable",
                            'v-for': "o_route in a_o_route",
                            ':to': 'o_route.path',
                            innerText: "{{ o_route.path }}",
                        }
                    ]
                },
                {
                    s_tag: "router-view"
                },  
                {
                    s_tag: "div",
                    class: "a_o_logmsg",
                    a_o: [
                        {
                            s_tag: "div",
                            class: "o_logmsg",
                            'v-for': "o_logmsg in a_o_logmsg",
                            ':class': "[o_logmsg.s_type, { expired: n_ts_ms_now > o_logmsg.n_ts_ms_created + o_logmsg.n_ttl_ms }]",
                            innerText: "{{ o_logmsg.s_message }}",
                        },
                        {
                            s_tag: "div",
                            class: "o_logmsg",
                            ':class': "[o_logmsg__run_command.s_type, { expired: n_ts_ms_now > o_logmsg__run_command.n_ts_ms_created + o_logmsg__run_command.n_ttl_ms }]",
                            innerText: "{{ o_logmsg__run_command.s_message }}",
                        },
                    ]

                },
                {
                    s_tag: "div",
                    class: "interactable",
                    ':class': "{ muted: b_utterance_muted }",
                    '@click': "b_utterance_muted = !b_utterance_muted",
                    ':title': "b_utterance_muted ? 'Unmute utterances' : 'Mute utterances'",
                    innerHTML: "{{ b_utterance_muted ? '&#128264;' : '&#128266;' }}",
                }
        ]
    }
    )).innerHTML,
    mounted: async function() {
        // Background shader
        let o_mod_bgshader = await import('./bgshader.js');
        o_mod_bgshader.f_start();
    },
});
globalThis.o_app = o_app;
globalThis.o_state = o_state;

o_app.use(o_router);

o_app.mount('#app');

let f_o_socket = function() {
    return o_socket;
};

// syncdata client implementation: apply broadcasts from other clients / server
o_wsmsg__syncdata.f_v_client_implementation = function(o_wsmsg, o_wsmsg__existing, o_state_ref){
    let v_data = o_wsmsg.v_data;
    f_apply_crud_to_a_o(o_state_ref[v_data.s_name_table], v_data.s_operation, v_data.o_data, s_name_prop_id);
    // denormalize newly created instance from broadcast
    if (v_data.s_operation === 'create') {
        let o_model = f_o_model__from_params(v_data.s_name_table, a_o_model);
        if (o_model) {
            f_denormalize_o_instance(v_data.o_data, o_model, o_state_ref, s_name_prop_id, o_relation_map);
        }
    }
};

o_wsmsg__syncdata.f_v_sync = async function({s_name_table, s_operation, o_data}){
    let o_resp = await f_send_wsmsg_with_response(
        f_o_wsmsg(o_wsmsg__syncdata.s_name, {
            s_name_table,
            s_operation,
            o_data
        })
    );
    if(o_resp.s_error) throw new Error(o_resp.s_error);
    let v_result = o_resp.v_result;
    if(s_operation !== 'read'){
        let o_data__for_state = s_operation === 'delete' ? o_data : v_result;
        f_apply_crud_to_a_o(o_state[s_name_table], s_operation, o_data__for_state, s_name_prop_id);
        // denormalize newly created instance from local sync
        if (s_operation === 'create') {
            let o_model = f_o_model__from_params(s_name_table, a_o_model);
            if (o_model) {
                f_denormalize_o_instance(o_data__for_state, o_model, o_state, s_name_prop_id, o_relation_map);
            }
        }
    }
    return v_result;
};

export {
    o_state,
    f_o_socket,
    f_send_wsmsg_with_response,
    o_wsmsg__syncdata
}