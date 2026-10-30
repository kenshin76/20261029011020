/* 체험 데이터 저장소 — 이 브라우저의 localStorage에만 저장합니다 (서버 전송 없음) */
(function () {
  'use strict';
  var KEY = 'roamly-demo:2026102901:v1';
  var VERSION = 1;
  var RD = window.RD;
  var saveTimer = null, disabled = false, lastError = '';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function rid(n) {
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    var buf = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint32Array(n)) : null;
    for (var i = 0; i < n; i++) s += a[(buf ? buf[i] : Math.floor(Math.random() * 1e9)) % a.length];
    return s;
  }

  function baseContent() {
    return { hotels: clone(RD.HOTELS), places: clone(RD.PLACES), coupons: clone(RD.COUPONS), banners: clone(RD.BANNERS) };
  }
  function fresh() {
    return {
      v: VERSION, lang: null, hotel: null, session: 's_' + rid(10).toLowerCase(),
      profile: null, consentAt: null, roulette: {}, prizeUsed: {}, issued: [], couponCount: {},
      favs: [], pinFail: {}, events: [], metrics: { qr: {}, ads: {} }, offline: { saved: false, at: null },
      demo: { offsetMs: 0, offline: false, label: '' },
      ops: {
        user: null, expiresAt: 0, loginFail: { n: 0, until: 0 }, dist: {}, concurrency: null,
        content: { version: 12, at: Date.now() - 2 * 864e5, by: 'pm@demo.roamly', note: '초기 운영본', rows: baseContent() },
        versions: [], draft: null, draftErrors: null, preview: false
      }
    };
  }

  function load() {
    var raw = null;
    try { raw = window.localStorage.getItem(KEY); } catch (e) { lastError = '이 브라우저에서 저장소를 사용할 수 없어 새로고침하면 체험 내용이 사라집니다.'; return fresh(); }
    if (!raw) return fresh();
    try {
      var s = JSON.parse(raw);
      if (!s || s.v !== VERSION || !s.ops || !s.ops.content) { lastError = '저장된 체험 데이터의 형식이 달라 기본 상태로 시작합니다.'; return fresh(); }
      return s;
    } catch (e) { lastError = '저장된 체험 데이터를 읽지 못해 기본 상태로 시작합니다.'; return fresh(); }
  }

  var state = load();
  var syncing = false;
  if (state.offline.saved && state.offline.cacheVersion !== 3) state.offline.saved = false;
  function measure(ev) {
    var m = state.metrics;
    if (ev.type === 'qr_entry') {
      var q = m.qr[ev.sd + '|' + ev.hotel] = m.qr[ev.sd + '|' + ev.hotel] || [];
      if (q.indexOf(ev.session) < 0) q.push(ev.session);
    }
    if (ev.type === 'banner_view' || ev.type === 'banner_click') {
      var key = [ev.sd, ev.hotel, ev.ref, ev.nat || 'NA', ev.hh].join('|');
      var a = m.ads[key] = m.ads[key] || { date: ev.sd, hotel: ev.hotel, ref: ev.ref, nat: ev.nat || 'NA', hh: ev.hh, imp: 0, clk: 0 };
      a[ev.type === 'banner_view' ? 'imp' : 'clk']++;
    }
  }
  if (!state.metrics) { state.metrics = { qr: {}, ads: {} }; state.events.forEach(measure); }
  if (!state.ops.loginFail) state.ops.loginFail = { n: 0, until: 0 };
  state.issued.forEach(function (it) { if (!it.session) it.session = state.session; });

  function save(now) {
    if (disabled) return;
    clearTimeout(saveTimer);
    var run = function () {
      try {
        if (state.events.length > 600) state.events = state.events.slice(-600);
        window.localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) { lastError = '저장 공간이 부족하거나 접근이 막혀 변경 내용을 저장하지 못했습니다.'; }
    };
    if (now) run(); else saveTimer = setTimeout(run, 150);
  }
  function reset() {
    clearTimeout(saveTimer);
    try { window.localStorage.removeItem(KEY); disabled = true; return true; } catch (e) { return false; }
  }
  window.addEventListener('pagehide', function () { save(true); });
  window.addEventListener('storage', function (e) {
    if (e.key === KEY && e.newValue === null) { disabled = true; location.reload(); }
    if (e.key === KEY && e.newValue) {
      try {
        var next = JSON.parse(e.newValue);
        if (next.v !== VERSION || !next.ops || !next.metrics) return;
        clearTimeout(saveTimer); state = next;
        syncing = true;
        if (window.APP) APP.render();
      } catch (err) { lastError = '다른 탭의 변경 내용을 읽지 못했습니다. 새로고침해 주세요.'; }
      finally { syncing = false; }
    }
  });

  /* ---------- 서울 시간 (시연용 시간 이동 포함) ---------- */
  function now() { return Date.now() + (state.demo.offsetMs || 0); }
  function seoul(ms) {
    var d = new Date((ms == null ? now() : ms) + 9 * 3600e3);
    var y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
    return {
      ms: ms == null ? now() : ms, y: y, m: m, d: day, dow: d.getUTCDay(), hh: d.getUTCHours(), mi: d.getUTCMinutes(), ss: d.getUTCSeconds(),
      date: y + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day,
      min: d.getUTCHours() * 60 + d.getUTCMinutes()
    };
  }
  function endOfSeoulDay(ms) { var s = seoul(ms); return Math.floor(ms / 1000) * 1000 - ((s.hh * 3600 + s.mi * 60 + s.ss) * 1000) + 864e5 - 1; }
  function setClock(hhmm, dayShift) {
    var d = new Date(Date.now() + 9 * 3600e3);
    var s = { hh: d.getUTCHours(), mi: d.getUTCMinutes(), ss: d.getUTCSeconds() };
    var target = hhmm ? hhmm.split(':').map(Number) : null;
    var delta = target ? ((target[0] * 60 + target[1]) - (s.hh * 60 + s.mi)) * 60000 - s.ss * 1000 : 0;
    state.demo.offsetMs = (dayShift || 0) * 864e5 + delta;
    save();
  }

  /* ---------- 이벤트 기록 (호텔·세션·언어·서울 시각) ---------- */
  function track(type, data) {
    if (syncing) return null;
    if (data && data.id && state.events.some(function (e) { return e.id === data.id; })) return null;
    var t = now();
    var ev = { id: 'e_' + rid(8).toLowerCase(), t: t, sd: seoul(t).date, hh: seoul(t).hh, type: type, hotel: state.hotel || '-', session: state.session, lang: state.lang || 'en' };
    if (data) for (var k in data) ev[k] = data[k];
    if (state.profile && !ev.nat) ev.nat = state.profile.nat;
    state.events.push(ev);
    measure(ev);
    save();
    if (window.APP && APP.onEvent) APP.onEvent(ev);
    return ev;
  }

  /* ---------- 콘텐츠 (배포된 운영 시트) ---------- */
  function content() { return state.ops.content.rows; }
  function byId(list, key, id) { for (var i = 0; i < list.length; i++) if (list[i][key] === id) return list[i]; return null; }

  window.ST = {
    KEY: KEY, get s() { return state; }, save: save, reset: reset, fresh: fresh, clone: clone, rid: rid,
    error: function () { var e = lastError; lastError = ''; return e; },
    now: now, seoul: seoul, endOfSeoulDay: endOfSeoulDay, setClock: setClock,
    track: track, content: content, baseContent: baseContent,
    hotel: function (code) { return byId(content().hotels, 'code', code || state.hotel); },
    place: function (id) { return byId(content().places, 'id', id); },
    coupon: function (id) { return byId(content().coupons, 'id', id); },
    banner: function (id) { return byId(content().banners, 'id', id); }
  };
})();
