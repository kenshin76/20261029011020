/* 운영 콘솔 (운영 담당자 전용) — 판정 지표 · 광고주 리포트 · 쿠폰·리딤 · 콘텐츠 시트 · QR 출력 · 이벤트 */
(function () {
  'use strict';
  var RD = window.RD, ST = window.ST, U = window.U, SV = window.SV, APP = window.APP;
  var esc = U.esc, ic = U.ic;
  var OPS = window.OPS = {};
  var F = { period: '7', hotel: 'all', ad: 'all', tab: 'places', evType: 'all', qr: 'HDL01', hsel: 'HDL01' };
  var SERIES = [['qr', 'QR 유입', '#2B6DE8'], ['issued', '쿠폰 발급', '#E8920C'], ['redeemed', '쿠폰 사용', '#0E9F8E']];
  var NAV = [
    ['dash', 'chart', '대시보드'], ['hotels', 'bed', '호텔별 지표'], ['ads', 'eye', '광고주 리포트'], ['coupons', 'ticket', '쿠폰 · 리딤'],
    ['content', 'sheet', '콘텐츠 시트'], ['qr', 'qr', 'QR 출력'], ['events', 'log', '이벤트 로그']
  ];
  var root, authTimer;
  OPS.authorized = function () {
    return !!RD.OPS_ACCOUNTS.some(function (a) { return a.id === ST.s.ops.user; }) && Number.isFinite(ST.s.ops.expiresAt) && ST.s.ops.expiresAt > Date.now();
  };
  function requireAuth() {
    if (OPS.authorized()) return true;
    if (ST.s.ops.user) { ST.s.ops.user = null; ST.s.ops.expiresAt = 0; ST.save(true); }
    return false;
  };
  function can(page) { return ST.s.ops.user === 'pm' || page === 'ads'; }


  /* ---------- 집계 ---------- */
  function dateOf(ago) { return ST.seoul(ST.now() - ago * 864e5).date; }
  function codes() { return ST.content().hotels.filter(function (h) { return h.status === 'active'; }).map(function (h) { return h.code; }); }
  function liveRow(code, date) {
    var issued = ST.s.issued.filter(function (x) { return x.hotel === code && ST.seoul(x.issuedAt).date === date; });
    var red = ST.s.issued.filter(function (x) { return x.hotel === code && x.status === 'used' && ST.seoul(x.usedAt).date === date; });
    var amt = red.filter(function (x) { return x.amount != null; });
    var qrKeys = (ST.s.metrics.qr[date + '|' + code] || []).map(function (id) { return code + '|' + id; });
    var ads = Object.keys(ST.s.metrics.ads).map(function (k) { return ST.s.metrics.ads[k]; }).filter(function (x) { return x.date === date && x.hotel === code; });
    return {
      qr: qrKeys.length, qrKeys: qrKeys, issued: issued.length, redeemed: red.length,
      cohortRedeemed: issued.filter(function (x) { return x.status === 'used' && x.usedAt <= ST.now(); }).length,
      amount: amt.reduce(function (n, x) { return n + x.amount; }, 0), amountN: amt.length,
      imp: ads.reduce(function (n, x) { return n + x.imp; }, 0), clk: ads.reduce(function (n, x) { return n + x.clk; }, 0),
      n: ST.s.events.filter(function (e) { return e.sd === date && e.hotel === code; }).length
    };
  }
  function rows(period, hotel) {
    var n = period === 'today' ? 1 : +period, out = [];
    var frac = Math.max(0.05, (ST.seoul().hh * 60 + ST.seoul().mi) / 1440);
    for (var ago = n - 1; ago >= 0; ago--) {
      var date = dateOf(ago);
      codes().forEach(function (code) {
        if (hotel !== 'all' && hotel !== code) return;
        var hist = RD.HISTORY.filter(function (x) { return x.hotel === code && x.day === (ago || 1); })[0];
        var r = { date: date, hotel: code, target: null, delivered: null, qr: 0, issued: 0, redeemed: 0, amount: 0, amountN: 0, imp: 0, clk: 0 };
        if (hist) {
          ['target', 'delivered', 'qr', 'issued', 'redeemed', 'amount', 'amountN', 'imp', 'clk'].forEach(function (k) { r[k] = hist[k]; });
          if (!ago) { ['qr', 'issued', 'redeemed', 'amount', 'amountN', 'imp', 'clk'].forEach(function (k) { r[k] = Math.round(r[k] * frac); }); r.target = null; r.delivered = null; }
        }
        /* 가상 이력의 사용 수는 해당 날짜 발급분 중 조회일까지 사용한 수로 구성 */
        r.cohortRedeemed = r.redeemed;
        r.qrKeys = Array.from({length:r.qr}, function (_, i) { return code + '|sample-' + (i + ago * 31); });
        var lv = liveRow(code, date);
        ['issued', 'redeemed', 'cohortRedeemed', 'amount', 'amountN', 'imp', 'clk'].forEach(function (k) { r[k] += lv[k]; });
        r.qrKeys = r.qrKeys.concat(lv.qrKeys); r.qr = r.qrKeys.length; r.live = lv.n;
        var d = ST.s.ops.dist[code + '|' + date];
        if (d) { r.target = d.target; r.delivered = d.delivered; r.manual = true; }
        out.push(r);
      });
    }
    return out;
  }
  function sum(list) {
    var s = { target: 0, delivered: 0, qrRec: 0, qr: 0, issued: 0, redeemed: 0, cohortRedeemed: 0, amount: 0, amountN: 0, imp: 0, clk: 0, missing: 0, days: list.length, live: 0 };
    var allQr = new Set(), recordedQr = new Set();
    list.forEach(function (r) {
      ['issued', 'redeemed', 'cohortRedeemed', 'amount', 'amountN', 'imp', 'clk', 'live'].forEach(function (k) { s[k] += r[k] || 0; });
      (r.qrKeys || []).forEach(function (id) { allQr.add(id); });
      if (r.target != null && r.delivered != null) { s.target += r.target; s.delivered += r.delivered; (r.qrKeys || []).forEach(function (id) { recordedQr.add(id); }); } else s.missing++;
    });
    s.qr = allQr.size; s.qrRec = recordedQr.size;
    return s;
  }
  function pct(a, b) { return b > 0 ? (a / b * 100).toFixed(1) + '%' : null; }
  function rateCell(a, b) { var p = pct(a, b); return p ? '<b>' + p + '</b>' : '<span class="na" title="분모가 기록되지 않아 산출하지 않습니다">산출 불가</span>'; }
  function hname(code) { var h = ST.hotel(code); return h ? h.name_ko : code; }
  function n(v) { return U.won(v); }

  /* ---------- 차트 (단일 축 · 범례 · 마우스 오버 표) ---------- */
  function lineChart(list, series) {
    var dates = []; list.forEach(function (r) { if (dates.indexOf(r.date) < 0) dates.push(r.date); });
    var data = dates.map(function (d) { var o = { date: d }; series.forEach(function (s) { o[s[0]] = 0; }); list.filter(function (r) { return r.date === d; }).forEach(function (r) { series.forEach(function (s) { o[s[0]] += r[s[0]]; }); }); return o; });
    var W = 640, H = 220, L = 40, R = 14, T = 14, B = 28, max = 1;
    data.forEach(function (o) { series.forEach(function (s) { max = Math.max(max, o[s[0]]); }); });
    var step = Math.pow(10, Math.floor(Math.log10(max))), top = Math.ceil(max / step) * step; if (top / step < 4) { step /= 2; top = Math.ceil(max / step) * step; }
    var x = function (i) { return L + (data.length < 2 ? (W - L - R) / 2 : i * (W - L - R) / (data.length - 1)); }, y = function (v) { return T + (1 - v / top) * (H - T - B); };
    var grid = ''; for (var g = 0; g <= top; g += step) grid += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(g).toFixed(1) + '" y2="' + y(g).toFixed(1) + '" class="cg"/><text x="' + (L - 6) + '" y="' + (y(g) + 4).toFixed(1) + '" class="cy">' + g + '</text>';
    var xl = data.map(function (o, i) { return (data.length <= 8 || i % 2 === 0 || i === data.length - 1) ? '<text x="' + x(i).toFixed(1) + '" y="' + (H - 8) + '" class="cx">' + o.date.slice(5).replace('-', '/') + '</text>' : ''; }).join('');
    var paths = series.map(function (s) {
      var d = data.map(function (o, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(o[s[0]]).toFixed(1); }).join('');
      var dots = data.map(function (o, i) { return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(o[s[0]]).toFixed(1) + '" r="4" fill="' + s[2] + '" stroke="#fff" stroke-width="2"/>'; }).join('');
      var last = data[data.length - 1];
      return '<path d="' + d + '" fill="none" stroke="' + s[2] + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' + dots +
        '<text x="' + (x(data.length - 1) - 6).toFixed(1) + '" y="' + (y(last[s[0]]) - 9).toFixed(1) + '" class="cl" text-anchor="end">' + n(last[s[0]]) + '</text>';
    }).join('');
    var hits = data.map(function (o, i) {
      var tip = o.date + '|' + series.map(function (s) { return s[1] + ' ' + n(o[s[0]]); }).join('|');
      var w = (W - L - R) / Math.max(1, data.length - 1);
      return '<rect x="' + (x(i) - w / 2).toFixed(1) + '" y="' + T + '" width="' + w.toFixed(1) + '" height="' + (H - T - B) + '" class="hit" data-tip="' + esc(tip) + '" data-x="' + x(i).toFixed(1) + '"/>';
    }).join('');
    return '<div class="chart"><div class="legend2">' + series.map(function (s) { return '<span><i style="background:' + s[2] + '"></i>' + s[1] + '</span>'; }).join('') + '</div>' +
      '<div class="chart-in"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="일자별 ' + series.map(function (s) { return s[1]; }).join('·') + ' 추이"><line class="xh" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) + '"/>' + grid + xl + paths + hits + '</svg><div class="ctip" hidden></div></div></div>';
  }
  function bindTips(el) {
    el.querySelectorAll('.chart-in, .hbars').forEach(function (c) {
      var tip = c.querySelector('.ctip'), xh = c.querySelector('.xh');
      c.addEventListener('mousemove', function (e) {
        var h = e.target.closest('[data-tip]'); if (!h) { tip.hidden = true; if (xh) xh.style.opacity = 0; return; }
        var p = h.getAttribute('data-tip').split('|');
        tip.innerHTML = '<b>' + esc(p[0]) + '</b>' + p.slice(1).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('');
        tip.hidden = false; var r = c.getBoundingClientRect();
        tip.style.left = Math.min(r.width - 170, Math.max(0, e.clientX - r.left + 12)) + 'px'; tip.style.top = (e.clientY - r.top + 12) + 'px';
        if (xh && h.getAttribute('data-x')) { xh.setAttribute('x1', h.getAttribute('data-x')); xh.setAttribute('x2', h.getAttribute('data-x')); xh.style.opacity = 1; }
      });
      c.addEventListener('mouseleave', function () { tip.hidden = true; if (xh) xh.style.opacity = 0; });
    });
  }
  function hbars(items, unit, color) {
    var max = Math.max.apply(null, items.map(function (x) { return x.v; }).concat([1]));
    return '<div class="hbars">' + items.map(function (x) {
      return '<div class="hb" data-tip="' + esc(x.k + '|' + (x.tip || n(x.v) + unit)) + '"><span class="hb-k">' + esc(x.k) + '</span><span class="hb-t"><i style="width:' + (x.v / max * 100).toFixed(1) + '%;background:' + (color || '#2B6DE8') + '"></i></span><b>' + n(x.v) + (x.sub ? '<small>' + esc(x.sub) + '</small>' : '') + '</b></div>';
    }).join('') + '<div class="ctip" hidden></div></div>';
  }

  /* ---------- 공통 틀 ---------- */
  OPS.render = function (r) {
    root = document.getElementById('ops');
    var page = r.arg || 'dash';
    clearInterval(authTimer);
    if (!requireAuth()) { root.innerHTML = login(); bindLogin(); return; }
    if (!can(page)) { APP.go('#/ops/ads', true); return; }
    authTimer = setInterval(function () { if (!requireAuth()) { APP.render(); APP.toast('로그인 시간이 만료되었습니다. 다시 로그인해 주세요.', 'info'); } else { var clock = root.querySelector('.o-sess span'); if (clock) clock.textContent = '운영 세션 · ' + Math.max(1, Math.ceil((ST.s.ops.expiresAt - Date.now()) / 60000)) + '분 이내 만료'; } }, 1000);
    APP.cleanup(function () { clearInterval(authTimer); });
    if (!PAGES[page]) page = 'dash';
    var u = RD.OPS_ACCOUNTS.filter(function (a) { return a.id === ST.s.ops.user; })[0] || RD.OPS_ACCOUNTS[0];
    var cur = NAV.filter(function (x) { return x[0] === page; })[0];
    root.innerHTML = '<div class="ops"><aside class="o-side"><a class="o-brand" href="#/ops/dash">' + APP.logo() + '<span><b>ROAMLY</b><small>Partner console</small></span></a>' +
      '<nav class="o-nav">' + NAV.filter(function (x) { return can(x[0]); }).map(function (x) { return '<a href="#/ops/' + x[0] + '" class="' + (x[0] === page ? 'on' : '') + '"' + (x[0] === page ? ' aria-current="page"' : '') + '>' + ic(x[1]) + '<span>' + x[2] + '</span></a>'; }).join('') + '</nav>' +
      '<div class="o-user">' + ic('user') + '<span><b>' + esc(u.label) + '</b><small>' + esc(u.email) + '</small></span></div>' +
      '<button type="button" class="o-out" data-o="logout">' + ic('logout') + '로그아웃</button></aside>' +
      '<main class="o-main">' + portalToolbar() + '<header class="o-head"><div><h1>' + cur[2] + '</h1><p>' + esc(DESC[page]) + '</p></div><div class="o-sess">' + ic('shield') + '<span>운영 세션 · ' + Math.max(1, Math.ceil((ST.s.ops.expiresAt - Date.now()) / 60000)) + '분 이내 만료</span></div></header>' +
      '<div class="o-body" id="obody"></div></main></div>';
    var body = root.querySelector('#obody');
    body.innerHTML = PAGES[page]();
    if (MOUNT[page]) MOUNT[page](body);
    bindTips(body);
    window.scrollTo(0, 0);
  };
  var DESC = {
    dash: '호텔별 「전달 → QR 유입 → 쿠폰 발급 → 사용」을 같은 기준으로 확인합니다. 발급·사용은 처리 기록으로 집계하며, 리딤률은 선택 기간 발급분을 기준으로 계산합니다.',
    hotels: '호텔이 기록한 배포 대상 수·실제 전달 수로 전달률을 계산합니다. 기록이 없는 일자는 산출 불가로 표시합니다.',
    ads: '배너 노출·클릭을 호텔별·국적별·시간대별로 집계합니다. 프로필 미입력은 「미상」으로 구분합니다.',
    coupons: '매장·쿠폰별 오늘(서울 날짜) 수량과 사용 기록, PIN 실패·잠금을 확인합니다.',
    content: '운영 스프레드시트를 검증·미리보기한 뒤 배포합니다. 오류가 있으면 현재 운영본을 유지합니다.',
    qr: '호텔 코드가 담긴 인쇄용 QR을 만듭니다. 호텔 코드는 다른 호텔에 재사용하지 않습니다.',
    events: '이 브라우저에서 발생한 체험 이벤트가 실시간으로 쌓입니다. 이벤트 정의서 기준으로 기록합니다.'
  };
  function filters(withAd) {
    var hs = codes();
    return '<div class="o-filters"><div class="o-seg">' + [['today', '오늘'], ['7', '최근 7일'], ['14', '최근 14일']].map(function (p) { return '<button type="button" class="' + (F.period === p[0] ? 'on' : '') + '" data-o="period" data-v="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>' +
      '<label class="o-sel">' + ic('bed') + '<select data-o="hotel"><option value="all">전체 호텔 (' + hs.length + ')</option>' + hs.map(function (c) { return '<option value="' + c + '"' + (F.hotel === c ? ' selected' : '') + '>' + esc(hname(c)) + ' · ' + c + '</option>'; }).join('') + '</select></label>' +
      (withAd ? '<label class="o-sel">' + ic('eye') + '<select data-o="ad"><option value="all">전체 광고주</option>' + ST.content().banners.map(function (b) { return '<option value="' + b.id + '"' + (F.ad === b.id ? ' selected' : '') + '>' + esc(b.advertiser) + '</option>'; }).join('') + '</select></label>' : '') +
      '<span class="o-asof">' + ic('clock') + '조회 기준 ' + ST.seoul().date + ' ' + U.hm() + ' (서울)</span></div>';
  }

  /* ---------- 로그인 ---------- */
  function portalToolbar() {
    var target = ST.s.hotel && ST.hotel(ST.s.hotel) && ST.hotel(ST.s.hotel).status === 'active' ? '#/home' : '#/';
    return '<div class="portal-toolbar"><span>ROAMLY <small>운영 콘솔</small></span><a class="portal-link" href="' + target + '">' + ic('back') + '<span>관광객 화면으로</span>' + ic('right') + '</a></div>';
  }
  function login() {
    return '<div class="o-login-page">' + portalToolbar() + '<div class="o-login"><div class="ol-art"><div class="ol-grid"></div><div class="ol-in"><span class="brand">' + APP.logo() + '<b>ROAMLY</b></span><span class="kicker">Partner console</span><h1>호텔과 매장을 잇는<br>운영 공간.</h1>' +
      '<p>호텔별 이용 현황을 확인하고, 매장 혜택과 안내 정보를 한곳에서 관리하세요.</p>' +
      '</div></div>' +
      '<div class="ol-form"><div class="ol-box"><h2>운영 콘솔 로그인</h2><p class="ol-sub">운영 계정으로 로그인해 호텔과 매장의 현황을 확인하세요.</p>' +
      '<form class="ol-f" id="olf"><label for="oid">이메일</label><input id="oid" name="email" class="inp" type="email" autocomplete="username" placeholder="이메일을 입력해 주세요" required>' +
      '<label for="opw">비밀번호</label><input id="opw" name="password" class="inp" type="password" autocomplete="current-password" placeholder="비밀번호를 입력해 주세요" required>' +
      '<p class="ol-err" role="alert"></p><button class="obtn pri wide" type="submit">로그인</button></form>' +
      '<div class="ol-trial"><div class="ol-th"><b>체험 계정</b><span>계정을 누르면 입력란에 채워집니다.</span></div>' +
      RD.OPS_ACCOUNTS.map(function (a) { return '<button type="button" class="ol-acc" data-fill="' + a.id + '"><span><b>' + esc(a.label) + '</b><small>' + esc(a.email) + ' · ' + esc(a.role) + '</small></span><code>' + esc(a.password) + '</code></button>'; }).join('') +
      '<p class="ol-disc">이 화면의 호텔·매장·지표는 체험용 가상 자료입니다. 로그인은 30분 후 만료되며, 5회 실패하면 5분 동안 잠깁니다. 실제 서버와 연동되지 않는 체험 환경입니다. 변경 내용은 이 브라우저에만 저장됩니다.</p>' +
      '<button type="button" class="obtn sm" data-demo="reset">' + ic('refresh') + '체험 데이터 초기화</button></div></div></div></div>';
  }
  function bindLogin() {
    var f = root.querySelector('#olf'), err = root.querySelector('.ol-err');
    root.querySelectorAll('[data-fill]').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = RD.OPS_ACCOUNTS.filter(function (x) { return x.id === b.getAttribute('data-fill'); })[0];
        f.email.value = a.email; f.password.value = a.password; err.textContent = ''; f.email.focus();
      });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var limit = ST.s.ops.loginFail;
      if (limit.until > Date.now()) { err.textContent = '로그인 시도가 잠겼습니다. ' + Math.ceil((limit.until - Date.now()) / 60000) + '분 후 다시 시도해 주세요.'; return; }
      if (limit.until) { limit.n = 0; limit.until = 0; }
      var a = RD.OPS_ACCOUNTS.filter(function (x) { return x.email === f.email.value.trim() && x.password === f.password.value; })[0];
      if (!a) { limit.n++; if (limit.n >= 5) limit.until = Date.now() + 5 * 60000; ST.save(true); err.textContent = limit.until ? '5회 실패하여 5분 동안 로그인이 잠겼습니다.' : '이메일 또는 비밀번호가 맞지 않습니다. (' + limit.n + '/5)'; f.password.value = ''; return; }
      ST.s.ops.loginFail = {n:0, until:0}; ST.s.ops.user = a.id; ST.s.ops.expiresAt = Date.now() + 30 * 60000; ST.save(true); APP.go(a.id === 'ad' ? '#/ops/ads' : '#/ops/dash');
    });
  }

  /* ---------- 페이지 ---------- */
  var PAGES = {}, MOUNT = {};

  PAGES.dash = function () {
    var list = rows(F.period, F.hotel), s = sum(list);
    var dr = pct(s.delivered, s.target), sr = pct(s.qrRec, s.delivered), rr = pct(s.cohortRedeemed, s.issued);
    var funnel = [['전달', s.delivered, '호텔 기록'], ['QR 유입', s.qr, '호텔별 고유 브라우저'], ['쿠폰 발급', s.issued, '발급 처리 기록'], ['쿠폰 사용', s.cohortRedeemed, '해당 기간 발급분']];
    var fmax = Math.max.apply(null, funnel.map(function (x) { return x[1]; }).concat([1]));
    var byHotel = codes().filter(function (c) { return F.hotel === 'all' || F.hotel === c; }).map(function (c) { return { c: c, s: sum(list.filter(function (r) { return r.hotel === c; })) }; });
    return filters() +
      '<div class="kpis">' +
        kpi('전달률', dr, '실제 전달 ' + n(s.delivered) + ' ÷ 배포 대상 ' + n(s.target), s.missing ? '기록 누락 ' + s.missing + '건 제외' : '') +
        kpi('스캔률', sr, 'QR 유입 ' + n(s.qrRec) + ' ÷ 전달 ' + n(s.delivered), '참고 전환 지표 · 실제 스캔 횟수와 구분') +
        kpi('쿠폰 리딤률', rr, '해당 발급분 사용 ' + n(s.cohortRedeemed) + ' ÷ 발급 ' + n(s.issued), '같은 기간 발급분 기준') +
        '<div class="kpi sm"><span>발급 · 사용</span><b>' + n(s.issued) + ' <small>/ ' + n(s.redeemed) + '</small></b><em>선택 기간 발급 수 / 사용일 기준 사용 수</em></div>' +
        '<div class="kpi sm"><span>입력된 구매 금액</span><b>₩' + n(s.amount) + '</b><em>' + n(s.amountN) + '건 입력 · 미입력 ' + n(s.redeemed - s.amountN) + '건은 합계에서 제외</em></div>' +
      '</div>' +
      '<div class="o-grid2"><section class="ocard"><h3>이용 전환 흐름 <small>' + (F.hotel === 'all' ? '전체 호텔' : esc(hname(F.hotel))) + ' · 단계별 건수와 참고 비율' + (s.missing ? ' · 배포 기록 누락 일자는 전달→QR 전환 제외' : '') + '</small></h3><div class="funnel">' +
        funnel.map(function (f, i) {
          var conv = i === 1 ? (s.missing ? null : pct(f[1], funnel[0][1])) : i ? pct(f[1], funnel[i - 1][1]) : null;
          return '<div class="fn"><span class="fn-k">' + f[0] + '<small>' + f[2] + '</small></span><span class="fn-b"><i style="width:' + (f[1] / fmax * 100).toFixed(1) + '%"></i></span><b>' + n(f[1]) + '</b>' + (conv ? '<em>' + conv + '</em>' : '<em></em>') + '</div>';
        }).join('') + '</div></section>' +
      '<section class="ocard"><h3>일자별 추이</h3>' + lineChart(list, SERIES) + '</section></div>' +
      '<section class="ocard"><h3>호텔별 지표 <small>' + (s.live ? '이 브라우저의 체험 이벤트 ' + s.live + '건 포함' : '체험 이벤트는 오늘 집계에 함께 반영됩니다') + '</small><button type="button" class="obtn sm" data-o="csv-dash">' + ic('download') + 'CSV</button></h3>' +
      '<div class="otw"><table class="otable"><thead><tr><th>호텔</th><th>배포 대상</th><th>전달</th><th>전달률</th><th>QR 유입</th><th>스캔률</th><th>발급</th><th>사용</th><th>리딤률</th></tr></thead><tbody>' +
      byHotel.map(function (x) { var q = x.s; return '<tr><th><b>' + esc(hname(x.c)) + '</b><small>' + x.c + (q.missing ? ' · 기록 누락 ' + q.missing + '일' : '') + '</small></th><td>' + (q.missing === q.days ? '<span class="na">미기록</span>' : n(q.target)) + '</td><td>' + (q.missing === q.days ? '—' : n(q.delivered)) + '</td><td>' + rateCell(q.delivered, q.target) + '</td><td>' + n(q.qr) + '</td><td>' + rateCell(q.qrRec, q.delivered) + '</td><td>' + n(q.issued) + '</td><td>' + n(q.redeemed) + '</td><td>' + rateCell(q.cohortRedeemed, q.issued) + '</td></tr>'; }).join('') +
      '</tbody></table></div><p class="o-note">' + ic('spark') + 'QR 유입은 호텔별로 선택 기간의 고유 브라우저를 집계하므로 일별 건수의 합계와 다를 수 있습니다. 한 브라우저에서 여러 쿠폰을 받을 수 있어 발급/유입 비율은 100%를 넘을 수 있습니다. 리딤률은 선택 기간 발급분의 사용 상태를 기준으로 합니다.</p></section>';
  };
  function kpi(label, val, formula, note) {
    return '<div class="kpi"><span>' + label + '</span><b>' + (val || '<span class="na">산출 불가</span>') + '</b><em>' + esc(formula) + '</em>' + (note ? '<small>' + esc(note) + '</small>' : '') + '</div>';
  }

  PAGES.hotels = function () {
    var hs = ST.content().hotels;
    var sel = F.hsel, h = ST.hotel(sel) || hs[0];
    var list = rows('14', h.code).reverse();
    return '<div class="o-grid2 w"><section class="ocard"><h3>호텔 목록 <small>운영 시트 「호텔」 기준</small></h3><div class="hlist">' + hs.map(function (x) {
      var miss = rows('14', x.code).filter(function (r) { return r.target == null; }).length;
      return '<button type="button" class="hl' + (x.code === h.code ? ' on' : '') + '" data-o="hsel" data-v="' + x.code + '"><span class="hl-c">' + x.code + '</span><span><b>' + esc(x.name_ko) + '</b><small>' + esc(x.area_ko) + ' · ' + (x.status === 'active' ? '운영 중' : '운영 종료') + '</small></span>' +
        (x.status !== 'active' ? '<em class="tag off">종료</em>' : miss ? '<em class="tag warn">기록 누락 ' + miss + '</em>' : '<em class="tag ok">정상</em>') + '</button>';
    }).join('') + '</div></section>' +
      '<section class="ocard"><h3>' + esc(h.name_ko) + ' · 일자별 배포 기록 <small>미기록 일자는 직접 입력해 반영할 수 있습니다</small></h3>' +
      (h.status !== 'active' ? '<p class="o-note">' + ic('alert') + '운영 종료 호텔입니다. 인쇄된 QR로 들어오면 안내 화면을 보여 줍니다.</p>' :
      '<div class="otw"><table class="otable distribution-table"><thead><tr><th>일자</th><th>배포 대상</th><th>실제 전달</th><th>전달률</th><th>QR 유입</th><th>스캔률</th><th>발급</th><th>사용</th></tr></thead><tbody>' +
      list.map(function (r) {
        var miss = r.target == null;
        return '<tr class="' + (miss ? 'miss' : '') + '"><th>' + r.date.slice(5).replace('-', '/') + (r.date === ST.seoul().date ? ' <em class="tag">오늘</em>' : '') + (r.manual ? ' <em class="tag ok">입력</em>' : '') + '</th>' +
          '<td><input class="cell" inputmode="numeric" data-dist="' + h.code + '|' + r.date + '|target" value="' + (miss ? '' : r.target) + '" placeholder="미기록" aria-label="' + r.date + ' 배포 대상"></td>' +
          '<td><input class="cell" inputmode="numeric" data-dist="' + h.code + '|' + r.date + '|delivered" value="' + (r.delivered == null ? '' : r.delivered) + '" placeholder="미기록" aria-label="' + r.date + ' 실제 전달"></td>' +
          '<td>' + rateCell(r.delivered || 0, r.target || 0) + '</td><td>' + n(r.qr) + '</td><td>' + (miss ? '<span class="na">산출 불가</span>' : rateCell(r.qr, r.delivered)) + '</td><td>' + n(r.issued) + '</td><td>' + n(r.redeemed) + '</td></tr>';
      }).join('') + '</tbody></table></div><p class="o-note">' + ic('spark') + '전달 수가 배포 대상보다 크거나 음수·소수이면 저장하지 않습니다. 배포 대상과 전달 수는 같은 단위(투숙객 또는 객실)로 입력해 주세요.</p>') + '</section></div>';
  };
  MOUNT.hotels = function (body) {
    body.addEventListener('change', function (e) {
      var i = e.target.closest('[data-dist]'); if (!i) return;
      if (!requireAuth() || ST.s.ops.user !== 'pm') { APP.render(); return; }
      var p = i.getAttribute('data-dist').split('|'), key = p[0] + '|' + p[1];
      var row = body.querySelectorAll('[data-dist^="' + key + '|"]'), tv = row[0].value.trim(), dv = row[1].value.trim();
      if (!tv && !dv) { delete ST.s.ops.dist[key]; ST.save(); OPS.render(APP.route); return; }
      if (!/^\d+$/.test(tv) || !/^\d+$/.test(dv)) { if (tv && dv) APP.toast('0 이상의 정수로 입력해 주세요.', 'err'); return; }
      if (+dv > +tv) { APP.toast('실제 전달 수가 배포 대상보다 클 수 없습니다.', 'err'); return; }
      ST.s.ops.dist[key] = { target: +tv, delivered: +dv }; ST.save();
      APP.toast(p[1] + ' 배포 기록을 저장했습니다.', 'ok'); OPS.render(APP.route);
    });
  };

  /* 광고주 리포트 */
  var AD_W = { b01: 0.32, b02: 0.26, b03: 0.24, b04: 0.18 };
  /* 정수 분배: 전체·호텔·국적·시간대 합계가 같은 값이 되도록 최대 나머지 방식 적용 */
  function allocate(total, weights) {
    var sumW = weights.reduce(function (n, v) { return n + v; }, 0) || 1;
    var exact = weights.map(function (w) { return total * w / sumW; });
    var out = exact.map(Math.floor), left = total - out.reduce(function (n, v) { return n + v; }, 0);
    exact.map(function (v, i) { return {i:i, fraction:v - out[i]}; }).sort(function (a, b) { return b.fraction - a.fraction || a.i - b.i; }).slice(0, left).forEach(function (x) { out[x.i]++; });
    return out;
  }
  function adData() {
    var list = rows(F.period, F.hotel), allBanners = ST.content().banners;
    var bans = allBanners.filter(function (b) { return F.ad === 'all' || b.id === F.ad; });
    var natKeys = RD.NATIONS.map(function (x) { return x.id; }).concat(['NA']);
    var natSum = RD.NATIONS.reduce(function (n, x) { return n + (RD.NAT_W[x.id] || 1); }, 0);
    var natWeights = natKeys.map(function (k) { return k === 'NA' ? natSum / 9 : RD.NAT_W[k] || 1; });
    var weights = allBanners.map(function (b) { return AD_W[b.id] || 0.2; });
    var byHotel = {}, byNat = {}, byHour = Array.from({length:24}, function () { return {imp:0, clk:0}; }), tot = {imp:0, clk:0};
    function addSample(r, imp, clk) {
      var hotel = byHotel[r.hotel] = byHotel[r.hotel] || {imp:0, clk:0};
      var hours = RD.HOUR_W.map(function (w, i) { return r.date === ST.seoul().date && i > ST.seoul().hh ? 0 : w; });
      ['imp', 'clk'].forEach(function (k) {
        var value = k === 'imp' ? imp : clk, ns = allocate(value, natWeights), hs = allocate(value, hours);
        hotel[k] += value; tot[k] += value;
        natKeys.forEach(function (key, i) { (byNat[key] = byNat[key] || {imp:0, clk:0})[k] += ns[i]; });
        hs.forEach(function (v, i) { byHour[i][k] += v; });
      });
    }
    list.forEach(function (r) {
      var live = liveRow(r.hotel, r.date);
      var imp = allocate(Math.max(0, r.imp - live.imp), weights), clk = allocate(Math.max(0, r.clk - live.clk), weights);
      allBanners.forEach(function (b, i) { if (F.ad === 'all' || F.ad === b.id) addSample(r, imp[i], clk[i]); });
    });
    Object.keys(ST.s.metrics.ads).forEach(function (key) {
      var e = ST.s.metrics.ads[key];
      if ((F.hotel !== 'all' && e.hotel !== F.hotel) || (F.ad !== 'all' && e.ref !== F.ad) || !list.some(function (r) { return r.hotel === e.hotel && r.date === e.date; })) return;
      ['imp', 'clk'].forEach(function (k) {
        (byHotel[e.hotel] = byHotel[e.hotel] || {imp:0, clk:0})[k] += e[k];
        (byNat[e.nat] = byNat[e.nat] || {imp:0, clk:0})[k] += e[k];
        byHour[e.hh][k] += e[k]; tot[k] += e[k];
      });
    });
    return { byHotel:byHotel, byNat:byNat, byHour:byHour, tot:tot, bans:bans };
  }
  function natName(k) { if (k === 'NA') return '미상'; var x = RD.NATIONS.filter(function (n) { return n.id === k; })[0]; return x ? x.ko : k; }
  PAGES.ads = function () {
    var d = adData(), ctr = pct(d.tot.clk, d.tot.imp);
    var natItems = Object.keys(d.byNat).map(function (k) { return { k: natName(k), v: d.byNat[k].imp, sub: '클릭 ' + n(d.byNat[k].clk), tip: '노출 ' + n(d.byNat[k].imp) + '|클릭 ' + n(d.byNat[k].clk) + '|CTR ' + (pct(d.byNat[k].clk, d.byNat[k].imp) || '-') }; }).sort(function (a, b) { return b.v - a.v; });
    var hmax = Math.max.apply(null, d.byHour.map(function (x) { return x.imp; }).concat([1]));
    return filters(true) +
      '<div class="kpis"><div class="kpi"><span>노출</span><b>' + n(d.tot.imp) + '</b><em>HOME 배너 · 하단 배너 · 쿠폰 상단</em></div><div class="kpi"><span>클릭</span><b>' + n(d.tot.clk) + '</b><em>배너를 눌러 매장 상세로 이동</em></div>' +
      '<div class="kpi"><span>클릭률 (CTR)</span><b>' + (ctr || '<span class="na">산출 불가</span>') + '</b><em>클릭 ÷ 노출</em></div><div class="kpi sm"><span>광고주</span><b>' + d.bans.length + '<small>개 배너</small></b><em>' + d.bans.map(function (b) { return esc(b.advertiser); }).join(' · ') + '</em></div></div>' +
      '<div class="o-grid2"><section class="ocard"><h3>호텔별 <button type="button" class="obtn sm" data-o="csv-ads">' + ic('download') + 'CSV</button></h3><div class="otw"><table class="otable"><thead><tr><th>호텔</th><th>노출</th><th>클릭</th><th>CTR</th></tr></thead><tbody>' +
        Object.keys(d.byHotel).map(function (k) { var o = d.byHotel[k]; return '<tr><th><b>' + esc(hname(k)) + '</b><small>' + k + '</small></th><td>' + n(o.imp) + '</td><td>' + n(o.clk) + '</td><td>' + rateCell(o.clk, o.imp) + '</td></tr>'; }).join('') + '</tbody></table></div></section>' +
      '<section class="ocard"><h3>국적별 노출 <small>프로필 미입력·미동의는 미상</small></h3>' + hbars(natItems.slice(0, 9), '회') + '</section></div>' +
      '<section class="ocard"><h3>시간대별 노출 <small>서울 시간 · 막대 높이 = 노출</small></h3><div class="hours24">' + d.byHour.map(function (o, i) {
        return '<div class="h24" data-tip="' + U.pad(i) + ':00|노출 ' + n(o.imp) + '|클릭 ' + n(o.clk) + '"><i style="height:' + Math.max(2, o.imp / hmax * 100).toFixed(1) + '%"></i><span>' + (i % 3 === 0 ? U.pad(i) : '') + '</span></div>';
      }).join('') + '<div class="ctip" hidden></div></div></section>';
  };
  MOUNT.ads = function (body) {
    var c = body.querySelector('.hours24'); if (!c) return; var tip = c.querySelector('.ctip');
    c.addEventListener('mousemove', function (e) { var h = e.target.closest('[data-tip]'); if (!h) { tip.hidden = true; return; } var p = h.getAttribute('data-tip').split('|'); tip.innerHTML = '<b>' + p[0] + '</b><span>' + p[1] + '</span><span>' + p[2] + '</span>'; tip.hidden = false; var r = c.getBoundingClientRect(); tip.style.left = Math.min(r.width - 150, e.clientX - r.left + 10) + 'px'; tip.style.top = '6px'; });
    c.addEventListener('mouseleave', function () { tip.hidden = true; });
  };

  /* 쿠폰·리딤 */
  PAGES.coupons = function () {
    var today = ST.seoul().date, cps = ST.content().coupons;
    var usedToday = function (ref) { return ST.s.issued.filter(function (x) { return x.ref === ref && x.status === 'used' && ST.seoul(x.usedAt).date === today; }).length; };
    var log = ST.s.issued.filter(function (x) { return x.status === 'used'; }).sort(function (a, b) { return b.usedAt - a.usedAt; });
    var fails = ST.s.events.filter(function (e) { return e.type === 'redeem_fail'; }).slice(-8).reverse();
    var cc = ST.s.ops.concurrency;
    return '<section class="ocard"><h3>오늘의 쿠폰 수량 <small>' + today + ' (서울) · 일일 한도와 사용 현황</small></h3><div class="otw"><table class="otable"><thead><tr><th>쿠폰</th><th>매장</th><th>일일 한도</th><th>발급</th><th>잔여</th><th>사용 (이 브라우저)</th><th>소진율</th></tr></thead><tbody>' +
      cps.map(function (c) {
        var p = ST.place(c.place_id), left = SV.remaining(c.id), iss = (+c.daily_limit) - left, r = iss / Math.max(1, +c.daily_limit);
        return '<tr><th><b>' + esc(c.title_ko) + '</b><small>' + c.id + (c.active !== 'Y' ? ' · 비활성' : '') + '</small></th><td>' + esc(p ? p.name_ko : '-') + '</td><td>' + c.daily_limit + '</td><td>' + iss + '</td><td>' + (left ? left : '<em class="tag off">소진</em>') + '</td><td>' + usedToday(c.id) + '</td><td><span class="bar"><i style="width:' + (r * 100).toFixed(0) + '%"></i></span></td></tr>';
      }).join('') + '</tbody></table></div></section>' +
      '<section class="ocard"><h3>룰렛 상품 재고 <small>한정 상품 소진 시 웰컴 혜택(한도 없음)으로 전환</small></h3><div class="otw"><table class="otable"><thead><tr><th>상품</th><th>등급</th><th>일일 한도</th><th>잔여</th></tr></thead><tbody>' +
      Object.keys(RD.ROULETTE.prizes).map(function (k) {
        var pz = RD.ROULETTE.prizes[k], tier = /^r_g/.test(k) ? '골드' : /^r_s/.test(k) ? '실버' : /^r_b/.test(k) ? '브론즈' : '웰컴', left = SV.prizeLeft(k);
        return '<tr><th><b>' + esc(pz.title_ko) + '</b><small>' + (pz.adult ? '주류 포함 · 18–24 연령대 제외' : '') + '</small></th><td>' + tier + '</td><td>' + (pz.limit || '없음') + '</td><td>' + (left === Infinity ? '∞' : left ? left : '<em class="tag off">소진</em>') + '</td></tr>';
      }).join('') + '</tbody></table></div></section>' +
      '<div class="o-grid2"><section class="ocard"><h3>사용(리딤) 기록 <small>이 브라우저의 체험 기록</small></h3>' + (log.length ? '<div class="otw"><table class="otable"><thead><tr><th>사용 시각</th><th>쿠폰</th><th>매장</th><th>발급 호텔</th><th>구매 금액</th></tr></thead><tbody>' +
        log.map(function (x) { var p = ST.place(x.place_id); return '<tr><td>' + U.dt(x.usedAt) + '</td><td>' + esc(x.title_ko) + '</td><td>' + esc(p ? p.name_ko : '') + '</td><td>' + x.hotel + '</td><td>' + (x.amount == null ? '<span class="na">미입력</span>' : '₩' + n(x.amount)) + '</td></tr>'; }).join('') +
        '</tbody></table></div>' : '<p class="o-empty">아직 사용 처리된 쿠폰이 없습니다. 관광객 화면에서 쿠폰을 받아 직원 PIN으로 사용해 보세요.</p>') + '</section>' +
      '<section class="ocard"><h3>PIN 실패 · 잠금 <small>매장별 5회 실패 시 5분 잠금</small></h3>' + (fails.length ? '<ul class="flog">' + fails.map(function (e) { var p = ST.place(e.place); return '<li><span>' + U.dt(e.t) + '</span><b>' + esc(p ? p.name_ko : e.place) + '</b><em>' + (e.reason === 'pin' ? 'PIN 불일치' : '검증값 만료') + '</em></li>'; }).join('') + '</ul>' : '<p class="o-empty">실패 기록이 없습니다.</p>') +
      '<p class="o-note">' + ic('lock') + '체험용 PIN 실패 기록입니다. 실제 서비스의 PIN 해시 검증은 서버에서 구현합니다.</p></section></div>' +
      '<details class="o-advanced"><summary><span class="o-advanced-title"><b>고급 도구</b><small>동시 발급 시험</small></span><span class="o-advanced-toggle"><span class="advanced-open">펼치기</span><span class="advanced-close">접기</span>' + ic('right') + '</span></summary>' +
      '<div class="o-advanced-body"><h3>동시 발급 시험</h3><p class="o-p">남은 1장에 여러 요청이 도착할 때의 처리 규칙을 별도로 확인합니다. 이 도구는 현재 브라우저에서 순차 처리로 규칙을 재현하며, 실제 서버 부하 시험 결과는 아닙니다.</p>' +
      '<button type="button" class="obtn pri" data-o="race">' + ic('play') + '시험 실행</button><div class="race" id="race">' + (cc ? raceView(cc) : '') + '</div></div></details>';
  };
  function raceView(cc) {
    return '<div class="rc-grid">' + cc.res.map(function (r, i) { return '<span class="rc ' + r + '" title="요청 ' + (i + 1) + '">' + (r === 'ok' ? ic('check') : r === 'dup' ? '↺' : '×') + '</span>'; }).join('') + '</div>' +
      '<p class="rc-sum"><b>성공 ' + cc.ok + '건</b> · 소진 응답 ' + cc.sold + '건 · 재시도 → 기존 결과 ' + cc.dup + '건 · <b class="okc">초과 발급 0건</b></p>';
  }
  function race() {
    var stock = 1, issued = {}, res = [], ok = 0, sold = 0, dup = 0;
    var reqs = []; for (var i = 0; i < 20; i++) reqs.push('req-' + i); reqs.push('req-3', 'req-3', 'req-7');
    reqs.sort(function () { return Math.random() - 0.5; });
    reqs.forEach(function (id) {
      if (issued[id]) { res.push('dup'); dup++; return; }   /* 같은 요청 재시도 → 기존 결과 */
      if (stock > 0) { stock--; issued[id] = 'ok'; res.push('ok'); ok++; } else { issued[id] = 'sold'; res.push('sold'); sold++; }
    });
    ST.s.ops.concurrency = { res: res, ok: ok, sold: sold, dup: dup }; ST.save();
    return ST.s.ops.concurrency;
  }

  /* 콘텐츠 시트 */
  var TABS = [['hotels', '호텔'], ['places', '장소'], ['coupons', '쿠폰'], ['banners', '배너']];
  var KEYS = { hotels: 'code', places: 'id', coupons: 'id', banners: 'id' };
  function draft() { if (!ST.s.ops.draft) ST.s.ops.draft = ST.clone(ST.content()); return ST.s.ops.draft; }
  function diffCount() {
    if (!ST.s.ops.draft) return 0; var c = 0, d = ST.s.ops.draft, cur = ST.content();
    TABS.forEach(function (tb) {
      var k = KEYS[tb[0]]; d[tb[0]].forEach(function (row) {
        var o = cur[tb[0]].filter(function (x) { return x[k] === row[k]; })[0];
        if (!o) { c++; return; } RD.SHEET_COLS[tb[0]].forEach(function (col) { if (String(o[col]) !== String(row[col])) c++; });
      });
      if (d[tb[0]].length < cur[tb[0]].length) c++;
    });
    return c;
  }
  function validate(d) {
    var errs = [], HM = /^([01]\d|2[0-3]):[0-5]\d$/, RANGE = /^([01]\d|2[0-3]):[0-5]\d-(?:([01]\d|2[0-3]):[0-5]\d|24:00)$/, DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    function e(tab, i, col, msg) { errs.push({ tab: tab, i: i, col: col, msg: msg }); }
    function uniq(tab, key) { var seen = Object.create(null); d[tab].forEach(function (r, i) {
      if (!r[key]) e(tab, i, key, '필수값'); else if (seen[r[key]]) e(tab, i, key, '중복 코드');
      if (tab !== 'hotels' && !/^[a-z][a-z0-9_-]{1,39}$/.test(r[key] || '')) e(tab, i, key, '영문 소문자로 시작하는 2~40자 코드');
      var original = ST.content()[tab][i];
      if (original && original[key] !== r[key]) e(tab, i, key, '기존 코드는 변경할 수 없습니다');
      seen[r[key]] = 1;
    }); }
    function geo(tab, r, i) { var la = +r.lat, ln = +r.lng; if (!(la >= 37.40 && la <= 37.72)) e(tab, i, 'lat', '서울 범위 밖 좌표'); if (!(ln >= 126.75 && ln <= 127.20)) e(tab, i, 'lng', '서울 범위 밖 좌표'); }
    function yn(tab, r, i, col) { if (r[col] !== 'Y' && r[col] !== 'N') e(tab, i, col, 'Y 또는 N'); }
    uniq('hotels', 'code');
    d.hotels.forEach(function (r, i) {
      if (!/^[A-Z]{3}\d{2}$/.test(r.code || '')) e('hotels', i, 'code', '형식: 영문 3자리+숫자 2자리');
      if (['active', 'closed'].indexOf(r.status) < 0) e('hotels', i, 'status', 'active 또는 closed');
      if (!r.name_en) e('hotels', i, 'name_en', '필수값'); if (!r.name_ko) e('hotels', i, 'name_ko', '필수값');
      geo('hotels', r, i); if (!HM.test(r.checkin)) e('hotels', i, 'checkin', '시각 형식 HH:MM'); if (!HM.test(r.checkout)) e('hotels', i, 'checkout', '시각 형식 HH:MM');
    });
    uniq('places', 'id');
    var pids = Object.create(null); d.places.forEach(function (r) { pids[r.id] = 1; });
    d.places.forEach(function (r, i) {
      if (!RD.CATS.some(function (c) { return c.id === r.cat; })) e('places', i, 'cat', '분류: food·cafe·night·shop·beauty·culture');
      if (!r.name_en) e('places', i, 'name_en', '필수값'); if (!r.name_ko) e('places', i, 'name_ko', '필수값 (길찾기에 사용)');
      if (!r.address_ko) e('places', i, 'address_ko', '필수값');
      geo('places', r, i);
      if (!RANGE.test(r.hours || '')) e('places', i, 'hours', '형식 HH:MM-HH:MM');
      if (r.break_time && (!RANGE.test(r.break_time) || r.break_time.split('-')[0] >= r.break_time.split('-')[1])) e('places', i, 'break_time', '형식 HH:MM-HH:MM 또는 빈칸');
      if (r.closed_days && r.closed_days.split(',').some(function (x) { return DAYS.indexOf(x.trim()) < 0; })) e('places', i, 'closed_days', '요일: Mon~Sun, 쉼표 구분');
      yn('places', r, i, 'local_fav'); yn('places', r, i, 'active');
    });
    uniq('coupons', 'id');
    d.coupons.forEach(function (r, i) {
      if (!pids[r.place_id]) e('coupons', i, 'place_id', '없는 장소 ID');
      if (!r.title_en) e('coupons', i, 'title_en', '필수값');
      if (!/^\d{1,7}$/.test(String(r.daily_limit))) e('coupons', i, 'daily_limit', '0~9,999,999의 정수');
      yn('coupons', r, i, 'active');
    });
    uniq('banners', 'id');
    d.banners.forEach(function (r, i) {
      if (!pids[r.place_id]) e('banners', i, 'place_id', '없는 장소 ID');
      if (!r.title_en) e('banners', i, 'title_en', '필수값');
      if (['pink', 'violet', 'coral', 'teal'].indexOf(r.tone) < 0) e('banners', i, 'tone', 'pink·violet·coral·teal');
      yn('banners', r, i, 'active');
    });
    return errs;
  }
  PAGES.content = function () {
    var d = draft(), tab = F.tab, cols = RD.SHEET_COLS[tab], cur = ST.content(), key = KEYS[tab];
    var errs = ST.s.ops.draftErrors, dc = diffCount(), oc = ST.s.ops.content;
    var errMap = {}; (errs || []).forEach(function (x) { errMap[x.tab + '|' + x.i + '|' + x.col] = x.msg; });
    var state = !dc ? 'clean' : errs == null ? 'edited' : errs.length ? 'error' : ST.s.ops.preview ? 'preview' : 'valid';
    var steps = [['edited', '시트 수정'], ['valid', '형식·참조 검증'], ['preview', '미리보기'], ['deploy', '배포']];
    var si = { clean: -1, edited: 0, error: 0, valid: 1, preview: 2 }[state];
    return '<div class="flow">' + steps.map(function (s, i) { return '<span class="' + (i <= si ? 'done' : '') + (i === si + 1 ? ' next' : '') + '"><i>' + (i + 1) + '</i>' + s[1] + '</span>'; }).join('') +
      '<span class="flow-v">운영본 <b>v' + oc.version + '</b> · ' + U.dt(oc.at) + '</span></div>' +
      '<section class="ocard"><div class="sh-tabs">' + TABS.map(function (x) { var ec = (errs || []).filter(function (q) { return q.tab === x[0]; }).length; return '<button type="button" class="' + (x[0] === tab ? 'on' : '') + '" data-o="tab" data-v="' + x[0] + '">' + x[1] + ' <small>' + d[x[0]].length + '</small>' + (ec ? '<em>' + ec + '</em>' : '') + '</button>'; }).join('') +
      '<span class="sh-tools">' + (tab === 'places' ? '<button type="button" class="obtn sm" data-o="addrow">' + ic('plus') + '행 추가</button><button type="button" class="obtn sm" data-o="badrow">' + ic('alert') + '오류 예시 넣기</button>' : '') + '</span></div>' +
      '<div class="sheet-g"><table class="sg"><thead><tr><th class="rn">#</th>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      d[tab].map(function (r, i) {
        var o = cur[tab].filter(function (x) { return x[key] === r[key]; })[0];
        return '<tr' + (!o ? ' class="new"' : '') + '><td class="rn">' + (i + 2) + '</td>' + cols.map(function (c) {
          var em = errMap[tab + '|' + i + '|' + c], ch = o && String(o[c]) !== String(r[c]);
          return '<td class="' + (/name|title|address|sub_en|advertiser|perks|cond/.test(c) ? 'w ' : '') + (em ? 'er' : '') + (ch ? ' ch' : '') + '"' + (em ? ' title="' + esc(em) + '"' : '') + '><input value="' + esc(r[c]) + '" data-cell="' + tab + '|' + i + '|' + c + '" aria-label="' + (i + 2) + '행 ' + c + '">' + (em ? '<span class="em">' + esc(em) + '</span>' : '') + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="o-note">' + ic('lock') + '매장 직원 PIN은 콘텐츠 시트에 표시하지 않습니다. 안내 정보를 바꿔도 이미 발급된 쿠폰 조건과 오늘 사용 수량은 유지됩니다.</p>' +
      '<div class="sh-act"><span class="sh-st">' + (dc ? '변경 ' + dc + '칸' : '변경 없음') + (errs ? (errs.length ? ' · <b class="bad">오류 ' + errs.length + '건 — 운영본 유지</b>' : ' · <b class="good">검증 통과</b>') : '') + '</span>' +
      '<button type="button" class="obtn" data-o="discard"' + (ST.s.ops.draft ? '' : ' disabled') + '>변경 취소</button>' +
      '<button type="button" class="obtn" data-o="validate"' + (dc ? '' : ' disabled') + '>' + ic('check') + '검증</button>' +
      '<button type="button" class="obtn" data-o="preview"' + (state === 'valid' || state === 'preview' ? '' : ' disabled') + '>' + ic('eye') + '미리보기</button>' +
      '<button type="button" class="obtn pri" data-o="deploy"' + (state === 'preview' ? '' : ' disabled') + '>' + ic('rocket') + '승인 후 배포</button></div></section>' +
      (errs && errs.length ? '<section class="ocard"><h3>검증 오류 <small>오류가 있는 동안 현재 운영본(v' + oc.version + ')을 그대로 유지합니다</small></h3><ul class="errs">' + errs.map(function (x) { return '<li><b>' + (TABS.filter(function (t2) { return t2[0] === x.tab; })[0][1]) + ' ' + (x.i + 2) + '행</b><code>' + x.col + '</code><span>' + esc(x.msg) + '</span></li>'; }).join('') + '</ul></section>' : '') +
      (state === 'preview' ? previewBlock() : '') +
      '<section class="ocard"><h3>배포 이력 <small>문제가 있으면 이전 버전으로 되돌립니다</small></h3><ul class="vers"><li class="cur"><b>v' + oc.version + '</b><span>' + U.dt(oc.at) + ' · ' + esc(oc.by) + '</span><em>' + esc(oc.note) + '</em><i class="tag ok">운영 중</i></li>' +
      ST.s.ops.versions.slice().reverse().map(function (v) { return '<li><b>v' + v.version + '</b><span>' + U.dt(v.at) + ' · ' + esc(v.by) + '</span><em>' + esc(v.note) + '</em><button type="button" class="obtn sm" data-o="rollback" data-v="' + v.version + '">' + ic('refresh') + '이 버전으로 되돌리기</button></li>'; }).join('') + '</ul></section>';
  };
  function previewBlock() {
    var d = ST.s.ops.draft, cur = ST.content(), out = [];
    TABS.forEach(function (tb) {
      var k = KEYS[tb[0]];
      d[tb[0]].forEach(function (row) {
        var o = cur[tb[0]].filter(function (x) { return x[k] === row[k]; })[0];
        var ch = RD.SHEET_COLS[tb[0]].filter(function (c) { return !o || String(o[c]) !== String(row[c]); });
        if (ch.length) out.push({ tab: tb, row: row, o: o, ch: ch });
      });
    });
    return '<section class="ocard"><h3>미리보기 <small>배포하면 관광객 화면에 이렇게 반영됩니다</small></h3><div class="pv">' + out.map(function (x) {
      var r = x.row, card = '';
      if (x.tab[0] === 'places') card = '<div class="pv-card">' + U.art(r, 'pv-art') + '<b>' + esc(r.name_en) + '</b><small>' + esc(r.name_ko) + ' · ' + esc(r.hours) + '</small></div>';
      else if (x.tab[0] === 'coupons') card = '<div class="pv-card tk-pv"><b>' + esc(r.title_en) + '</b><small>' + esc(r.title_ko) + ' · 일일 ' + esc(r.daily_limit) + '장</small></div>';
      else if (x.tab[0] === 'banners') card = '<div class="pv-card bn tone-' + esc(r.tone) + '"><b>' + esc(r.title_en) + '</b><small>' + esc(r.sub_en) + '</small></div>';
      else card = '<div class="pv-card"><b>' + esc(r.name_en) + '</b><small>' + esc(r.name_ko) + ' · 체크인 ' + esc(r.checkin) + '</small></div>';
      return '<div class="pv-i"><span class="tag">' + x.tab[1] + ' · ' + esc(r[KEYS[x.tab[0]]]) + (x.o ? '' : ' · 신규') + '</span>' + card +
        '<ul>' + x.ch.map(function (c) { return '<li><code>' + c + '</code>' + (x.o ? '<s>' + esc(x.o[c]) + '</s> → ' : '') + '<b>' + esc(r[c]) + '</b></li>'; }).join('') + '</ul></div>';
    }).join('') + '</div></section>';
  }
  MOUNT.content = function (body) {
    var fe = body.querySelector('.sg td.er'); if (fe) { var g = body.querySelector('.sheet-g'); g.scrollTop = Math.max(0, fe.offsetTop - 60); g.scrollLeft = Math.max(0, fe.offsetLeft - 120); }
    body.addEventListener('input', function (e) {
      var i = e.target.closest('[data-cell]'); if (!i) return;
      if (!requireAuth() || ST.s.ops.user !== 'pm') { APP.render(); return; }
      var p = i.getAttribute('data-cell').split('|'), row = draft()[p[0]][+p[1]], col = p[2];
      row[col] = (col === 'lat' || col === 'lng') && i.value.trim() !== '' && !isNaN(+i.value) ? +i.value : i.value.trim();
      ST.s.ops.draftErrors = null; ST.s.ops.preview = false; ST.save();
      /* 입력 중 전체 표를 다시 그리면 포커스와 다음 버튼 클릭이 사라집니다. */
      i.closest('td').classList.add('ch');
      body.querySelector('.sh-st').textContent = '변경 ' + diffCount() + '칸 · 다시 검증해 주세요';
      body.querySelector('[data-o="validate"]').disabled = !diffCount();
      body.querySelector('[data-o="discard"]').disabled = false;
      body.querySelector('[data-o="preview"]').disabled = true;
      body.querySelector('[data-o="deploy"]').disabled = true;
    });
  };

  PAGES.qr = function () {
    var hs = ST.content().hotels, h = ST.hotel(F.qr) || hs[0];
    var base = location.href.split('#')[0], url = base + '#/h/' + h.code;
    return '<div class="o-grid2 w"><section class="ocard"><h3>호텔 선택</h3><div class="hlist">' + hs.map(function (x) {
      return '<button type="button" class="hl' + (x.code === h.code ? ' on' : '') + '" data-o="qrsel" data-v="' + x.code + '"><span class="hl-c">' + x.code + '</span><span><b>' + esc(x.name_ko) + '</b><small>' + esc(x.name_en) + '</small></span>' + (x.status !== 'active' ? '<em class="tag off">운영 종료</em>' : '') + '</button>';
    }).join('') + '</div><p class="o-note">' + ic('spark') + 'QR에는 호텔 코드가 담긴 주소만 들어갑니다. 운영 종료 호텔의 QR로 들어오면 안내 화면을 보여 주므로 이미 인쇄된 지도도 깨지지 않습니다.</p></section>' +
      '<section class="ocard"><h3>인쇄용 QR <small>종이 지도 부착용 · SVG(인쇄) · PNG</small></h3><div class="qrprint" id="qrprint"><div class="qp-card">' +
      '<div class="qp-top">' + APP.logo() + '<b>ROAMLY</b><span>' + esc(h.name_en) + '</span></div>' + window.QR.svg(url, { quiet: 4, cls: 'qp-qr', label: h.name_en + ' QR' }) +
      '<b class="qp-t">Scan for local picks &amp; coupons</b><p class="qp-l"><span lang="ko">스캔하고 로컬 혜택 받기</span><span lang="ja">スキャンしてお得なクーポン</span><span lang="zh">扫码领取本地优惠</span></p><code>' + h.code + '</code></div></div>' +
      (h.status !== 'active' ? '<p class="o-note bad">' + ic('alert') + '운영 종료 호텔입니다. 새로 인쇄하지 마세요.</p>' : '') +
      '<p class="qp-url"><code>' + esc(url) + '</code></p><div class="sh-act"><button type="button" class="obtn" data-o="dl-svg">' + ic('download') + 'SVG</button><button type="button" class="obtn" data-o="dl-png">' + ic('download') + 'PNG</button><button type="button" class="obtn pri" data-o="print">' + ic('printer') + '인쇄</button></div></section></div>';
  };

  var EV_DEF = [
    ['qr_entry', '호텔 QR 유입', '호텔 코드·세션'], ['qr_invalid', '잘못된·종료 QR', '코드'], ['page_view', '화면 진입', '화면'], ['menu_click', '메뉴 클릭', '메뉴'],
    ['banner_view', '배너 노출', '배너·위치'], ['banner_click', '배너 클릭', '배너·위치'], ['place_view', '장소 보기', '장소'], ['directions_click', '길찾기 연결', '대상·지도 앱'],
    ['profile_submit', '프로필 제출', '국적·연령대·동반'], ['roulette_spin', '룰렛 추첨', '상품·등급'], ['coupon_issue', '쿠폰 발급 처리', '쿠폰·매장'], ['coupon_redeem', '쿠폰 사용 처리', '쿠폰·매장·금액'],
    ['redeem_fail', '사용 실패', '사유'], ['fav_add', 'FAVORITE 저장', '장소'], ['station_view', '역 보기', '역'], ['offline_saved', '노선도 저장', ''], ['lang_change', '언어 변경', '언어']
  ];
  PAGES.events = function () {
    var types = {}; ST.s.events.forEach(function (e) { types[e.type] = (types[e.type] || 0) + 1; });
    return '<div class="o-grid2 ev"><section class="ocard"><h3>실시간 이벤트 <small id="evc">' + ST.s.events.length + '건</small><span class="o-live"><i></i>LIVE</span><button type="button" class="obtn sm" data-o="csv-ev">' + ic('download') + 'CSV</button></h3>' +
      '<div class="o-filters"><label class="o-sel">' + ic('log') + '<select data-o="evtype"><option value="all">전체 유형</option>' + EV_DEF.map(function (d) { return '<option value="' + d[0] + '"' + (F.evType === d[0] ? ' selected' : '') + '>' + d[1] + ' (' + (types[d[0]] || 0) + ')</option>'; }).join('') + '</select></label>' +
      '<a class="obtn sm" href="#/home" target="_blank" rel="noopener">' + ic('play') + '새 탭에서 관광객 화면 열기</a></div>' +
      '<div class="otw tall"><table class="otable ev"><thead><tr><th>서울 시각</th><th>유형</th><th>호텔</th><th>세션</th><th>언어</th><th>대상</th><th>국적</th></tr></thead><tbody id="evb">' + evRows() + '</tbody></table></div></section>' +
      '<section class="ocard"><h3>이벤트 정의서 <small>클라이언트 재전송은 같은 이벤트 ID로 중복 제거</small></h3><ul class="evdef">' + EV_DEF.map(function (d) { return '<li><code>' + d[0] + '</code><b>' + d[1] + '</b><small>' + d[2] + '</small></li>'; }).join('') + '</ul></section></div>';
  };
  function evRows() {
    var list = ST.s.events.filter(function (e) { return F.evType === 'all' || e.type === F.evType; }).slice(-120).reverse();
    if (!list.length) return '<tr><td colspan="7" class="o-empty">아직 이벤트가 없습니다. 관광객 화면을 이용하면 이곳에 쌓입니다.</td></tr>';
    return list.map(evRow).join('');
  }
  function evRow(e) {
    var d = EV_DEF.filter(function (x) { return x[0] === e.type; })[0];
    return '<tr><td class="mono">' + U.dt(e.t).split(' ')[1] + ':' + U.pad(ST.seoul(e.t).ss) + '<small> ' + e.sd.slice(5) + '</small></td><td><b>' + (d ? d[1] : e.type) + '</b><small>' + e.type + '</small></td><td>' + esc(e.hotel) + '</td><td class="mono">' + esc(e.session.slice(0, 8)) + '</td><td>' + esc(e.lang) + '</td><td>' + esc([e.ref, e.slot, e.app, e.screen, e.reason, e.amount != null ? '₩' + n(e.amount) : ''].filter(Boolean).join(' · ')) + '</td><td>' + esc(e.nat ? natName(e.nat) : '미상') + '</td></tr>';
  }
  OPS.onEvent = function (ev) {
    var b = document.getElementById('evb'); if (!b || (F.evType !== 'all' && ev.type !== F.evType)) return;
    if (b.querySelector('.o-empty')) b.innerHTML = '';
    b.insertAdjacentHTML('afterbegin', evRow(ev).replace('<tr>', '<tr class="flash">'));
    var c = document.getElementById('evc'); if (c) c.textContent = ST.s.events.length + '건';
  };
  /* ---------- 내려받기 ---------- */
  function download(name, data, type) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: type });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csv(head, list) { return '﻿' + [head].concat(list).map(function (r) { return r.map(function (v) { v = v == null ? '' : String(v); if (/^[=+@\t\r-]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n'); }

  OPS.metrics = { rows: rows, sum: sum, adData: adData };
  OPS.validateContent = validate;

  /* ---------- 이벤트 위임 ---------- */
  document.addEventListener('change', function (e) {
    var s = e.target.closest('select[data-o]'); if (!s || !document.body.classList.contains('mode-ops')) return;
    if (!requireAuth()) { APP.render(); return; }
    var k = s.getAttribute('data-o');
    if (k === 'hotel') F.hotel = s.value; else if (k === 'ad') F.ad = s.value; else if (k === 'evtype') { F.evType = s.value; document.getElementById('evb').innerHTML = evRows(); return; }
    OPS.render(APP.route);
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-o]'); if (!b || b.tagName === 'SELECT' || !document.body.classList.contains('mode-ops')) return;
    if (!requireAuth()) { APP.render(); return; }
    var k = b.getAttribute('data-o'), v = b.getAttribute('data-v');
    if (ST.s.ops.user !== 'pm' && ['logout', 'period', 'csv-ads'].indexOf(k) < 0) { APP.toast('이 계정은 광고 리포트 조회만 가능합니다.', 'err'); return; }
    switch (k) {
      case 'logout': ST.s.ops.user = null; ST.s.ops.expiresAt = 0; ST.save(true); APP.go('#/ops'); return;
      case 'period': F.period = v; break;
      case 'hsel': F.hsel = v; break;
      case 'qrsel': F.qr = v; break;
      case 'tab': F.tab = v; break;
      case 'race': race(); document.getElementById('race').innerHTML = raceView(ST.s.ops.concurrency); APP.toast('20건 동시 요청 중 1건만 발급되었습니다.', 'ok'); return;
      case 'addrow':
        var d = draft(), nid = 'p' + (d.places.length + 1 + Math.floor(Math.random() * 50) + 30);
        d.places.push({ id: nid, cat: 'cafe', name_en: 'New Café', name_ko: '새 카페', name_ja: '', name_zh: '', address_ko: '서울 마포구 와우산로 0길 50', lat: 37.5571, lng: 126.9248, hours: '10:00-22:00', break_time: '', closed_days: '', area: 'hongdae', staff_pick: '', staff_name: '', local_fav: 'N', slots: 'lunch,dinner', price: '₩', desc_en: 'Newly added from the content sheet.', desc_ko: '운영 시트에서 새로 추가한 장소입니다.', active: 'Y' });
        ST.s.ops.draftErrors = null; ST.s.ops.preview = false; ST.save(); break;
      case 'badrow':
        var d2 = draft();
        d2.places.push({ id: 'p02', cat: 'bakery', name_en: 'Sample Bakery', name_ko: '', name_ja: '', name_zh: '', address_ko: '', lat: 35.1, lng: 129.04, hours: '9:00~21:00', break_time: '15-16', closed_days: 'Monday', area: 'hongdae', staff_pick: '', staff_name: '', local_fav: 'yes', slots: 'morning', price: '₩', desc_en: '', desc_ko: '', active: 'Y' });
        ST.s.ops.draftErrors = null; ST.s.ops.preview = false; ST.save(); APP.toast('오류가 있는 행을 추가했습니다. 「검증」을 눌러 보세요.', 'info'); break;
      case 'discard': ST.s.ops.draft = null; ST.s.ops.draftErrors = null; ST.s.ops.preview = false; ST.save(); break;
      case 'validate':
        var errs = validate(draft()); ST.s.ops.draftErrors = errs; ST.s.ops.preview = false; ST.save();
        APP.toast(errs.length ? '오류 ' + errs.length + '건 — 운영본은 그대로 유지됩니다.' : '검증을 통과했습니다. 미리보기로 확인해 주세요.', errs.length ? 'err' : 'ok'); break;
      case 'preview': if (!ST.s.ops.draft || validate(draft()).length) { APP.toast('시트 검증을 먼저 완료해 주세요.', 'err'); return; } ST.s.ops.preview = true; ST.save(); break;
      case 'deploy':
        if (!ST.s.ops.draft || !ST.s.ops.preview || validate(draft()).length) { APP.toast('검증·미리보기를 먼저 완료해 주세요.', 'err'); return; }
        APP.confirm('검증·미리보기를 마친 변경 사항을 운영본으로 배포할까요?', function () {
          if (!requireAuth() || ST.s.ops.user !== 'pm' || !ST.s.ops.draft || !ST.s.ops.preview || validate(draft()).length) { APP.render(); return; }
          var oc = ST.s.ops.content, u = RD.OPS_ACCOUNTS.filter(function (a) { return a.id === ST.s.ops.user; })[0];
          ST.s.ops.versions.push({ version: oc.version, at: oc.at, by: oc.by, note: oc.note, rows: oc.rows });
          if (ST.s.ops.versions.length > 5) ST.s.ops.versions.shift();
          ST.s.ops.content = { version: oc.version + 1, at: ST.now(), by: u.email, note: '시트 변경 ' + diffCount() + '칸 반영', rows: ST.s.ops.draft };
          ST.s.ops.draft = null; ST.s.ops.draftErrors = null; ST.s.ops.preview = false; ST.save(true);
          OPS.render(APP.route); APP.toast('v' + ST.s.ops.content.version + ' 배포 완료 — 관광객 화면에 반영되었습니다.', 'ok');
        }); return;
      case 'rollback':
        var ver = ST.s.ops.versions.filter(function (x) { return String(x.version) === v; })[0]; if (!ver) return;
        APP.confirm('v' + v + ' 콘텐츠로 되돌릴까요? 현재 운영본은 이력에 남으며, 임시 편집 내용은 취소됩니다.', function () {
          if (!requireAuth() || ST.s.ops.user !== 'pm') { APP.render(); return; }
          var cur = ST.s.ops.content;
          ST.s.ops.versions = ST.s.ops.versions.filter(function (x) { return x !== ver; });
          ST.s.ops.versions.push({ version: cur.version, at: cur.at, by: cur.by, note: cur.note, rows: cur.rows });
          ST.s.ops.content = { version: cur.version + 1, at: ST.now(), by: cur.by, note: 'v' + v + ' 콘텐츠로 되돌림', rows: ST.clone(ver.rows) };
          ST.s.ops.draft = null; ST.s.ops.draftErrors = null; ST.s.ops.preview = false;
          ST.save(true); OPS.render(APP.route); APP.toast('v' + v + ' 콘텐츠로 되돌렸습니다.', 'ok');
        }); return;
      case 'csv-dash':
        var rr = rows(F.period, F.hotel);
        download('roamly-hotel-metrics-' + ST.seoul().date + '.csv', csv(['일자', '호텔', '배포대상', '실제전달', 'QR유입', '쿠폰발급', '사용일기준쿠폰사용', '해당기간발급분사용', '입력구매금액', '금액입력건수'], rr.map(function (r) { return [r.date, r.hotel, r.target, r.delivered, r.qr, r.issued, r.redeemed, r.cohortRedeemed, r.amount, r.amountN]; })), 'text/csv;charset=utf-8'); return;
      case 'csv-ads':
        var ad = adData(), lines = [];
        Object.keys(ad.byHotel).forEach(function (h) { lines.push(['호텔', h, ad.byHotel[h].imp, ad.byHotel[h].clk]); });
        Object.keys(ad.byNat).forEach(function (h) { lines.push(['국적', natName(h), ad.byNat[h].imp, ad.byNat[h].clk]); });
        ad.byHour.forEach(function (o, i) { lines.push(['시간대', U.pad(i) + ':00', o.imp, o.clk]); });
        download('roamly-ad-report-' + ST.seoul().date + '.csv', csv(['구분', '항목', '노출', '클릭'], lines), 'text/csv;charset=utf-8'); return;
      case 'csv-ev':
        download('roamly-events-' + ST.seoul().date + '.csv', csv(['event_id', 'seoul_time', 'type', 'hotel', 'session', 'lang', 'ref', 'nationality'], ST.s.events.map(function (e) { return [e.id, U.dt(e.t), e.type, e.hotel, e.session, e.lang, e.ref || '', e.nat || '']; })), 'text/csv;charset=utf-8'); return;
      case 'dl-svg':
        download('roamly-qr-' + F.qr + '.svg', document.querySelector('.qp-qr').outerHTML, 'image/svg+xml'); return;
      case 'dl-png':
        var svg = document.querySelector('.qp-qr').outerHTML.replace('<svg ', '<svg width="1024" height="1024" ');
        var img = new Image(); img.onload = function () { var c = document.createElement('canvas'); c.width = c.height = 1024; var x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0, 1024, 1024); c.toBlob(function (bl) { download('roamly-qr-' + F.qr + '.png', bl); }); };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); return;
      case 'print': document.body.classList.add('print-qr'); window.print(); setTimeout(function () { document.body.classList.remove('print-qr'); }, 400); return;
      default: return;
    }
    OPS.render(APP.route);
  });
})();
