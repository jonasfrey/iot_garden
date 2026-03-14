// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// backend utility functions
// add shared server-side helper functions here and import them where needed

import { s_ds, s_root_dir, n_port, s_ssid, s_wifi_password } from './runtimedata.js';
import { s_db_create, s_db_read, s_db_update, s_db_delete } from '../localhost/runtimedata.js';
import { a_o_wsmsg, f_o_model_instance, f_s_name_table__from_o_model, o_model__o_fsnode, o_model__o_utterance, o_wsmsg__deno_copy_file, o_wsmsg__deno_mkdir, o_wsmsg__deno_stat, o_wsmsg__f_a_o_fsnode, o_wsmsg__f_delete_table_data, o_wsmsg__f_v_crud__indb, o_wsmsg__logmsg, o_wsmsg__set_state_data, o_wsmsg__syncdata, o_wsmsg__esp32_list_ports, o_wsmsg__esp32_compile, o_wsmsg__esp32_flash, o_wsmsg__esp32_install_libs, o_wsmsg__esp32_get_config } from '../localhost/constructors.js';
import { f_v_crud__indb, f_db_delete_table_data } from './database_functions.js';
import { f_o_uttdatainfo } from './cli_functions.js';

let f_a_o_fsnode = async function(
    s_path,
    b_recursive = false,
    b_store_in_db = false
) {
    let a_o = [];

    if (!s_path) {
        console.error('Invalid path:', s_path);
        return a_o;
    }
    if (!s_path.startsWith(s_ds)) {
        console.error('Path is not absolute:', s_path);
        return a_o;
    }

    try {
        for await (let o_dir_entry of Deno.readDir(s_path)) {
            let s_path_absolute = `${s_path}${s_ds}${o_dir_entry.name}`;

            let o_fsnode = f_o_model_instance(
                o_model__o_fsnode,
                {
                    s_path_absolute,
                    s_name: s_path_absolute.split(s_ds).at(-1),
                    b_folder: o_dir_entry.isDirectory,
                }
            );
            if(b_store_in_db){
                let s_name_table__fsnode = f_s_name_table__from_o_model(o_model__o_fsnode);
                let o_fsnode__fromdb = (o_wsmsg__syncdata.f_v_sync({s_name_table: s_name_table__fsnode, s_operation: 'read', o_data: { s_path_absolute }}) || []).at(0);
                if (o_fsnode__fromdb) {
                    o_fsnode.n_id = o_fsnode__fromdb.n_id;
                } else {
                    let o_fsnode__created = o_wsmsg__syncdata.f_v_sync({s_name_table: s_name_table__fsnode, s_operation: 'create', o_data: { s_path_absolute, b_folder: o_dir_entry.isDirectory }});
                    o_fsnode.n_id = o_fsnode__created.n_id;
                }
                if (o_dir_entry.isDirectory && b_recursive) {
                    o_fsnode.a_o_fsnode = await f_a_o_fsnode(s_path_absolute, b_recursive);
                }
            }

            a_o.push(o_fsnode);
        }
    } catch (o_error) {
        console.error(`Error reading directory: ${s_path}`, o_error.message);
        console.error(o_error.stack);
    }

    a_o.sort(function(o_a, o_b) {
        if (o_a.b_folder === o_b.b_folder) return (o_a.s_name || '').localeCompare(o_b.s_name || '');
        return o_a.b_folder ? -1 : 1;
    });

    return a_o;
};



// WARNING: the following deno_copy_file, deno_stat, deno_mkdir handlers expose raw Deno APIs
// to any connected WebSocket client with arbitrary arguments. Fine for local dev use,
// but must be restricted or removed before any network-exposed deployment.
o_wsmsg__deno_copy_file.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return Deno.copyFile(...a_v_arg);
}
o_wsmsg__deno_stat.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return Deno.stat(...a_v_arg);
}
o_wsmsg__deno_mkdir.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return Deno.mkdir(...a_v_arg);
}
o_wsmsg__f_v_crud__indb.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return f_v_crud__indb(...a_v_arg);
}
o_wsmsg__f_delete_table_data.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return f_db_delete_table_data(...a_v_arg);
}
o_wsmsg__f_a_o_fsnode.f_v_server_implementation = function(o_wsmsg){
    let a_v_arg = Array.isArray(o_wsmsg.v_data) ? o_wsmsg.v_data : [];
    return f_a_o_fsnode(...a_v_arg);
}
o_wsmsg__logmsg.f_v_server_implementation = function(o_wsmsg){
    let o_logmsg = o_wsmsg.v_data;
    if(o_logmsg.b_consolelog){
        console[o_logmsg.s_type](o_logmsg.s_message);
    }
    return null;
}
o_wsmsg__set_state_data.f_v_server_implementation = function(o_wsmsg, o_wsmsg__existing, o_state){
    o_state[o_wsmsg.v_data.s_property] = o_wsmsg.v_data.value;
    return null;
}
// --- ESP32 arduino-cli integration ---
let s_bin__arduino_cli = Deno.env.get('BIN_ARDUINO_CLI') || 'arduino-cli';
let s_fqbn__esp32s3 = 'esp32:esp32:esp32s3';
let s_path__sketch_dir = `${s_root_dir}${s_ds}.gitignored${s_ds}esp32_sketch`;

