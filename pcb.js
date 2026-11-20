// Cover: draws a jumper wire from the name chip to each project part, and lights it with its part.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var board = document.getElementById('board'), svg = document.getElementById('wires'), chip = document.getElementById('chip');
  if (!board || !svg || !chip) return;
  var mods = [].slice.call(document.querySelectorAll('.rmod')), thumbs = [].slice.call(document.querySelectorAll('.thumb'));
  var wires = mods.map(function (m) {
    var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'wire'); g.style.setProperty('--w', m.style.getPropertyValue('--w'));
    ['shade', 'core', 'gloss', 'flow'].forEach(function (c) { var p = document.createElementNS(NS, 'path'); p.setAttribute('class', c); g.appendChild(p); });
    svg.appendChild(g);
    return g;
  });
  // each wire leaves the chip from one of its legs, through a crimped metal ferrule
  var defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = '<linearGradient id="fer-v" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#8a8f95"/><stop offset=".35" stop-color="#f4f5f6"/><stop offset=".6" stop-color="#c5c9cf"/><stop offset="1" stop-color="#70757b"/></linearGradient>' +
                   '<linearGradient id="fer-h" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8a8f95"/><stop offset=".35" stop-color="#f4f5f6"/><stop offset=".6" stop-color="#c5c9cf"/><stop offset="1" stop-color="#70757b"/></linearGradient>';
  svg.insertBefore(defs, svg.firstChild);
  wires.forEach(function (g) {
    var f = document.createElementNS(NS, 'rect'); f.setAttribute('class', 'ferrule'); f.setAttribute('rx', 2); g.appendChild(f);
    var r = document.createElementNS(NS, 'rect'); r.setAttribute('class', 'ferrule-ring'); g.appendChild(r);
  });
  function set(el, o) { for (var k in o) el.setAttribute(k, o[k]); }
  function draw() {
    var b = board.getBoundingClientRect(), c = chip.getBoundingClientRect(), narrow = window.matchMedia('(max-width: 860px)').matches;
    svg.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
    mods.forEach(function (m, i) {
      var t = m.querySelector('.cap').getBoundingClientRect(), g = wires[i];
      var ex = t.left - b.left + (t.width < 30 ? 10 : 16), ey = t.top - b.top + t.height / 2, d;   // the centre of the left-hand solder pad
      var fer = g.querySelector('.ferrule'), ring = g.querySelector('.ferrule-ring');
      if (narrow) {            // chip above: legs are 6px wide on a 12px pitch from 14px in (see pcb.css); the first four carry the wires
        var sx = c.left - b.left + 14 + 3 + i * 12, tip = c.bottom - b.top + 14, r = 14;
        d = 'M' + sx + ' ' + (tip + 4) + 'V' + (ey - r) + 'Q' + sx + ' ' + ey + ' ' + (sx + r) + ' ' + ey + 'H' + ex;
        set(fer, { x: sx - 4.5, y: tip - 1, width: 9, height: 13, fill: 'url(#fer-v)' });
        set(ring, { x: sx - 4.5, y: tip + 7, width: 9, height: 1.5 });
      } else {                 // chip on the left: legs are 9px tall on a 22px pitch from 22px down; each wire takes the leg nearest its fan-out point
        var want = c.height * (0.26 + 0.16 * i), k = Math.round((want - 26.5) / 22);
        var sy = c.top - b.top + 26.5 + 22 * k, tipx = c.right - b.left + 14, q = (ex - tipx) * 0.55;
        d = 'M' + (tipx + 4) + ' ' + sy + 'C' + (tipx + q) + ' ' + sy + ' ' + (ex - q) + ' ' + ey + ' ' + ex + ' ' + ey;
        set(fer, { x: tipx - 1, y: sy - 5.5, width: 15, height: 11, fill: 'url(#fer-h)' });
        set(ring, { x: tipx + 8, y: sy - 5.5, width: 1.5, height: 11 });
      }
      [].forEach.call(g.querySelectorAll('path'), function (p) { p.setAttribute('d', d); });
    });
  }
  // board traces: from each part's LED round the right-hand edge and up into the legs of that project's chip
  var traces = mods.map(function (m, i) {
    var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'trace'); g.style.setProperty('--w', m.style.getPropertyValue('--w'));
    g.appendChild(document.createElementNS(NS, 'path')); svg.insertBefore(g, svg.firstChild.nextSibling);
    var th = thumbs[i];
    function on() { g.classList.add('on'); wires[i].classList.add('on'); m.classList.add('on'); if (th) th.classList.add('on'); }
    function off() { g.classList.remove('on'); wires[i].classList.remove('on'); m.classList.remove('on'); if (th) th.classList.remove('on'); }
    [m, th].forEach(function (el) { if (!el) return; el.addEventListener('mouseenter', on); el.addEventListener('mouseleave', off); el.addEventListener('focus', on); el.addEventListener('blur', off); });
    return g;
  });
  function route() {
    var b = board.getBoundingClientRect(), ok = thumbs.length === mods.length && window.innerWidth > 860;
    if (ok) { var top0 = thumbs[0].getBoundingClientRect().top; thumbs.forEach(function (t) { if (Math.abs(t.getBoundingClientRect().top - top0) > 2) ok = false; }); }   // only when the chips sit in one row
    board.classList.toggle('routed', ok);
    traces.forEach(function (g, i) {
      var p = g.firstChild; if (!ok) { p.setAttribute('d', ''); return; }
      var m = mods[i].getBoundingClientRect(), t = thumbs[i].getBoundingClientRect(), last = thumbs[thumbs.length - 1].getBoundingClientRect(), c = 9;
      var sx = m.right - b.left, sy = m.top - b.top + m.height / 2;
      var bx = Math.max(m.right, last.right + 12) - b.left + 16 + (mods.length - 1 - i) * 11;        // the first part takes the outside lane
      var by = t.bottom - b.top + 12 + 14 + (mods.length - 1 - i) * 11;                              // and the lowest channel
      var n = Math.round((t.width / 2 - 26) / 20), tx = t.left - b.left + 26 + n * 20;               // the leg nearest the chip's middle
      p.setAttribute('d', 'M' + sx + ' ' + sy + 'H' + (bx - c) + 'L' + bx + ' ' + (sy + c) + 'V' + (by - c) + 'L' + (bx - c) + ' ' + by + 'H' + (tx + c) + 'L' + tx + ' ' + (by - c) + 'V' + (t.bottom - b.top + 11));
    });
  }
  function drawAll() { route(); draw(); }
  drawAll(); drawAll();   // the second pass settles the layout shift from reserving the trace lane
  window.addEventListener('resize', drawAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawAll);
  if (window.ResizeObserver) new ResizeObserver(drawAll).observe(board);
  window.addEventListener('load', drawAll);
})();

