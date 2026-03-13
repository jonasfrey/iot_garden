// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPLv2. See LICENSE file for details.

// functions that spawn CLI subprocesses (python, pip, etc.)

import { s_ds, s_root_dir, s_uuid, s_bin__python, s_path__venv } from './runtimedata.js';
import { f_s_name_table__from_o_model, o_model__o_fsnode, o_model__o_utterance, o_wsmsg__syncdata } from '../localhost/constructors.js';

let f_init_python = async function(){
    let a_s_package = ['python-dotenv', 'pyttsx3'];

    // check if venv exists
    let b_venv_exists = true;
    try {
        await Deno.stat(s_path__venv);
    } catch {
        b_venv_exists = false;
    }

    if (!b_venv_exists) {
        console.log('[f_init_python] creating venv...');
        let o_proc__venv = new Deno.Command(s_bin__python, {
            args: ['-m', 'venv', s_path__venv],
            stdout: 'inherit',
            stderr: 'inherit',
        });
        let o_result__venv = await o_proc__venv.output();
        if (!o_result__venv.success) {
            console.error('[f_init_python] failed to create venv');
            return;
        }
        console.log('[f_init_python] venv created');
    }

    let s_path__pip = `${s_path__venv}${s_ds}bin${s_ds}pip`;
    if (Deno.build.os === 'windows') {
        s_path__pip = `${s_path__venv}${s_ds}Scripts${s_ds}pip.exe`;
    }

    // get list of already installed packages
    let o_proc__freeze = new Deno.Command(s_path__pip, {
        args: ['freeze'],
        stdout: 'piped',
        stderr: 'piped',
    });
    let o_result__freeze = await o_proc__freeze.output();
    let s_installed = new TextDecoder().decode(o_result__freeze.stdout).toLowerCase();

    // filter to only packages not yet installed
    let a_s_package__missing = a_s_package.filter(function(s_pkg) {
        // pip freeze outputs "package-name==version", compare lowercased
        return !s_installed.includes(s_pkg.toLowerCase());
    });

    if (a_s_package__missing.length === 0) {
        console.log('[f_init_python] all packages already installed');
        return;
    }

    console.log(`[f_init_python] installing: ${a_s_package__missing.join(', ')}...`);
    let o_proc__install = new Deno.Command(s_path__pip, {
        args: ['install', ...a_s_package__missing],
        stdout: 'inherit',
        stderr: 'inherit',
    });
    let o_result__install = await o_proc__install.output();
    if (!o_result__install.success) {
        console.error('[f_init_python] pip install failed');
        return;
    }
    console.log('[f_init_python] packages installed');
}

