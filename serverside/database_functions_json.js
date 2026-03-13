// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import {
    a_o_model,
    f_s_name_table__from_o_model,
    f_s_name_foreign_key__params,
    f_o_model_instance,
    s_name_prop_id,
    f_a_s_error__invalid_model_instance,
    f_o_model__from_params,
    s_name_prop_ts_created,
    s_name_prop_ts_updated,
    a_o_data_default,
} from "../localhost/constructors.js";
import { s_path__db_json } from "./runtimedata.js";
import { s_db_create, s_db_read, s_db_update, s_db_delete } from "../localhost/runtimedata.js";

// in-memory store: { "a_o_student": [{...}, ...], ... }
let o_store = {};
// track next auto-increment id per table
let o_next_id = {};

let f_s_path__table = function(s_name_table) {
    return s_path__db_json + s_name_table + '.json';
};

let f_read_table = function(s_name_table) {
    let s_path = f_s_path__table(s_name_table);
    try {
        let s_json = Deno.readTextFileSync(s_path);
        return JSON.parse(s_json);
    } catch {
        return [];
    }
};

let f_write_table = function(s_name_table) {
    let s_path = f_s_path__table(s_name_table);
    let a_o = o_store[s_name_table] || [];
    Deno.writeTextFileSync(s_path, JSON.stringify(a_o, null, 2));
};

let f_n_next_id = function(s_name_table) {
    if (o_next_id[s_name_table] === undefined) {
        let a_o = o_store[s_name_table] || [];
        let n_max = 0;
        for (let o of a_o) {
            if (o.n_id > n_max) n_max = o.n_id;
        }
        o_next_id[s_name_table] = n_max + 1;
    }
    let n_id = o_next_id[s_name_table];
    o_next_id[s_name_table] = n_id + 1;
    return n_id;
};

let f_init_db = async function() {
    await Deno.mkdir(s_path__db_json, { recursive: true });

    for (let o_model of a_o_model) {
        let s_name_table = f_s_name_table__from_o_model(o_model);
        o_store[s_name_table] = f_read_table(s_name_table);

        // migrate existing records: add missing properties with null
        let a_s_name_prop = o_model.a_o_property.map(function(o_prop) { return o_prop.s_name; });
        for (let o_instance of o_store[s_name_table]) {
            for (let s_name_prop of a_s_name_prop) {
                if (!(s_name_prop in o_instance)) {
                    o_instance[s_name_prop] = null;
                    console.log(`[f_init_db json] Adding missing property '${s_name_prop}' to instance in '${s_name_table}'`);
                }
            }
        }
    }

    f_ensure_default_data();
};

let f_db_delete_table_data = function(s_name_table) {
    let o_model = f_o_model__from_params(s_name_table, a_o_model);
    if (!o_model) throw new Error(`Unknown table: ${s_name_table}`);
    o_store[s_name_table] = [];
    o_next_id[s_name_table] = 1;
    f_write_table(s_name_table);
    return true;
};

