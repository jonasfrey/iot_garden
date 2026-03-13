## denormalized state access (implemented)

o_state objects now have lazy getter properties for related data.
the getters are defined via Object.defineProperty (enumerable: false) so they don't break JSON.stringify or sync.

### usage
```js
let o_student__gretel = o_state.a_o_student.find(o => o.s_name == 'Gretel');
o_student__gretel.a_o_course       // many-to-many via junction table
o_student__gretel.a_o_course[0].a_o_student  // reverse direction works too
o_utt.o_fsnode                     // many-to-one via FK
o_fsnode.a_o_utterance             // one-to-many (reverse FK)
```

### how it works
- f_o_relation_map__from_a_o_model: precomputes all relations once by inspecting FK properties across all models
- f_denormalize_o_state: defines getters on all objects in all o_state arrays
- f_denormalize_o_instance: defines getters on a single new object (called after creates)
- relation types detected automatically: many-to-many (junction tables), many-to-one (FK on self), one-to-many (FK on other)
- getters are lazy: every access reads directly from o_state arrays (always latest data, no cache)

## dual database backend (implemented)

the app now supports either SQLite or JSON file storage, configurable via `.env`:

- `S_DB_TYPE=sqlite` — uses SQLite (default, existing behavior)
- `S_DB_TYPE=json` — uses JSON files in a directory

### json backend details
- directory path set via `S_PATH__DB_JSON` (default: `./.gitignored/appdb/`)
- each table stored as `{table_name}.json` (e.g. `a_o_student.json`)
- files contain a JSON array of objects
- auto-increment IDs tracked in memory, derived from max existing ID on startup
- schema migration: missing properties added with `null` on init
- same CRUD interface (`f_v_crud__indb`) — backend is transparent to the rest of the app

### files
- `serverside/database_functions_json.js` — JSON file backend
- `serverside/database_functions.js` — delegates to SQLite or JSON based on `s_db_type`
- `.env` / `.env.example` — new vars: `S_DB_TYPE`, `S_PATH__DB_JSON`
- `serverside/runtimedata.js` — exports `s_db_type`, `s_path__db_json`

---

### todo: cached relation access
- current getters are O(n) per access (filter junction table each time)
- for large datasets or tight loops, add a cached version
- possible shapes: per-instance snapshot (o_student.a_o_course__cached), global lookup map (o_state.o_cache__relation), or pre-grouped junction rows for O(1) lookup
- cache must be invalidated/rebuilt on create/update/delete


---
### todo: abstract all non app specific content
this is a template for any application. it can be 'cloned' with the f_init_project function. after this has been done it should import the abstract general framework functions from jsr. this separation of what is directly related to a specific app and what is only a basic framework functionality has to be completed and improved further. the jsr codebase should be the single source of truth for framework based functions. there can be some redundancy because it is difficult to abstract everything and its not always the best thing to abstract everything that is possible since different specific application have different specific use cases. 

