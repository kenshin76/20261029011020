/* 앱 셸 · 라우터 · 공통 UI · 체험 안내 패널 */
(function () {
  'use strict';
  var RD = window.RD, ST = window.ST, U = window.U, SV = window.SV, t = U.t, esc = U.esc, ic = U.ic;
  var APP = window.APP = { screens: {}, timers: [], route: null };

  /* ---------- 라우팅 ---------- */
  function parse() {
    var h = location.hash.replace(/^#/, '') || '/', q = {}, qi = h.indexOf('?');
    if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); try { if (p[0]) q[decodeURIComponent(p[0])] = decodeURIComponent(p.slice(1).join('=') || ''); } catch (e) {} }); h = h.slice(0, qi); }
    var parts = h.split('/').filter(Boolean);
    return { path: h, name: parts[0] || '', arg: parts[1] || '', arg2: parts[2] || '', q: q, parts: parts };
  }
  APP.go = function (hash, replace) {
    if (!/^#/.test(hash)) hash = '#' + hash;
    if (location.hash === hash) { render(); return; }
    if (replace) { history.replaceState(null, '', hash); render(); } else location.hash = hash;
  };
  APP.clearTimers = function () { APP.timers.forEach(function (x) { clearInterval(x); clearTimeout(x); }); APP.timers = []; };
  APP.every = function (fn, ms) { var id = setInterval(fn, ms); APP.timers.push(id); return id; };
  APP.later = function (fn, ms) { var id = setTimeout(fn, ms); APP.timers.push(id); return id; };
  APP.cleanups = [];
  APP.cleanup = function (fn) { APP.cleanups.push(fn); };

  var TOURIST = { home: 1, hotel: 1, map: 1, picks: 1, place: 1, subway: 1, coupons: 1, mine: 1, coupon: 1, roulette: 1, fav: 1, help: 1, more: 1 };
  var NEED_HOTEL = { home: 1, hotel: 1, coupons: 1, mine: 1, roulette: 1 };
  var TAB = { home: 'home', map: 'map', picks: 'picks', place: 'picks', coupons: 'coupons', mine: 'coupons', coupon: 'coupons', roulette: 'coupons', more: 'more', hotel: 'more', subway: 'more', fav: 'more', help: 'more' };

  function render() {
    APP.clearTimers(); APP.cleanups.splice(0).forEach(function (fn) { fn(); }); closeSheet(true);
    SV.clearTokens();
    var r = APP.route = parse();
    document.documentElement.lang = r.name === 'ops' ? 'ko' : U.lang();
    if (r.name === 'ops') { document.body.classList.remove('demo-open'); document.body.className = 'mode-ops'; window.OPS.render(r); renderDemo(); return; }
    document.body.className = 'mode-app';
    if (r.name === 'h') return entry(r.arg);
    var dev = document.getElementById('device');
    if (!r.name) { dev.innerHTML = APP.screens.landing(r); finish(r); return; }
    if (r.name === 'invalid') { dev.innerHTML = APP.screens.invalid(r); finish(r); return; }
    if (!TOURIST[r.name]) { APP.go('#/', true); return; }
    if (NEED_HOTEL[r.name]) {
      var activeHotel = ST.hotel();
      if (!activeHotel) { APP.go('#/', true); return; }
      if (activeHotel.status !== 'active') { APP.go('#/invalid/' + encodeURIComponent(activeHotel.code), true); return; }
    }
    dev.innerHTML = shell(r);
    var view = dev.querySelector('#view');
    var out = APP.screens[r.name](r, view);
    if (typeof out === 'string') view.innerHTML = out;
    if (!view.isConnected || APP.route !== r) return;
    if (APP.screens[r.name].mount) APP.screens[r.name].mount(r, view);
    finish(r);
    ST.track('page_view', { screen: r.name });
  }
  function finish(r) {
    var v = document.querySelector('#view') || document.getElementById('device');
    if (v) v.scrollTop = 0;
    var sc = document.querySelector('.app-scroll'); if (sc) sc.scrollTop = 0;
    renderDemo();
    var err = ST.error(); if (err) APP.toast(err, 'warn');
  }
  APP.render = render;

  /* QR 진입: 서버가 호텔 코드를 확인해 홈으로 보내거나 안내 화면으로 */
  function entry(code) {
    code = String(code || '').toUpperCase();
    var h = ST.hotel(code);
    if (!h || h.status !== 'active') {
      ST.track('qr_invalid', { ref: code, hotel: code });
      APP.go('#/invalid/' + encodeURIComponent(code), true); return;
    }
    var prev = ST.s.hotel;
    ST.s.hotel = code; ST.save();
    ST.track('qr_entry', { ref: code, hotel: code });
    APP.go('#/home', true);
    if (prev && prev !== code) APP.toast(t('hotel_changed', { hotel: U.hotelName(h) }), 'info');
  }

  /* ---------- 셸 ---------- */
  function shell(r) {
    var h = ST.hotel(), mine = ST.s.issued.filter(function (x) { return SV.itemStatus(x) === 'usable'; }).length;
    var tab = TAB[r.name];
    var tabs = [['home', 'home', 'nav_home'], ['map', 'map', 'nav_map'], ['picks', 'star', 'nav_picks'], ['coupons', 'ticket', 'nav_coupons'], ['more', 'grid', 'nav_more']];
    var showAd = r.name !== 'home' && r.name !== 'coupon' && r.name !== 'roulette' && r.name !== 'coupons';
    return '<div class="app">' +
      '<header class="tb">' +
        '<div class="guest-tools"><span class="guest-wordmark">ROAMLY</span><a class="portal-link" href="#/ops">' + ic('chart') + '<span>' + esc(t('land_ops')) + '</span>' + ic('right') + '</a></div>' +
        (h ? '<a class="hchip" href="#/hotel"><span class="hchip-i">' + ic('bed') + '</span><span class="hchip-t"><small>' + esc(t('staying')) + '</small><b>' + esc(U.hotelName(h)) + '</b></span></a>'
           : '<a class="hchip" href="#/"><span class="hchip-i">' + ic('qr') + '</span><span class="hchip-t"><small>ROAMLY</small><b>Seoul</b></span></a>') +
        '<div class="tb-r"><button type="button" class="tbtn" data-act="lang" aria-label="' + esc(t('change_lang')) + '">' + ic('globe') + '<span>' + U.lang().toUpperCase() + '</span></button>' +
        '<a class="tbtn wallet" href="#/mine" aria-label="' + esc(t('cp_tab_mine')) + '">' + ic('ticket') + (mine ? '<em>' + mine + '</em>' : '') + '</a></div>' +
      '</header>' +
      (SV.online() ? '' : '<div class="offbar">' + ic('cloudoff') + esc(t('offline_banner')) + '</div>') +
      '<main id="view" class="view app-scroll" tabindex="-1"></main>' +
      (showAd && SV.online() ? adBar() : '') +
      '<nav class="tabs" aria-label="Main">' + tabs.map(function (x) {
        return '<a href="#/' + x[0] + '" class="' + (tab === x[0] ? 'on' : '') + '"' + (tab === x[0] ? ' aria-current="page"' : '') + '>' + ic(x[1]) + '<span>' + esc(t(x[2])) + '</span></a>';
      }).join('') + '</nav>' +
      '</div>';
  }

  /* 하단 광고 배너 (HOME 외 화면) — 노출·클릭 집계 */
  var adIdx = 0;
  function adBar() {
    var list = ST.content().banners.filter(function (b) { return b.active === 'Y'; });
    if (!list.length) return '';
    var b = list[adIdx++ % list.length];
    APP.later(function () { ST.track('banner_view', { ref: b.id, slot: 'bottom' }); }, 0);
    return '<a class="adbar tone-' + esc(b.tone) + '" href="#/place/' + esc(b.place_id) + '" data-banner="' + esc(b.id) + '" data-slot="bottom">' +
      '<span class="ad-tag">' + esc(t('sponsored')) + '</span><span class="ad-t"><b>' + esc(U.lang() === 'ko' ? b.title_ko : b.title_en) + '</b><small>' + esc(U.lang() === 'ko' ? b.sub_ko : b.sub_en) + '</small></span>' + ic('right') + '</a>';
  }

  /* ---------- 시트·토스트 ---------- */
  var sheetCleanup = null;
  APP.sheet = function (html, mount, cls) {
    closeSheet(true);
    var host = document.body.classList.contains('mode-ops') ? document.getElementById('ops') : (document.querySelector('#device .app') || document.getElementById('device'));
    var el = document.createElement('div');
    el.className = 'sheet-wrap'; el.id = 'sheet';
    el.innerHTML = '<div class="sheet-bg" data-close></div><div class="sheet ' + (cls || '') + '" role="dialog" aria-modal="true"><button type="button" class="sheet-x" data-close aria-label="' + esc(t('close')) + '">' + ic('x') + '</button>' + html + '</div>';
    host.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('in'); var f = el.querySelector('[autofocus],button:not(.sheet-x),input,select,a'); if (f) f.focus(); });
    el.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeSheet(); });
    if (mount) sheetCleanup = mount(el.querySelector('.sheet')) || null;
    return el;
  };
  function closeSheet(now) {
    var el = document.getElementById('sheet'); if (!el) return;
    if (typeof sheetCleanup === 'function') sheetCleanup(); sheetCleanup = null;
    if (now) { el.remove(); return; }
    el.classList.remove('in'); setTimeout(function () { el.remove(); }, 220);
  }
  APP.closeSheet = closeSheet;
  APP.confirm = function (message, accept) {
    APP.sheet('<h3 class="sh-t">확인해 주세요</h3><p class="sh-p">' + esc(message) + '</p><div class="sh-btns"><button type="button" class="btn" data-close>취소</button><button type="button" class="btn pri" data-confirm>확인</button></div>', function (sheet) {
      sheet.querySelector('[data-confirm]').addEventListener('click', function () { closeSheet(true); accept(); });
    }, 'confirm-sheet');
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (document.getElementById('sheet')) closeSheet(); else if (document.body.classList.contains('demo-open')) document.body.classList.remove('demo-open'); } });

  APP.badge = function () {
    var w = document.querySelector('#device .wallet'); if (!w) return;
    var n = ST.s.issued.filter(function (x) { return SV.itemStatus(x) === 'usable'; }).length, em = w.querySelector('em');
    if (!n) { if (em) em.remove(); return; } if (!em) { em = document.createElement('em'); w.appendChild(em); } em.textContent = n;
  };
  APP.toast = function (msg, kind) {
    var host = document.body.classList.contains('mode-ops') ? (document.querySelector('.ops') || document.body) : (document.querySelector('#device .app') || document.body);
    var box = host.querySelector(':scope > .toasts'); if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); host.appendChild(box); }
    var el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.innerHTML = ic(kind === 'err' ? 'alert' : kind === 'ok' ? 'check' : 'spark') + '<span>' + esc(msg) + '</span>';
    box.appendChild(el); setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 300); }, 2600);
  };

  APP.langSheet = function () {
    var cur = U.lang();
    APP.sheet('<h3 class="sh-t">' + ic('globe') + esc(t('change_lang')) + '</h3><div class="langs">' + window.I18N.order.map(function (l) {
      return '<button type="button" class="lang' + (l === cur ? ' on' : '') + '" data-setlang="' + l + '"><b>' + esc(window.I18N[l].lang_name) + '</b><small>' + l.toUpperCase() + (l === 'ja' || l === 'zh' ? ' · ' + esc(window.I18N[l].fallback_note) : '') + '</small>' + (l === cur ? ic('check') : '') + '</button>';
    }).join('') + '</div>');
  };

  /* ---------- 전역 클릭 ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]');
    var bn = e.target.closest('[data-banner]');
    if (bn) ST.track('banner_click', { ref: bn.getAttribute('data-banner'), slot: bn.getAttribute('data-slot') || '' });
    var dl = e.target.closest('[data-deeplink]');
    if (dl) ST.track('directions_click', { ref: dl.getAttribute('data-deeplink'), app: dl.getAttribute('data-app') });
    var mc = e.target.closest('[data-menu]');
    if (mc) ST.track('menu_click', { ref: mc.getAttribute('data-menu') });
    var sl = e.target.closest('[data-setlang]');
    if (sl) {
      ST.s.lang = sl.getAttribute('data-setlang'); ST.save(); ST.track('lang_change', { ref: ST.s.lang });
      closeSheet(true); render(); return;
    }
    if (!a) return;
    var act = a.getAttribute('data-act');
    if (act === 'lang') { APP.langSheet(); return; }
    if (act === 'copy') {
      var txt = a.getAttribute('data-copy');
      (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { APP.toast(t('copied'), 'ok'); }, function () { APP.toast(txt, 'info'); });
      return;
    }
    if (APP.actions[act]) APP.actions[act](a, e);
  });
  APP.actions = {};

  /* ======================================================================
     체험 안내 패널 (한국어) — 데스크톱 왼쪽 패널 · 모바일 하단 버튼
     ====================================================================== */
  var DEMO_TIMES = [['', '실제 시각'], ['09:00', '09:00 아침'], ['15:30', '15:30 브레이크타임'], ['22:30', '22:30 심야']];
  function renderDemo() {
    var el = document.getElementById('demo'); if (!el) return;
    var h = ST.hotel(), s = ST.seoul(), r = APP.route || {};
    var curIt = r.name === 'coupon' ? SV.item(r.arg) : null;
    var pinFor = curIt ? RD.DEMO_PIN[curIt.place_id] : null;
    var off = ST.s.demo.offsetMs || 0;
    el.innerHTML =
      '<div class="dm-in">' +
      '<div class="dm-head"><span class="dm-logo">' + logo() + '</span><div><b>ROAMLY 체험 도구</b><small>호텔 QR 로컬 정보·쿠폰 모바일 웹</small></div>' +
      '<button type="button" class="dm-x" data-demo="close" aria-label="닫기">' + ic('x') + '</button></div>' +
      '<div class="dm-state">' +
        '<div><span>현재 호텔</span><b>' + (h ? esc(h.name_ko) + ' <code>' + h.code + '</code>' : '없음 (QR 미스캔)') + '</b></div>' +
        '<div><span>익명 세션</span><b><code>' + esc(ST.s.session) + '</code></b></div>' +
        '<div><span>서울 시각' + (off ? ' (시연)' : '') + '</span><b class="dm-clock">' + s.date + ' ' + U.pad(s.hh) + ':' + U.pad(s.mi) + '</b></div>' +
        '<div><span>네트워크</span><b>' + (SV.online() ? '온라인' : '<em class="dm-off">오프라인 (시연)</em>') + '</b></div>' +
      '</div>' +
      (pinFor ? '<div class="dm-pin">' + ic('lock') + '<span>이 쿠폰 매장의 직원 PIN</span><b>' + pinFor + '</b></div>' : '') +
      '<h4>체험 시나리오</h4><div class="dm-list">' +
        btn('qr-a', 'qr', '호텔 QR 스캔으로 시작', '호텔 레인 홍대 · HDL01') +
        btn('qr-b', 'refresh', '다른 호텔 QR로 다시 진입', '연남 로프트 호텔 · 기존 쿠폰 귀속 유지') +
        btn('qr-bad', 'alert', '운영 종료·잘못된 QR', '인쇄된 QR이 깨지지 않는 안내 화면') +
        btn('roulette', 'gift', '프로필 → 오늘의 룰렛', '전원 당첨 · 1일 1회 · 수량 소진 시 웰컴 혜택') +
        btn('redeem', 'ticket', '쿠폰 발급 → 직원 PIN 사용 처리', '구매 금액 선택 입력 · PIN은 위 표시') +
        btn('capture', 'eye', '캡처 화면으로 사용 시도', '60초 검증값 만료 → 서버에서 거절') +
        btn('picks', 'star', '영업 상태·시간대 추천', '브레이크타임·정기휴무 반영') +
        btn('map', 'map', 'MAP 범위·반경·쿠폰 매장', '호텔 주변 · 내 위치 · 서울 전역') +
        btn('subway', 'train', '노선도 저장 → 오프라인 열람', '저장 완료 후 네트워크를 끊어 확인') +
        btn('ops', 'chart', '운영 콘솔', '이용 전환 흐름 · 광고주 리포트 · 시트 배포 · QR 출력') +
      '</div>' +
      '<h4>시연 시간 (서울)</h4><div class="dm-seg">' + DEMO_TIMES.map(function (x) {
        var on = (x[0] === '' && !off) || (ST.s.demo.label === x[0] && x[0]);
        return '<button type="button" class="' + (on ? 'on' : '') + '" data-demo="time" data-v="' + x[0] + '">' + x[1] + '</button>';
      }).join('') + '<button type="button" class="' + (ST.s.demo.label === 'next' ? 'on' : '') + '" data-demo="time" data-v="next">다음 날 00:05</button></div>' +
      '<h4>네트워크</h4><div class="dm-seg two"><button type="button" class="' + (!ST.s.demo.offline ? 'on' : '') + '" data-demo="net" data-v="on">온라인</button><button type="button" class="' + (ST.s.demo.offline ? 'on' : '') + '" data-demo="net" data-v="off">오프라인 체험</button></div>' +
      '<p class="dm-note">호텔·매장·쿠폰·지표는 모두 시연용 가상 데이터입니다. 지도는 그림 지도로 대신했으며 실제 구축 시 Google Maps JavaScript API를 연결합니다. 체험 내용은 이 브라우저에만 저장됩니다.</p>' +
      '<button type="button" class="dm-reset" data-demo="reset">' + ic('refresh') + '체험 데이터 초기화</button>' +
      '</div>';
    var fab = document.getElementById('demo-fab');
    if (fab) fab.hidden = r.name === 'ops';
  }
  function btn(k, i, a, b) { return '<button type="button" class="dm-b" data-demo="' + k + '"><span class="dm-bi">' + ic(i) + '</span><span><b>' + a + '</b><small>' + b + '</small></span>' + ic('right', 'dm-ch') + '</button>'; }
  function logo() { return '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#245D50"/><path d="M16 6.5a7 7 0 017 7c0 5.2-7 11.5-7 11.5S9 18.7 9 13.5a7 7 0 017-7z" fill="#fff"/><circle cx="16" cy="13.5" r="2.6" fill="#245D50"/></svg>'; }
  APP.logo = logo;
  APP.renderDemo = renderDemo;

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-demo]'); if (!b) return;
    var k = b.getAttribute('data-demo');
    if (k !== 'close' && k !== 'time' && k !== 'net') document.body.classList.remove('demo-open');
    switch (k) {
      case 'close': document.body.classList.remove('demo-open'); return;
      case 'qr-a': APP.go('#/h/HDL01'); return;
      case 'qr-b': APP.go('#/h/YNL02'); return;
      case 'qr-bad': APP.go('#/h/SCG03'); return;
      case 'roulette': if (!ST.s.hotel) { ST.s.hotel = 'HDL01'; ST.track('qr_entry', { ref: 'HDL01', hotel: 'HDL01' }); } APP.go('#/roulette'); return;
      case 'redeem':
        if (!ST.s.hotel) { ST.s.hotel = 'HDL01'; ST.track('qr_entry', { ref: 'HDL01', hotel: 'HDL01' }); }
        var it = ST.s.issued.filter(function (x) { return SV.itemStatus(x) === 'usable'; })[0];
        if (!it) { var res = SV.issueCoupon(SV.remaining('c02') > 0 && !SV.hasIssued('c02') ? 'c02' : 'c07', 'demo-' + ST.seoul().date); if (res.ok) it = res.item; else { APP.toast(t(res.err), 'err'); return; } }
        APP.go('#/coupon/' + it.id); return;
      case 'capture':
        if (!ST.s.hotel) { ST.s.hotel = 'HDL01'; }
        var it2 = ST.s.issued.filter(function (x) { return SV.itemStatus(x) === 'usable'; })[0];
        if (!it2) { var r2 = SV.issueCoupon(SV.remaining('c07') > 0 && !SV.hasIssued('c07') ? 'c07' : 'c06', 'demo-cap-' + ST.seoul().date); if (r2.ok) it2 = r2.item; else { APP.toast(t(r2.err), 'err'); return; } }
        APP.go('#/coupon/' + it2.id + '?capture=1'); return;
      case 'picks': if (!ST.s.hotel) ST.s.hotel = 'HDL01'; APP.go('#/picks'); return;
      case 'map': if (!ST.s.hotel) ST.s.hotel = 'HDL01'; APP.go('#/map'); return;
      case 'subway': APP.go('#/subway'); return;
      case 'ops': APP.go('#/ops'); return;
      case 'time':
        var v = b.getAttribute('data-v');
        if (v === 'next') { ST.setClock('00:05', 1); ST.s.demo.label = 'next'; }
        else { ST.setClock(v || null, 0); ST.s.demo.label = v; }
        ST.save(); render(); APP.toast('서울 시각을 ' + U.hm() + '(' + ST.seoul().date + ')로 맞췄습니다', 'info'); return;
      case 'net': ST.s.demo.offline = b.getAttribute('data-v') === 'off'; ST.save(); render(); return;
      case 'reset':
        APP.confirm('이 브라우저에 저장된 체험 데이터(쿠폰·룰렛·이벤트·운영 콘솔 변경 사항)를 모두 초기화할까요?', function () {
          if (ST.reset()) { location.replace(location.pathname + '#/'); setTimeout(function () { location.reload(); }, 50); }
          else APP.toast('저장소에 접근할 수 없어 초기화하지 못했습니다.', 'err');
        });
        return;
    }
  });

  /* 실시간 이벤트 수신 (운영 콘솔 이벤트 로그 갱신) */
  APP.onEvent = function (ev) { if (window.OPS && OPS.onEvent) OPS.onEvent(ev); };

  /* 시연 시계 갱신 */
  setInterval(function () { var c = document.querySelector('.dm-clock'); if (c) { var s = ST.seoul(); c.textContent = s.date + ' ' + U.pad(s.hh) + ':' + U.pad(s.mi); } }, 15000);
  window.addEventListener('online', function () { render(); });
  window.addEventListener('offline', function () { render(); });

  APP.start = function () {
    if (!ST.s.lang) { ST.s.lang = 'en'; }
    var q = location.search.match(/[?&]h=([A-Za-z0-9]+)/);
    if (q && !location.hash) history.replaceState(null, '', location.pathname + '#/h/' + q[1]);
    window.addEventListener('hashchange', render);
    var fab = document.getElementById('demo-fab');
    if (fab) fab.addEventListener('click', function () { document.body.classList.add('demo-open'); var x = document.querySelector('#demo .dm-b'); if (x) x.focus(); });
    document.getElementById('demo-bg').addEventListener('click', function () { document.body.classList.remove('demo-open'); });
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
    render();
  };
})();
