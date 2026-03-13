// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.

// frontend utility functions
// add shared client-side helper functions here and import them where needed

let f_s_path_parent = function(s_path, s_ds) {
    if (s_path === s_ds) return s_path;
    let a_s_part = s_path.split(s_ds).filter(function(s) { return s !== ''; });
    a_s_part.pop();
    if (a_s_part.length === 0) return s_ds;
    return s_ds + a_s_part.join(s_ds);
};

export {
    f_s_path_parent
};