let f_v_crud__indb = function(
    s_name_crud_function,
    s_name_table,
    v_o_data,
    v_o_data_update
) {
    let o_model = f_o_model__from_params(s_name_table, a_o_model);
    if (!o_model) throw new Error(`Model not found for table ${s_name_table}`);
    let v_return = null;

    if (v_o_data && s_name_crud_function !== s_db_read) {
        let a_s_error = f_a_s_error__invalid_model_instance(o_model, v_o_data);
        if (a_s_error.length > 0) {
            throw new Error('Invalid model instance: ' + a_s_error.join('; '));
        }
    }

    // set timestamps
    if (s_name_crud_function === s_db_create) {
        v_o_data[s_name_prop_ts_created] = Date.now();
        v_o_data[s_name_prop_ts_updated] = Date.now();
    }
    if (s_name_crud_function === s_db_update) {
        v_o_data_update[s_name_prop_ts_updated] = Date.now();
    }

    // validate values
    let o_model_instance = null;
    if (v_o_data && s_name_crud_function !== s_db_read) {
        o_model_instance = f_o_model_instance(o_model, v_o_data);
    }

    if (s_name_crud_function === s_db_create) {
        // check b_unique constraints
        let a_o__existing = o_store[s_name_table] || [];
        for (let o_prop of o_model.a_o_property) {
            if (!o_prop.b_unique) continue;
            let v_val = v_o_data[o_prop.s_name];
            if (v_val === undefined || v_val === null) continue;
            let o_duplicate = a_o__existing.find(function(o) { return o[o_prop.s_name] === v_val; });
            if (o_duplicate) {
                throw new Error(`Unique constraint violation: ${o_prop.s_name} = '${v_val}' already exists in ${s_name_table}`);
            }
        }
        let n_id = f_n_next_id(s_name_table);
        o_model_instance.n_id = n_id;
        if (!o_store[s_name_table]) o_store[s_name_table] = [];
        o_store[s_name_table].push(o_model_instance);
        f_write_table(s_name_table);
        v_return = { ...o_model_instance };
    }

    if (s_name_crud_function === s_db_read) {
        let a_o = o_store[s_name_table] || [];
        if (v_o_data && Object.keys(v_o_data).length > 0) {
            a_o = a_o.filter(function(o_row) {
                for (let s_key in v_o_data) {
                    if (o_row[s_key] !== v_o_data[s_key]) return false;
                }
                return true;
            });
        }
        v_return = a_o.map(function(o) { return { ...o }; });
    }

    if (s_name_crud_function === s_db_update) {
        if (!v_o_data || v_o_data[s_name_prop_id] === undefined || v_o_data[s_name_prop_id] === null) {
            throw new Error(`id property (${s_name_prop_id}) is required for update`);
        }
        // check b_unique constraints for updated fields
        let a_o__all = o_store[s_name_table] || [];
        for (let o_prop of o_model.a_o_property) {
            if (!o_prop.b_unique) continue;
            if (!(o_prop.s_name in v_o_data_update)) continue;
            let v_val = v_o_data_update[o_prop.s_name];
            if (v_val === undefined || v_val === null) continue;
            let o_duplicate = a_o__all.find(function(o) { return o[o_prop.s_name] === v_val && o.n_id !== v_o_data[s_name_prop_id]; });
            if (o_duplicate) {
                throw new Error(`Unique constraint violation: ${o_prop.s_name} = '${v_val}' already exists in ${s_name_table}`);
            }
        }
        let n_id = v_o_data[s_name_prop_id];
        let a_o = o_store[s_name_table] || [];
        let n_idx = a_o.findIndex(function(o) { return o.n_id === n_id; });
        if (n_idx === -1) throw new Error(`Record with n_id=${n_id} not found in ${s_name_table}`);
        for (let s_key in v_o_data_update) {
            a_o[n_idx][s_key] = v_o_data_update[s_key];
        }
        f_write_table(s_name_table);
        v_return = { ...a_o[n_idx] };
    }

    if (s_name_crud_function === s_db_delete) {
        if (!v_o_data || v_o_data.n_id === undefined || v_o_data.n_id === null) return false;
        let a_o = o_store[s_name_table] || [];
        let n_idx = a_o.findIndex(function(o) { return o.n_id === v_o_data.n_id; });
        if (n_idx === -1) return false;
        a_o.splice(n_idx, 1);
        f_write_table(s_name_table);
        v_return = true;
    }

    return v_return;
};

