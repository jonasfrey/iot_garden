// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.
import {
    f_db_delete_table_data,
    f_generate_model_constructors_for_cli_languages,
    f_init_db,
    f_v_crud__indb,
} from "./serverside/database_functions.js";
import { f_a_o_fsnode, f_o_uttdatainfo__read_or_create, f_v_result_from_o_wsmsg } from "./serverside/functions.js";
import { f_init_python } from "./serverside/cli_functions.js";
import {
    a_o_model,
    f_o_model__from_params,
    f_o_model_instance,
    o_model__o_course,
    o_model__o_wsclient,
    a_o_wsmsg,
    f_s_name_table__from_o_model,
    f_o_wsmsg,
    f_o_logmsg,
    o_wsmsg__logmsg,
    o_wsmsg__set_state_data,
    o_wsmsg__utterance,
    o_wsmsg__f_v_crud__indb,
    o_wsmsg__f_delete_table_data,
    o_wsmsg__syncdata,
    s_o_logmsg_s_type__log,
    s_o_logmsg_s_type__info,
    s_o_logmsg_s_type__error,
    s_name_prop_id,
    f_apply_crud_to_a_o,
    f_o_relation_map__from_a_o_model,
    f_denormalize_o_state,
    f_denormalize_o_instance,
} from "./localhost/constructors.js";
import {
    s_ds,
    s_root_dir,
    n_port,
    s_dir__static,
} from "./serverside/runtimedata.js";
import { s_db_create, s_db_read, s_db_update, s_db_delete } from "./localhost/runtimedata.js";

// guard: require .env file before running
// try {
//     await Deno.stat('.env');
// } catch {
//     console.log('.env file not found. Please create a .env file before running the websocket server.');
//     console.log('You can copy .env.example as a starting point:');
//     console.log('  cp .env.example .env');
//     Deno.exit(1);
// }

// we cannot simply check if a .env file exists, because env variables can also be set through other means (e.g. system environment, Deno CLI flags, etc.)
let s_db_type__env = Deno.env.get('S_DB_TYPE') ?? 'sqlite';
let a_s_env_required = [
    'PORT',
    'STATIC_DIR',
    'MODEL_CONSTRUCTORS_CLI_LANGUAGES_PATH',
    'S_UUID',
    'BIN_PYTHON',
    'PATH_VENV',
];
if (s_db_type__env === 'sqlite') {
    a_s_env_required.push('DB_PATH');
} else if (s_db_type__env === 'json') {
    a_s_env_required.push('S_PATH__DB_JSON');
}
let a_s_env_missing = a_s_env_required.filter(s => !Deno.env.get(s));
if (a_s_env_missing.length > 0) {
    console.log('Missing environment variables: ' + a_s_env_missing.join(', '));
    console.log('Set them in your .env file or environment before running the websocket server.');
    console.log('You can copy .env.example as a starting point:');
    console.log('  cp .env.example .env');
    Deno.exit(1);
}


let o_state = {}
let a_o_socket = [];

await f_init_db();
await f_init_python();
await f_generate_model_constructors_for_cli_languages();

