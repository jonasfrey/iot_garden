// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// derive project root from this file's location (serverside/ -> parent)
let n_idx__last_sep = Math.max(
    import.meta.dirname.lastIndexOf('/'),
    import.meta.dirname.lastIndexOf('\\')
);
let s_root_dir = import.meta.dirname.slice(0, n_idx__last_sep);

// directory separator
let s_ds = '/';
// if windows is detected as platform, change to backslash
if (Deno.build.os === 'windows') {
    s_ds = '\\';
}

// all .env variables gathered here, each script imports what it needs from this file
let n_port = parseInt(Deno.env.get('PORT') ?? '8000');
let s_dir__static = Deno.env.get('STATIC_DIR') ?? './localhost';
let s_db_type = Deno.env.get('S_DB_TYPE') ?? 'sqlite';
let s_path__database = Deno.env.get('DB_PATH') ?? './.gitignored/app.db';
let s_path__db_json = Deno.env.get('S_PATH__DB_JSON') ?? './.gitignored/appdb/';
let s_path__model_constructor_cli_language = Deno.env.get('MODEL_CONSTRUCTORS_CLI_LANGUAGES_PATH') ?? './.gitignored/model_constructors/';
let s_uuid = Deno.env.get('S_UUID') ?? '';
let s_bin__python = Deno.env.get('BIN_PYTHON') ?? 'python3';
let s_path__venv = Deno.env.get('PATH_VENV') ?? './venv';

let s_bin__glances = Deno.env.get('BIN_GLANCES') ?? 'glances';

export {
    s_root_dir,
    s_ds,
    n_port,
    s_dir__static,
    s_db_type,
    s_path__database,
    s_path__db_json,
    s_path__model_constructor_cli_language,
    s_uuid,
    s_bin__python,
    s_path__venv,
    s_bin__glances,
}