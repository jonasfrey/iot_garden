// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { assertEquals } from "jsr:@std/assert";
import {
    o_model__o_course,
    o_model__o_student,
    o_model__o_course_o_student,
    o_model__o_fsnode,
    o_model__o_keyvalpair,
    o_model__o_wsclient,
    f_o_example_instance_connected_cricular_from_o_model,
    f_s_name_table__from_o_model,
    a_o_model,
    s_name_prop_id,
    s_name_prop_ts_created,
    s_name_prop_ts_updated,
} from "../../localhost/constructors.js";
import {
    f_init_db,
    f_v_crud__indb,
    f_a_o_instance__denormalized,
} from "../database_functions.js";
import { s_db_create } from "../../localhost/runtimedata.js";

Deno.test("simple sanity check", () => {
    let n_result = 1 + 2;
    assertEquals(n_result, 3);
});

Deno.test("f_o_example_instance_connected_cricular_from_o_model - o_course has own property", () => {
    let o = f_o_example_instance_connected_cricular_from_o_model(o_model__o_course, [], a_o_model, s_name_prop_id, s_name_prop_ts_created, s_name_prop_ts_updated);
    console.log(o)
    assertEquals(o.n_id, 1);
    assertEquals(o.s_name, 'string');
    assertEquals(typeof o.n_ts_ms_created, 'number');
    assertEquals(typeof o.n_ts_ms_updated, 'number');
});


Deno.test("f_o_example_instance_connected_cricular_from_o_model - o_student nests a_o_course via junction", () => {
    let o = f_o_example_instance_connected_cricular_from_o_model(o_model__o_student, [], a_o_model, s_name_prop_id, s_name_prop_ts_created, s_name_prop_ts_updated);
    assertEquals(Array.isArray(o.a_o_course), true);
    assertEquals(o.a_o_course.length, 1);
    assertEquals(o.a_o_course[0].n_id, 1);
    assertEquals(o.a_o_course[0].s_name, 'string');
    // circular back to student
    assertEquals(o.a_o_course[0].a_o_student[0], '...');
});

Deno.test("f_o_example_instance_connected_cricular_from_o_model - o_fsnode self-reference is circular", () => {
    let o = f_o_example_instance_connected_cricular_from_o_model(o_model__o_fsnode, [], a_o_model, s_name_prop_id, s_name_prop_ts_created, s_name_prop_ts_updated);
    console.log(o)
    // self-referencing: child fsnode should be circular
    assertEquals(Array.isArray(o.a_o_fsnode), true);
    assertEquals(o.a_o_fsnode[0], '...');
});

// --- f_a_o_instance__denormalized test (require DB) ---

let s_path__db_test = './.gitignored/test_relations.db';

Deno.test("f_a_o_instance__denormalized - setup test db", async () => {
    try { await Deno.remove(s_path__db_test); } catch(_e) { /* ignore */ }
    await f_init_db(s_path__db_test);

    // create two course
    let o_course__bio = f_v_crud__indb(s_db_create, f_s_name_table__from_o_model(o_model__o_course), { s_name: 'Biology' });
    let o_course__math = f_v_crud__indb(s_db_create, f_s_name_table__from_o_model(o_model__o_course), { s_name: 'Math' });

    // create two student
    let o_student__daria = f_v_crud__indb(s_db_create, f_s_name_table__from_o_model(o_model__o_student), { s_name: 'Daria' });
    let o_student__hansi = f_v_crud__indb(s_db_create, f_s_name_table__from_o_model(o_model__o_student), { s_name: 'Hansi' });

    // enrol: daria -> bio, hansi -> bio + math
    let s_name_table__junction = f_s_name_table__from_o_model(o_model__o_course_o_student);
    f_v_crud__indb(s_db_create, s_name_table__junction, { n_o_course_n_id: o_course__bio.n_id, n_o_student_n_id: o_student__daria.n_id });
    f_v_crud__indb(s_db_create, s_name_table__junction, { n_o_course_n_id: o_course__bio.n_id, n_o_student_n_id: o_student__hansi.n_id });
    f_v_crud__indb(s_db_create, s_name_table__junction, { n_o_course_n_id: o_course__math.n_id, n_o_student_n_id: o_student__hansi.n_id });

    // store id for subsequent test
    globalThis.o_test_id = {
        n_id__daria: o_student__daria.n_id,
        n_id__hansi: o_student__hansi.n_id,
        n_id__bio: o_course__bio.n_id,
        n_id__math: o_course__math.n_id,
    };
});

Deno.test("f_a_o_instance__denormalized - student with one course", () => {
    let a_o = f_a_o_instance__denormalized(o_model__o_student, [globalThis.o_test_id.n_id__daria], [], {}, true);
    console.log(JSON.stringify(a_o, null, 2));
    assertEquals(a_o.length, 1);
    assertEquals(a_o[0].s_name, 'Daria');
    // daria is enrolled in biology
    assertEquals(Array.isArray(a_o[0].a_o_course), true);
    assertEquals(a_o[0].a_o_course.length, 1);
    assertEquals(a_o[0].a_o_course[0].s_name, 'Biology');
    // circular: course should not recurse back into student
    assertEquals(a_o[0].a_o_course[0].a_o_student, '.');
});

Deno.test("f_a_o_instance__denormalized - student with two course", () => {
    let a_o = f_a_o_instance__denormalized(o_model__o_student, [globalThis.o_test_id.n_id__hansi], [], {}, true);
    assertEquals(a_o.length, 1);
    assertEquals(a_o[0].s_name, 'Hansi');
    assertEquals(a_o[0].a_o_course.length, 2);
    let a_s_name__course = a_o[0].a_o_course.map(function(o){ return o.s_name; }).sort();
    assertEquals(a_s_name__course, ['Biology', 'Math']);
});

Deno.test("f_a_o_instance__denormalized - multiple id at once", () => {
    let a_o = f_a_o_instance__denormalized(o_model__o_student, [
        globalThis.o_test_id.n_id__daria,
        globalThis.o_test_id.n_id__hansi
    ], [], {}, true);
    assertEquals(a_o.length, 2);
});

Deno.test("f_a_o_instance__denormalized - from course side", () => {
    let a_o = f_a_o_instance__denormalized(o_model__o_course, [globalThis.o_test_id.n_id__bio], [], {}, true);
    assertEquals(a_o.length, 1);
    assertEquals(a_o[0].s_name, 'Biology');
    // biology has two enrolled student
    assertEquals(Array.isArray(a_o[0].a_o_student), true);
    assertEquals(a_o[0].a_o_student.length, 2);
    // circular ref back to course
    assertEquals(a_o[0].a_o_student[0].a_o_course, '.');
});

Deno.test("f_a_o_instance__denormalized - nonexistent id returns empty", () => {
    let a_o = f_a_o_instance__denormalized(o_model__o_student, [99999], [], {}, true);
    assertEquals(a_o.length, 0);
});

Deno.test("f_a_o_instance__denormalized - cleanup test db", async () => {
    try { await Deno.remove(s_path__db_test); } catch(_e) { /* ignore */ }
});