// server-side syncdata: DB operation, o_state update, broadcast to clients
// o_socket__exclude: skip this socket when broadcasting (used for client-initiated syncs)
o_wsmsg__syncdata.f_v_sync = function({s_name_table, s_operation, o_data}, o_socket__exclude){
    let v_result = null;
    if(s_operation === 'read'){
        v_result = f_v_crud__indb(s_db_read, s_name_table, o_data);
    }
    if(s_operation === 'create'){
        v_result = f_v_crud__indb(s_db_create, s_name_table, o_data);
    }
    if(s_operation === 'update'){
        let n_id = o_data[s_name_prop_id];
        if(n_id == null) throw new Error('n_id is required for update');
        let o_update = {};
        for(let s_key in o_data){
            if(s_key === s_name_prop_id) continue;
            o_update[s_key] = o_data[s_key];
        }
        v_result = f_v_crud__indb(s_db_update, s_name_table, { [s_name_prop_id]: n_id }, o_update);
    }
    if(s_operation === 'delete'){
        let n_id = o_data[s_name_prop_id];
        if(n_id == null) throw new Error('n_id is required for delete');
        v_result = f_v_crud__indb(s_db_delete, s_name_table, o_data);
    }
    // update server o_state
    let o_data__for_state = s_operation === 'delete' ? o_data : v_result;
    f_apply_crud_to_a_o(o_state[s_name_table], s_operation, o_data__for_state, s_name_prop_id);
    // denormalize newly created instance
    if (s_operation === 'create' && o_relation_map) {
        let o_model = f_o_model__from_params(s_name_table, a_o_model);
        if (o_model) {
            f_denormalize_o_instance(o_data__for_state, o_model, o_state, s_name_prop_id, o_relation_map);
        }
    }
    // broadcast to clients (read operations are not broadcast)
    if(s_operation !== 'read' && v_result){
        let s_msg = JSON.stringify(
            f_o_wsmsg(o_wsmsg__syncdata.s_name, {
                s_name_table,
                s_operation,
                o_data: o_data__for_state
            })
        );
        for(let o_sock of a_o_socket){
            if(o_sock !== o_socket__exclude && o_sock.readyState === WebSocket.OPEN){
                o_sock.send(s_msg);
            }
        }
    }
    return v_result;
};

// websocket receive handler: delegate to f_v_sync, exclude sender from broadcast
o_wsmsg__syncdata.f_v_server_implementation = function(o_wsmsg, o_wsmsg__existing, o_state_ref, o_socket__sender){
    let { s_name_table, s_operation, o_data } = o_wsmsg.v_data;
    return o_wsmsg__syncdata.f_v_sync({s_name_table, s_operation, o_data}, o_socket__sender);
};

// initialize server-side state with DB table data
for (let o_model of a_o_model) {
    let s_name_table = f_s_name_table__from_o_model(o_model);
    o_state[s_name_table] = o_wsmsg__syncdata.f_v_sync({s_name_table, s_operation: 'read', o_data: {}}) || [];
}

// denormalize all state objects for relation access (e.g. o_student.a_o_course)
let o_relation_map = f_denormalize_o_state(o_state, a_o_model, s_name_prop_id);

let f_broadcast_db_data = function(s_name_table) {
    let a_o_data = o_wsmsg__syncdata.f_v_sync({s_name_table, s_operation: 'read', o_data: {}}) || [];
    o_state[s_name_table] = a_o_data;
    // re-denormalize the replaced array
    let o_model = f_o_model__from_params(s_name_table, a_o_model);
    if (o_model) {
        let a_o_relation = o_relation_map[o_model.s_name];
        if (a_o_relation && a_o_relation.length > 0) {
            for (let o_instance of a_o_data) {
                f_denormalize_o_instance(o_instance, o_model, o_state, s_name_prop_id, o_relation_map);
            }
        }
    }
    let s_msg = JSON.stringify(
        f_o_wsmsg(
            o_wsmsg__set_state_data.s_name,
            {
                s_property: s_name_table,
                value: a_o_data
            }
        )
    );
    for (let o_sock of a_o_socket) {
        if (o_sock.readyState === WebSocket.OPEN) {
            o_sock.send(s_msg);
        }
    }
};

let f_s_content_type = function(s_path) {
    if (s_path.endsWith('.html')) return 'text/html';
    if (s_path.endsWith('.js')) return 'application/javascript';
    if (s_path.endsWith('.css')) return 'text/css';
    if (s_path.endsWith('.json')) return 'application/json';
    return 'application/octet-stream';
};

// provide direct access to Deno specifc functions like Deno.writeFile through standard http requests


