// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

import { Database } from "jsr:@db/sqlite@0.11";
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
    f_o_example_instance_connected_cricular_from_o_model,
} from "../localhost/constructors.js";
import { s_ds, s_db_type, s_path__database, s_path__model_constructor_cli_language } from "./runtimedata.js";
import { s_db_create, s_db_read, s_db_update, s_db_delete } from "../localhost/runtimedata.js";
import { ensureDir as f_ensure_dir } from "@std/fs";

import {
    f_init_db as f_init_db__json,
    f_v_crud__indb as f_v_crud__indb__json,
    f_db_delete_table_data as f_db_delete_table_data__json,
    f_ensure_default_data as f_ensure_default_data__json,
} from "./database_functions_json.js";

let b_json = s_db_type === 'json';

let o_db = null;

let f_init_db = async function(s_path_db = s_path__database) {
    if (b_json) {
        return await f_init_db__json();
    }
    //make sure the folder where db should be stored exists
    await Deno.mkdir(s_path_db.slice(0, s_path_db.lastIndexOf(s_ds)), { recursive: true });

    o_db = new Database(s_path_db);

    for (let o_model of a_o_model) {
        let s_name_table = f_s_name_table__from_o_model(o_model);
        let a_s_column = [];
        let a_s_fk = [];

        for (let o_prop of o_model.a_o_property) {
            if (o_prop.s_name === 'n_id') {
                a_s_column.push('n_id INTEGER PRIMARY KEY');
                continue;
            }
            
            let s_sql_type = 'TEXT';
            if (o_prop.s_type === 'number') s_sql_type = 'REAL';
            if (o_prop.s_type === 'boolean') s_sql_type = 'INTEGER';

            let s_unique = o_prop.b_unique ? ' UNIQUE' : '';
            a_s_column.push(`${o_prop.s_name} ${s_sql_type}${s_unique}`);

            // detect foreign key
            let o_model__foreign = a_o_model.find(function(o) {
                return f_s_name_foreign_key__params(o, s_name_prop_id) === o_prop.s_name;
            });
            if (o_model__foreign) {
                let s_name_table_ref = f_s_name_table__from_o_model(o_model__foreign);
                a_s_fk.push(`FOREIGN KEY (${o_prop.s_name}) REFERENCES ${s_name_table_ref}(n_id)`);
            }
        }

        let s_sql = `CREATE TABLE IF NOT EXISTS ${s_name_table} (\n${a_s_column.concat(a_s_fk).join(',\n')}\n)`;
        o_db.exec(s_sql);

        // check for schema differences between JS model and existing DB table
        let a_o_column__db = o_db.prepare(`PRAGMA table_info(${s_name_table})`).all();
        let a_s_name_column__db = a_o_column__db.map(function(o_col) { return o_col.name; });
        let a_s_name_column__model = o_model.a_o_property.map(function(o_prop) { return o_prop.s_name; });

        // add columns that exist in JS model but not in DB
        for (let o_prop of o_model.a_o_property) {
            if (!a_s_name_column__db.includes(o_prop.s_name)) {
                let s_sql_type = 'TEXT';
                if (o_prop.s_type === 'number') s_sql_type = 'REAL';
                if (o_prop.s_type === 'boolean') s_sql_type = 'INTEGER';
                let s_sql_alter = `ALTER TABLE ${s_name_table} ADD COLUMN ${o_prop.s_name} ${s_sql_type}`;
                console.log(`[f_init_db] Adding missing column '${o_prop.s_name}' to table '${s_name_table}'`);
                o_db.exec(s_sql_alter);
            }
        }

        // warn about columns that exist in DB but not in JS model
        for (let s_name_column of a_s_name_column__db) {
            if (!a_s_name_column__model.includes(s_name_column)) {
                console.warn(`[f_init_db] WARNING: Column '${s_name_column}' exists in DB table '${s_name_table}' but is not defined in the JS model '${o_model.s_name}'`);
            }
        }
    }

    f_ensure_default_data();
    return o_db;
};


// generic db CRUD

