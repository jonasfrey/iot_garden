// Copyright (C) 2026 Jonas Immanuel Frey - Licensed under GPLv2. See LICENSE file for details
document.addEventListener('pointerdown', function(o_evt) {
    let el = o_evt.target.closest('.interactable');
    if (!el || el.classList.contains('disabled')) return;
    el.classList.add('pressed');
    let f_up = function() { el.classList.remove('pressed'); };
    window.addEventListener('pointerup', f_up, { once: true });
});
