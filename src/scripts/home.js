/* ventustium — home scenes
   Wheel / touch / keyboard swap the active scene instead of scrolling the page.
   Each element type has its own in/out motion, and some pick a random variant
   per entry so repeat visits don't look identical. */
(function () {
    'use strict';

    var root = document.documentElement;
    var stage = document.querySelector('.stage');
    var scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
    if (!stage || !scenes.length || !Element.prototype.animate) return;

    root.classList.add('js');

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var EASE_OUT = 'cubic-bezier(.16,1,.3,1)';
    var EASE_IN = 'cubic-bezier(.7,0,.84,0)';
    var EASE_SPRING = 'cubic-bezier(.34,1.56,.64,1)';
    var pagerButtons = [];
    var current = 0;
    var busy = false;
    var lastCharVariant = null;

    var moods = [
        { gx: '30%', gy: '40%', gh: '0deg',   py: '0vh',  ps: 1 },
        { gx: '75%', gy: '30%', gh: '-40deg', py: '-3vh', ps: 1.05 },
        { gx: '20%', gy: '72%', gh: '70deg',  py: '-6vh', ps: 1.1 },
        { gx: '55%', gy: '55%', gh: '-90deg', py: '-9vh', ps: 1.16 },
        { gx: '40%', gy: '25%', gh: '140deg', py: '-12vh', ps: 1.2 }
    ];

    function rand(min, max) { return min + Math.random() * (max - min); }
    function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

    /* ---------- text splitting ---------- */
    function splitInto(el, mode) {
        Array.prototype.slice.call(el.childNodes).forEach(function (node) {
            if (node.nodeType === 1) { splitInto(node, mode); return; }
            if (node.nodeType !== 3) return;
            var frag = document.createDocumentFragment();
            node.textContent.split(/(\s+)/).forEach(function (part) {
                if (!part) return;
                if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                if (mode === 'chars') {
                    var word = document.createElement('span');
                    word.className = 'wd';
                    Array.prototype.forEach.call(part, function (ch, ci) {
                        var c = document.createElement('span');
                        c.className = 'c';
                        c.textContent = ch;
                        c.style.setProperty('--i', ci);
                        c.style.setProperty('--n', part.length);
                        c.setAttribute('data-a', 'char');
                        word.appendChild(c);
                    });
                    frag.appendChild(word);
                } else {
                    var mask = document.createElement('span');
                    mask.className = 'w';
                    var inner = document.createElement('span');
                    inner.textContent = part;
                    inner.setAttribute('data-a', 'word');
                    mask.appendChild(inner);
                    frag.appendChild(mask);
                }
            });
            el.replaceChild(frag, node);
        });
    }
    $$('[data-split]').forEach(function (el) {
        el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
        splitInto(el, el.getAttribute('data-split'));
        $$('.w, .wd', el).forEach(function (s) { s.setAttribute('aria-hidden', 'true'); });
    });

    /* ---------- scramble / decode text ---------- */
    var GLYPHS = '!<>-_\\/[]{}=+*^?#%&$@01';
    function scramble(el, duration, delay) {
        if (reduce) return;
        var final = el.getAttribute('data-final') || el.textContent;
        el.setAttribute('data-final', final);
        if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', final);
        if (el._scr) cancelAnimationFrame(el._scr);
        var start = null;
        function frame(t) {
            if (start === null) start = t + (delay || 0);
            var p = Math.max(0, Math.min(1, (t - start) / duration));
            var out = '';
            for (var i = 0; i < final.length; i++) {
                var ch = final[i];
                if (ch === ' ' || i < Math.floor(p * final.length)) out += ch;
                else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
            }
            el.textContent = out;
            if (p < 1) el._scr = requestAnimationFrame(frame);
            else { el.textContent = final; el._scr = null; }
        }
        el._scr = requestAnimationFrame(frame);
    }

    /* ---------- typewriter ---------- */
    // Types the element's text after `delay` ms; returns the total typing time.
    function typeText(el, delay) {
        var full = el.getAttribute('data-final') || el.textContent.trim().replace(/\s+/g, ' ');
        el.setAttribute('data-final', full);
        el.setAttribute('aria-label', full);
        clearTimeout(el._typeT);
        // typed part + invisible remainder keeps the line box (and layout) stable while typing
        var typed = document.createElement('span');
        var rest = document.createElement('span');
        typed.className = 'typed';
        rest.className = 'rest';
        rest.textContent = full;
        el.textContent = '';
        el.appendChild(typed);
        el.appendChild(rest);
        el.classList.add('typing');
        var speed = 18;
        var i = 0;
        function tick() {
            i++;
            typed.textContent = full.slice(0, i);
            rest.textContent = full.slice(i);
            if (i < full.length) el._typeT = setTimeout(tick, speed + Math.random() * 20);
            else el._typeT = setTimeout(function () { el.classList.remove('typing'); }, 1600);
        }
        el._typeT = setTimeout(tick, delay);
        return full.length * (speed + 15);
    }

    /* ---------- keyframes per element type ---------- */
    function charVariant() {
        var all = ['flip', 'zoom', 'scatter'];
        var pick = all.filter(function (v) { return v !== lastCharVariant; });
        lastCharVariant = pick[(Math.random() * pick.length) | 0];
        return lastCharVariant;
    }

    function inFrames(type, dir, i, variant) {
        switch (type) {
            case 'char':
                if (variant === 'flip') return { k: [{ opacity: 0, transform: 'translate3d(0,30%,0) rotateX(-100deg)' }, { opacity: 1, transform: 'none' }], d: 1100, step: 32, e: EASE_OUT };
                if (variant === 'zoom') return { k: [{ opacity: 0, filter: 'blur(14px)', transform: 'scale(2.8)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], d: 1000, step: 45, e: EASE_OUT };
                return { k: [{ opacity: 0, filter: 'blur(6px)', transform: 'translate3d(' + rand(-220, 220) + 'px,' + rand(-160, 160) + 'px,0) rotate(' + rand(-120, 120) + 'deg) scale(.3)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], d: 1300, step: 14, e: EASE_OUT };
            case 'word':
                return { k: [{ transform: 'translate3d(0,' + (dir * 110) + '%,0) rotate(' + (dir * 5) + 'deg)' }, { transform: 'none' }], d: 1000, step: 60, e: EASE_OUT };
            case 'logo':
                return { k: [{ opacity: 0, filter: 'blur(20px)', transform: 'scale(' + (dir > 0 ? 1.25 : .75) + ')' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], d: 1400, step: 160, e: EASE_OUT };
            case 'ghost':
                return { k: [{ opacity: 0, transform: 'translate3d(' + (dir * 35) + 'vw,0,0)' }, { opacity: 1, transform: 'none' }], d: 1600, step: 0, e: EASE_OUT };
            case 'wipe':
                var fromRight = i % 2 === 1;
                return {
                    k: [
                        { opacity: 0, clipPath: fromRight ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)', transform: 'translate3d(' + (fromRight ? 30 : -30) + 'px,0,0)' },
                        { opacity: 1, clipPath: 'inset(0 0 0 0)', transform: 'none' }
                    ], d: 900, step: 70, e: EASE_OUT
                };
            case 'tilt': // cards swing in like doors from the side
                return {
                    k: [
                        { opacity: 0, transform: 'translate3d(80px,0,0) rotateY(-65deg)', filter: 'blur(4px)' },
                        { opacity: 1, transform: 'none', filter: 'blur(0)' }
                    ], d: 1200, step: 110, e: EASE_SPRING
                };
            case 'pill': // opens from its centre like a capsule
                return { k: [{ opacity: 0, clipPath: 'inset(0 50% 0 50% round 999px)' }, { opacity: 1, clipPath: 'inset(0 0 0 0 round 999px)' }], d: 900, step: 200, e: EASE_OUT };
            case 'pop':
                return { k: [{ opacity: 0, transform: 'scale(0) rotate(-120deg)' }, { opacity: 1, transform: 'none' }], d: 800, step: 0, e: EASE_SPRING };
            case 'rise':
                return { k: [{ opacity: 0, filter: 'blur(10px)', transform: 'translate3d(0,' + (dir * 60) + 'px,0) scale(.92)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], d: 1100, step: 90, e: EASE_SPRING };
            default: // fade
                return { k: [{ opacity: 0, filter: 'blur(8px)', transform: 'translate3d(0,' + (dir * 30) + 'px,0)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], d: 900, step: 90, e: EASE_OUT };
        }
    }

    function outFrames(type, dir, i) {
        switch (type) {
            case 'wipe':
                return [{ opacity: 1, clipPath: 'inset(0 0 0 0)' }, { opacity: 0, clipPath: i % 2 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)' }];
            case 'ghost':
                return [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translate3d(' + (-dir * 25) + 'vw,0,0)' }];
            default:
                return [{ opacity: 1, filter: 'blur(0)', transform: 'none' }, { opacity: 0, filter: 'blur(8px)', transform: 'translate3d(0,' + (-dir * 30) + 'px,0)' }];
        }
    }

    function settle(anims) {
        return Promise.all(anims.map(function (a) { return a.finished.catch(function () {}); })).then(function () { return anims; });
    }

    function playIn(scene, dir, baseDelay) {
        var variant = charVariant();
        var t = baseDelay || 0;
        var prevType = null;
        var anims = $$('[data-a]', scene).map(function (el, i) {
            var type = el.getAttribute('data-a');
            if (type === 'type') { // typewriter runs alongside whatever follows; it doesn't hold the timeline
                if (reduce) return null;
                if (prevType) t += 150;
                prevType = type;
                typeText(el, t);
                t += 250;
                return null;
            }
            if (reduce) return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: 'backwards' });
            // data-variant on a split element pins its char animation instead of the random pick
            var pinned = type === 'char' && el.closest('[data-variant]');
            var v = pinned ? pinned.getAttribute('data-variant') : variant;
            var f = inFrames(type, dir, i, v);
            if (prevType && prevType !== type) t += 120; // small breath between groups
            prevType = type;
            // 'backwards' fill: hidden during the delay, then hands control back to CSS (keeps hover effects working)
            var a = el.animate(f.k, { duration: f.d, delay: t, easing: v === 'flip' && type === 'char' ? EASE_SPRING : f.e, fill: 'backwards' });
            t += f.step;
            return a;
        }).filter(Boolean);
        $$('[data-scramble]', scene).forEach(function (el) { scramble(el, 700, t + 100); });
        return settle(anims);
    }

    function playOut(scene, dir) {
        if (reduce) return settle([scene.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'both' })]);
        var mode = scene.getAttribute('data-out');
        var inner = scene.querySelector('.scene-inner');
        if (mode === 'zoom') {
            // The whole scene flies through the camera (forward) or sinks away (back).
            return settle([inner.animate([
                { opacity: 1, filter: 'blur(0)', transform: 'none' },
                { opacity: 0, filter: 'blur(16px)', transform: dir > 0 ? 'translate3d(0,-6vh,0) scale(1.35)' : 'translate3d(0,8vh,0) scale(.8)' }
            ], { duration: 700, easing: EASE_IN, fill: 'both' })]);
        }
        if (mode === 'slide') {
            // The scene is swept sideways with a skew, like a page being pulled away.
            return settle([inner.animate([
                { opacity: 1, filter: 'blur(0)', transform: 'none' },
                { opacity: 0, filter: 'blur(10px)', transform: 'translate3d(' + (dir > 0 ? -28 : 28) + 'vw,' + (-dir * 4) + 'vh,0) skewX(' + (dir * 8) + 'deg)' }
            ], { duration: 650, easing: EASE_IN, fill: 'both' })]);
        }
        var list = $$('[data-a]', scene);
        if (dir < 0) list.reverse();
        return settle(list.map(function (el, i) {
            return el.animate(outFrames(el.getAttribute('data-a'), dir, i), { duration: 500, delay: i * 35, easing: EASE_IN, fill: 'both' });
        }));
    }

    /* ---------- deferred images ---------- */
    // img[data-src] only downloads when its scene is opened, not on page load.
    function loadDeferred(scene) {
        $$('img[data-src]', scene).forEach(function (img) {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        });
    }

    /* ---------- state ---------- */
    function applyMood(i) {
        var m = moods[i % moods.length];
        var s = document.body.style;
        s.setProperty('--gx', m.gx);
        s.setProperty('--gy', m.gy);
        s.setProperty('--gh', m.gh);
        s.setProperty('--py', m.py);
        s.setProperty('--ps', m.ps);
    }

    function setChrome(i) {
        pagerButtons.forEach(function (b, j) { b.setAttribute('aria-current', j === i ? 'true' : 'false'); });
        var hint = document.querySelector('.hint');
        if (hint) hint.classList.toggle('is-hidden', i === scenes.length - 1);
        if (history.replaceState) history.replaceState(null, '', i === 0 ? location.pathname : '#' + scenes[i].id);
    }

    // Below 1280px pager labels are hidden; touching the pager shows them via a CSS state class.
    var LABEL_MS = 1800;
    function pagerShow(cls) {
        var pager = document.querySelector('.pager');
        if (!pager) return;
        pager.classList.add(cls);
        clearTimeout(pager['_' + cls]);
        pager['_' + cls] = setTimeout(function () { pager.classList.remove(cls); }, LABEL_MS);
    }

    function activate(i) {
        scenes.forEach(function (s, j) {
            var on = j === i;
            s.classList.toggle('is-active', on);
            s.setAttribute('aria-hidden', on ? 'false' : 'true');
            if ('inert' in s) s.inert = !on;
        });
    }

    function goTo(next) {
        next = Math.max(0, Math.min(scenes.length - 1, next));
        if (busy || next === current) return;
        busy = true;

        var dir = next > current ? 1 : -1;
        var from = scenes[current];
        var to = scenes[next];
        current = next;
        loadDeferred(to); // start downloading while the previous scene plays out
        applyMood(next);
        setChrome(next);

        from.classList.add('is-leaving');
        playOut(from, dir).then(function (anims) {
            from.classList.remove('is-leaving');
            anims.forEach(function (a) { a.cancel(); });
        });

        setTimeout(function () {
            activate(next);
            playIn(to, dir).then(function () { busy = false; wheelAcc = 0; });
        }, reduce ? 150 : 420);
    }

    /* ---------- pager ---------- */
    var pager = document.querySelector('.pager');
    if (pager) {
        scenes.forEach(function (s, i) {
            var title = s.getAttribute('data-title') || 'section ' + (i + 1);
            var b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('aria-label', (pager.getAttribute('data-go') || 'go to') + ' ' + title);
            b.innerHTML = '<span class="lbl" aria-hidden="true"></span><span class="bar" aria-hidden="true"></span>';
            b.firstChild.textContent = title;
            b.addEventListener('click', function () { goTo(i); });
            pager.appendChild(b);
            pagerButtons.push(b);
        });
        // Touching the pager reveals every label; they hide LABEL_MS after the finger lifts.
        pager.addEventListener('touchstart', function () {
            clearTimeout(pager['_is-touch']);
            pager.classList.add('is-touch');
        }, { passive: true });
        pager.addEventListener('touchend', function () { pagerShow('is-touch'); });
        pager.addEventListener('touchcancel', function () { pagerShow('is-touch'); });
    }

    /* ---------- hover: re-decode link text ---------- */
    $$('.card, .mail, .pill').forEach(function (a) {
        var t = a.querySelector('.t');
        if (!t) return;
        a.addEventListener('mouseenter', function () { scramble(t, 350, 0); });
        a.addEventListener('focus', function () { scramble(t, 350, 0); });
    });

    /* ---------- input ---------- */
    var wheelAcc = 0;
    var wheelTimer = null;
    window.addEventListener('wheel', function (e) {
        e.preventDefault();
        if (busy) return;
        wheelAcc += e.deltaY;
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(function () { wheelAcc = 0; }, 180);
        if (Math.abs(wheelAcc) > 45) {
            var d = wheelAcc > 0 ? 1 : -1;
            wheelAcc = 0;
            goTo(current + d);
        }
    }, { passive: false });

    var touchY = null;
    stage.addEventListener('touchstart', function (e) { touchY = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    stage.addEventListener('touchend', function (e) {
        if (touchY === null) return;
        var dy = touchY - e.changedTouches[0].clientY;
        touchY = null;
        if (Math.abs(dy) > 50) goTo(current + (dy > 0 ? 1 : -1));
    });

    window.addEventListener('keydown', function (e) {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        switch (e.key) {
            case 'ArrowDown': case 'PageDown': case ' ': e.preventDefault(); goTo(current + (e.shiftKey && e.key === ' ' ? -1 : 1)); break;
            case 'ArrowUp': case 'PageUp': e.preventDefault(); goTo(current - 1); break;
            case 'Home': e.preventDefault(); goTo(0); break;
            case 'End': e.preventDefault(); goTo(scenes.length - 1); break;
        }
    });

    window.addEventListener('hashchange', function () {
        var i = scenes.findIndex(function (s) { return '#' + s.id === location.hash; });
        if (i >= 0) goTo(i);
    });

    /* ---------- boot ---------- */
    var start = scenes.findIndex(function (s) { return location.hash && '#' + s.id === location.hash; });
    current = start > 0 ? start : 0;
    activate(current);
    loadDeferred(scenes[current]);
    applyMood(current);
    setChrome(current);
    busy = true;
    playIn(scenes[current], 1, 200).then(function () { busy = false; });
})();

/* copy-to-clipboard buttons (tip jar address). Independent of the scene engine. */
(function () {
    'use strict';
    // Without the scene engine every scene is visible as a normal page, so load deferred images now.
    if (!document.documentElement.classList.contains('js')) {
        Array.prototype.forEach.call(document.querySelectorAll('img[data-src]'), function (img) {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        });
    }
    document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('[data-copy]');
        if (!btn) return;
        var src = document.querySelector(btn.getAttribute('data-copy'));
        if (!src) return;
        var text = src.textContent.trim();
        // Labels come from the markup so each locale can translate them.
        if (!btn._label) btn._label = btn.textContent;
        function done() {
            btn.textContent = btn.getAttribute('data-done') || 'copied';
            btn.classList.add('is-done');
            clearTimeout(btn._t);
            btn._t = setTimeout(function () { btn.textContent = btn._label; btn.classList.remove('is-done'); }, 1600);
        }
        function fallback() {
            var r = document.createRange();
            r.selectNodeContents(src);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(r);
            try { if (document.execCommand('copy')) done(); } catch (err) { /* selection stays so the user can copy */ }
        }
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
        else fallback();
    });
})();