let f_db_delete_table_data = function(s_name_table){
    if (b_json) return f_db_delete_table_data__json(s_name_table);
    let o_model = f_o_model__from_params(s_name_table, a_o_model);
    if(!o_model) throw new Error(`Unknown table: ${s_name_table}`);
    o_db.exec('PRAGMA foreign_keys = OFF');
    let v_result = o_db.prepare(`DELETE FROM ${s_name_table}`).run();
    o_db.exec('PRAGMA foreign_keys = ON');
    return v_result;
}
let f_v_crud__indb = function(
    s_name_crud_function,
    s_name_table,
    v_o_data,
    v_o_data_update
){
    if (b_json) return f_v_crud__indb__json(s_name_crud_function, s_name_table, v_o_data, v_o_data_update);
    let o_model = f_o_model__from_params(s_name_table, a_o_model);
    if(!o_model) throw new Error(`Model not found for table ${s_name_table}`);
    let v_return = null;
    
    if(v_o_data && s_name_crud_function !== s_db_read){

        let a_s_error = f_a_s_error__invalid_model_instance(o_model, v_o_data);
        if(a_s_error.length > 0){
            throw new Error('Invalid model instance: ' + a_s_error.join('; '));
        }
    }

    // set timestamps
    if(s_name_crud_function === s_db_create){
        v_o_data[s_name_prop_ts_created] = Date.now();
        v_o_data[s_name_prop_ts_updated] = Date.now();
    }
    if(s_name_crud_function === s_db_update){
        v_o_data_update[s_name_prop_ts_updated] = Date.now();
    }

    // validate values
    let o_model_instance = null;
    let a_s_name_property = null;
    let a_v_value = null;
    if(v_o_data && s_name_crud_function !== s_db_read){

        o_model_instance = f_o_model_instance(o_model, v_o_data);
        a_s_name_property = Object.keys(o_model_instance);
        a_v_value = Object.values(o_model_instance);
    }

    if (s_name_crud_function === s_db_create) {
        // check b_unique constraints
        for (let o_prop of o_model.a_o_property) {
            if (!o_prop.b_unique) continue;
            let v_val = v_o_data[o_prop.s_name];
            if (v_val === undefined || v_val === null) continue;
            let o_existing = o_db.prepare(`SELECT n_id FROM ${s_name_table} WHERE ${o_prop.s_name} = ?`).get(v_val);
            if (o_existing) {
                throw new Error(`Unique constraint violation: ${o_prop.s_name} = '${v_val}' already exists in ${s_name_table}`);
            }
        }
        // v_o_data should be an instance of o_model
        let s_sql = `INSERT INTO ${s_name_table} (${a_s_name_property.join(', ')}) VALUES (${a_s_name_property.map(function() { return '?'; }).join(', ')})`;
        o_db.prepare(s_sql).run(...a_v_value);


        let o_last = o_db.prepare('SELECT last_insert_rowid() as n_id').get();
        v_return = o_db.prepare(`SELECT * FROM ${s_name_table} WHERE n_id = ?`).get(o_last.n_id)
    }

    if (s_name_crud_function === s_db_read) {
        // v_o_data is not null we use the specified properties as filters for the query
        let s_query = `SELECT * FROM ${s_name_table}`;
        if (v_o_data) {
            let a_s_filter = [];
            for (let s_key in v_o_data) {
                a_s_filter.push(`${s_key} = ?`);
            }
            if (a_s_filter.length > 0) {
                s_query += ` WHERE ${a_s_filter.join(' AND ')}`;
            }
        }
        // console.log(s_query);
        // console.log(v_o_data);
        let a_o_row = o_db.prepare(s_query).all(...(v_o_data ? Object.values(v_o_data) : []));
        v_return = a_o_row
        
        // v_return = a_o_row.map(function(o_row) { return f_o_row__deserialized(o_model, o_row); });
    }

    if (s_name_crud_function === s_db_update) {
        // v_o_data identifies the record (must have n_id)
        // v_o_data_update has the fields to change
        if(!v_o_data || v_o_data[s_name_prop_id] === undefined || v_o_data[s_name_prop_id] === null){
            throw new Error(`id property (${s_name_prop_id}) is required for update`);
        }
        // check b_unique constraints for updated fields
        for (let o_prop of o_model.a_o_property) {
            if (!o_prop.b_unique) continue;
            if (!(o_prop.s_name in v_o_data_update)) continue;
            let v_val = v_o_data_update[o_prop.s_name];
            if (v_val === undefined || v_val === null) continue;
            let o_existing = o_db.prepare(`SELECT n_id FROM ${s_name_table} WHERE ${o_prop.s_name} = ? AND n_id != ?`).get(v_val, v_o_data[s_name_prop_id]);
            if (o_existing) {
                throw new Error(`Unique constraint violation: ${o_prop.s_name} = '${v_val}' already exists in ${s_name_table}`);
            }
        }
        let a_s_name_prop__update = Object.keys(v_o_data_update);
        let a_v_value__update = Object.values(v_o_data_update);
        let a_s_set = a_s_name_prop__update.map(function(s_key) { return `${s_key} = ?`; });
        let s_sql = `UPDATE ${s_name_table} SET ${a_s_set.join(', ')} WHERE ${s_name_prop_id} = ?`;
        o_db.prepare(s_sql).run(...a_v_value__update, v_o_data[s_name_prop_id]);
        v_return = o_db.prepare(`SELECT * FROM ${s_name_table} WHERE n_id = ?`).get(v_o_data[s_name_prop_id]);
    }

    if (s_name_crud_function === s_db_delete) {
        if(!a_s_name_property.includes(s_name_prop_id)){
            throw new Error(`id property (${s_name_prop_id}) is required for delete`);
        }
        // v_o_data should be an instance of o_model, with n_id property set to the id of the row to delete
        if (!v_o_data || v_o_data.n_id === undefined || v_o_data.n_id === null) return false;
        o_db.exec('PRAGMA foreign_keys = OFF');
        o_db.prepare(`DELETE FROM ${s_name_table} WHERE n_id = ?`).run(v_o_data.n_id);
        o_db.exec('PRAGMA foreign_keys = ON');
        v_return = true;
    }

    return v_return;
};



