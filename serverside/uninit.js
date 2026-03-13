// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPLv2. See LICENSE file for details.

// This script uninitializes the project by deleting the database and any
// generated runtime data. A confirmation prompt prevents accidental runs.
//
// Usage:
//   deno task uninit

import { s_path__database } from './runtimedata.js';

let f_b_path_exists = async function(s_path) {
    try {
        await Deno.stat(s_path);
        return true;
    } catch {
        return false;
    }
};

let f_uninit_project = async function() {
    console.log('');
    console.log('=== project uninitialization ===');
    console.log('');
    console.log('this will:');
    console.log(`  - delete the database file: ${s_path__database}`);
    console.log('  - delete the .gitignored/ directory');
    console.log('  - delete start.desktop (has hardcoded paths, regenerated on init)');
    console.log('');

    // ── double confirmation ──
    let s_answer = prompt('are you sure you want to uninitialize? type "yes" to confirm:');
    if (s_answer !== 'yes') {
        console.log('aborted.');
        return;
    }

    let s_answer_confirm = prompt('this cannot be undone. type "yes" again to proceed:');
    if (s_answer_confirm !== 'yes') {
        console.log('aborted.');
        return;
    }

    console.log('');

    // ── delete database file ──
    if (await f_b_path_exists(s_path__database)) {
        await Deno.remove(s_path__database);
        console.log(`  deleted: ${s_path__database}`);
    } else {
        console.log(`  skipped: ${s_path__database} (not found)`);
    }

    // ── delete .gitignored directory ──
    if (await f_b_path_exists('./.gitignored')) {
        await Deno.remove('./.gitignored', { recursive: true });
        console.log('  deleted: .gitignored/');
    } else {
        console.log('  skipped: .gitignored/ (not found)');
    }

    // ── delete start.desktop (contains hardcoded absolute paths) ──
    if (await f_b_path_exists('./start.desktop')) {
        await Deno.remove('./start.desktop');
        console.log('  deleted: start.desktop');
    } else {
        console.log('  skipped: start.desktop (not found)');
    }

    console.log('');
    console.log('project uninitialized successfully.');
    console.log('run "deno task run" to reinitialize the database.');
};

if (import.meta.main) {
    await f_uninit_project();
}

export { f_uninit_project };
