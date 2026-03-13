// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import {
    f_o_property,
    f_o_model,
    f_s_name_table__from_o_model,
    f_s_name_foreign_key__params,
    f_a_s_error__invalid_model_instance,
    f_o_model__from_params,
    f_o_model_prop__default_id,
    f_o_model_prop__timestamp_default,
    f_o_model_instance,
    f_o_example_instance_connected_cricular_from_o_model,
    f_apply_crud_to_a_o,
    f_o_logmsg,
    f_o_wsmsg_def,
    f_o_wsmsg,
    f_o_relation_map__from_a_o_model,
    f_denormalize_o_state,
    f_denormalize_o_instance,
} from "@apn/websersocketgui/constructors_framework"

let s_name_prop_ts_created = 'n_ts_ms_created';
let s_name_prop_ts_updated = 'n_ts_ms_updated';
let s_name_prop_id = 'n_id';


let o_course__opensource101 = {
    s_name: 'Opensource 101'
}
let o_course__geometry101 = {
    s_name: 'Geometry 101'
}
let o_student__gretel = {
    s_name: 'Gretel',
    o_course: o_course__geometry101
}
let o_student__olaf = {
    s_name: 'Olaf',
    o_course: o_course__opensource101
}

let a_o_data_default = [
    {o_student: o_student__gretel},
    {o_student: o_student__olaf},
    {
        o_student: {
            s_name: "Daria",
            o_course: o_course__opensource101
        }
    },
    {
        o_keyvalpair: {
            s_key: 's_path_absolute__filebrowser',
            s_value: '/home'
        }
    },
    {
        o_course: {
            s_name: 'Database Systems 101',
            a_o_student: [
                'Gretel',
                'Olaf',
                'Daria',
                'Isabel',
                'Salomon',
                'Gandalf',
                'Rumplestiltskin',
                'Elizabeth',
                'Albert',
                'Tiffany',
            ]
        }
    },
]



let o_model__o_student = f_o_model({
    s_name: 'o_student',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_property('s_name', 'string', (s)=>{return s!==''}),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
})

let o_model__o_course = f_o_model({
    s_name: 'o_course',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_property('s_name', 'string', (s)=>{return s!==''}),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
})

