/* 지도 (시연용 일러스트 지도 · 실제 구축 시 Google Maps JavaScript API) · 서울 전역 · 지하철 노선도 */
(function () {
  'use strict';
  var RD = window.RD, ST = window.ST, U = window.U;
  var MAP = window.MAP = {};

  /* ---------- 이동·확대 (마우스 끌기·휠·두 손가락) ---------- */
  function PanZoom(svg, vb, lim, onChange) {
    var self = this; this.svg = svg; this.vb = vb.slice(); this.home = vb.slice(); this.lim = lim; this.onChange = onChange;
    var ptrs = {}, last = null, pinch = null, moved = 0;
    this.apply = function () { svg.setAttribute('viewBox', self.vb.map(function (v) { return v.toFixed(1); }).join(' ')); if (self.onChange) self.onChange(self); };
    this.scale = function () { var r = svg.getBoundingClientRect(); return r.width ? self.vb[2] / r.width : 1; };
    this.zoom = function (f, cx, cy) {
      var w = Math.max(lim[0], Math.min(lim[1], self.vb[2] * f)), k = w / self.vb[2];
      if (cx == null) { cx = self.vb[0] + self.vb[2] / 2; cy = self.vb[1] + self.vb[3] / 2; }
      self.vb = [cx - (cx - self.vb[0]) * k, cy - (cy - self.vb[1]) * k, self.vb[2] * k, self.vb[3] * k];
      self.apply();
    };
    this.center = function (x, y, w) {
      var r = svg.getBoundingClientRect(), ratio = r.width && r.height ? r.height / r.width : self.vb[3] / self.vb[2];
      w = w || self.vb[2]; var h = w * ratio;
      self.vb = [x - w / 2, y - h / 2, w, h]; self.apply();
    };
    function pt(e) { var r = svg.getBoundingClientRect(); return { x: self.vb[0] + (e.clientX - r.left) / r.width * self.vb[2], y: self.vb[1] + (e.clientY - r.top) / r.height * self.vb[3] }; }
    svg.addEventListener('pointerdown', function (e) {
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; moved = 0;
      var ids = Object.keys(ptrs);
      if (ids.length === 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; }
      last = { x: e.clientX, y: e.clientY };
    });
    svg.addEventListener('pointermove', function (e) {
      if (!ptrs[e.pointerId]) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(ptrs);
      if (ids.length === 2 && pinch) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > 0) { var m = pt({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 }); self.zoom(pinch.d / d, m.x, m.y); pinch.d = d; }
        moved += 10; return;
      }
      if (!last) return;
      var s = self.scale(), dx = (e.clientX - last.x) * s, dy = (e.clientY - last.y) * s;
      moved += Math.abs(e.clientX - last.x) + Math.abs(e.clientY - last.y);
      if (moved > 4) { try { svg.setPointerCapture(e.pointerId); } catch (x) {} svg.classList.add('dragging'); }
      self.vb[0] -= dx; self.vb[1] -= dy; last = { x: e.clientX, y: e.clientY }; self.apply();
    });
    function up(e) { delete ptrs[e.pointerId]; if (Object.keys(ptrs).length < 2) pinch = null; if (!Object.keys(ptrs).length) last = null; svg.classList.remove('dragging'); }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up); svg.addEventListener('pointerleave', up);
    svg.addEventListener('click', function (e) { if (moved > 6) { e.stopPropagation(); e.preventDefault(); } }, true);
    svg.addEventListener('wheel', function (e) { e.preventDefault(); var p = pt(e); self.zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, p.x, p.y); }, { passive: false });
  }
  MAP.PanZoom = PanZoom;

  /* ---------- 동네 지도 바탕 (1단위 = 4m) ---------- */
  var baseCache = null;
  function baseArt() {
    if (baseCache) return baseCache;
    var r = RD.rng(20261029), blocks = '';
    for (var i = 0; i < 230; i++) {
      var x = Math.round(r() * 1100) - 50, y = Math.round(r() * 1100) - 50, w = 24 + Math.round(r() * 46), h = 18 + Math.round(r() * 40);
      if (y > 800 + x * 0.25) continue; /* 강 아래 제외 */
      blocks += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" transform="rotate(' + (-28 + Math.round(r() * 6)) + ' ' + x + ' ' + y + ')"/>';
    }
    var streets = '';
    for (i = 0; i < 26; i++) {
      var sx = Math.round(r() * 1000), sy = Math.round(r() * 900), len = 120 + r() * 240, ang = (-28 + (r() > 0.5 ? 90 : 0)) * Math.PI / 180;
      streets += '<path d="M' + sx + ' ' + sy + 'l' + (Math.cos(ang) * len).toFixed(0) + ' ' + (Math.sin(ang) * len).toFixed(0) + '"/>';
    }
    baseCache =
      '<rect x="-2000" y="-2000" width="5000" height="5000" fill="var(--map-land)"/>' +
      '<g class="m-blocks">' + blocks + '</g>' +
      '<rect x="640" y="520" width="150" height="110" rx="18" class="m-campus" transform="rotate(-20 700 560)"/>' +
      '<text x="690" y="600" class="m-area sm" transform="rotate(-20 700 560)">Hongik Univ.</text>' +
      '<path class="m-park" d="M440 470 C 500 420, 540 380, 590 330 S 680 220, 760 120"/>' +
      '<path class="m-river" d="M-200 820 C 120 800, 330 900, 560 980 S 900 1120, 1200 1180 L1200 1500 L-200 1500 Z"/>' +
      '<g class="m-streets">' + streets + '</g>' +
      '<g class="m-roads"><path d="M120 880 L300 655 L455 455 L560 330 L800 170 L1100 60"/><path d="M470 900 C 520 760, 600 620, 640 520 S 720 380, 820 300"/>' +
      '<path d="M455 455 L420 120 L400 -100"/><path d="M-100 560 L300 655 L520 700 L900 690"/><path d="M300 655 L200 420 L120 200"/></g>' +
      '<g class="m-lbl"><text x="560" y="255" class="m-area">YEONNAM</text><text x="590" y="585" class="m-area">HONGDAE</text>' +
      '<text x="250" y="610" class="m-area">HAPJEONG</text><text x="110" y="500" class="m-area">MANGWON</text><text x="560" y="770" class="m-area">SANGSU</text>' +
      '<text x="210" y="905" class="m-area river">HAN RIVER</text><text x="690" y="250" class="m-area sm park">Gyeongui Line Forest Park</text></g>' +
      station(455, 455, 'Hongik Univ.', ['2', 'A', 'K']) + station(300, 655, 'Hapjeong', ['2', '6']) + station(520, 700, 'Sangsu', ['6']) + station(200, 420, 'Mangwon', ['6']);
    return baseCache;
  }
  function lineColor(id) { for (var i = 0; i < RD.LINES.length; i++) if (RD.LINES[i].id === id) return RD.LINES[i].color; return '#888'; }
  function station(x, y, name, lines) {
    var dots = lines.map(function (l, i) { return '<circle cx="' + (x - 8 + i * 9) + '" cy="' + (y - 13) + '" r="4.2" fill="' + lineColor(l) + '"/>'; }).join('');
    return '<g class="m-stn"><rect x="' + (x - 12) + '" y="' + (y - 8) + '" width="24" height="16" rx="5"/><path d="M' + (x - 5) + ' ' + (y + 3) + 'h10M' + (x - 4) + ' ' + (y - 3) + 'h8" stroke="#fff" stroke-width="2"/>' + dots +
      '<text x="' + (x + 16) + '" y="' + (y + 5) + '">' + name + '</text></g>';
  }

  /* 핀 (화면 크기 일정 유지) */
  function pinSvg(p, k, sel) {
    var c = U.catOf(p.cat), xy = U.xy(p.lat, p.lng), hasC = p._coupon;
    return '<g class="pin' + (sel ? ' sel' : '') + (p._dim ? ' dim' : '') + '" data-pin="' + p.id + '" transform="translate(' + xy.x.toFixed(1) + ' ' + xy.y.toFixed(1) + ') scale(' + (k * (sel ? 1.25 : 1)).toFixed(3) + ')" role="button" tabindex="0" aria-label="' + U.esc(U.nm(p)) + '">' +
      '<path d="M0 0 C -5 -9, -15 -13, -15 -24 a15 15 0 0 1 30 0 C 15 -13, 5 -9, 0 0z" fill="' + c.color + '" stroke="#fff" stroke-width="2.5"/>' +
      '<g transform="translate(-8 -32) scale(.67)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + U.ic(c.icon).replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</g>' +
      (hasC ? '<g transform="translate(10 -36)"><circle r="8.5" fill="#FFC531" stroke="#fff" stroke-width="2"/><path d="M-4 -1.5h8v3h-8z" fill="#1A1A1A"/></g>' : '') + '</g>';
  }
  function hotelPin(h, k) {
    var xy = U.xy(h.lat, h.lng);
    return '<g class="hpin" transform="translate(' + xy.x.toFixed(1) + ' ' + xy.y.toFixed(1) + ') scale(' + k.toFixed(3) + ')"><circle r="22" fill="rgba(11,15,26,.14)"/>' +
      '<rect x="-15" y="-15" width="30" height="30" rx="9" fill="#0B0F1A" stroke="#fff" stroke-width="2.5"/><g transform="translate(-9 -9) scale(.75)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round">' +
      U.ic('bed').replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</g><text y="31" class="hpin-t">' + U.esc(U.t('hotel_pin')) + '</text></g>';
  }
  function meDot(me, k) {
    return '<g class="me" transform="translate(' + me.x + ' ' + me.y + ') scale(' + k.toFixed(3) + ')"><circle r="24" class="me-pulse"/><circle r="9" fill="#2F6BFF" stroke="#fff" stroke-width="3"/></g>';
  }

  /* opts: { places, sel, center:{x,y}, radiusM, me, hotel, onPin(id), onBg() } */
  MAP.neighborhood = function (el, opts) {
    el.innerHTML = '<div class="mapbox"><svg class="msvg" xmlns="http://www.w3.org/2000/svg"><g class="mbase">' + baseArt() + '</g><g class="mring"></g><g class="mpins"></g></svg>' +
      '<div class="mapctl"><button type="button" data-z="in" aria-label="' + U.t('zoom_in') + '">' + U.ic('plus') + '</button><button type="button" data-z="out" aria-label="' + U.t('zoom_out') + '">' + U.ic('minus') + '</button><button type="button" data-z="home" aria-label="' + U.t('recenter') + '">' + U.ic('locate') + '</button></div>' +
      '<span class="mapattr">Illustrative map · Sample locations</span></div>';
    var svg = el.querySelector('svg'), ring = el.querySelector('.mring'), pins = el.querySelector('.mpins');
    var c = opts.center || { x: 500, y: 500 }, rU = (opts.radiusM || 1000) / RD.UNIT;
    var w = Math.max(300, rU * 2.3);
    var pz;
    function draw() {
      var k = pz.scale();
      var list = opts.places.slice().sort(function (a, b) { return (a.id === opts.sel) - (b.id === opts.sel) || U.xy(a.lat, a.lng).y - U.xy(b.lat, b.lng).y; });
      var h = opts.hotel;
      pins.innerHTML = (h ? hotelPin(h, k) : '') + list.map(function (p) { return pinSvg(p, k, p.id === opts.sel); }).join('') + (opts.me ? meDot(opts.me, k) : '');
    }
    ring.innerHTML = opts.radiusM ? '<circle cx="' + c.x + '" cy="' + c.y + '" r="' + rU + '" class="m-radius"/>' : '';
    pz = new PanZoom(svg, [c.x - w / 2, c.y - w / 2, w, w], [140, 2600], draw);
    requestAnimationFrame(function () { pz.center(c.x, c.y, w); });
    el.querySelector('.mapctl').addEventListener('click', function (e) {
      var b = e.target.closest('[data-z]'); if (!b) return;
      var z = b.getAttribute('data-z'); if (z === 'in') pz.zoom(1 / 1.4); else if (z === 'out') pz.zoom(1.4); else pz.center(c.x, c.y, w);
    });
    svg.addEventListener('click', function (e) {
      var p = e.target.closest('[data-pin]');
      if (p) { opts.sel = p.getAttribute('data-pin'); draw(); if (opts.onPin) opts.onPin(opts.sel); }
      else if (opts.onBg) { opts.sel = null; draw(); opts.onBg(); }
    });
    svg.addEventListener('keydown', function (e) { var p = e.target.closest('[data-pin]'); if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); p.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
    var ro = window.ResizeObserver ? new ResizeObserver(function () { draw(); }) : null; if (ro) { ro.observe(svg); if (window.APP) APP.cleanup(function () { ro.disconnect(); }); }
    return { select: function (id) { opts.sel = id; draw(); var p = ST.place(id); if (p) { var xy = U.xy(p.lat, p.lng); pz.center(xy.x, xy.y + pz.vb[3] * 0.12, pz.vb[2]); } }, pz: pz };
  };

  /* ---------- 서울 전역 (구역별 묶음 표시) ---------- */
  var AREAS = {
    hongdae: { lat: 37.556, lng: 126.922, en: 'Hongdae · Yeonnam', ko: '홍대·연남' },
    myeongdong: { lat: 37.5636, lng: 126.985, en: 'Myeong-dong', ko: '명동' },
    seongsu: { lat: 37.5445, lng: 127.0559, en: 'Seongsu', ko: '성수' },
    itaewon: { lat: 37.5345, lng: 126.9946, en: 'Itaewon', ko: '이태원' },
    jongno: { lat: 37.5743, lng: 126.9898, en: 'Jongno · Ikseon', ko: '종로·익선' },
    gangnam: { lat: 37.4979, lng: 127.0276, en: 'Gangnam', ko: '강남' }
  };
  MAP.AREAS = AREAS;
  function sxy(lat, lng) { return { x: (lng - 126.80) / 0.38 * 1000, y: (37.70 - lat) / 0.27 * 800 }; }
  MAP.seoul = function (el, opts) {
    var river = [[37.585, 126.80], [37.567, 126.86], [37.553, 126.90], [37.537, 126.93], [37.523, 126.96], [37.515, 126.99], [37.517, 127.02], [37.527, 127.05], [37.535, 127.08], [37.53, 127.11], [37.545, 127.14], [37.556, 127.18]]
      .map(function (p) { var q = sxy(p[0], p[1]); return q.x.toFixed(0) + ' ' + q.y.toFixed(0); }).join(' L');
    var dist = [['Mapo', 37.567, 126.905], ['Jongno', 37.594, 126.979], ['Jung-gu', 37.558, 127.0], ['Yongsan', 37.528, 126.975], ['Seongdong', 37.556, 127.04], ['Gangnam', 37.505, 127.055],
      ['Songpa', 37.506, 127.115], ['Yeongdeungpo', 37.518, 126.898], ['Gwanak', 37.47, 126.95], ['Seodaemun', 37.58, 126.935], ['Gwangjin', 37.548, 127.085], ['Seocho', 37.48, 127.01]];
    var counts = {}; opts.places.forEach(function (p) { counts[p.area] = (counts[p.area] || 0) + 1; });
    var bubbles = Object.keys(AREAS).map(function (k) {
      var a = AREAS[k], q = sxy(a.lat, a.lng), n = counts[k] || 0;
      if (!n) return '';
      var r = 20 + Math.min(20, n * 1.4);
      return '<g class="clu" data-area="' + k + '" role="button" tabindex="0" transform="translate(' + q.x.toFixed(0) + ' ' + q.y.toFixed(0) + ')"><circle r="' + (r + 8) + '" class="clu-h"/><circle r="' + r + '" class="clu-c"/>' +
        '<text class="clu-n" y="6">' + n + '</text><text class="clu-t" y="' + (k === 'jongno' ? -(r + 12) : r + 22) + '">' + U.esc(U.lang() === 'ko' ? a.ko : a.en) + '</text></g>';
    }).join('');
    var h = opts.hotel ? sxy(opts.hotel.lat, opts.hotel.lng) : null;
    el.innerHTML = '<div class="mapbox seoulmap"><svg class="msvg" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="-500" y="-500" width="2000" height="1800" fill="var(--map-land)"/>' +
      '<path d="M120 140 C 300 40, 620 30, 840 120 S 1010 420, 930 640 S 520 820, 300 760 S 20 520, 120 140z" class="s-city"/>' +
      '<path d="M' + river + '" class="s-river"/>' +
      dist.map(function (d) { var q = sxy(d[1], d[2]); return '<text class="s-dist" x="' + q.x.toFixed(0) + '" y="' + q.y.toFixed(0) + '">' + d[0] + '</text>'; }).join('') +
      (h ? '<g transform="translate(' + h.x.toFixed(0) + ' ' + (h.y - 46).toFixed(0) + ')"><rect x="-13" y="-13" width="26" height="26" rx="8" fill="#0B0F1A" stroke="#fff" stroke-width="2.5"/><g transform="translate(-8 -8) scale(.67)" fill="none" stroke="#fff" stroke-width="2.4">' + U.ic('bed').replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</g></g>' : '') +
      bubbles + '</svg><div class="mapctl"><button type="button" data-z="in" aria-label="' + U.t('zoom_in') + '">' + U.ic('plus') + '</button><button type="button" data-z="out" aria-label="' + U.t('zoom_out') + '">' + U.ic('minus') + '</button></div><span class="mapattr">Illustrative map · Sample locations</span></div>';
    var svg = el.querySelector('svg'), pz = new PanZoom(svg, [40, 0, 920, 800], [260, 1400], null);
    requestAnimationFrame(function () { pz.center(497, 470, 560); });
    el.querySelector('.mapctl').addEventListener('click', function (e) { var b = e.target.closest('[data-z]'); if (b) pz.zoom(b.getAttribute('data-z') === 'in' ? 1 / 1.35 : 1.35); });
    svg.addEventListener('click', function (e) { var c = e.target.closest('[data-area]'); if (c && opts.onArea) opts.onArea(c.getAttribute('data-area')); });
    svg.addEventListener('keydown', function (e) { var c = e.target.closest('[data-area]'); if (c && e.key === 'Enter' && opts.onArea) opts.onArea(c.getAttribute('data-area')); });
  };

  /* ---------- 지하철 노선도 (다국어 역명) ---------- */
  MAP.stName = function (s) { var l = U.lang(); return s[l] || s.en; };
  MAP.lineColor = lineColor;
  var BELOW = { '240': 1, '242': 1, '201': 1, '203': 1, '206': 1, '238': 0, 'K24': 0, '624': 0, '625': 1, '133': 1, '424': 1, '329': 1, '130': 0 };
  MAP.subway = function (el, opts) {
    var S = {}; RD.STATIONS.forEach(function (s) { S[s.id] = s; });
    var lines = Object.keys(RD.LINE_PATHS).map(function (lid) {
      var pts = RD.LINE_PATHS[lid].map(function (id) { return S[id].x + ' ' + S[id].y; }).join(' L');
      return '<path d="M' + pts + '" stroke="' + lineColor(lid) + '" class="sl"/>';
    }).join('');
    var dots = RD.STATIONS.map(function (s) {
      var big = s.lines.length > 1, sel = s.id === opts.sel;
      var label = MAP.stName(s), below = s.y > 760 || BELOW[s.id], ly = s.y + (below ? 24 : -13), anchor = s.x > 1050 ? 'end' : 'middle';
      return '<g class="sst' + (sel ? ' sel' : '') + '" data-st="' + s.id + '" role="button" tabindex="0">' +
        (sel ? '<circle cx="' + s.x + '" cy="' + s.y + '" r="20" class="sst-h"/>' : '') +
        '<circle cx="' + s.x + '" cy="' + s.y + '" r="' + (big ? 8 : 5.5) + '" class="' + (big ? 'sx' : 'so') + '"/>' +
        '<text x="' + s.x + '" y="' + ly + '" text-anchor="' + anchor + '" class="sst-t">' + U.esc(label) + '</text></g>';
    }).join('');
    el.innerHTML = '<div class="mapbox subwaymap"><svg class="msvg" xmlns="http://www.w3.org/2000/svg"><rect x="-500" y="-500" width="2200" height="1900" fill="var(--sub-bg)"/>' +
      '<path d="M-100 640 C 200 600, 400 560, 600 600 S 1000 560, 1300 520" class="sub-river"/>' + lines + dots + '</svg>' +
      '<div class="mapctl"><button type="button" data-z="in" aria-label="' + U.t('zoom_in') + '">' + U.ic('plus') + '</button><button type="button" data-z="out" aria-label="' + U.t('zoom_out') + '">' + U.ic('minus') + '</button><button type="button" data-z="home" aria-label="' + U.t('recenter') + '">' + U.ic('locate') + '</button></div></div>';
    var svg = el.querySelector('svg'), pz = new PanZoom(svg, [0, 100, 1160, 760], [240, 1700], null);
    var sel = opts.sel ? S[opts.sel] : null;
    requestAnimationFrame(function () { if (sel) pz.center(sel.x + 40, sel.y + 30, 440); else pz.center(560, 470, 900); });
    el.querySelector('.mapctl').addEventListener('click', function (e) {
      var b = e.target.closest('[data-z]'); if (!b) return; var z = b.getAttribute('data-z');
      if (z === 'in') pz.zoom(1 / 1.35); else if (z === 'out') pz.zoom(1.35); else pz.center(560, 470, 900);
    });
    svg.addEventListener('click', function (e) { var g = e.target.closest('[data-st]'); if (g && opts.onSt) opts.onSt(g.getAttribute('data-st')); });
    svg.addEventListener('keydown', function (e) { var g = e.target.closest('[data-st]'); if (g && e.key === 'Enter' && opts.onSt) opts.onSt(g.getAttribute('data-st')); });
  };
})();