let f_o_uttdatainfo = async function(s_text){
    let s_name_script = 'f_o_uttdatainfo.py';
    let s_path__script = `${s_root_dir}${s_ds}serverside${s_ds}${s_name_script}`;
    // prefer venv python if it exists, fall back to system python
    let s_path__python = `${s_path__venv}${s_ds}bin${s_ds}python3`;
    try { await Deno.stat(s_path__python); } catch { s_path__python = s_bin__python; }
    let a_s_cmd = [s_path__python, s_path__script, s_text, '--s-uuid', s_uuid];

    let o_process = new Deno.Command(a_s_cmd[0], {
        args: a_s_cmd.slice(1),
        cwd: s_root_dir,
        stdout: 'piped',
        stderr: 'piped',
    });
    let o_output = await o_process.output();
    let s_stdout = new TextDecoder().decode(o_output.stdout);
    let s_stderr = new TextDecoder().decode(o_output.stderr);

    if(o_output.code !== 0){
        console.error(`${s_name_script} python script failed:`, s_stderr);
        throw new Error(`${s_name_script} exited with code ${o_output.code}: ${s_stderr}`);
    }

    // parse IPC block from stdout
    let s_tag__start = `${s_uuid}_start_json`;
    let s_tag__end = `${s_uuid}_end_json`;
    let n_idx__start = s_stdout.indexOf(s_tag__start);
    let n_idx__end = s_stdout.indexOf(s_tag__end);

    if(n_idx__start === -1 || n_idx__end === -1){
        console.error(`${s_name_script}: no IPC block found in stdout:\n`, s_stdout);
        throw new Error(`${s_name_script} did not emit IPC json block`);
    }

    let s_json = s_stdout.slice(n_idx__start + s_tag__start.length, n_idx__end).trim();
    let o_ipc = JSON.parse(s_json);
    // o_ipc: { o_utterance: { s_text, ... }, o_fsnode: { s_path_absolute, s_name, n_bytes, ... } }

    // create o_fsnode in db for the audio file
    let s_name_table__fsnode = f_s_name_table__from_o_model(o_model__o_fsnode);
    let o_fsnode = o_wsmsg__syncdata.f_v_sync({
        s_name_table: s_name_table__fsnode,
        s_operation: 'create',
        o_data: {
            s_path_absolute: o_ipc.o_fsnode.s_path_absolute,
            s_name: o_ipc.o_fsnode.s_name,
            n_bytes: o_ipc.o_fsnode.n_bytes,
            b_folder: false,
        }
    });

    // create o_utterance in db linked to o_fsnode
    let s_name_table__utterance = f_s_name_table__from_o_model(o_model__o_utterance);
    let o_utterance = o_wsmsg__syncdata.f_v_sync({
        s_name_table: s_name_table__utterance,
        s_operation: 'create',
        o_data: {
            s_text: o_ipc.o_utterance.s_text,
            n_o_fsnode_n_id: o_fsnode.n_id,
        }
    });

    return {
        o_utterance,
        o_fsnode,
    };
};


let f_install_linux_binary = async function(s_name_binary){
    // check if already available via PATH (which) before falling back to absolute path
    let o_proc__which = new Deno.Command('which', {
        args: [s_name_binary],
        stdout: 'piped',
        stderr: 'piped',
    });
    let o_result__which = await o_proc__which.output();
    if (o_result__which.success) {
        let s_path__found = new TextDecoder().decode(o_result__which.stdout).trim();
        console.log(`[f_install_linux_binary] ${s_name_binary} already installed at ${s_path__found}`);
        return;
    }

    console.log(`[f_install_linux_binary] ${s_name_binary} not found, attempting to install...`);

    // try apt-get first (debian/ubuntu)
    let o_proc__apt = new Deno.Command('sudo', {
        args: ['apt-get', 'install', '-y', s_name_binary],
        stdout: 'inherit',
        stderr: 'inherit',
    });
    let o_result__apt = await o_proc__apt.output();
    if (o_result__apt.success) {
        console.log(`[f_install_linux_binary] ${s_name_binary} installed via apt-get`);
        return;
    }

    // try pip (python packages like glances)
    let s_path__pip = 'pip3';
    let o_proc__pip = new Deno.Command(s_path__pip, {
        args: ['install', s_name_binary],
        stdout: 'inherit',
        stderr: 'inherit',
    });
    let o_result__pip = await o_proc__pip.output();
    if (o_result__pip.success) {
        console.log(`[f_install_linux_binary] ${s_name_binary} installed via pip3`);
        return;
    }

    // try snap as last resort
    let o_proc__snap = new Deno.Command('sudo', {
        args: ['snap', 'install', s_name_binary],
        stdout: 'inherit',
        stderr: 'inherit',
    });
    let o_result__snap = await o_proc__snap.output();
    if (o_result__snap.success) {
        console.log(`[f_install_linux_binary] ${s_name_binary} installed via snap`);
        return;
    }

    console.error(`[f_install_linux_binary] failed to install ${s_name_binary} via apt-get, pip3, or snap`);
}



export {
    f_init_python,
    f_o_uttdatainfo,
    f_install_linux_binary,
};
