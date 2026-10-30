/* 호텔별 QR 출력용 QR 코드 생성기 (바이트 모드 · 오류 정정 M · 버전 1~10) */
(function () {
  'use strict';
  var EC = { 1: [10, [[1, 16]]], 2: [16, [[1, 28]]], 3: [26, [[1, 44]]], 4: [18, [[2, 32]]], 5: [24, [[2, 43]]],
    6: [16, [[4, 27]]], 7: [18, [[4, 31]]], 8: [22, [[2, 38], [2, 39]]], 9: [22, [[3, 36], [2, 37]]], 10: [26, [[4, 43], [1, 44]]] };
  var ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] };
  var EXP = new Array(512), LOG = new Array(256);
  (function () { var x = 1; for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11D; } for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
  function mul(a, b) { return (a && b) ? EXP[LOG[a] + LOG[b]] : 0; }
  function gen(n) { var g = [1]; for (var i = 0; i < n; i++) { var ng = new Array(g.length + 1).fill(0); for (var j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; } return g; }
  function rs(data, n) { var g = gen(n), r = data.concat(new Array(n).fill(0)); for (var i = 0; i < data.length; i++) { var c = r[i]; if (c) for (var j = 0; j < g.length; j++) r[i + j] ^= mul(g[j], c); } return r.slice(data.length); }
  function utf8(s) { var out = [], b = unescape(encodeURIComponent(s)); for (var i = 0; i < b.length; i++) out.push(b.charCodeAt(i)); return out; }

  function encode(text) {
    var bytes = utf8(text), ver = 0, dataCw = 0;
    for (var v = 1; v <= 10; v++) {
      var e = EC[v], dc = 0; e[1].forEach(function (g) { dc += g[0] * g[1]; });
      var need = 4 + (v < 10 ? 8 : 16) + 8 * bytes.length;
      if (need <= dc * 8) { ver = v; dataCw = dc; break; }
    }
    if (!ver) throw new Error('QR: text too long');
    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
    var cap = dataCw * 8; put(0, Math.min(4, cap - bits.length));
    while (bits.length % 8) bits.push(0);
    var cw = []; for (var i = 0; i < bits.length; i += 8) { var x = 0; for (var j = 0; j < 8; j++) x = (x << 1) | bits[i + j]; cw.push(x); }
    for (var p = 0; cw.length < dataCw; p++) cw.push(p % 2 ? 0x11 : 0xEC);
    /* 블록 분할·오류 정정·인터리브 */
    var ecn = EC[ver][0], blocks = [], k = 0;
    EC[ver][1].forEach(function (g) { for (var c = 0; c < g[0]; c++) { var d = cw.slice(k, k + g[1]); k += g[1]; blocks.push({ d: d, e: rs(d, ecn) }); } });
    var out = [], maxD = Math.max.apply(null, blocks.map(function (b) { return b.d.length; }));
    for (i = 0; i < maxD; i++) blocks.forEach(function (b) { if (i < b.d.length) out.push(b.d[i]); });
    for (i = 0; i < ecn; i++) blocks.forEach(function (b) { out.push(b.e[i]); });
    return { ver: ver, cw: out };
  }

  function build(text) {
    var enc = encode(text), ver = enc.ver, size = 17 + 4 * ver;
    var m = [], fn = [];
    for (var y = 0; y < size; y++) { m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function set(x, y, d) { m[y][x] = !!d; fn[y][x] = true; }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var x = cx + dx, y = cy + dy; if (x < 0 || y < 0 || x >= size || y >= size) continue;
        var d = Math.max(Math.abs(dx), Math.abs(dy)); set(x, y, d !== 2 && d !== 4);
      }
    }
    for (var i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var al = ALIGN[ver], n = al.length;
    for (i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
    function formatBits(mask) {
      var data = (0 << 3) | mask, rem = data; /* 오류 정정 M = 00 */
      for (var q = 0; q < 10; q++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      return ((data << 10) | rem) ^ 0x5412;
    }
    function drawFormat(mask) {
      var b = formatBits(mask), bit = function (k) { return (b >>> k) & 1; };
      for (var q = 0; q <= 5; q++) set(8, q, bit(q));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (q = 9; q < 15; q++) set(14 - q, 8, bit(q));
      for (q = 0; q < 8; q++) set(size - 1 - q, 8, bit(q));
      for (q = 8; q < 15; q++) set(8, size - 15 + q, bit(q));
      set(8, size - 8, 1);
    }
    drawFormat(0);
    if (ver >= 7) {
      var rem = ver; for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var vb = (ver << 12) | rem;
      for (i = 0; i < 18; i++) { var bt = (vb >>> i) & 1, a = size - 11 + i % 3, c = Math.floor(i / 3); set(a, c, bt); set(c, a, bt); }
    }
    /* 데이터 배치 */
    var bits = []; enc.cw.forEach(function (c) { for (var q = 7; q >= 0; q--) bits.push((c >>> q) & 1); });
    var bi = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (j = 0; j < 2; j++) {
        var x = right - j, up = ((right + 1) & 2) === 0, yy = up ? size - 1 - vert : vert;
        if (!fn[yy][x]) { m[yy][x] = bi < bits.length ? !!bits[bi] : false; bi++; }
      }
    }
    function maskFn(k, x, y) {
      switch (k) {
        case 0: return (x + y) % 2 === 0; case 1: return y % 2 === 0; case 2: return x % 3 === 0; case 3: return (x + y) % 3 === 0;
        case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; case 5: return x * y % 2 + x * y % 3 === 0;
        case 6: return (x * y % 2 + x * y % 3) % 2 === 0; default: return ((x + y) % 2 + x * y % 3) % 2 === 0;
      }
    }
    function applyMask(k) { for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) if (!fn[y][x] && maskFn(k, x, y)) m[y][x] = !m[y][x]; }
    function penalty() {
      var p = 0, y, x, run, dark = 0;
      for (var pass = 0; pass < 2; pass++) for (y = 0; y < size; y++) {
        run = 1;
        for (x = 1; x < size; x++) {
          var a = pass ? m[x][y] : m[y][x], b = pass ? m[x - 1][y] : m[y][x - 1];
          if (a === b) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
        }
      }
      for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) { var c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3; }
      var pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], pat2 = pat1.slice().reverse();
      for (pass = 0; pass < 2; pass++) for (y = 0; y < size; y++) for (x = 0; x + 11 <= size; x++) {
        var ok1 = true, ok2 = true;
        for (var q = 0; q < 11; q++) { var v = (pass ? m[x + q][y] : m[y][x + q]) ? 1 : 0; if (v !== pat1[q]) ok1 = false; if (v !== pat2[q]) ok2 = false; }
        if (ok1) p += 40; if (ok2) p += 40;
      }
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) dark++;
      var total = size * size; p += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
      return p;
    }
    var best = 0, bestP = Infinity;
    for (var k = 0; k < 8; k++) { applyMask(k); drawFormat(k); var pp = penalty(); if (pp < bestP) { bestP = pp; best = k; } applyMask(k); }
    applyMask(best); drawFormat(best);
    return { size: size, ver: ver, mask: best, m: m };
  }

  function svg(text, opt) {
    opt = opt || {};
    var q = build(text), quiet = opt.quiet == null ? 4 : opt.quiet, n = q.size + quiet * 2, d = '';
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.m[y][x]) d += 'M' + (x + quiet) + ' ' + (y + quiet) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + ' ' + n + '" shape-rendering="crispEdges"' + (opt.cls ? ' class="' + opt.cls + '"' : '') +
      (opt.label ? ' role="img" aria-label="' + opt.label + '"' : ' aria-hidden="true"') + '><rect width="' + n + '" height="' + n + '" fill="' + (opt.light || '#fff') + '"/><path d="' + d + '" fill="' + (opt.dark || '#000') + '"/></svg>';
  }
  window.QR = { build: build, svg: svg };
})();