let f_run_cli = async function(a_s_args) {
    let o_process = new Deno.Command(s_bin__arduino_cli, {
        args: a_s_args,
        stdout: 'piped',
        stderr: 'piped',
    });
    let o_output = await o_process.output();
    let s_stdout = new TextDecoder().decode(o_output.stdout);
    let s_stderr = new TextDecoder().decode(o_output.stderr);
    return { b_success: o_output.success, s_stdout, s_stderr };
};

o_wsmsg__esp32_list_ports.f_v_server_implementation = async function() {
    let o_result = await f_run_cli(['board', 'list', '--format', 'json']);
    if (!o_result.b_success) {
        throw new Error('Failed to list ports: ' + o_result.s_stderr);
    }
    let o_parsed = JSON.parse(o_result.s_stdout);
    let a_o_detected = o_parsed.detected_ports || [];
    return a_o_detected.map(function(o) {
        let s_board_name = (o.matching_boards && o.matching_boards.length > 0)
            ? o.matching_boards[0].name : '';
        return {
            s_address: o.port.address,
            s_label: o.port.protocol_label + (s_board_name ? ' — ' + s_board_name : ''),
        };
    });
};

o_wsmsg__esp32_install_libs.f_v_server_implementation = async function() {
    let a_s_lib = ['Adafruit BME280 Library', 'BH1750'];
    let a_s_log = [];
    for (let s_lib of a_s_lib) {
        let o_result = await f_run_cli(['lib', 'install', s_lib]);
        if (o_result.b_success) {
            a_s_log.push(`Installed: ${s_lib}`);
        } else {
            a_s_log.push(`${s_lib}: ${o_result.s_stderr.trim()}`);
        }
    }
    return { a_s_log };
};

o_wsmsg__esp32_compile.f_v_server_implementation = async function(o_wsmsg) {
    let s_code = o_wsmsg.v_data.s_code;
    if (!s_code) throw new Error('No code provided');

    // ensure sketch directory exists
    await Deno.mkdir(s_path__sketch_dir, { recursive: true });

    // arduino-cli requires the .ino file name to match the directory name
    let s_path__ino = `${s_path__sketch_dir}${s_ds}esp32_sketch.ino`;
    await Deno.writeTextFile(s_path__ino, s_code);

    let o_result = await f_run_cli([
        'compile',
        '--fqbn', s_fqbn__esp32s3,
        s_path__sketch_dir,
    ]);

    return {
        b_success: o_result.b_success,
        s_stdout: o_result.s_stdout,
        s_stderr: o_result.s_stderr,
    };
};

o_wsmsg__esp32_flash.f_v_server_implementation = async function(o_wsmsg) {
    let s_port = o_wsmsg.v_data.s_port;
    if (!s_port) throw new Error('No port specified');

    let o_result = await f_run_cli([
        'upload',
        '--fqbn', s_fqbn__esp32s3,
        '--port', s_port,
        s_path__sketch_dir,
    ]);

    return {
        b_success: o_result.b_success,
        s_stdout: o_result.s_stdout,
        s_stderr: o_result.s_stderr,
    };
};

o_wsmsg__esp32_get_config.f_v_server_implementation = function() {
    return {
        s_ssid: s_ssid,
        s_password: s_wifi_password,
        n_port: n_port,
    };
};

let f_o_uttdatainfo__read_or_create = async function(s_text){
    let s_name_table__utterance = f_s_name_table__from_o_model(o_model__o_utterance);
    let s_name_table__fsnode = f_s_name_table__from_o_model(o_model__o_fsnode);
    let a_o_existing = o_wsmsg__syncdata.f_v_sync({s_name_table: s_name_table__utterance, s_operation: 'read', o_data: { s_text }}) || [];
    if(a_o_existing.length > 0){
        let o_utterance = a_o_existing[0];
        let o_fsnode = o_utterance.n_o_fsnode_n_id
            ? (o_wsmsg__syncdata.f_v_sync({s_name_table: s_name_table__fsnode, s_operation: 'read', o_data: { n_id: o_utterance.n_o_fsnode_n_id }}) || []).at(0)
            : null;
        return { o_utterance, o_fsnode };
    }
    // not found in db, generate new utterance audio
    return await f_o_uttdatainfo(s_text);
};

let f_v_result_from_o_wsmsg = async function(
    o_wsmsg,
    o_state,
    o_socket__sender
){
    let o_wsmsg__existing = a_o_wsmsg.find(o=>o.s_name === o_wsmsg.s_name);
    if(!o_wsmsg__existing){
        console.error('No such wsmsg:', o_wsmsg.s_name);
        return null;
    }
    if(!o_wsmsg__existing.f_v_server_implementation) {
        console.error('No server implementation for wsmsg:', o_wsmsg.s_name);
        return null;
    }
    return o_wsmsg__existing.f_v_server_implementation(
        o_wsmsg,
        o_wsmsg__existing,
        o_state,
        o_socket__sender
    );

}

export {
    f_a_o_fsnode,
    f_o_uttdatainfo__read_or_create,
    f_v_result_from_o_wsmsg
};
