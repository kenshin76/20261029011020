/* 공통 유틸 · 아이콘 · 그림 · 서버 규칙 재현(쿠폰 수량·룰렛·리딤) */
(function () {
  'use strict';
  var RD = window.RD, ST = window.ST, I = window.I18N;
  var U = window.U = {};

  /* ---------- 텍스트 ---------- */
  U.lang = function () { return ST.s.lang || 'en'; };
  U.t = function (k, vars) {
    var s = (I[U.lang()] || {})[k]; if (s == null) s = I.en[k]; if (s == null) s = k;
    if (vars) for (var v in vars) s = s.split('{' + v + '}').join(vars[v]);
    if (s.indexOf('{eul}') >= 0) { var m = s.match(/([가-힣])\{eul\}/), c = m ? m[1].charCodeAt(0) - 0xAC00 : -1; s = s.replace('{eul}', c >= 0 && c % 28 ? '을' : '를'); }
    return s;
  };
  U.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  U.nm = function (row) { if (!row) return ''; return row['name_' + U.lang()] || row.name_en; };
  U.desc = function (row) { return U.lang() === 'ko' ? (row.desc_ko || row.desc_en) : row.desc_en; };
  U.title = function (row) { return U.lang() === 'ko' ? (row.title_ko || row.title_en) : row.title_en; };
  U.cond = function (row) { return U.lang() === 'ko' ? (row.cond_ko || row.cond_en) : row.cond_en; };
  U.hotelName = function (h) { return h ? (U.lang() === 'ko' ? h.name_ko : h.name_en) : ''; };
  U.area = function (h) { return h ? (U.lang() === 'ko' ? h.area_ko : h.area_en) : 'Seoul'; };
  U.dur = function (h, m) {
    var l = U.lang(), u = { ko: ['시간 ', '분'], ja: ['時間', '分'], zh: ['小时', '分'] }[l] || ['h ', 'm'];
    return h + u[0] + U.pad(m) + u[1];
  };
  U.won = function (n) { return Number(n || 0).toLocaleString('en-US'); };
  U.pad = function (n) { return (n < 10 ? '0' : '') + n; };
  U.hm = function (ms) { var s = ST.seoul(ms); return U.pad(s.hh) + ':' + U.pad(s.mi); };
  U.dt = function (ms) { var s = ST.seoul(ms); return s.m + '/' + s.d + ' ' + U.pad(s.hh) + ':' + U.pad(s.mi); };
  U.catOf = function (id) { for (var i = 0; i < RD.CATS.length; i++) if (RD.CATS[i].id === id) return RD.CATS[i]; return RD.CATS[0]; };
  U.hash = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  /* ---------- 아이콘 ---------- */
  var P = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    ticket: '<path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    bed: '<path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 00-3-3h-7v5"/><circle cx="7" cy="11" r="2"/>',
    train: '<rect x="5" y="3" width="14" height="14" rx="4"/><path d="M5 11h14M9 21l1.5-4M15 21l-1.5-4"/><circle cx="9" cy="14" r=".6"/><circle cx="15" cy="14" r=".6"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
    help: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
    right: '<path d="M9 5l7 7-7 7"/>', left: '<path d="M15 5l-7 7 7 7"/>', down: '<path d="M5 9l7 7 7-7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    wifi: '<path d="M2 9a15 15 0 0120 0M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0"/><circle cx="12" cy="19" r=".8"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
    car: '<path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM7 11h10"/><circle cx="7.5" cy="16" r="1.5"/><circle cx="16.5" cy="16" r="1.5"/>',
    plusbox: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    nav: '<path d="M3 11l18-8-8 18-2-8z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r=".8"/><circle cx="4" cy="12" r=".8"/><circle cx="4" cy="18" r=".8"/>',
    locate: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    cloudoff: '<path d="M3 3l18 18M8 8a5 5 0 00-2.5 9.5H17M12 6a6 6 0 016 6 4 4 0 012 6.3"/>',
    food: '<path d="M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M17 21V3c-2 1-3 4-3 7h3"/>',
    cafe: '<path d="M4 9h13v5a5 5 0 01-5 5H9a5 5 0 01-5-5z"/><path d="M17 11h2a2 2 0 010 4h-2M8 3v3M12 3v3"/>',
    night: '<path d="M6 3h12l-6 8z"/><path d="M12 11v8M8 21h8"/>',
    shop: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8a3 3 0 016 0"/>',
    beauty: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    culture: '<path d="M3 21h18M4 10h16M6 10v8M10 10v8M14 10v8M18 10v8M12 3l8 5H4z"/>',
    gift: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18M12 9C10 5 6 5 7 8M12 9c2-4 6-4 5-1"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    refresh: '<path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3M14 20h2"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    sheet: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    log: '<path d="M4 6h16M4 12h10M4 18h13"/>',
    logout: '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
    spark: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    store: '<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    rocket: '<path d="M5 15c-1 1-2 5-2 5s4-1 5-2M14 4c3-1 6-1 6-1s0 3-1 6l-7 7-5-5z"/><circle cx="15" cy="9" r="1.5"/>',
    back: '<path d="M10 6l-6 6 6 6M4 12h16"/>',
    printer: '<path d="M7 9V3h10v6M7 17H4v-7a1 1 0 011-1h14a1 1 0 011 1v7h-3"/><rect x="7" y="14" width="10" height="7"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'
  };
  U.ic = function (n, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || P.star) + '</svg>'; };

  /* ---------- 장소 이미지 · 가상 매장의 대표 이미지 ---------- */
  U.art = function (place, cls) {
    var photo = ({p03:'noodles',p05:'cosmetics',p06:'vinyl',p09:'dining',p11:'market',p12:'park',p13:'market',p18:'market',p19:'river',p20:'noodles',s01:'market',s03:'seoul',s04:'hanok',s05:'seoul'}[place.id] || {cafe:'cafe',food:'restaurant',culture:'seoul',shop:'shop',beauty:'beauty',night:'night'}[place.cat] || 'seoul') + '-v2';
    return '<img class="art' + (cls ? ' ' + cls : '') + '" src="assets/images/' + photo + '.webp" alt="" loading="lazy" decoding="async" width="1200" height="800">';
  };
  U.hotelArt = function (h, cls) {
    var photo = ({HDL01:'hotel',YNL02:'hotel-room',HPJ04:'hotel-exterior',SGS05:'hotel-room'}[h.code] || 'hotel') + '-v2';
    return '<img class="art' + (cls ? ' ' + cls : '') + '" src="assets/images/' + photo + '.webp" alt="" decoding="async" width="1200" height="800">';
  };
  /* ---------- 영업 상태 (서울 시간 · 요일·브레이크타임·정기휴무) ---------- */
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function toMin(s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; }
  function fmtMin(m) { m = ((m % 1440) + 1440) % 1440; return U.pad(Math.floor(m / 60)) + ':' + U.pad(m % 60); }
  U.status = function (p, ms) {
    var s = ST.seoul(ms), closed = (p.closed_days || '').split(',').map(function (d) { return d.trim(); }).filter(Boolean);
    if (p.hours === '00:00-24:00' && closed.indexOf(DAYS[s.dow]) >= 0) return { open:false, label:U.t('closed_today'), cls:'off' };
    if (p.hours === '00:00-24:00') return { open: true, key: 'open_24', label: U.t('open_24'), cls: 'ok' };
    var hp = p.hours.split('-'), o = toMin(hp[0]), c = toMin(hp[1]); if (c <= o) c += 1440;
    var now = s.min;
    /* 전날 밤에 시작해 자정을 넘긴 영업 */
    var yday = DAYS[(s.dow + 6) % 7];
    if (c > 1440 && now < c - 1440 && closed.indexOf(yday) < 0) {
      var left = c - 1440 - now;
      return left <= 45 ? { open: true, label: U.t('closes_soon', { t: fmtMin(c) }), cls: 'warn' } : { open: true, label: U.t('open_now') + ' · ' + U.t('closes_at', { t: fmtMin(c) }), cls: 'ok' };
    }
    if (closed.indexOf(DAYS[s.dow]) >= 0) return { open: false, label: U.t('closed_today'), cls: 'off' };
    if (now < o) return { open: false, label: U.t('opens_at', { t: fmtMin(o) }), cls: 'off' };
    if (now >= c) return { open: false, label: U.t('closed'), cls: 'off' };
    if (p.break_time) {
      var bp = p.break_time.split('-'), bs = toMin(bp[0]), be = toMin(bp[1]);
      if (now >= bs && now < be) return { open: false, label: U.t('break_now', { t: fmtMin(be) }), cls: 'brk' };
    }
    if (c - now <= 45) return { open: true, label: U.t('closes_soon', { t: fmtMin(c) }), cls: 'warn' };
    return { open: true, label: U.t('open_now') + ' · ' + U.t('closes_at', { t: fmtMin(c) }), cls: 'ok' };
  };
  U.DAYS = DAYS;
  U.slotNow = function () { var h = ST.seoul().hh; return h < 5 || h >= 21 ? 'night' : h < 11 ? 'morning' : h < 15 ? 'lunch' : 'dinner'; };

  /* ---------- 거리 (호텔 기준, 지도 좌표) ---------- */
  U.xy = function (lat, lng) { return { x: 500 + (lng - RD.BASE.lng) * RD.M_LNG / RD.UNIT, y: 500 - (lat - RD.BASE.lat) * RD.M_LAT / RD.UNIT }; };
  U.distM = function (a, b) { var dy = (a.lat - b.lat) * RD.M_LAT, dx = (a.lng - b.lng) * RD.M_LNG; return Math.sqrt(dx * dx + dy * dy); };
  U.distLabel = function (m) { return m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1) + ' km'; };
  U.walk = function (m) { return Math.max(1, Math.round(m * 1.25 / 75)); };
  U.origin = function () { var h = ST.hotel(); return h ? { lat: h.lat, lng: h.lng } : { lat: RD.BASE.lat, lng: RD.BASE.lng }; };

  /* ---------- 딥링크 (한국어 상호·주소 전달) ---------- */
  U.naver = function (p) { return 'https://map.naver.com/p/search/' + encodeURIComponent(p.name_ko || p.ko || p.address_ko); };
  U.google = function (p) {
    var q = p.lat ? p.lat + ',' + p.lng : (p.name_ko || p.ko);
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  };
  U.googleDir = function (p) { return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(p.lat + ',' + p.lng) + '&travelmode=walking'; };

  /* ======================================================================
     서버 규칙 재현 (실제 구축 시 서버·DB 트랜잭션이 보장하는 규칙)
     ====================================================================== */
  var SV = window.SV = {};
  SV.online = function () { return !ST.s.demo.offline && navigator.onLine !== false; };
  function today() { return ST.seoul().date; }

  /* 쿠폰 잔여 수량 = 일일 한도 − (오늘 다른 이용자 발급 + 이 체험 발급) */
  SV.remaining = function (cid) {
    var c = ST.coupon(cid); if (!c) return 0;
    var seed = RD.SEED_ISSUED[cid] || 0, mine = ((ST.s.couponCount[today()] || {})[cid]) || 0;
    var dayIdx = ST.seoul().d; /* 날짜가 바뀌면 시드 발급량도 달라짐 */
    if (ST.s.demo.offsetMs >= 864e5) seed = Math.max(0, seed - 4 - (dayIdx % 3));
    return Math.max(0, (+c.daily_limit || 0) - seed - mine);
  };
  SV.hasIssued = function (cid) {
    return ST.s.issued.some(function (x) { return x.session === ST.s.session && x.ref === cid && x.kind === 'coupon' && ST.seoul(x.issuedAt).date === today(); });
  };
  function newCode() { return 'RM-' + ST.rid(4) + '-' + ST.rid(4); }

  /* 원자적 확인·차감 후 발급 (같은 요청 재시도는 기존 결과 반환) */
  SV.issueCoupon = function (cid, reqId) {
    if (!SV.online()) return { ok: false, err: 'offline_coupon' };
    if (!ST.hotel() || ST.hotel().status !== 'active') return { ok: false, err: 'need_hotel' };
    var c = ST.coupon(cid), place = c && ST.place(c.place_id);
    if (!c || c.active !== 'Y' || !place || place.active !== 'Y') return { ok: false, err: 'not_found' };
    var dup = reqId && ST.s.issued.filter(function (x) { return x.req === reqId && x.ref === cid && x.session === ST.s.session; })[0];
    if (dup) return { ok: true, item: dup, dup: true };
    if (SV.hasIssued(cid)) return { ok: false, err: 'got' };
    if (SV.remaining(cid) <= 0) return { ok: false, err: 'sold_out' };
    var t = ST.now();
    var cc = ST.s.couponCount[today()] = ST.s.couponCount[today()] || {}; cc[cid] = (cc[cid] || 0) + 1;
    var item = { id: 'i_' + ST.rid(8).toLowerCase(), session: ST.s.session, req: reqId || null, kind: 'coupon', ref: cid, place_id: c.place_id, code: newCode(), hotel: ST.s.hotel,
      title_en: c.title_en, title_ko: c.title_ko, cond_en: c.cond_en, cond_ko: c.cond_ko, issuedAt: t, expiresAt: ST.endOfSeoulDay(t), status: 'usable' };
    ST.s.issued.unshift(item); ST.save();
    ST.track('coupon_issue', { ref: cid, place: c.place_id, src: 'list' });
    return { ok: true, item: item };
  };

  /* 룰렛: 세션·서울 날짜 고유 제약 + 추첨·수량 차감·발급을 한 번에 */
  SV.spunToday = function () { return ST.s.roulette[today()] || null; };
  SV.prizeLeft = function (pid) {
    var pz = RD.ROULETTE.prizes[pid]; if (!pz.limit) return Infinity;
    var used = (RD.ROULETTE.seedUsed[pid] || 0) + (((ST.s.prizeUsed[today()] || {})[pid]) || 0);
    return Math.max(0, pz.limit - used);
  };
  SV.spin = function () {
    if (!SV.online()) return { ok: false, err: 'offline_coupon' };
    if (!ST.hotel() || ST.hotel().status !== 'active') return { ok: false, err: 'need_hotel' };
    if (SV.spunToday()) return { ok: false, err: 'spun', res: SV.spunToday() };
    var pf = ST.s.profile;
    if (!pf || !ST.s.consentAt || RD.AGES.indexOf(pf.age) < 0 || RD.COMPANIONS.indexOf(pf.companion) < 0 || !RD.NATIONS.some(function (n) { return n.id === pf.nat; })) return { ok: false, err: 'profile_required' };
    var R = RD.ROULETTE, total = 0; R.tiers.forEach(function (x) { total += x.weight; });
    var roll = Math.random() * total, tier = 'welcome';
    for (var i = 0; i < R.tiers.length; i++) { roll -= R.tiers[i].weight; if (roll < 0) { tier = R.tiers[i].id; break; } }
    var drawn = tier, prizeId = null, fallback = false;
    if (tier !== 'welcome') {
      var pool = (R.pools[pf.companion] || R.pools.solo)[tier].filter(function (pid) {
        return !(R.prizes[pid].adult && pf.age === '18-24') && SV.prizeLeft(pid) > 0;
      });
      if (pool.length) prizeId = pool[Math.floor(Math.random() * pool.length)];
      else { fallback = true; tier = 'welcome'; }
    }
    if (!prizeId) prizeId = 'r_w_welcome';
    var pz = R.prizes[prizeId], t = ST.now();
    var pu = ST.s.prizeUsed[today()] = ST.s.prizeUsed[today()] || {}; pu[prizeId] = (pu[prizeId] || 0) + 1;
    var item = { id: 'i_' + ST.rid(8).toLowerCase(), session: ST.s.session, kind: 'prize', ref: prizeId, tier: tier, place_id: pz.place_id, code: newCode(), hotel: ST.s.hotel,
      title_en: pz.title_en, title_ko: pz.title_ko, cond_en: 'Roulette prize · 1 per guest', cond_ko: '룰렛 당첨 · 1인 1회', issuedAt: t, expiresAt: ST.endOfSeoulDay(t) + 2 * 864e5, status: 'usable' };
    ST.s.issued.unshift(item);
    var res = { tier: tier, drawn: drawn, prizeId: prizeId, item: item.id, fallback: fallback, at: t };
    ST.s.roulette[today()] = res; ST.save();
    ST.track('roulette_spin', { ref: prizeId, tier: tier, fallback: fallback });
    ST.track('coupon_issue', { ref: prizeId, place: pz.place_id, src: 'roulette' });
    return { ok: true, res: res, item: item };
  };

  SV.itemStatus = function (it) {
    if (it.status === 'used') return 'used';
    if (ST.now() > it.expiresAt) return 'expired';
    return 'usable';
  };
  SV.item = function (id) { return ST.s.issued.filter(function (x) { return x.id === id && x.session === ST.s.session; })[0] || null; };

  /* 리딤용 1회용 검증값 (유효시간 60초, 발급 세션·쿠폰에 연결) */
  var tokens = {};
  SV.clearTokens = function () { tokens = {}; };
  SV.token = function (itemId, force) {
    if (!SV.item(itemId)) return null;
    var tk = tokens[itemId];
    if (force || !tk || tk.used || tk.session !== ST.s.session || ST.now() < tk.at || ST.now() - tk.at >= 60000) tk = tokens[itemId] = { itemId: itemId, v: ST.rid(4), at: ST.now(), used: false, session: ST.s.session };
    return tk;
  };
  SV.staleToken = function (itemId) { return { v: 'CAP' + ST.rid(1), at: ST.now() - 134000, used: false, session: ST.s.session }; };

  /* 리딤: 세션·매장·미사용·유효기간·검증값·PIN 확인 후 사용 처리와 기록을 함께 */
  SV.redeem = function (itemId, pin, amountRaw, tk) {
    if (!SV.online()) return { ok: false, err: 'offline_coupon' };
    var it = SV.item(itemId); if (!it) return { ok: false, err: 'not_found' };
    var lk = ST.s.pinFail[it.place_id];
    if (lk && lk.until && lk.until > ST.now()) return { ok: false, err: 'locked', until: lk.until };
    var st = SV.itemStatus(it);
    if (st === 'used') return { ok: false, err: 'already_used' };
    if (st === 'expired') return { ok: false, err: 'expired_msg' };
    if (!tk || tokens[itemId] !== tk || tk.itemId !== itemId || tk.used || tk.session !== ST.s.session || ST.now() < tk.at || ST.now() - tk.at >= 60000) {
      ST.track('redeem_fail', { ref: it.ref, place: it.place_id, reason: 'token', hotel: it.hotel });
      return { ok: false, err: 'token_expired' };
    }
    var amount = null;
    if (amountRaw !== '' && amountRaw != null) {
      if (!/^\d{1,9}$/.test(String(amountRaw))) return { ok: false, err: 'amount_bad' };
      amount = parseInt(amountRaw, 10);
    }
    if (RD.DEMO_PIN[it.place_id] !== pin) {
      lk = ST.s.pinFail[it.place_id] = ST.s.pinFail[it.place_id] || { n: 0, until: 0 };
      lk.n++;
      ST.track('redeem_fail', { ref: it.ref, place: it.place_id, reason: 'pin', hotel: it.hotel });
      if (lk.n >= 5) { lk.until = ST.now() + 5 * 60000; lk.n = 0; ST.save(); return { ok: false, err: 'locked', until: lk.until }; }
      ST.save();
      return { ok: false, err: 'wrong_pin', left: 5 - lk.n };
    }
    tk.used = true;
    if (ST.s.pinFail[it.place_id]) ST.s.pinFail[it.place_id].n = 0;
    it.status = 'used'; it.usedAt = ST.now(); it.amount = amount;
    ST.save();
    ST.track('coupon_redeem', { ref: it.ref, place: it.place_id, amount: amount, hotel: it.hotel });
    return { ok: true, item: it };
  };
})();