let o_model__o_course_o_student = f_o_model({
    s_name: 'o_course_o_student', //'enrolment' table to link students and courses in a many-to-many relationship
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_model_prop__default_id(f_s_name_foreign_key__params(o_model__o_course, s_name_prop_id)),
        f_o_model_prop__default_id(f_s_name_foreign_key__params(o_model__o_student, s_name_prop_id)),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
})
let o_model__o_wsclient = f_o_model({
    s_name: 'o_wsclient',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_property('s_ip', 'string', (s)=>{return s!==''}),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
})
let o_model__o_fsnode = f_o_model({
    s_name: 'o_fsnode',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_model_prop__default_id('n_o_fsnode_n_id'),
        f_o_property('n_bytes', 'number'),
        f_o_property('s_name', 'string', (s)=>{return s!==''}),
        f_o_property('s_path_absolute', 'string', (s)=>{return s!==''}),
        f_o_property('b_folder', 'boolean', (b)=>{return typeof b === 'boolean'}),
        f_o_property('b_image', 'boolean'),
        f_o_property('b_video', 'boolean'),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
});
let o_model__o_keyvalpair = f_o_model({
    // a generic key-value pair model that ca be used for
    // config data
    // temporary data storage
    s_name: 'o_keyvalpair',
    a_o_property: [
        f_o_model_prop__default_id('n_id'),
        f_o_property('s_key', 'string', (s)=>{return s!==''}, true),
        f_o_property('s_value', 'string', (s)=>{return s!==''}),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
});

let o_model__o_utterance = f_o_model({
    s_name: 'o_utterance',
    a_o_property: [
        f_o_model_prop__default_id('n_id'),
        f_o_property('s_text', 'string', (s)=>{return s!==''}),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__default_id(f_s_name_foreign_key__params(o_model__o_fsnode, s_name_prop_id)),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
});

let o_model__o_weatherreading = f_o_model({
    s_name: 'o_weatherreading',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_property('n_temperature', 'number'),
        f_o_property('n_humidity', 'number'),
        f_o_property('n_pressure', 'number'),
        f_o_property('n_lux', 'number'),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
});


let s_o_logmsg_s_type__log = 'log';
let s_o_logmsg_s_type__error = 'error';
let s_o_logmsg_s_type__warn = 'warn';
let s_o_logmsg_s_type__info = 'info';
let s_o_logmsg_s_type__debug = 'debug';
let s_o_logmsg_s_type__table = 'table';


let a_o_model = [
    o_model__o_student,
    o_model__o_course,
    o_model__o_course_o_student,
    o_model__o_wsclient,
    o_model__o_fsnode,
    o_model__o_keyvalpair,
    o_model__o_utterance,
    o_model__o_weatherreading,
];



// message type definitions
let o_wsmsg__deno_copy_file = f_o_wsmsg_def('deno_copy_file', false);
let o_wsmsg__deno_stat = f_o_wsmsg_def('deno_stat', false);
let o_wsmsg__deno_mkdir = f_o_wsmsg_def('deno_mkdir', false);
let o_wsmsg__f_v_crud__indb = f_o_wsmsg_def('f_v_crud__indb', true);
let o_wsmsg__f_delete_table_data = f_o_wsmsg_def('f_delete_table_data', true);
let o_wsmsg__f_a_o_fsnode = f_o_wsmsg_def('f_a_o_fsnode', true);
let o_wsmsg__logmsg = f_o_wsmsg_def('logmsg', false);
let o_wsmsg__set_state_data = f_o_wsmsg_def('set_state_data', false);
let o_wsmsg__utterance = f_o_wsmsg_def('utterance', false);
let o_wsmsg__syncdata = f_o_wsmsg_def('syncdata', true);
let o_wsmsg__esp32_list_ports = f_o_wsmsg_def('esp32_list_ports', true);
let o_wsmsg__esp32_compile = f_o_wsmsg_def('esp32_compile', true);
let o_wsmsg__esp32_flash = f_o_wsmsg_def('esp32_flash', true);
let o_wsmsg__esp32_install_libs = f_o_wsmsg_def('esp32_install_libs', true);

// client implementations
o_wsmsg__logmsg.f_v_client_implementation = function(o_wsmsg, o_wsmsg__existing, o_state){
    let o_logmsg = o_wsmsg.v_data;
    if(o_logmsg.b_consolelog){
        console[o_logmsg.s_type](o_logmsg.s_message);
    }
    if(o_logmsg.b_guilog){
        o_logmsg.n_ts_ms_created = o_logmsg.n_ts_ms_created || Date.now();
        o_logmsg.n_ttl_ms = o_logmsg.n_ttl_ms || 5000;
        o_state.a_o_logmsg.push(o_logmsg);
    }
}
o_wsmsg__set_state_data.f_v_client_implementation = function(o_wsmsg, o_wsmsg__existing, o_state){
    o_state[o_wsmsg.v_data.s_property] = o_wsmsg.v_data.value;
    // denormalize newly arrived array if relation map is available on o_state
    if (o_state.o_relation_map) {
        let o_model = f_o_model__from_params(o_wsmsg.v_data.s_property, a_o_model);
        if (o_model) {
            let a_o_relation = o_state.o_relation_map[o_model.s_name];
            if (a_o_relation && a_o_relation.length > 0) {
                let a_o = o_state[o_wsmsg.v_data.s_property];
                for (let o_instance of a_o) {
                    f_denormalize_o_instance(o_instance, o_model, o_state, s_name_prop_id, o_state.o_relation_map);
                }
            }
        }
    }
}
o_wsmsg__utterance.f_v_client_implementation = function(o_wsmsg, o_wsmsg__existing, o_state){
    if(o_state.b_utterance_muted) return;
    let v_data = o_wsmsg.v_data;
    if(!v_data || !v_data.o_fsnode || !v_data.o_fsnode.s_path_absolute) return;
    let s_url = '/api/file?path=' + encodeURIComponent(v_data.o_fsnode.s_path_absolute);
    let o_audio = new Audio(s_url);
    o_audio.play().catch(function(o_error){
        console.warn('utterance audio playback failed (user interaction may be required):', o_error.message);
    });
}

let a_o_wsmsg = [
    o_wsmsg__deno_copy_file,
    o_wsmsg__deno_stat,
    o_wsmsg__deno_mkdir,
    o_wsmsg__f_v_crud__indb,
    o_wsmsg__f_delete_table_data,
    o_wsmsg__f_a_o_fsnode,
    o_wsmsg__logmsg,
    o_wsmsg__set_state_data,
    o_wsmsg__utterance,
    o_wsmsg__syncdata,
    o_wsmsg__esp32_list_ports,
    o_wsmsg__esp32_compile,
    o_wsmsg__esp32_flash,
    o_wsmsg__esp32_install_libs,
]

export {
    o_model__o_student,
    o_model__o_course,
    o_model__o_course_o_student,
    o_model__o_wsclient,
    o_model__o_fsnode,
    o_model__o_keyvalpair,
    o_model__o_utterance,
    o_model__o_weatherreading,
    a_o_model,
    f_o_property,
    f_o_model,
    f_o_model_prop__default_id,
    f_o_model_prop__timestamp_default,
    f_s_name_table__from_o_model,
    f_s_name_foreign_key__params,
    f_o_model_instance,
    f_o_model__from_params,
    s_name_prop_ts_created,
    s_name_prop_ts_updated,
    f_a_s_error__invalid_model_instance,
    s_name_prop_id,
    f_o_logmsg,
    a_o_wsmsg,
    o_wsmsg__deno_copy_file,
    o_wsmsg__deno_stat,
    o_wsmsg__deno_mkdir,
    o_wsmsg__f_v_crud__indb,
    o_wsmsg__set_state_data,
    o_wsmsg__f_delete_table_data,
    o_wsmsg__f_a_o_fsnode,
    o_wsmsg__logmsg,
    o_wsmsg__utterance,
    o_wsmsg__syncdata,
    o_wsmsg__esp32_list_ports,
    o_wsmsg__esp32_compile,
    o_wsmsg__esp32_flash,
    o_wsmsg__esp32_install_libs,
    f_o_wsmsg,
    f_o_wsmsg_def,
    s_o_logmsg_s_type__log,
    s_o_logmsg_s_type__error,
    s_o_logmsg_s_type__warn,
    s_o_logmsg_s_type__info,
    s_o_logmsg_s_type__debug,
    s_o_logmsg_s_type__table,
    a_o_data_default,
    f_o_example_instance_connected_cricular_from_o_model,
    f_apply_crud_to_a_o,
    f_o_relation_map__from_a_o_model,
    f_denormalize_o_state,
    f_denormalize_o_instance,
}
