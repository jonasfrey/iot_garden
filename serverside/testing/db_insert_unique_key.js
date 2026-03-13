// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// test: b_unique constraint on o_keyvalpair.s_key prevents duplicate inserts and updates
// run: deno run --allow-read --allow-write --allow-env --allow-ffi --env serverside/testing/db_insert_unique_key.js

// use isolated test db paths
Deno.env.set('S_PATH__DB_JSON', './.gitignored/testing/appdb_unique_test/');
Deno.env.set('S_PATH__DATABASE', './.gitignored/testing/unique_test.db');

import {
    a_o_model,
    f_s_name_table__from_o_model,
} from "../../localhost/constructors.js";
import { s_db_create, s_db_read, s_db_update, s_db_delete } from "../../localhost/runtimedata.js";
import {
    f_init_db as f_init_db__json,
    f_v_crud__indb as f_v_crud__indb__json,
    f_db_delete_table_data as f_db_delete_table_data__json,
} from "../database_functions_json.js";

let s_name_table = 'a_o_keyvalpair';
let n_passed = 0;
let n_failed = 0;

let f_assert = function(s_description, b_condition) {
    if (b_condition) {
        console.log(`  PASS: ${s_description}`);
        n_passed++;
    } else {
        console.error(`  FAIL: ${s_description}`);
        n_failed++;
    }
};

let f_test__json = async function() {
    console.log('\n=== b_unique constraint tests (JSON backend) ===\n');

    // init fresh db
    try { await Deno.remove('./.gitignored/testing/appdb_unique_test/', { recursive: true }); } catch { /* ignore */ }
    await f_init_db__json();
    // clear seeded data
    for (let o_m of a_o_model) {
        f_db_delete_table_data__json(f_s_name_table__from_o_model(o_m));
    }

    // test 1: first insert should succeed
    let o_result = f_v_crud__indb__json(s_db_create, s_name_table, { s_key: 'test_key', s_value: 'value_1' });
    f_assert('create first entry with unique s_key succeeds', o_result && o_result.s_key === 'test_key');

    // test 2: duplicate s_key should throw
    let b_threw = false;
    let s_error = '';
    try {
        f_v_crud__indb__json(s_db_create, s_name_table, { s_key: 'test_key', s_value: 'value_2' });
    } catch (o_err) {
        b_threw = true;
        s_error = o_err.message;
    }
    f_assert('create duplicate s_key throws error', b_threw);
    f_assert('error message mentions unique constraint', s_error.includes('Unique constraint violation'));

    // test 3: different s_key should succeed
    let o_result_2 = f_v_crud__indb__json(s_db_create, s_name_table, { s_key: 'other_key', s_value: 'value_3' });
    f_assert('create entry with different s_key succeeds', o_result_2 && o_result_2.s_key === 'other_key');

    // test 4: update to a conflicting s_key should throw
    b_threw = false;
    s_error = '';
    try {
        f_v_crud__indb__json(s_db_update, s_name_table, { n_id: o_result_2.n_id }, { s_key: 'test_key' });
    } catch (o_err) {
        b_threw = true;
        s_error = o_err.message;
    }
    f_assert('update s_key to existing value throws error', b_threw);
    f_assert('update error message mentions unique constraint', s_error.includes('Unique constraint violation'));

    // test 5: update s_key to same value on same record should succeed (not a conflict with itself)
    b_threw = false;
    try {
        f_v_crud__indb__json(s_db_update, s_name_table, { n_id: o_result.n_id }, { s_key: 'test_key' });
    } catch (o_err) {
        b_threw = true;
    }
    f_assert('update s_key to own existing value succeeds (no self-conflict)', !b_threw);

    // test 6: after deleting original, reuse of s_key should succeed
    f_v_crud__indb__json(s_db_delete, s_name_table, { n_id: o_result.n_id });
    b_threw = false;
    try {
        f_v_crud__indb__json(s_db_create, s_name_table, { s_key: 'test_key', s_value: 'value_reuse' });
    } catch (o_err) {
        b_threw = true;
    }
    f_assert('create with previously deleted s_key succeeds', !b_threw);

    // cleanup
    try { await Deno.remove('./.gitignored/testing/appdb_unique_test/', { recursive: true }); } catch { /* ignore */ }
};

await f_test__json();

console.log(`\n┌──────────────────────────────┐`);
console.log(`│  Results: ${n_passed} passed, ${n_failed} failed  │`);
console.log(`└──────────────────────────────┘\n`);

if (n_failed > 0) Deno.exit(1);
