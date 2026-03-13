import { f_o_logmsg } from "./constructors.js";

let s_db_create = 'c';
let s_db_read = 'r';
let s_db_update = 'u';
let s_db_delete = 'd';

export {
    s_db_create,
    s_db_read,
    s_db_update,
    s_db_delete,
}


let o_logmsg__run_command = f_o_logmsg(
    'Scanned 0 / 0 items (0% complete)',
    false, true, 'info', Date.now(), 1000
);

export {
    o_logmsg__run_command
}