let f_ensure_default_data = function(){
    // reads 'denormalized' object structure from a_o_data_default and creates corresponding instances in db,
    // minimal example { o_person: {s_name: "Gretel", o_pet: {s_name: "Hansi"}}} with models Person and Pet where Person has a FK to Pet,
    // cache to deduplicate instances: "model_name:key=val,key=val" -> db record
    let o_cache = {};

    let f_s_cache_key = function(s_name_model, o_data){
        let a_s_part = Object.keys(o_data).sort().map(function(s_key){
            return s_key + '=' + o_data[s_key];
        });
        return s_name_model + ':' + a_s_part.join(',');
    };

    let f_o_model__find_by_name = function(s_name){
        return a_o_model.find(function(o){
            return o.s_name === s_name;
        });
    };

    // find a junction model that has foreign keys to both models (many-to-many)
    let f_o_model__junction = function(o_model_a, o_model_b){
        let s_fk_a = f_s_name_foreign_key__params(o_model_a, s_name_prop_id);
        let s_fk_b = f_s_name_foreign_key__params(o_model_b, s_name_prop_id);
        return a_o_model.find(function(o_model){
            let a_s_name_prop = o_model.a_o_property.map(function(o_prop){
                return o_prop.s_name;
            });
            return a_s_name_prop.includes(s_fk_a) && a_s_name_prop.includes(s_fk_b);
        });
    };

    // find or create a model instance in db, with caching for deduplication
    let f_o_instance__ensured_in_db = function(o_model, o_data_plain){
        let s_key = f_s_cache_key(o_model.s_name, o_data_plain);
        if(o_cache[s_key]){
            return o_cache[s_key];
        }
        let s_name_table = f_s_name_table__from_o_model(o_model);
        let a_o_existing = f_v_crud__indb(s_db_read, s_name_table, o_data_plain);
        let o_instance = null;
        if(a_o_existing && a_o_existing.length > 0){
            o_instance = a_o_existing[0];
        } else {
            o_instance = f_v_crud__indb(s_db_create, s_name_table, o_data_plain);
        }
        o_cache[s_key] = o_instance;
        return o_instance;
    };

    // recursively process a model's data: separate plain props from nested model refs,
    // create nested instances first, then handle FK / junction relationships
    let f_o_instance__processed = function(o_model, o_data){
        let o_data_plain = {};
        let a_o_nested = [];

        for(let s_prop in o_data){
            let o_model__nested = f_o_model__find_by_name(s_prop);
            if(o_model__nested){
                // recursively process nested model data
                let o_instance__nested = f_o_instance__processed(o_model__nested, o_data[s_prop]);
                a_o_nested.push({o_model: o_model__nested, o_instance: o_instance__nested});
            } else {
                // check if property name matches a table name (e.g. a_o_student) with an array value
                let o_model__related = f_o_model__from_params(s_prop, a_o_model);
                if(o_model__related && Array.isArray(o_data[s_prop])){
                    for(let v_element of o_data[s_prop]){
                        let o_data__element = null;
                        if(typeof v_element === 'string'){
                            // shorthand: string is treated as s_name value
                            o_data__element = {s_name: v_element};
                        } else if(typeof v_element === 'object' && v_element !== null){
                            o_data__element = v_element;
                        } else {
                            console.warn(`Unsupported element type in ${s_prop}: ${typeof v_element}`);
                            continue;
                        }
                        let o_instance__related = f_o_instance__processed(o_model__related, o_data__element);
                        a_o_nested.push({o_model: o_model__related, o_instance: o_instance__related});
                    }
                } else {
                    o_data_plain[s_prop] = o_data[s_prop];
                }
            }
        }

        // if parent model has a direct FK to a nested model (one-to-many), set it
        let a_s_name_prop__parent = o_model.a_o_property.map(function(o_prop){
            return o_prop.s_name;
        });
        for(let o_nested of a_o_nested){
            let s_fk = f_s_name_foreign_key__params(o_nested.o_model, s_name_prop_id);
            if(a_s_name_prop__parent.includes(s_fk)){
                o_data_plain[s_fk] = o_nested.o_instance.n_id;
            }
        }

        // find or create this instance
        let o_instance = f_o_instance__ensured_in_db(o_model, o_data_plain);

        // for nested models without direct FK, create junction table entries (many-to-many)
        for(let o_nested of a_o_nested){
            let s_fk = f_s_name_foreign_key__params(o_nested.o_model, s_name_prop_id);
            if(!a_s_name_prop__parent.includes(s_fk)){
                let o_model__junc = f_o_model__junction(o_model, o_nested.o_model);
                if(o_model__junc){
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

    // process each entry in the default data array
    for(let o_entry of a_o_data_default){
        for(let s_key in o_entry){
            let o_model = f_o_model__find_by_name(s_key);
            if(!o_model){
                console.warn(`Model '${s_key}' not found in a_o_model, skipping`);
                continue;
            }
            f_o_instance__processed(o_model, o_entry[s_key]);
        }
    }
};

let f_a_o_instance__with_relations__old = function(o_model, a_n_id, a_s_name__visited = []){
    let s_name_table = f_s_name_table__from_o_model(o_model);

    // load instance by id
    let a_o_instance = [];
    for(let n_id of a_n_id){
        let o_instance = o_db.prepare(`SELECT * FROM ${s_name_table} WHERE n_id = ?`).get(n_id);
        if(o_instance) a_o_instance.push(o_instance);
    }

    a_s_name__visited = [...a_s_name__visited, o_model.s_name];

    let s_fk__self = f_s_name_foreign_key__params(o_model, s_name_prop_id);

    // for each instance, discover and attach related data
    for(let o_instance of a_o_instance){
        for(let o_model__candidate of a_o_model){
            // find foreign key property in candidate (excluding primary n_id)
            let a_o_prop__fk = o_model__candidate.a_o_property.filter(function(o_prop){
                return o_prop.s_name !== s_name_prop_id
                    && o_prop.s_name.startsWith('n_')
                    && o_prop.s_name.endsWith(`_${s_name_prop_id}`);
            });

            let b_references_self = a_o_prop__fk.some(function(o_prop){
                return o_prop.s_name === s_fk__self;
            });

            if(!b_references_self) continue;

            let b_junction = a_o_prop__fk.length >= 2;

            if(b_junction){
                // junction table: follow through to the connected model
                for(let o_prop__fk of a_o_prop__fk){
                    if(o_prop__fk.s_name === s_fk__self) continue;

                    let o_model__connected = a_o_model.find(function(o_m){
                        return f_s_name_foreign_key__params(o_m, s_name_prop_id) === o_prop__fk.s_name;
                    });

                    if(!o_model__connected) continue;

                    let s_key = f_s_name_table__from_o_model(o_model__connected);

                    if(a_s_name__visited.includes(o_model__connected.s_name)){
                        o_instance[s_key] = '.';
                    } else {
                        let s_name_table__junction = f_s_name_table__from_o_model(o_model__candidate);
                        let a_o_junction = o_db.prepare(
                            `SELECT ${o_prop__fk.s_name} FROM ${s_name_table__junction} WHERE ${s_fk__self} = ?`
                        ).all(o_instance.n_id);

                        let a_n_id__related = a_o_junction.map(function(o_row){
                            return o_row[o_prop__fk.s_name];
                        });

                        if(a_n_id__related.length > 0){
                            o_instance[s_key] = f_a_o_instance__with_relations(
                                o_model__connected, a_n_id__related, a_s_name__visited
                            );
                        } else {
                            o_instance[s_key] = [];
                        }
                    }
                }
            } else {
                // direct foreign key: candidate belongs to this model
                let s_key = f_s_name_table__from_o_model(o_model__candidate);

                if(a_s_name__visited.includes(o_model__candidate.s_name)){
                    o_instance[s_key] = '.';
                } else {
                    let s_name_table__candidate = f_s_name_table__from_o_model(o_model__candidate);
                    let a_o_related = o_db.prepare(
                        `SELECT n_id FROM ${s_name_table__candidate} WHERE ${s_fk__self} = ?`
                    ).all(o_instance.n_id);

                    let a_n_id__related = a_o_related.map(function(o_row){
                        return o_row.n_id;
                    });

                    if(a_n_id__related.length > 0){
                        o_instance[s_key] = f_a_o_instance__with_relations(
                            o_model__candidate, a_n_id__related, a_s_name__visited
                        );
                    } else {
                        o_instance[s_key] = [];
                    }
                }
            }
        }
    }

    return a_o_instance;
}

let f_a_o_instance__denormalized = function(o_model, a_n_id, a_s_name__visited = [], o_cache, b_read_from_db = false){
    let s_name_table = f_s_name_table__from_o_model(o_model);

    // load instances either from db or from cache
    let a_o_instance = [];
    if(b_read_from_db){
        for(let n_id of a_n_id){
            let o_instance = o_db.prepare(`SELECT * FROM ${s_name_table} WHERE n_id = ?`).get(n_id);
            if(o_instance) a_o_instance.push({...o_instance});
        }
    } else {
        let a_o_cached = o_cache[s_name_table] || [];
        for(let n_id of a_n_id){
            let o_instance = a_o_cached.find(function(o){ return o.n_id === n_id; });
            if(o_instance) a_o_instance.push({...o_instance});
        }
    }

    a_s_name__visited = [...a_s_name__visited, o_model.s_name];

    let s_fk__self = f_s_name_foreign_key__params(o_model, s_name_prop_id);

    // for each instance, discover and attach related data
    for(let o_instance of a_o_instance){
        for(let o_model__candidate of a_o_model){
            let a_o_prop__fk = o_model__candidate.a_o_property.filter(function(o_prop){
                return o_prop.s_name !== s_name_prop_id
                    && o_prop.s_name.startsWith('n_')
                    && o_prop.s_name.endsWith(`_${s_name_prop_id}`);
            });

            let b_references_self = a_o_prop__fk.some(function(o_prop){
                return o_prop.s_name === s_fk__self;
            });

            if(!b_references_self) continue;

            let b_junction = a_o_prop__fk.length >= 2;

            if(b_junction){
                // junction table: follow through to the connected model
                for(let o_prop__fk of a_o_prop__fk){
                    if(o_prop__fk.s_name === s_fk__self) continue;

                    let o_model__connected = a_o_model.find(function(o_m){
                        return f_s_name_foreign_key__params(o_m, s_name_prop_id) === o_prop__fk.s_name;
                    });

                    if(!o_model__connected) continue;

                    let s_key = f_s_name_table__from_o_model(o_model__connected);

                    if(a_s_name__visited.includes(o_model__connected.s_name)){
                        o_instance[s_key] = '.';
                    } else {
                        let a_n_id__related = [];
                        if(b_read_from_db){
                            let s_name_table__junction = f_s_name_table__from_o_model(o_model__candidate);
                            let a_o_junction = o_db.prepare(
                                `SELECT ${o_prop__fk.s_name} FROM ${s_name_table__junction} WHERE ${s_fk__self} = ?`
                            ).all(o_instance.n_id);
                            a_n_id__related = a_o_junction.map(function(o_row){
                                return o_row[o_prop__fk.s_name];
                            });
                        } else {
                            let s_name_table__junction = f_s_name_table__from_o_model(o_model__candidate);
                            let a_o_junction__cached = o_cache[s_name_table__junction] || [];
                            a_n_id__related = a_o_junction__cached
                                .filter(function(o_row){ return o_row[s_fk__self] === o_instance.n_id; })
                                .map(function(o_row){ return o_row[o_prop__fk.s_name]; });
                        }

                        if(a_n_id__related.length > 0){
                            o_instance[s_key] = f_a_o_instance__denormalized(
                                o_model__connected, a_n_id__related, a_s_name__visited, o_cache, b_read_from_db
                            );
                        } else {
                            o_instance[s_key] = [];
                        }
                    }
                }
            } else {
                // direct foreign key: candidate belongs to this model
                let s_key = f_s_name_table__from_o_model(o_model__candidate);

                if(a_s_name__visited.includes(o_model__candidate.s_name)){
                    o_instance[s_key] = '.';
                } else {
                    let a_n_id__related = [];
                    if(b_read_from_db){
                        let s_name_table__candidate = f_s_name_table__from_o_model(o_model__candidate);
                        let a_o_related = o_db.prepare(
                            `SELECT n_id FROM ${s_name_table__candidate} WHERE ${s_fk__self} = ?`
                        ).all(o_instance.n_id);
                        a_n_id__related = a_o_related.map(function(o_row){
                            return o_row.n_id;
                        });
                    } else {
                        let s_name_table__candidate = f_s_name_table__from_o_model(o_model__candidate);
                        let a_o_cached__candidate = o_cache[s_name_table__candidate] || [];
                        a_n_id__related = a_o_cached__candidate
                            .filter(function(o_row){ return o_row[s_fk__self] === o_instance.n_id; })
                            .map(function(o_row){ return o_row.n_id; });
                    }

                    if(a_n_id__related.length > 0){
                        o_instance[s_key] = f_a_o_instance__denormalized(
                            o_model__candidate, a_n_id__related, a_s_name__visited, o_cache, b_read_from_db
                        );
                    } else {
                        o_instance[s_key] = [];
                    }
                }
            }
        }
    }

    return a_o_instance;
}



let f_s_python__model_constructor = function(
    s_name_model
){
    let o_model = a_o_model.find(function(o){
        return o.s_name === s_name_model;
    });
    if(!o_model) throw new Error(`Model not found: ${s_name_model}`);
    let s_constructor = `def f_${s_name_model}(data):\n`;
    s_constructor += `    return {\n`;
    for(let o_prop of o_model.a_o_property){
        s_constructor += `        '${o_prop.s_name}': data.get('${o_prop.s_name}'),\n`;
    }
    s_constructor += `    }\n`;
    return s_constructor;
}
let f_s_python__model_constructors = function(){

    let s_code = `# Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.\n\n`;
    s_code += `# Auto-generated on ${new Date().toISOString()} model constructors\n\n`;

    for(let o_model of a_o_model){
        s_code += f_s_python__model_constructor(o_model.s_name) + '\n';
    }
    return s_code;
};

let f_generate_model_constructors_for_cli_languages = async function(){
    let s_python = f_s_python__model_constructors();
    await f_ensure_dir(s_path__model_constructor_cli_language);
        await Deno.writeTextFile(
        s_path__model_constructor_cli_language + 'model_constructors.py',
        s_python
    );
}
export {
    f_init_db,
    f_v_crud__indb,
    f_db_delete_table_data,
    f_ensure_default_data,
    f_generate_model_constructors_for_cli_languages,
    f_a_o_instance__denormalized
};