let f_handler = async function(o_request, o_conninfo) {
    // websocket upgrade

    if (o_request.headers.get('upgrade') === 'websocket') {
        // TODO: implement authentication before upgrading the WebSocket connection
        // e.g. validate a token from query params or cookies against a secret from .env
        let { socket: o_socket, response: o_response } = Deno.upgradeWebSocket(o_request);
        let s_ip = o_request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || o_conninfo.remoteAddr.hostname;
        let o_wsclient = f_o_model_instance(
            o_model__o_wsclient,
            {
                s_ip
            }
        );
        let s_name_table__wsclient = f_s_name_table__from_o_model(o_model__o_wsclient);
        let o_wsclient_db = (o_wsmsg__syncdata.f_v_sync({
            s_name_table: s_name_table__wsclient,
            s_operation: 'read',
            o_data: o_wsclient
        }) || []).at(0);
        if(!o_wsclient_db){
            o_wsclient_db = o_wsmsg__syncdata.f_v_sync({
                s_name_table: s_name_table__wsclient,
                s_operation: 'create',
                o_data: o_wsclient
            });
        }
        o_socket.onopen = async function() {
            console.log('websocket connected');
            a_o_socket.push(o_socket);
            o_socket.send(JSON.stringify(
                f_o_wsmsg(
                    o_wsmsg__set_state_data.s_name,
                    {
                        s_property: 's_root_dir',
                        value: s_root_dir
                    }
                )
            ));
            o_socket.send(JSON.stringify(
                f_o_wsmsg(
                    o_wsmsg__set_state_data.s_name,
                    {
                        s_property: 's_ds',
                        value: s_ds
                    }
                )
            ));

            for(let o_model of a_o_model){
                // use data from cache / o_state
                let s_name_table = f_s_name_table__from_o_model(o_model);
                let a_o = o_state[s_name_table] || [];
                o_socket.send(JSON.stringify(
                    f_o_wsmsg(
                        o_wsmsg__set_state_data.s_name,
                        {
                            s_property: f_s_name_table__from_o_model(o_model),
                            value: a_o
                        }
                    )
                ));

            }


        };

        o_socket.onmessage = async function(o_evt) {
            let o_wsmsg = JSON.parse(o_evt.data);
            //check if o_wsmsg exists            
            let o_wsmsg__existing = a_o_wsmsg.find(o => o.s_name === o_wsmsg.s_name);
            if(o_wsmsg__existing){

                try {
                    let v_result = await f_v_result_from_o_wsmsg(
                        o_wsmsg,
                        o_state,
                        o_socket
                    );
                    if(o_wsmsg__existing.b_expecting_response){
                        o_socket.send(JSON.stringify({
                            v_result,
                            s_uuid: o_wsmsg.s_uuid,
                        }));
                    }
                    // broadcast updated DB table state to all clients after mutations
                    let a_s_mutation = [s_db_create, s_db_update, s_db_delete];
                    if (o_wsmsg.s_name === o_wsmsg__f_v_crud__indb.s_name) {
                        let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
                        let s_operation = a_v_arg[0];
                        let s_name_table = a_v_arg[1];
                        if (s_name_table && a_s_mutation.includes(s_operation)) {
                            f_broadcast_db_data(s_name_table);
                        }
                    }
                    if (o_wsmsg.s_name === o_wsmsg__f_delete_table_data.s_name) {
                        let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
                        let s_name_table = a_v_arg[0];
                        if (s_name_table) {
                            f_broadcast_db_data(s_name_table);
                        }
                    }
                } catch (o_error) {
                    // send response with original s_uuid so client promise resolves
                    if(o_wsmsg__existing.b_expecting_response){
                        o_socket.send(JSON.stringify({
                            v_result: null,
                            s_uuid: o_wsmsg.s_uuid,
                            s_error: o_error.message,
                        }));
                    }
                    // send error logmsg for console + GUI toast
                    o_socket.send(JSON.stringify(
                        f_o_wsmsg(
                            o_wsmsg__logmsg.s_name,
                            f_o_logmsg(
                                o_error.message,
                                true,
                                true,
                                s_o_logmsg_s_type__error,
                                Date.now(),
                                8000
                            )
                        )
                    ));
                }

                // respond to hello from client
                if(o_wsmsg.s_name === o_wsmsg__logmsg.s_name && o_wsmsg.v_data.s_message === 'Hello from client!'){
                    o_socket.send(JSON.stringify(
                        f_o_wsmsg(
                            o_wsmsg__logmsg.s_name,
                            f_o_logmsg(
                                'Hello from server!',
                                true,
                                false,
                                s_o_logmsg_s_type__log
                            )
                        )
                    ));
                }
            }

        };

        o_socket.onclose = function() {
            console.log('websocket disconnected');
            let n_idx = a_o_socket.indexOf(o_socket);
            if (n_idx !== -1) {
                a_o_socket.splice(n_idx, 1);
            }
        };

        return o_response;
    }

    let o_url = new URL(o_request.url);
    let s_path = o_url.pathname;




    // ESP32 weather station: receive sensor readings via HTTP POST
    if (s_path === '/api/weatherreading' && o_request.method === 'POST') {
        try {
            let o_body = await o_request.json();
            let o_reading = o_wsmsg__syncdata.f_v_sync({
                s_name_table: 'a_o_weatherreading',
                s_operation: 'create',
                o_data: {
                    n_temperature: Number(o_body.n_temperature) || 0,
                    n_humidity: Number(o_body.n_humidity) || 0,
                    n_pressure: Number(o_body.n_pressure) || 0,
                    n_lux: Number(o_body.n_lux) || 0,
                }
            });
            return new Response(JSON.stringify(o_reading), {
                headers: { 'content-type': 'application/json' },
            });
        } catch (o_error) {
            return new Response(JSON.stringify({ s_error: o_error.message }), {
                status: 400,
                headers: { 'content-type': 'application/json' },
            });
        }
    }

    // WARNING: this endpoint reads arbitrary absolute paths with no restrictions.
    // restrict to a safe base directory before exposing this server on a network.
    if (s_path === '/api/file') {
        let s_path_file = o_url.searchParams.get('path');
        if (!s_path_file) {
            return new Response('Missing path parameter', { status: 400 });
        }
        try {
            let a_n_byte = await Deno.readFile(s_path_file);
            let s_content_type = 'application/octet-stream';
            if (s_path_file.endsWith('.jpg') || s_path_file.endsWith('.jpeg')) s_content_type = 'image/jpeg';
            if (s_path_file.endsWith('.png')) s_content_type = 'image/png';
            if (s_path_file.endsWith('.gif')) s_content_type = 'image/gif';
            if (s_path_file.endsWith('.webp')) s_content_type = 'image/webp';
            if (s_path_file.endsWith('.wav')) s_content_type = 'audio/wav';
            if (s_path_file.endsWith('.mp3')) s_content_type = 'audio/mpeg';
            if (s_path_file.endsWith('.ogg')) s_content_type = 'audio/ogg';
            return new Response(a_n_byte, {
                headers: { 'content-type': s_content_type },
            });
        } catch {
            return new Response('File not found', { status: 404 });
        }
    }

    // serve static file
    if (s_path === '/') {
        s_path = '/index.html';
    }

    try {
        let s_path_file = `${s_dir__static}${s_path}`.replace(/\//g, s_ds);
        let a_n_byte = await Deno.readFile(s_path_file);
        let s_content_type = f_s_content_type(s_path);
        return new Response(a_n_byte, {
            headers: { 'content-type': s_content_type },
        });
    } catch {
        return new Response('Not Found', { status: 404 });
    }
};

Deno.serve({
    port: n_port,
    onListen() {
        console.log(`server running on http://localhost:${n_port}`);
    },
}, f_handler);