// Project pages: light the side-menu pin for the section on screen.
(function () {
  var links = [].slice.call(document.querySelectorAll('.rail a'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  var byId = {}, rail = document.querySelector('.rail');
  links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
  function light(id) {
    links.forEach(function (a) { a.removeAttribute('aria-current'); });
    var a = byId[id]; if (!a) return;
    a.setAttribute('aria-current', 'true');
    if (rail.scrollWidth > rail.clientWidth) rail.scrollTo({ left: a.offsetLeft - 12, behavior: 'smooth' });   // the phone strip keeps the lit pin in view
  }
  var seen = {};
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
    for (var i = 0; i < links.length; i++) { var id = links[i].getAttribute('href').slice(1); if (seen[id]) { light(id); return; } }
  }, { rootMargin: '-25% 0px -60% 0px' });
  Object.keys(byId).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
})();

// Looping clips: play only while on screen; with reduced motion, show controls instead of autoplay.
(function () {
  var vids = [].slice.call(document.querySelectorAll('.fig video'));
  if (!vids.length) return;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  vids.forEach(function (v) {
    v.muted = true;
    if (still || !('IntersectionObserver' in window)) { v.controls = true; return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () { v.controls = true; }); }
        else v.pause();
      });
    }, { rootMargin: '200px 0px' }).observe(v);
  });
})();
