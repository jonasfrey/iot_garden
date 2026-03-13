// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// benchmark: compare SQLite vs JSON backend writing 10000 o_student objects
// run: deno run --allow-read --allow-write --allow-env --allow-ffi --env serverside/testing/db_type.js

// set JSON path before any module imports resolve it
Deno.env.set('S_PATH__DB_JSON', './.gitignored/testing/appdb_benchmark/');

import { Database } from "jsr:@db/sqlite@0.11";
import {
    a_o_model,
    f_s_name_table__from_o_model,
    f_o_model_instance,
    f_o_model__from_params,
    s_name_prop_id,
    s_name_prop_ts_created,
    s_name_prop_ts_updated,
} from "../../localhost/constructors.js";
import { s_db_create, s_db_read } from "../../localhost/runtimedata.js";
import {
    f_init_db as f_init_db__json,
    f_v_crud__indb as f_v_crud__indb__json,
    f_db_delete_table_data as f_db_delete_table_data__json,
} from "../database_functions_json.js";

let n_count = 10000;
let s_name_table = 'a_o_student';
let s_path__db_sqlite = './.gitignored/testing/benchmark.db';
let s_path__db_json = './.gitignored/testing/appdb_benchmark/';

let o_model = f_o_model__from_params(s_name_table, a_o_model);

// --- SQLite helpers ---

let f_init_sqlite = async function() {
    await Deno.mkdir('./.gitignored/testing', { recursive: true });
    try { await Deno.remove(s_path__db_sqlite); } catch { /* ignore */ }
    let o_db = new Database(s_path__db_sqlite);
    let a_s_column = [];
    for (let o_prop of o_model.a_o_property) {
        if (o_prop.s_name === 'n_id') {
            a_s_column.push('n_id INTEGER PRIMARY KEY');
            continue;
        }
        let s_sql_type = 'TEXT';
        if (o_prop.s_type === 'number') s_sql_type = 'REAL';
        if (o_prop.s_type === 'boolean') s_sql_type = 'INTEGER';
        a_s_column.push(`${o_prop.s_name} ${s_sql_type}`);
    }
    o_db.exec(`CREATE TABLE IF NOT EXISTS ${s_name_table} (${a_s_column.join(', ')})`);
    return o_db;
};

let f_create_sqlite = function(o_db, o_data) {
    o_data[s_name_prop_ts_created] = Date.now();
    o_data[s_name_prop_ts_updated] = Date.now();
    let o_instance = f_o_model_instance(o_model, o_data);
    let a_s_key = Object.keys(o_instance);
    let a_v_val = Object.values(o_instance);
    let s_sql = `INSERT INTO ${s_name_table} (${a_s_key.join(', ')}) VALUES (${a_s_key.map(function() { return '?'; }).join(', ')})`;
    o_db.prepare(s_sql).run(...a_v_val);
    let o_last = o_db.prepare('SELECT last_insert_rowid() as n_id').get();
    return o_db.prepare(`SELECT * FROM ${s_name_table} WHERE n_id = ?`).get(o_last.n_id);
};

// --- benchmark ---

let f_benchmark = async function() {
    console.log(`\n=== DB Type Benchmark: ${n_count} o_student creates ===\n`);

    // --- SQLite ---
    let o_db = await f_init_sqlite();

    let n_ts__sqlite_start = performance.now();
    for (let n_i = 0; n_i < n_count; n_i++) {
        f_create_sqlite(o_db, { s_name: `student_${n_i}` });
    }
    let n_ms__sqlite = performance.now() - n_ts__sqlite_start;

    let n_cnt__sqlite = o_db.prepare(`SELECT count(*) as cnt FROM ${s_name_table}`).get().cnt;
    console.log(`SQLite: ${n_cnt__sqlite} records created`);
    o_db.close();

    // --- JSON ---
    try { await Deno.remove(s_path__db_json, { recursive: true }); } catch { /* ignore */ }
    await f_init_db__json();
    // clear default data seeded by init
    for (let o_m of a_o_model) {
        f_db_delete_table_data__json(f_s_name_table__from_o_model(o_m));
    }

    let n_ts__json_start = performance.now();
    for (let n_i = 0; n_i < n_count; n_i++) {
        f_v_crud__indb__json(s_db_create, s_name_table, { s_name: `student_${n_i}` });
    }
    let n_ms__json = performance.now() - n_ts__json_start;

    let a_o__json = f_v_crud__indb__json(s_db_read, s_name_table, {});
    console.log(`JSON:   ${a_o__json.length} records created`);

    // --- results ---
    let n_ratio = n_ms__json / n_ms__sqlite;
    let n_ops__sqlite = n_count / (n_ms__sqlite / 1000);
    let n_ops__json = n_count / (n_ms__json / 1000);

    console.log(`\n┌────────────┬──────────────┬──────────────────┐`);
    console.log(`│  Backend   │  Time (ms)   │  ops/sec         │`);
    console.log(`├────────────┼──────────────┼──────────────────┤`);
    console.log(`│  SQLite    │ ${n_ms__sqlite.toFixed(1).padStart(12)}│ ${n_ops__sqlite.toFixed(0).padStart(16)} │`);
    console.log(`│  JSON      │ ${n_ms__json.toFixed(1).padStart(12)}│ ${n_ops__json.toFixed(0).padStart(16)} │`);
    console.log(`└────────────┴──────────────┴──────────────────┘`);
    console.log(`\nJSON is ${n_ratio.toFixed(2)}x ${n_ratio > 1 ? 'slower' : 'faster'} than SQLite\n`);

    // cleanup
    try { await Deno.remove(s_path__db_sqlite); } catch { /* ignore */ }
    try { await Deno.remove(s_path__db_json, { recursive: true }); } catch { /* ignore */ }
};

await f_benchmark();