let f_ensure_default_data = function() {
    let o_cache = {};

    let f_s_cache_key = function(s_name_model, o_data) {
        let a_s_part = Object.keys(o_data).sort().map(function(s_key) {
            return s_key + '=' + o_data[s_key];
        });
        return s_name_model + ':' + a_s_part.join(',');
    };

    let f_o_model__find_by_name = function(s_name) {
        return a_o_model.find(function(o) {
            return o.s_name === s_name;
        });
    };

    let f_o_model__junction = function(o_model_a, o_model_b) {
        let s_fk_a = f_s_name_foreign_key__params(o_model_a, s_name_prop_id);
        let s_fk_b = f_s_name_foreign_key__params(o_model_b, s_name_prop_id);
        return a_o_model.find(function(o_model) {
            let a_s_name_prop = o_model.a_o_property.map(function(o_prop) {
                return o_prop.s_name;
            });
            return a_s_name_prop.includes(s_fk_a) && a_s_name_prop.includes(s_fk_b);
        });
    };

    let f_o_instance__ensured_in_db = function(o_model, o_data_plain) {
        let s_key = f_s_cache_key(o_model.s_name, o_data_plain);
        if (o_cache[s_key]) {
            return o_cache[s_key];
        }
        let s_name_table = f_s_name_table__from_o_model(o_model);
        let a_o_existing = f_v_crud__indb(s_db_read, s_name_table, o_data_plain);
        let o_instance = null;
        if (a_o_existing && a_o_existing.length > 0) {
            o_instance = a_o_existing[0];
        } else {
            // before creating, check if a record with a matching unique field already exists
            // (the full-object read may miss it if non-unique fields differ)
            for (let o_prop of o_model.a_o_property) {
                if (!o_prop.b_unique) continue;
                let v_val = o_data_plain[o_prop.s_name];
                if (v_val === undefined || v_val === null) continue;
                let a_o_by_unique = f_v_crud__indb(s_db_read, s_name_table, { [o_prop.s_name]: v_val });
                if (a_o_by_unique && a_o_by_unique.length > 0) {
                    o_instance = a_o_by_unique[0];
                    break;
                }
            }
            if (!o_instance) {
                o_instance = f_v_crud__indb(s_db_create, s_name_table, o_data_plain);
            }
        }
        o_cache[s_key] = o_instance;
        return o_instance;
    };

    let f_o_instance__processed = function(o_model, o_data) {
        let o_data_plain = {};
        let a_o_nested = [];

        for (let s_prop in o_data) {
            let o_model__nested = f_o_model__find_by_name(s_prop);
            if (o_model__nested) {
                let o_instance__nested = f_o_instance__processed(o_model__nested, o_data[s_prop]);
                a_o_nested.push({ o_model: o_model__nested, o_instance: o_instance__nested });
            } else {
                let o_model__related = f_o_model__from_params(s_prop, a_o_model);
                if (o_model__related && Array.isArray(o_data[s_prop])) {
                    for (let v_element of o_data[s_prop]) {
                        let o_data__element = null;
                        if (typeof v_element === 'string') {
                            o_data__element = { s_name: v_element };
                        } else if (typeof v_element === 'object' && v_element !== null) {
                            o_data__element = v_element;
                        } else {
                            console.warn(`Unsupported element type in ${s_prop}: ${typeof v_element}`);
                            continue;
                        }
                        let o_instance__related = f_o_instance__processed(o_model__related, o_data__element);
                        a_o_nested.push({ o_model: o_model__related, o_instance: o_instance__related });
                    }
                } else {
                    o_data_plain[s_prop] = o_data[s_prop];
                }
            }
        }

        let a_s_name_prop__parent = o_model.a_o_property.map(function(o_prop) {
            return o_prop.s_name;
        });
        for (let o_nested of a_o_nested) {
            let s_fk = f_s_name_foreign_key__params(o_nested.o_model, s_name_prop_id);
            if (a_s_name_prop__parent.includes(s_fk)) {
                o_data_plain[s_fk] = o_nested.o_instance.n_id;
            }
        }

        let o_instance = f_o_instance__ensured_in_db(o_model, o_data_plain);

        for (let o_nested of a_o_nested) {
            let s_fk = f_s_name_foreign_key__params(o_nested.o_model, s_name_prop_id);
            if (!a_s_name_prop__parent.includes(s_fk)) {
                let o_model__junc = f_o_model__junction(o_model, o_nested.o_model);
                if (o_model__junc) {
                    let o_junction_data = {};
                    o_junction_data[f_s_name_foreign_key__params(o_model, s_name_prop_id)] = o_instance.n_id;
                    o_junction_data[f_s_name_foreign_key__params(o_nested.o_model, s_name_prop_id)] = o_nested.o_instance.n_id;
                    f_o_instance__ensured_in_db(o_model__junc, o_junction_data);
                } else {
                    console.warn(`No junction model found for ${o_model.s_name} <-> ${o_nested.o_model.s_name}`);
                }
            }
        }

        return o_instance;
    };

    for (let o_entry of a_o_data_default) {
        for (let s_key in o_entry) {
            let o_model = f_o_model__find_by_name(s_key);
            if (!o_model) {
                console.warn(`Model '${s_key}' not found in a_o_model, skipping`);
                continue;
            }
            f_o_instance__processed(o_model, o_entry[s_key]);
        }
    }
};

export {
    f_init_db,
    f_v_crud__indb,
    f_db_delete_table_data,
    f_ensure_default_data,
};
