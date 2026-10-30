/* 관광객 화면 */
(function () {
  'use strict';
  var RD = window.RD, ST = window.ST, U = window.U, SV = window.SV, MAP = window.MAP, APP = window.APP;
  var t = U.t, esc = U.esc, ic = U.ic, S = APP.screens, A = APP.actions;

  /* ---------- 공통 조각 ---------- */
  function places(all) {
    return ST.content().places.filter(function (p) { return p.active === 'Y' && (all || p.area === 'hongdae'); });
  }
  function couponsOf(pid) { return ST.content().coupons.filter(function (c) { return c.active === 'Y' && c.place_id === pid; }); }
  function hasCoupon(p) { return couponsOf(p.id).length > 0; }
  function dist(p) { return U.distM(U.origin(), p); }
  function badge(st) { return '<span class="st st-' + st.cls + '"><i></i>' + esc(st.label) + '</span>'; }
  function catLabel(id) { return t('c_' + id); }
  function koSub(p) { return U.lang() === 'ko' ? esc(catLabel(p.cat)) : '<span lang="ko">' + esc(p.name_ko) + '</span> · ' + esc(catLabel(p.cat)); }
  function placeRow(p) {
    var st = U.status(p), d = dist(p);
    return '<a class="prow" href="#/place/' + p.id + '">' + U.art(p, 'prow-art') +
      '<span class="prow-b"><b>' + esc(U.nm(p)) + '</b><small>' + koSub(p) + '</small>' +
      '<span class="prow-m">' + badge(st) + '<span class="dist">' + ic('pin') + U.distLabel(d) + '</span>' + (hasCoupon(p) ? '<span class="ctag">' + ic('ticket') + esc(t('f_coupon')) + '</span>' : '') + '</span></span></a>';
  }
  function placeTile(p, extra) {
    var st = U.status(p);
    return '<a class="ptile" href="#/place/' + p.id + '"><span class="ptile-a">' + U.art(p, 'ptile-art') + (hasCoupon(p) ? '<span class="ctag float">' + ic('ticket') + '</span>' : '') + '</span>' +
      '<span class="ptile-b"><b>' + esc(U.nm(p)) + '</b><small>' + esc(catLabel(p.cat)) + ' · ' + U.distLabel(dist(p)) + '</small>' + badge(st) + (extra || '') + '</span></a>';
  }
  function chips(list, cur, attr) {
    return '<div class="chips" role="group">' + list.map(function (x) {
      return '<button type="button" class="chip' + (x[0] === cur ? ' on' : '') + '" data-act="' + attr + '" data-v="' + x[0] + '" aria-pressed="' + (x[0] === cur) + '">' + (x[2] ? '<i style="background:' + x[2] + '"></i>' : '') + esc(x[1]) + '</button>';
    }).join('') + '</div>';
  }
  function catChips(cur, withCoupon) {
    var l = [['all', t('all')]]; if (withCoupon) l.push(['coupon', t('coupon_only')]);
    RD.CATS.forEach(function (c) { l.push([c.id, catLabel(c.id), c.color]); });
    return chips(l, cur, 'cat');
  }
  function secHead(title, link, linkLabel) { return '<div class="sec-h"><h2>' + title + '</h2>' + (link ? '<a href="' + link + '">' + esc(linkLabel || t('see_all')) + ic('right') + '</a>' : '') + '</div>'; }
  function tierName(id) { return t('t_' + id); }

  function cityArt() {
    return '<img class="city" src="assets/images/seoul-v2.webp" alt="" width="1200" height="800" fetchpriority="high" decoding="async">';
  }

  /* ======================================================================
     랜딩 (QR 미스캔 진입) — 시연용 호텔 QR
     ====================================================================== */
  S.landing = function () {
    var hotels = ST.content().hotels.filter(function (h) { return h.status === 'active'; });
    return '<div class="app landing app-scroll"><div class="land-hero">' + cityArt() +
      '<div class="land-top"><div class="land-bar"><a class="backmain" href="../index.html">' + ic('back') + '<span>메인으로</span></a></div><span class="brand">' + APP.logo() + '<b>ROAMLY</b></span><div class="land-actions"><a class="portal-link" href="#/ops">' + ic('chart') + '<span>' + esc(t('land_ops')) + '</span>' + ic('right') + '</a><button type="button" class="tbtn light" data-act="lang" aria-label="' + esc(t('change_lang')) + '">' + ic('globe') + '<span>' + U.lang().toUpperCase() + '</span></button></div></div>' +
      '<div class="land-in"><span class="kicker">SEOUL, AT YOUR PACE</span><h1>' + esc(t('land_title')) + '</h1><p>' + esc(t('land_sub')) + '</p></div></div>' +
      '<section class="land-demo"><div class="sec-h"><h2>' + esc(t('land_demo')) + '</h2><span class="land-count">SEOUL · ' + hotels.length + '</span></div><div class="hotel-options">' + hotels.map(function (h) {
        return '<article class="hotel-option"><a class="hotel-option-link" href="#/h/' + esc(h.code) + '">' + U.hotelArt(h, 'hotel-option-img') + '<span><small>' + esc(U.area(h)) + '</small><b>' + esc(U.hotelName(h)) + '</b><em>' + esc(t('explore_hotel')) + ' ' + ic('right') + '</em></span></a><button type="button" class="hotel-qr" data-act="showqr" data-v="' + esc(h.code) + '" aria-label="' + esc(t('show_qr') + ' · ' + U.hotelName(h)) + '">' + ic('qr') + '</button></article>';
      }).join('') + '</div><p class="land-note">' + ic('qr') + esc(t('land_qr_note')) + '</p></section>' +
      '<ol class="steps">' + [['qr', 'land_step1'], ['clock', 'land_step2'], ['gift', 'land_step3']].map(function (v, i) { return '<li><span class="sn">0' + (i + 1) + '</span>' + ic(v[0]) + '<b>' + esc(t(v[1])) + '</b></li>'; }).join('') + '</ol>' +
      '<a class="land-ops" href="#/ops">' + ic('chart') + '<span><b>' + esc(t('land_ops')) + '</b><small>' + esc(t('partner_sub')) + '</small></span>' + ic('right') + '</a>' +
      '<footer class="land-foot">ROAMLY · ' + esc(t('sample_note')) + '</footer></div>';
  };
  A.showqr = function (b) {
    var h = ST.hotel(b.getAttribute('data-v')); if (!h) return;
    var url = location.href.split('#')[0] + '#/h/' + h.code;
    var local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    APP.sheet('<h3 class="sh-t">' + ic('qr') + esc(U.hotelName(h)) + '</h3><div class="guest-qr">' + QR.svg(url, {quiet:4, cls:'qrimg'}) + '</div><p class="sh-p">' + esc(t(local ? 'qr_local_note' : 'land_qr_note')) + '</p><a class="btn pri wide" href="#/h/' + h.code + '" data-close>' + esc(t('explore_hotel')) + '</a>');
  };

  S.invalid = function (r) {
    var code = r.arg || ''; try { code = decodeURIComponent(code); } catch (e) {} var h = ST.hotel(code);
    return '<div class="app landing app-scroll"><div class="inv">' +
      '<span class="inv-i">' + ic('qr') + '<i>' + ic('x') + '</i></span><h1>' + esc(t('inv_title')) + '</h1>' +
      (h ? '<p class="inv-h">' + esc(t('inv_closed', { hotel: U.hotelName(h) })) + '</p>' : '<p class="inv-h"><code>' + esc(code || '—') + '</code></p>') +
      '<p>' + esc(t('inv_body')) + '</p>' +
      '<a class="btn pri wide" href="#/map?scope=seoul">' + ic('map') + esc(t('inv_go')) + '</a>' +
      '<a class="btn ghost wide" href="#/subway">' + ic('train') + esc(t('m_subway')) + '</a>' +
      '<a class="btn ghost wide" href="#/help">' + ic('help') + esc(t('help_title')) + '</a></div></div>';
  };

  /* ======================================================================
     HOME
     ====================================================================== */
  S.home = function () {
    var h = ST.hotel(), s = ST.seoul(), slot = U.slotNow();
    var greet = s.hh >= 5 && s.hh < 12 ? 'g_morning' : s.hh < 17 ? 'g_afternoon' : s.hh < 22 ? 'g_evening' : 'g_night';
    var area = U.area(h), title = esc(t('home_title', { area: area })).replace(esc(area), '<em>' + esc(area) + '</em>');
    var bans = ST.content().banners.filter(function (b) { return b.active === 'Y'; });
    var open = places().filter(function (p) { return U.status(p).open && (p.slots || '').indexOf(slot) >= 0; }).sort(function (a, b) { return dist(a) - dist(b); }).slice(0, 8);
    var cps = ST.content().coupons.filter(function (c) { return c.active === 'Y'; }).sort(function (a, b) { return dist(ST.place(a.place_id)) - dist(ST.place(b.place_id)); }).slice(0, 6);
    var menu = [['hotel', 'bed', 'm_hotel', 'm_hotel_s', 't1'], ['map', 'map', 'm_map', 'm_map_s', 't2'], ['picks', 'star', 'm_picks', 'm_picks_s', 't3'], ['subway', 'train', 'm_subway', 'm_subway_s', 't4']];
    return '<section class="hero">' + cityArt() + '<div class="hero-in"><p class="hero-k">' + ic(s.hh >= 6 && s.hh < 19 ? 'sun' : 'moon') + esc(t(greet)) + ' · ' + esc(t('seoul')) + ' ' + U.pad(s.hh) + ':' + U.pad(s.mi) + '</p><h1>' + title + '</h1></div></section>' +
      (bans.length ? '<section class="car" aria-roledescription="carousel"><div class="car-track" id="car">' + bans.map(function (b, i) {
        var p = ST.place(b.place_id);
        return '<a class="slide tone-' + esc(b.tone) + '" href="#/place/' + esc(b.place_id) + '" data-banner="' + b.id + '" data-slot="home" data-i="' + i + '">' + (p ? U.art(p, 'slide-art') : '') +
          '<span class="slide-in"><span class="ad-tag">' + esc(t('sponsored')) + '</span><b>' + esc(U.lang() === 'ko' ? b.title_ko : b.title_en) + '</b><small>' + esc(U.lang() === 'ko' ? b.sub_ko : b.sub_en) + '</small></span></a>';
      }).join('') + '</div><div class="car-dots">' + bans.map(function (b, i) { return '<i class="' + (i ? '' : 'on') + '"></i>'; }).join('') + '</div></section>' : '') +
      '<section class="menu4">' + menu.map(function (m) {
        return '<a class="mtile ' + m[4] + '" href="#/' + m[0] + '" data-menu="' + m[0] + '"><span class="mt-i">' + ic(m[1]) + '</span><b>' + esc(t(m[2])) + '</b><small>' + esc(t(m[3])) + '</small></a>';
      }).join('') + '</section>' +
      rouletteCard() +
      (open.length ? '<section class="sec">' + secHead(esc(t('right_now')) + ' <span class="slot-pill">' + esc(t('s_' + slot)) + '</span>', '#/picks') + '<div class="hscroll">' + open.map(function (p) { return placeTile(p); }).join('') + '</div></section>' : '') +
      '<section class="sec">' + secHead(esc(t('coupons_near')), '#/coupons') + '<div class="hscroll">' + cps.map(miniTicket).join('') + '</div></section>' +
      '<section class="sec">' + secHead(esc(t('need_help'))) + '<div class="helpstrip">' +
        '<button type="button" class="hs" data-act="taxi">' + ic('car') + '<span>' + esc(t('taxi')) + '</span></button>' +
        '<a class="hs" href="' + esc(U.naver(h)) + '" target="_blank" rel="noopener" data-deeplink="hotel" data-app="naver">' + ic('nav') + '<span>' + esc(t('back_hotel')) + '</span></a>' +
        '<a class="hs" href="#/help">' + ic('help') + '<span>' + esc(t('emergency')) + '</span></a></div></section>';
  };
  S.home.mount = function (r, view) {
    var tr = view.querySelector('#car'); if (!tr) return;
    var dots = view.querySelectorAll('.car-dots i'), n = dots.length, cur = -1, seen = {};
    function mark(i) {
      if (i === cur) return; cur = i;
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
      var sl = tr.children[i], id = sl && sl.getAttribute('data-banner');
      if (id && !seen[id]) { seen[id] = 1; ST.track('banner_view', { ref: id, slot: 'home' }); }
    }
    mark(0);
    var to; tr.addEventListener('scroll', function () { clearTimeout(to); to = APP.later(function () { mark(Math.round(tr.scrollLeft / tr.clientWidth)); }, 80); }, { passive: true });
    APP.every(function () { if (!document.body.contains(tr)) return; var nx = (cur + 1) % n; tr.scrollTo({ left: nx * tr.clientWidth, behavior: 'smooth' }); }, 5000);
  };

  function rouletteCard() {
    var res = SV.spunToday();
    if (!res) return '<a class="rlcard" href="#/roulette" data-menu="roulette"><span class="rl-wheel">' + miniWheel() + '</span><span class="rl-t"><small>' + esc(t('today_coupon')) + '</small><b>' + esc(t('spin_cta')) + '</b><em>' + esc(t('spin_sub')) + '</em></span>' + ic('right') + '</a>';
    var it = SV.item(res.item), pz = RD.ROULETTE.prizes[res.prizeId];
    var e = ST.endOfSeoulDay(ST.now()) + 1000 - ST.now(), hh = Math.floor(e / 3600000), mm = Math.floor(e % 3600000 / 60000);
    return '<a class="rlcard done rt-' + res.tier + '" href="' + (it ? '#/coupon/' + it.id : '#/mine') + '"><span class="rl-medal">' + ic('gift') + '</span><span class="rl-t"><small>' + esc(t('today_coupon')) + ' · ' + esc(tierName(res.tier)) + '</small><b>' + esc(U.title(pz)) + '</b><em>' + esc(t('next_spin', { t: U.dur(hh, mm) })) + '</em></span>' + ic('right') + '</a>';
  }
  function miniWheel() {
    var cols = ['#F6B91A', '#2FD6A6', '#C8D0DA', '#D98A55', '#2FD6A6', '#C8D0DA', '#D98A55', '#2FD6A6'], s = '';
    for (var i = 0; i < 8; i++) { var a0 = (i * 45 - 90) * Math.PI / 180, a1 = ((i + 1) * 45 - 90) * Math.PI / 180; s += '<path d="M24 24 L' + (24 + 22 * Math.cos(a0)).toFixed(2) + ' ' + (24 + 22 * Math.sin(a0)).toFixed(2) + ' A22 22 0 0 1 ' + (24 + 22 * Math.cos(a1)).toFixed(2) + ' ' + (24 + 22 * Math.sin(a1)).toFixed(2) + 'z" fill="' + cols[i] + '"/>'; }
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><g class="mw">' + s + '</g><circle cx="24" cy="24" r="7" fill="#0B0F1A"/><path d="M24 0l4 7h-8z" fill="#fff"/></svg>';
  }
  function miniTicket(c) {
    var p = ST.place(c.place_id), left = SV.remaining(c.id), got = SV.hasIssued(c.id);
    return '<a class="mtk" href="#/coupons?focus=' + c.id + '" style="--cc:' + U.catOf(p.cat).color + '"><span class="mtk-s">' + ic(U.catOf(p.cat).icon) + '</span><span class="mtk-b"><small>' + esc(U.nm(p)) + '</small><b>' + esc(U.title(c)) + '</b>' +
      '<em class="' + (left ? '' : 'out') + '">' + (got ? esc(t('got')) : left ? esc(t('left', { n: left })) : esc(t('sold_out'))) + '</em></span></a>';
  }

  /* ======================================================================
     HOTEL
     ====================================================================== */
  S.hotel = function () {
    var h = ST.hotel();
    var floors = (h.floors || '').split(';').filter(Boolean).map(function (f) { var p = f.split('|'); return '<li><b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span></li>'; }).join('');
    var fac = [['fitness_hours', 'f_fitness', 'spark'], ['laundry', 'f_laundry', 'refresh'], ['luggage', 'f_luggage', 'lock'], ['parking', 'f_parking', 'car'], ['airport_bus', 'f_airport_bus', 'nav'], ['convenience', 'f_convenience', 'store'],
      ['atm', 'f_atm', 'ticket'], ['adapter', 'f_adapter', 'plusbox'], ['umbrella', 'f_umbrella', 'shield'], ['smoking', 'f_smoking', 'alert'], ['late_checkout', 'f_late_checkout', 'clock'], ['quiet_hours', 'f_quiet_hours', 'moon']];
    var perks = (h.perks || '').split(';').filter(Boolean).map(function (x) {
      var p = x.split('|'), c = p[1] ? ST.coupon(p[1]) : null;
      return '<li>' + ic('gift') + '<span>' + esc(p[0]) + '</span>' + (c ? '<a class="btn sm pri" href="#/coupons?focus=' + c.id + '">' + esc(t('get_coupon')) + '</a>' : '') + '</li>';
    }).join('');
    return '<section class="hhero">' + U.hotelArt(h, 'hhero-art') + '<div class="hhero-in"><span class="kicker">' + esc(h.code) + ' · ' + esc(U.area(h)) + '</span><h1>' + esc(U.hotelName(h)) + '</h1>' +
      '<p lang="ko">' + esc(h.address_ko) + '</p></div></section>' +
      '<div class="pad">' +
      '<div class="kv2"><div><small>' + esc(t('check_in')) + '</small><b>' + esc(h.checkin) + '</b></div><div><small>' + esc(t('check_out')) + '</small><b>' + esc(h.checkout) + '</b></div>' +
      '<a class="kv-call" href="tel:' + esc(h.phone) + '">' + ic('phone') + '<span>' + esc(t('call_front')) + '</span></a></div>' +
      '<div class="wifi"><span class="wifi-i">' + ic('wifi') + '</span><div><small>' + esc(t('network')) + '</small><b>' + esc(h.wifi_ssid) + '</b></div><div><small>' + esc(t('password')) + '</small><b class="mono">' + esc(h.wifi_pw) + '</b></div>' +
      '<button type="button" class="btn sm" data-act="copy" data-copy="' + esc(h.wifi_pw) + '">' + ic('copy') + esc(t('copy')) + '</button></div>' +
      (perks ? '<section class="sec"><h2 class="h2">' + esc(t('guest_perks')) + '</h2><ul class="perks">' + perks + '</ul></section>' : '') +
      '<section class="sec"><h2 class="h2">' + esc(t('dining')) + '</h2><div class="dine">' +
        dine('cafe', t('breakfast'), h.breakfast_place, h.breakfast_hours, h.breakfast_price && h.breakfast_price !== '-' ? '₩' + h.breakfast_price + ' ' + t('per_person') : '') +
        dine('food', t('restaurant'), h.restaurant_name, h.restaurant_hours, '') + dine('night', t('bar'), h.bar_name, h.bar_hours, '') + '</div></section>' +
      '<section class="sec"><h2 class="h2">' + esc(t('floors')) + '</h2><ol class="floors">' + floors + '</ol></section>' +
      '<section class="sec"><h2 class="h2">' + esc(t('facilities')) + '</h2><div class="facs">' + fac.map(function (f) {
        return '<div class="fac">' + ic(f[2]) + '<small>' + esc(t(f[1])) + '</small><b>' + esc(h[f[0]]) + '</b></div>';
      }).join('') + '</div></section></div>';
  };
  function dine(icn, label, name, hours, extra) {
    if (!name || name === '—' || name === '-') return '';
    return '<div class="dn">' + ic(icn) + '<div><small>' + esc(label) + '</small><b>' + esc(name) + '</b><span>' + ic('clock') + esc(hours) + (extra ? ' · ' + esc(extra) : '') + '</span></div></div>';
  }

  /* ======================================================================
     MAP
     ====================================================================== */
  var M = { scope: 'near', cat: 'all', radius: 1000, sel: null, me: false };
  var ME = { x: 590, y: 360 };
  S.map = function (r) {
    if (r.q.scope) M.scope = r.q.scope;
    if (r.q.sel) M.sel = r.q.sel;
    var seg = [['near', 'near_hotel', 'bed'], ['me', 'my_location', 'locate'], ['seoul', 'all_seoul', 'globe']];
    return '<div class="mapscr">' +
      '<div class="map-top"><div class="seg" role="tablist">' + seg.map(function (s) {
        return '<button type="button" role="tab" aria-selected="' + (M.scope === s[0]) + '" class="' + (M.scope === s[0] ? 'on' : '') + '" data-act="scope" data-v="' + s[0] + '">' + ic(s[2]) + esc(t(s[1])) + '</button>';
      }).join('') + '</div>' + catChips(M.cat, true) +
      (M.scope !== 'seoul' ? '<div class="radius"><span>' + esc(t('radius')) + '</span>' + [500, 1000, 3000].map(function (v) { return '<button type="button" class="' + (M.radius === v ? 'on' : '') + '" data-act="radius" data-v="' + v + '">' + (v < 1000 ? v + 'm' : v / 1000 + 'km') + '</button>'; }).join('') + '</div>' : '') +
      '</div><div class="map-host" id="maphost"></div><div class="map-card" id="mapcard"></div></div>';
  };
  function mapFilter(list) {
    return list.filter(function (p) {
      if (M.cat === 'coupon') return hasCoupon(p);
      return M.cat === 'all' || p.cat === M.cat;
    });
  }
  S.map.mount = function (r, view) {
    view.classList.add('view-full');
    var host = view.querySelector('#maphost'), card = view.querySelector('#mapcard');
    if (!SV.online()) {
      host.innerHTML = '<div class="map-off">' + ic('cloudoff') + '<p>' + esc(t('map_offline')) + '</p></div>';
      card.innerHTML = '<div class="mc-list">' + mapFilter(places()).sort(function (a, b) { return dist(a) - dist(b); }).map(placeRow).join('') + '</div>';
      card.classList.add('tall'); return;
    }
    if (M.scope === 'me' && !M.me) {
      APP.sheet('<span class="sh-ic">' + ic('locate') + '</span><h3 class="sh-t">' + esc(t('loc_title')) + '</h3><p class="sh-p">' + esc(t('loc_body')) + '</p><p class="sh-note">' + esc(t('loc_demo')) + '</p>' +
        '<div class="sh-btns"><button type="button" class="btn ghost" data-act="loc" data-v="no">' + esc(t('not_now')) + '</button><button type="button" class="btn pri" data-act="loc" data-v="yes" autofocus>' + esc(t('allow')) + '</button></div>');
      M.scope = 'near';
    }
    if (M.scope === 'seoul') {
      var all = mapFilter(places(true));
      MAP.seoul(host, { places: all, hotel: ST.hotel(), onArea: function (k) {
        if (k === 'hongdae') { M.scope = 'near'; APP.render(); return; }
        var a = MAP.AREAS[k], list = all.filter(function (p) { return p.area === k; });
        APP.sheet('<h3 class="sh-t">' + ic('pin') + esc(U.lang() === 'ko' ? a.ko : a.en) + '</h3><div class="mc-list">' + list.map(placeRow).join('') + '</div>');
      } });
      card.innerHTML = '<div class="mc-sum">' + ic('globe') + '<span>' + esc(t('all_seoul')) + ' · ' + esc(t('picks_count', { n: all.length })) + '</span></div>';
      return;
    }
    var center = M.scope === 'me' ? ME : U.xy(U.origin().lat, U.origin().lng);
    var list = mapFilter(places()).filter(function (p) {
      var xy = U.xy(p.lat, p.lng); return Math.hypot(xy.x - center.x, xy.y - center.y) * RD.UNIT <= M.radius;
    });
    list.forEach(function (p) { p._coupon = hasCoupon(p); });
    if (M.sel && !list.some(function (p) { return p.id === M.sel; })) M.sel = null;
    function showCard(id) {
      var p = id && ST.place(id);
      if (!p) {
        card.innerHTML = '<div class="mc-sum">' + ic('pin') + '<span>' + esc(t('in_radius', { n: list.length, r: M.radius < 1000 ? M.radius + ' m' : M.radius / 1000 + ' km' })) + '</span><button type="button" class="btn sm" data-act="maplist">' + ic('list') + esc(t('view_list')) + '</button></div>';
        return;
      }
      ST.track('place_view', { ref: p.id, from: 'map' });
      var cs = couponsOf(p.id), d = dist(p);
      card.innerHTML = '<div class="mc">' + U.art(p, 'mc-art') + '<div class="mc-b"><b>' + esc(U.nm(p)) + '</b><small>' + koSub(p) + '</small>' +
        '<span class="prow-m">' + badge(U.status(p)) + '<span class="dist">' + ic('pin') + U.distLabel(d) + ' · ' + esc(t('min_walk', { n: U.walk(d) })) + '</span></span>' +
        (cs.length ? '<span class="mc-cp">' + ic('ticket') + esc(U.title(cs[0])) + '</span>' : '') + '</div></div>' +
        '<div class="mc-act"><a class="btn pri" href="#/place/' + p.id + '">' + esc(t('details')) + '</a>' +
        '<a class="btn" href="' + esc(U.naver(p)) + '" target="_blank" rel="noopener" data-deeplink="' + p.id + '" data-app="naver">' + ic('nav') + esc(t('naver_map')) + '</a>' +
        '<a class="btn" href="' + esc(U.googleDir(p)) + '" target="_blank" rel="noopener" data-deeplink="' + p.id + '" data-app="google">' + ic('nav') + 'Google</a></div>';
    }
    MAP.neighborhood(host, { places: list, sel: M.sel, center: center, radiusM: M.radius, me: M.scope === 'me' ? ME : null, hotel: ST.hotel(),
      onPin: function (id) { M.sel = id; showCard(id); }, onBg: function () { M.sel = null; showCard(null); } });
    showCard(M.sel);
    A.maplist = function () { APP.sheet('<h3 class="sh-t">' + ic('list') + esc(t('in_radius', { n: list.length, r: M.radius < 1000 ? M.radius + ' m' : M.radius / 1000 + ' km' })) + '</h3><div class="mc-list">' + list.sort(function (a, b) { return dist(a) - dist(b); }).map(placeRow).join('') + '</div>', null, 'tall'); };
  };
  A.scope = function (b) { M.scope = b.getAttribute('data-v'); M.sel = null; APP.go('#/map', true); };
  A.radius = function (b) { M.radius = +b.getAttribute('data-v'); APP.render(); };
  A.loc = function (b) { APP.closeSheet(true); if (b.getAttribute('data-v') === 'yes') { M.me = true; M.scope = 'me'; } else M.scope = 'near'; APP.go('#/map', true); };
  A.cat = function (b) {
    var v = b.getAttribute('data-v'), n = APP.route.name;
    if (n === 'map') M.cat = v; else if (n === 'picks') K.cat = v; else if (n === 'coupons') C.cat = v; else if (n === 'fav') return;
    APP.render();
  };

  /* ======================================================================
     LOCAL PICKS
     ====================================================================== */
  var K = { slot: null, cat: 'all', open: false, coupon: false };
  S.picks = function () {
    var now = U.slotNow(), slot = K.slot || now;
    var list = places().filter(function (p) {
      if ((p.slots || '').indexOf(slot) < 0) return false;
      if (K.cat !== 'all' && p.cat !== K.cat) return false;
      if (K.open && !U.status(p).open) return false;
      if (K.coupon && !hasCoupon(p)) return false;
      return true;
    }).sort(function (a, b) { return (U.status(b).open - U.status(a).open) || dist(a) - dist(b); });
    var staff = list.filter(function (p) { return p.staff_pick; }), locals = list.filter(function (p) { return p.local_fav === 'Y'; });
    return '<div class="ph"><h1>' + esc(t('m_picks')) + '</h1><p>' + esc(t('picks_for', { s: t('s_' + slot) })) + '</p></div>' +
      '<div class="slots" role="tablist">' + ['morning', 'lunch', 'dinner', 'night'].map(function (s) {
        return '<button type="button" role="tab" aria-selected="' + (s === slot) + '" class="' + (s === slot ? 'on' : '') + '" data-act="slot" data-v="' + s + '">' + ic(s === 'morning' ? 'sun' : s === 'night' ? 'moon' : s === 'lunch' ? 'food' : 'night') + '<b>' + esc(t('s_' + s)) + '</b>' + (s === now ? '<em>' + esc(t('now_label')) + '</em>' : '') + '</button>';
      }).join('') + '</div>' +
      '<div class="filters">' + catChips(K.cat) + '<div class="chips"><button type="button" class="chip tog' + (K.open ? ' on' : '') + '" data-act="ftog" data-v="open" aria-pressed="' + K.open + '">' + ic('clock') + esc(t('f_open')) + '</button>' +
      '<button type="button" class="chip tog' + (K.coupon ? ' on' : '') + '" data-act="ftog" data-v="coupon" aria-pressed="' + K.coupon + '">' + ic('ticket') + esc(t('f_coupon')) + '</button></div></div>' +
      (staff.length ? '<section class="sec">' + secHead(ic('user') + esc(t('picks_staff'))) + '<div class="hscroll">' + staff.map(function (p) {
        return placeTile(p, '<q class="quote">' + esc(p.staff_pick) + '</q><cite>— ' + esc(p.staff_name) + '</cite>');
      }).join('') + '</div></section>' : '') +
      (locals.length ? '<section class="sec">' + secHead(ic('heart') + esc(t('picks_local'))) + '<div class="hscroll">' + locals.map(function (p) { return placeTile(p); }).join('') + '</div></section>' : '') +
      '<section class="sec pad">' + secHead(esc(t('picks_count', { n: list.length }))) + (list.length ? '<div class="plist">' + list.map(placeRow).join('') + '</div>' : '<p class="empty">' + esc(t('no_results')) + '</p>') + '</section>';
  };
  A.slot = function (b) { K.slot = b.getAttribute('data-v'); APP.render(); };
  A.ftog = function (b) { var v = b.getAttribute('data-v'); K[v] = !K[v]; APP.render(); };

  /* ======================================================================
     장소 상세
     ====================================================================== */
  S.place = function (r) {
    var p = ST.place(r.arg); if (!p) { APP.go('#/picks', true); return ''; }
    ST.track('place_view', { ref: p.id, from: 'detail' });
    var st = U.status(p), d = dist(p), fav = ST.s.favs.indexOf(p.id) >= 0, cs = couponsOf(p.id);
    var closed = (p.closed_days || '').split(',').filter(Boolean);
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], today = U.DAYS[ST.seoul().dow];
    var rows = days.map(function (dd) {
      var off = closed.indexOf(dd) >= 0;
      return '<li class="' + (dd === today ? 'today' : '') + (off ? ' off' : '') + '"><span>' + esc(t('d_' + dd.toLowerCase())) + '</span><b>' + (off ? esc(t('closed')) : esc(p.hours === '00:00-24:00' ? t('open_24') : p.hours.replace('-', ' – '))) + '</b>' +
        (!off && p.break_time ? '<small>' + esc(t('break_time')) + ' ' + esc(p.break_time.replace('-', '–')) + '</small>' : '') + '</li>';
    }).join('');
    return '<section class="pd-hero">' + U.art(p, 'pd-art') + '<div class="pd-top"><button type="button" class="rbtn" data-act="back" aria-label="' + esc(t('back')) + '">' + ic('left') + '</button>' +
      '<button type="button" class="rbtn' + (fav ? ' on' : '') + '" data-act="fav" data-v="' + p.id + '" aria-pressed="' + fav + '" aria-label="' + esc(fav ? t('saved') : t('save')) + '">' + ic('heart') + '</button></div>' +
      '<div class="pd-in"><span class="kicker" style="--cc:' + U.catOf(p.cat).color + '">' + ic(U.catOf(p.cat).icon) + esc(catLabel(p.cat)) + ' · ' + esc(p.price) + '</span><h1>' + esc(U.nm(p)) + '</h1>' + (U.lang() !== 'ko' ? '<p class="pd-ko" lang="ko">' + esc(p.name_ko) + '</p>' : '') + '</div></section>' +
      '<div class="pad">' +
      '<div class="pd-st">' + badge(st) + '<span class="dist">' + ic('pin') + U.distLabel(d) + ' · ' + esc(t('min_walk', { n: U.walk(d) })) + '</span>' + (p.local_fav === 'Y' ? '<span class="lf">' + ic('heart') + esc(t('local_fav')) + '</span>' : '') + '</div>' +
      '<p class="pd-desc">' + esc(U.desc(p)) + '</p>' +
      (p.staff_pick ? '<blockquote class="pick"><span>' + ic('user') + esc(t('staff_pick')) + '</span><p>' + esc(p.staff_pick) + '</p><cite>— ' + esc(p.staff_name) + '</cite></blockquote>' : '') +
      cs.map(function (c) { return '<h2 class="h2">' + esc(t('coupon_here')) + '</h2>' + ticket(c); }).join('') +
      '<div class="dirs"><a class="btn pri" href="' + esc(U.naver(p)) + '" target="_blank" rel="noopener" data-deeplink="' + p.id + '" data-app="naver">' + ic('nav') + esc(t('naver_map')) + '</a>' +
      '<a class="btn dark" href="' + esc(U.googleDir(p)) + '" target="_blank" rel="noopener" data-deeplink="' + p.id + '" data-app="google">' + ic('nav') + esc(t('google_map')) + '</a></div>' +
      '<p class="note">' + ic('spark') + esc(t('deeplink_note')) + '</p>' +
      '<section class="sec"><h2 class="h2">' + esc(t('addr_ko')) + '</h2><div class="addr"><b lang="ko">' + esc(p.address_ko) + '</b><div><button type="button" class="btn sm" data-act="copy" data-copy="' + esc(p.name_ko + ' ' + p.address_ko) + '">' + ic('copy') + esc(t('copy_addr')) + '</button>' +
      '<button type="button" class="btn sm" data-act="taxi" data-v="' + p.id + '">' + ic('car') + esc(t('show_driver')) + '</button></div></div></section>' +
      '<section class="sec"><h2 class="h2">' + esc(t('hours')) + '</h2><ul class="hours">' + rows + '</ul></section></div>';
  };
  A.back = function () { if (history.length > 1) history.back(); else APP.go('#/home'); };
  A.fav = function (b) {
    var id = b.getAttribute('data-v'), i = ST.s.favs.indexOf(id);
    if (i >= 0) ST.s.favs.splice(i, 1); else { ST.s.favs.push(id); ST.track('fav_add', { ref: id }); }
    ST.save(); b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', i < 0);
    b.setAttribute('aria-label', i < 0 ? t('saved') : t('save'));
    APP.toast(i < 0 ? t('saved') : t('removed'), 'ok');
  };
  A.taxi = function (b) {
    var id = b.getAttribute('data-v'), p = id ? ST.place(id) : null, h = ST.hotel();
    var name = p ? p.name_ko : (h ? h.name_ko : ''), addr = p ? p.address_ko : (h ? h.address_ko : '');
    APP.sheet('<div class="taxi"><small>' + esc(t('taxi_title')) + (U.lang() !== 'ko' ? ' · 이 주소로 가 주세요' : '') + '</small><b lang="ko">' + esc(name) + '</b><p lang="ko">' + esc(addr) + '</p>' +
      (h && !p ? '<span class="taxi-ph">' + ic('phone') + esc(h.phone) + '</span>' : '') + '</div>', null, 'dark');
  };

  /* 쿠폰 티켓 */
  function ticket(c, focus) {
    var p = ST.place(c.place_id), left = SV.remaining(c.id), got = SV.hasIssued(c.id), cc = U.catOf(p.cat).color;
    var pct = Math.round(left / Math.max(1, +c.daily_limit) * 100);
    return '<div class="tk' + (focus ? ' focus' : '') + (left ? '' : ' out') + '" id="tk-' + c.id + '" style="--cc:' + cc + '"><div class="tk-s">' + ic(U.catOf(p.cat).icon) + '<span>' + esc(catLabel(p.cat)) + '</span></div>' +
      '<div class="tk-b"><a href="#/place/' + p.id + '" class="tk-p">' + esc(U.nm(p)) + ' · ' + U.distLabel(dist(p)) + '</a><b>' + esc(U.title(c)) + '</b><small>' + esc(U.cond(c)) + '</small>' +
      '<span class="tk-q"><i style="width:' + pct + '%"></i></span><em>' + (left ? esc(t('left', { n: left })) : esc(t('sold_out'))) + '</em></div>' +
      '<div class="tk-a">' + (got ? '<a class="btn sm ok" href="#/mine">' + ic('check') + esc(t('got')) + '</a>' :
        '<button type="button" class="btn sm pri" data-act="getc" data-v="' + c.id + '"' + (left ? '' : ' disabled') + '>' + esc(left ? t('get') : t('sold_out')) + '</button>') + '</div></div>';
  }
  A.getc = function (b) {
    var id = b.getAttribute('data-v'); b.disabled = true;
    var res = SV.issueCoupon(id, 'req-' + id + '-' + ST.seoul().date + '-' + ST.s.session);
    if (!res.ok) { APP.toast(t(res.err === 'need_hotel' ? 'inv_body' : res.err), 'err'); APP.render(); return; }
    APP.toast(t('issued'), 'ok');
    var tk = b.closest('.tk'); if (tk) tk.classList.add('pop');
    APP.later(APP.render, 380);
  };

  /* ======================================================================
     SUBWAY
     ====================================================================== */
  var W = { q: '', sel: '239' };
  S.subway = function () {
    var saved = ST.s.offline.saved, on = SV.online();
    var bar = saved ? '<div class="offsave ok">' + ic('check') + '<span><b>' + esc(t('saved_offline')) + '</b><small>' + esc(t('offline_ready')) + '</small></span></div>'
      : '<div class="offsave"><span>' + ic('download') + '<span><b>' + esc(t('save_offline')) + '</b><small>' + esc(t('m_subway_s')) + '</small></span></span><button type="button" class="btn sm pri" data-act="savesub"' + (on ? '' : ' disabled') + '>' + ic('download') + esc(t('save')) + '</button><i class="prog"><b></b></i></div>';
    if (!on && !saved) bar += '<p class="warnline">' + ic('cloudoff') + esc(t('save_failed')) + '</p>';
    return '<div class="ph"><h1>' + esc(t('subway_title')) + '</h1><p>' + esc(t('st_dataset')) + '</p></div>' + bar +
      '<div class="sbox"><label class="search">' + ic('search') + '<input id="stq" type="search" autocomplete="off" placeholder="' + esc(t('st_search')) + '" value="' + esc(W.q) + '" aria-label="' + esc(t('st_search')) + '"></label><div id="stres" class="stres"></div></div>' +
      '<div id="subhost" class="subhost' + (!on && !saved ? ' blocked' : '') + '"></div><div id="stcard"></div>' +
      '<div class="legend">' + RD.LINES.map(function (l) { return '<span><i style="background:' + l.color + '"></i>' + esc(lineName(l.id)) + '</span>'; }).join('') + '</div>';
  };
  function lineName(id) { return id === 'A' ? t('line_A') : id === 'K' ? t('line_K') : t('line_n', { n: id }); }
  function lineBadges(s) { return s.lines.map(function (l) { return '<i class="lb" style="background:' + MAP.lineColor(l) + '" title="' + esc(lineName(l)) + '">' + (l === 'A' ? 'A' : l === 'K' ? 'K' : l) + '</i>'; }).join(''); }
  S.subway.mount = function (r, view) {
    var host = view.querySelector('#subhost'), res = view.querySelector('#stres'), card = view.querySelector('#stcard'), q = view.querySelector('#stq');
    if (!SV.online() && !ST.s.offline.saved) { host.innerHTML = '<div class="map-off">' + ic('cloudoff') + '<p>' + esc(t('save_failed')) + '</p></div>'; return; }
    function draw() { MAP.subway(host, { sel: W.sel, onSt: pick }); showCard(); }
    function showCard() {
      var s = RD.STATIONS.filter(function (x) { return x.id === W.sel; })[0]; if (!s) { card.innerHTML = ''; return; }
      card.innerHTML = '<div class="stc"><div class="stc-h"><b>' + esc(MAP.stName(s)) + '</b>' + lineBadges(s) + '</div><dl class="stc-n">' +
        [['EN', s.en], ['KO', s.ko], ['JA', s.ja], ['ZH', s.zh]].map(function (x) { return '<div><dt>' + x[0] + '</dt><dd lang="' + x[0].toLowerCase() + '">' + esc(x[1]) + '</dd></div>'; }).join('') + '</dl>' +
        '<div class="stc-a"><a class="btn sm" href="' + esc(U.naver({ name_ko: s.ko + '역' })) + '" target="_blank" rel="noopener" data-deeplink="st-' + s.id + '" data-app="naver">' + ic('nav') + esc(t('naver_map')) + '</a>' +
        '<a class="btn sm" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.ko + '역') + '" target="_blank" rel="noopener" data-deeplink="st-' + s.id + '" data-app="google">' + ic('nav') + esc(t('google_map')) + '</a></div></div>';
    }
    function pick(id) { W.sel = id; ST.track('station_view', { ref: id }); draw(); }
    function search() {
      W.q = q.value.trim(); var k = W.q.toLowerCase();
      if (!k) { res.innerHTML = ''; return; }
      var hit = RD.STATIONS.filter(function (s) { return [s.en, s.ko, s.ja, s.zh].some(function (n) { return n.toLowerCase().indexOf(k) >= 0; }) || s.lines.indexOf(k.toUpperCase()) >= 0; }).slice(0, 7);
      res.innerHTML = hit.length ? hit.map(function (s) { return '<button type="button" class="str" data-st="' + s.id + '"><b>' + esc(MAP.stName(s)) + '</b><small>' + esc(s.en) + ' · <span lang="ko">' + esc(s.ko) + '</span> · ' + esc(s.ja) + ' · ' + esc(s.zh) + '</small>' + lineBadges(s) + '</button>'; }).join('') : '<p class="empty">' + esc(t('no_station')) + '</p>';
    }
    q.addEventListener('input', search);
    res.addEventListener('click', function (e) { var b = e.target.closest('[data-st]'); if (b) { q.value = ''; W.q = ''; res.innerHTML = ''; pick(b.getAttribute('data-st')); } });
    search(); draw();
  };
  A.savesub = function (b) {
    if (!SV.online()) { APP.toast(t('save_failed'), 'err'); return; }
    var box = b.closest('.offsave'); box.classList.add('busy'); b.disabled = true; b.textContent = t('saving');
    var active = true, timeout;
    APP.cleanup(function () { active = false; clearTimeout(timeout); });
    var files = ['index.html', 'assets/style.css', 'assets/ops.css', 'assets/data.js', 'assets/i18n.js', 'assets/store.js', 'assets/core.js', 'assets/map.js', 'assets/app.js', 'assets/screens.js', 'assets/qr.js', 'assets/ops.js', 'assets/favicon.svg'];
    files = files.concat(RD.PHOTOS.map(function (n) { return 'assets/images/' + n + '.webp'; }));
    var real = 'caches' in window && 'serviceWorker' in navigator && (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname));
    var work = real ? navigator.serviceWorker.ready.then(function () { return caches.open('roamly-offline-v3'); }).then(function (c) { return c.addAll(files).then(function () { return Promise.all(files.map(function (f) { return c.match(f); })); }); })
      .then(function (m) { if (m.some(function (x) { return !x; })) throw new Error('missing'); }) : Promise.reject(new Error('unsupported'));
    var deadline = new Promise(function (resolve, reject) { timeout = setTimeout(function () { reject(new Error('timeout')); }, 15000); });
    return Promise.race([work, deadline]).then(function () {
      clearTimeout(timeout); if (!active) return;
      ST.s.offline = { saved: true, at: ST.now(), cacheVersion:3 }; ST.save(); ST.track('offline_saved', { ref: 'subway' }); APP.toast(t('saved_offline'), 'ok'); APP.render();
    }, function () { clearTimeout(timeout); if (!active) return; box.classList.remove('busy'); b.disabled = false; b.textContent = t('save'); APP.toast(t(real ? 'save_failed' : 'offline_unsupported'), 'err'); });
  };

  /* ======================================================================
     COUPONS / MY COUPONS
     ====================================================================== */
  var C = { cat: 'all', view: 'list', mine: 'usable' };
  function cpTabs(cur) {
    var n = ST.s.issued.filter(function (x) { return SV.itemStatus(x) === 'usable'; }).length;
    return '<div class="cptabs" role="tablist"><a role="tab" href="#/coupons" class="' + (cur === 'all' ? 'on' : '') + '" aria-selected="' + (cur === 'all') + '">' + esc(t('cp_tab_all')) + '</a>' +
      '<a role="tab" href="#/mine" class="' + (cur === 'mine' ? 'on' : '') + '" aria-selected="' + (cur === 'mine') + '">' + esc(t('cp_tab_mine')) + (n ? '<em>' + n + '</em>' : '') + '</a></div>';
  }
  S.coupons = function (r) {
    var list = ST.content().coupons.filter(function (c) {
      var p = ST.place(c.place_id); return c.active === 'Y' && p && (C.cat === 'all' || p.cat === C.cat);
    }).sort(function (a, b) { return (SV.remaining(b.id) > 0) - (SV.remaining(a.id) > 0) || dist(ST.place(a.place_id)) - dist(ST.place(b.place_id)); });
    var top = ST.content().banners.filter(function (b) { return b.active === 'Y'; })[1];
    if (top) APP.later(function () { ST.track('banner_view', { ref: top.id, slot: 'coupon_top' }); }, 0);
    return cpTabs('all') +
      (top ? '<a class="cbanner tone-' + esc(top.tone) + '" href="#/place/' + top.place_id + '" data-banner="' + top.id + '" data-slot="coupon_top"><span class="ad-tag">' + esc(t('sponsored')) + '</span><b>' + esc(U.lang() === 'ko' ? top.title_ko : top.title_en) + '</b><small>' + esc(U.lang() === 'ko' ? top.sub_ko : top.sub_en) + '</small>' + ic('right') + '</a>' : '') +
      rouletteCard() +
      '<div class="cp-tools">' + catChips(C.cat) + '<div class="vt"><button type="button" class="' + (C.view === 'list' ? 'on' : '') + '" data-act="cview" data-v="list" aria-label="' + esc(t('view_list')) + '">' + ic('list') + '</button><button type="button" class="' + (C.view === 'map' ? 'on' : '') + '" data-act="cview" data-v="map" aria-label="' + esc(t('view_map')) + '">' + ic('map') + '</button></div></div>' +
      (C.view === 'map' ? '<div class="cmap" id="cmap"></div><div id="cmapcard"></div>' : '<div class="tks pad">' + list.map(function (c) { return ticket(c, r.q.focus === c.id); }).join('') + '</div>');
  };
  S.coupons.mount = function (r, view) {
    if (r.q.focus) { var el = view.querySelector('#tk-' + r.q.focus); if (el) APP.later(function () { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60); }
    if (C.view !== 'map') return;
    var host = view.querySelector('#cmap'), card = view.querySelector('#cmapcard');
    if (!SV.online()) { host.innerHTML = '<div class="map-off">' + ic('cloudoff') + '<p>' + esc(t('map_offline')) + '</p></div>'; return; }
    var ps = places().filter(function (p) { return couponsOf(p.id).some(function (c) { return C.cat === 'all' || p.cat === C.cat; }); });
    ps.forEach(function (p) { p._coupon = true; });
    MAP.neighborhood(host, { places: ps, center: U.xy(U.origin().lat, U.origin().lng), radiusM: 0, hotel: ST.hotel(), onPin: function (id) {
      card.innerHTML = '<div class="pad">' + couponsOf(id).map(function (c) { return ticket(c); }).join('') + '</div>';
    }, onBg: function () { card.innerHTML = ''; } });
  };
  A.cview = function (b) { C.view = b.getAttribute('data-v'); APP.render(); };

  S.mine = function () {
    var items = ST.s.issued.filter(function (x) { return SV.itemStatus(x) === C.mine; });
    var cnt = function (s) { return ST.s.issued.filter(function (x) { return SV.itemStatus(x) === s; }).length; };
    return cpTabs('mine') + '<div class="seg3" role="tablist">' + ['usable', 'used', 'expired'].map(function (s) {
      return '<button type="button" role="tab" aria-selected="' + (C.mine === s) + '" class="' + (C.mine === s ? 'on' : '') + '" data-act="mineseg" data-v="' + s + '">' + esc(t('st_' + s)) + ' <span>' + cnt(s) + '</span></button>';
    }).join('') + '</div><div class="pad mylist">' + (items.length ? items.map(myTicket).join('') : '<div class="empty big">' + ic('ticket') + '<p>' + esc(t('empty_mine')) + '</p><a class="btn pri" href="#/coupons">' + esc(t('cp_tab_all')) + '</a></div>') + '</div>';
  };
  A.mineseg = function (b) { C.mine = b.getAttribute('data-v'); APP.render(); };
  function myTicket(it) {
    var p = ST.place(it.place_id), st = SV.itemStatus(it), cc = U.catOf(p.cat).color;
    return '<a class="my st-' + st + '" href="#/coupon/' + it.id + '" style="--cc:' + cc + '">' +
      '<span class="my-s">' + (it.kind === 'prize' ? '<b class="tier tier-' + it.tier + '">' + esc(tierName(it.tier)) + '</b>' : ic(U.catOf(p.cat).icon)) + '</span>' +
      '<span class="my-b"><small>' + esc(U.nm(p)) + (it.kind === 'prize' ? ' · ' + esc(t('from_roulette')) : '') + '</small><b>' + esc(U.lang() === 'ko' ? it.title_ko : it.title_en) + '</b>' +
      '<em>' + (st === 'used' ? esc(t('redeemed_at', { t: U.dt(it.usedAt) })) : st === 'expired' ? esc(t('st_expired')) : esc(t('valid_until', { t: U.dt(it.expiresAt) }))) + '</em></span>' +
      (st === 'usable' ? '<span class="my-go">' + esc(t('use_store')) + ic('right') + '</span>' : '<span class="my-stamp">' + esc(t('st_' + st)) + '</span>') + '</a>';
  }

  /* ======================================================================
     쿠폰 사용 화면 (직원 PIN · 60초 실시간 검증값)
     ====================================================================== */
  S.coupon = function (r) {
    var it = SV.item(r.arg); if (!it) { APP.go('#/mine', true); return ''; }
    var p = ST.place(it.place_id), st = SV.itemStatus(it), cap = r.q.capture === '1';
    var cc = U.catOf(p.cat).color;
    var head = '<div class="cu-top"><button type="button" class="rbtn" data-act="back" aria-label="' + esc(t('back')) + '">' + ic('left') + '</button><span>' + esc(t('cp_tab_mine')) + '</span><span></span></div>';
    var body = '<div class="cu-ticket st-' + st + (cap ? ' captured' : '') + '" style="--cc:' + cc + '">' +
      '<div class="cu-h">' + U.art(p, 'cu-art') + '<div class="cu-hin"><small>' + esc(U.nm(p)) + (U.lang() !== 'ko' ? ' · <span lang="ko">' + esc(p.name_ko) + '</span>' : '') + '</small><b>' + esc(U.lang() === 'ko' ? it.title_ko : it.title_en) + '</b>' +
      (it.kind === 'prize' ? '<span class="tier tier-' + it.tier + '">' + esc(tierName(it.tier)) + ' · ' + esc(t('from_roulette')) + '</span>' : '') + '</div></div>' +
      '<div class="cu-perf"></div>';
    if (st === 'usable') {
      body += '<div class="cu-live"><div class="holo" aria-hidden="true"></div><div class="cu-live-in"><span class="livetag"><i></i>' + esc(t('live')) + '</span>' +
        '<b class="cu-clock" id="cuclock">--:--:--</b><span class="cu-code mono">' + esc(it.code) + '</span>' +
        '<span class="cu-tk"><svg viewBox="0 0 36 36" class="ring"><circle cx="18" cy="18" r="15.5" class="r0"/><circle cx="18" cy="18" r="15.5" class="r1" id="ring"/></svg><b id="tkv">----</b></span>' +
        '<small id="tkleft">' + esc(t('refresh_in', { s: 60 })) + '</small></div>' + (cap ? '<span class="capmark">' + ic('eye') + (U.lang() === 'ko' ? '캡처 이미지 (시연)' : 'Screenshot (demo)') + '</span>' : '') + '</div>' +
        '<p class="cu-show">' + ic('store') + esc(t('show_staff')) + '</p>' +
        '<div class="cu-staff"><p class="cu-sl">' + ic('lock') + esc(t('staff_pin')) + '</p><div class="pin-dots" id="pindots"><i></i><i></i><i></i><i></i></div>' +
        '<div class="pad-k" id="padk">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 'c', 0, 'b'].map(function (k) {
          return '<button type="button" data-k="' + k + '"' + (k === 'c' ? ' aria-label="Clear"' : k === 'b' ? ' aria-label="Delete"' : '') + '>' + (k === 'c' ? 'C' : k === 'b' ? '⌫' : k) + '</button>';
        }).join('') + '</div>' +
        '<label class="amt"><span>' + esc(t('amount_opt')) + '</span><span class="amt-in"><input id="amt" inputmode="numeric" autocomplete="off" placeholder="' + esc(t('amount_ph')) + '"><em>' + esc(t('won')) + '</em></span></label>' +
        '<p class="cu-err" id="cuerr" role="alert"></p>' +
        '<button type="button" class="btn pri wide" id="cuok" disabled>' + ic('check') + esc(t('confirm')) + '</button>' +
        '<p class="demo-pin">' + esc(t('demo_pin')) + ' <b>' + esc(RD.DEMO_PIN[it.place_id] || '-') + '</b></p></div>';
    } else {
      body += '<div class="cu-done"><span class="stamp ' + st + '">' + esc(t('st_' + st)) + '</span>' +
        (st === 'used' ? '<p>' + esc(t('redeemed_at', { t: U.dt(it.usedAt) })) + (it.amount != null ? ' · ₩' + U.won(it.amount) : '') + '</p>' : '<p>' + esc(t('expired_msg')) + '</p>') + '<span class="cu-code mono">' + esc(it.code) + '</span></div>';
    }
    body += '<div class="cu-meta"><span>' + ic('clock') + esc(t('valid_until', { t: U.dt(it.expiresAt) })) + '</span><span>' + esc(U.lang() === 'ko' ? it.cond_ko : it.cond_en) + '</span></div></div>' +
      '<div class="dirs pad"><a class="btn" href="#/place/' + p.id + '">' + ic('pin') + esc(t('details')) + '</a><a class="btn" href="' + esc(U.naver(p)) + '" target="_blank" rel="noopener" data-deeplink="' + p.id + '" data-app="naver">' + ic('nav') + esc(t('directions')) + '</a></div>';
    return '<div class="cu">' + head + body + '</div>';
  };
  S.coupon.mount = function (r, view) {
    view.classList.add('view-dark'); view.closest('.app').classList.add('dark');
    var it = SV.item(r.arg); if (!it || SV.itemStatus(it) !== 'usable') return;
    var cap = r.q.capture === '1';
    var tk = cap ? SV.staleToken(it.id) : SV.token(it.id);
    var clock = view.querySelector('#cuclock'), tkv = view.querySelector('#tkv'), left = view.querySelector('#tkleft'), ring = view.querySelector('#ring');
    var pin = '', dots = view.querySelectorAll('#pindots i'), ok = view.querySelector('#cuok'), err = view.querySelector('#cuerr'), amt = view.querySelector('#amt');
    var capClock = ST.seoul(tk.at + 6000);
    function tick() {
      if (!cap) { var age = ST.now() - tk.at; if (age >= 60000) { tk = SV.token(it.id, true); } }
      var s = cap ? capClock : ST.seoul(), rem = cap ? 54 : Math.max(0, 60 - Math.floor((ST.now() - tk.at) / 1000));
      clock.textContent = U.pad(s.hh) + ':' + U.pad(s.mi) + ':' + U.pad(s.ss);
      tkv.textContent = tk.v; left.textContent = t('refresh_in', { s: rem });
      ring.style.strokeDashoffset = (97.4 * (1 - rem / 60)).toFixed(1);
    }
    tick(); if (!cap) APP.every(tick, 1000);
    function paint() { dots.forEach(function (d, i) { d.classList.toggle('on', i < pin.length); }); ok.disabled = pin.length !== 4; }
    view.querySelector('#padk').addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]'); if (!b) return; var k = b.getAttribute('data-k');
      if (k === 'c') pin = ''; else if (k === 'b') pin = pin.slice(0, -1); else if (pin.length < 4) pin += k;
      err.textContent = ''; paint();
    });
    amt.setAttribute('maxlength', '9');
    ok.addEventListener('click', function () {
      var res = SV.redeem(it.id, pin, amt.value.trim(), tk);
      if (res.ok) {
        var sh = APP.sheet('<div class="done-anim"><span class="stamp used big">' + esc(t('redeemed')) + '</span><h3>' + esc(t('redeem_done')) + '</h3><p>' + esc(U.lang() === 'ko' ? it.title_ko : it.title_en) + '</p><p class="mono">' + esc(U.dt(it.usedAt)) + (it.amount != null ? ' · ₩' + U.won(it.amount) : '') + '</p>' +
          '<a class="btn pri wide" href="#/mine" data-close>' + esc(t('cp_tab_mine')) + '</a></div>', null, 'center');
        return;
      }
      pin = ''; paint();
      var m = res.err === 'wrong_pin' ? t('wrong_pin', { n: res.left }) : res.err === 'locked' ? t('locked', { t: U.hm(res.until) }) : t(res.err);
      if (cap && res.err === 'token_expired') m = U.lang() === 'ko' ? '캡처 화면의 실시간 확인값은 이미 만료되어 서버에서 사용 처리를 거절했습니다. 관광객 휴대폰의 실제 쿠폰 화면에서 다시 진행해 주세요.' : 'This screenshot carries an expired live check, so the server refused it. Please use the live coupon screen on the guest’s phone.';
      err.textContent = m; err.parentNode.classList.remove('shake'); void err.offsetWidth; err.parentNode.classList.add('shake');
      if (res.err === 'token_expired' && !cap) { tk = SV.token(it.id, true); tick(); }
      APP.renderDemo();
    });
  };

  /* ======================================================================
     룰렛 (프로필 → 추첨)
     ====================================================================== */
  var SEGS = ['gold', 'welcome', 'silver', 'bronze', 'welcome', 'silver', 'bronze', 'welcome'];
  S.roulette = function (r) {
    var res = SV.spunToday();
    if (!ST.s.profile && !res) return profileForm();
    return '<div class="rl"><div class="rl-h"><span class="kicker">' + esc(t('today_coupon')) + '</span><h1>' + esc(t('rl_title')) + '</h1><p>' + esc(t('rl_sub')) + '</p></div>' +
      '<div class="wheel-wrap"><span class="wheel-ptr" aria-hidden="true"></span><svg class="wheel" id="wheel" viewBox="0 0 300 300" aria-hidden="true">' + wheelSvg() + '</svg>' +
      '<button type="button" class="spin" id="spin"' + (res ? ' disabled' : '') + '>' + (res ? ic('lock') : esc(t('spin'))) + '</button></div>' +
      '<div id="rlres">' + (res ? resultCard(res) : '<p class="rl-hint">' + ic('spark') + esc(t('spin_sub')) + '</p>') + '</div>' +
      '<ul class="odds">' + RD.ROULETTE.tiers.map(function (x) { return '<li><i style="background:' + x.color + '"></i>' + esc(tierName(x.id)) + '</li>'; }).join('') + '</ul></div>';
  };
  function wheelSvg() {
    var col = {}; RD.ROULETTE.tiers.forEach(function (x) { col[x.id] = x.color; });
    var s = '';
    SEGS.forEach(function (id, i) {
      var a0 = (i * 45 - 90) * Math.PI / 180, a1 = ((i + 1) * 45 - 90) * Math.PI / 180, am = ((i + 0.5) * 45 - 90) * Math.PI / 180;
      s += '<path d="M150 150 L' + (150 + 140 * Math.cos(a0)).toFixed(2) + ' ' + (150 + 140 * Math.sin(a0)).toFixed(2) + ' A140 140 0 0 1 ' + (150 + 140 * Math.cos(a1)).toFixed(2) + ' ' + (150 + 140 * Math.sin(a1)).toFixed(2) + 'z" fill="' + col[id] + '" stroke="#0B0F1A" stroke-width="3"/>';
      s += '<text x="' + (150 + 92 * Math.cos(am)).toFixed(1) + '" y="' + (150 + 92 * Math.sin(am)).toFixed(1) + '" transform="rotate(' + ((i + 0.5) * 45) + ' ' + (150 + 92 * Math.cos(am)).toFixed(1) + ' ' + (150 + 92 * Math.sin(am)).toFixed(1) + ')" class="wt">' + esc(tierName(id)).toUpperCase() + '</text>';
    });
    for (var k = 0; k < 24; k++) { var a = k * 15 * Math.PI / 180; s += '<circle cx="' + (150 + 146 * Math.cos(a)).toFixed(1) + '" cy="' + (150 + 146 * Math.sin(a)).toFixed(1) + '" r="2.6" fill="' + (k % 2 ? '#FFC531' : '#fff') + '"/>'; }
    return '<circle cx="150" cy="150" r="149" fill="#0B0F1A"/><g id="wg">' + s.replace(/<circle[^>]*\/>/g, '') + '</g>' + s.match(/<circle[^>]*\/>/g).join('');
  }
  function resultCard(res) {
    var pz = RD.ROULETTE.prizes[res.prizeId], it = SV.item(res.item), p = ST.place(pz.place_id);
    return '<div class="rl-res"><span class="tier tier-' + res.tier + ' big">' + esc(tierName(res.tier)) + '</span><small>' + esc(t('you_won')) + '</small><b>' + esc(U.title(pz)) + '</b>' +
      '<span class="rl-pl">' + ic('pin') + esc(U.nm(p)) + ' · ' + U.distLabel(dist(p)) + '</span>' +
      (res.fallback ? '<p class="rl-fb">' + ic('spark') + esc(t('fallback')) + '</p>' : '') +
      '<p class="rl-ok">' + ic('check') + esc(t('in_wallet')) + ' · ' + esc(t('valid_until', { t: it ? U.dt(it.expiresAt) : '' })) + '</p>' +
      (it ? '<a class="btn pri wide" href="#/coupon/' + it.id + '">' + esc(t('use_now')) + '</a>' : '') + '<p class="rl-done">' + esc(t('rl_done')) + '</p></div>';
  }
  S.roulette.mount = function (r, view) {
    view.classList.add('view-dark'); view.closest('.app').classList.add('dark');
    var form = view.querySelector('#pform');
    if (form) {
      var go = view.querySelector('#pgo');
      var check = function () { var f = new FormData(form); go.disabled = !(f.get('nat') && f.get('age') && f.get('companion') && f.get('consent')); };
      form.addEventListener('change', check); check();
      view.querySelector('#cmore').addEventListener('click', function () { var d = view.querySelector('#cdetail'); d.hidden = !d.hidden; });
      form.addEventListener('submit', function (e) {
        e.preventDefault(); var f = new FormData(form);
        if (!(f.get('nat') && f.get('age') && f.get('companion') && f.get('consent'))) return;
        ST.s.profile = { nat: f.get('nat'), age: f.get('age'), gender: f.get('gender') || 'na', companion: f.get('companion') };
        ST.s.consentAt = ST.now(); ST.save(); ST.track('profile_submit', { nat: ST.s.profile.nat, age: ST.s.profile.age, companion: ST.s.profile.companion });
        APP.render();
      });
      return;
    }
    var btn = view.querySelector('#spin'), wg = view.querySelector('#wg'), out = view.querySelector('#rlres');
    if (SV.spunToday()) { var r0 = SV.spunToday(), i0 = SEGS.indexOf(r0.tier); wg.style.transform = 'rotate(' + (360 - (i0 * 45 + 22.5)) + 'deg)'; }
    btn.addEventListener('click', function () {
      var res = SV.spin();
      if (!res.ok) { APP.toast(res.err === 'spun' ? t('spun_today') : t(res.err === 'need_hotel' ? 'inv_body' : res.err), 'err'); return; }
      btn.disabled = true; btn.innerHTML = ic('spark'); APP.badge();
      var idx = SEGS.map(function (s, i) { return s === res.res.tier ? i : -1; }).filter(function (i) { return i >= 0; });
      var pick = idx[Math.floor(Math.random() * idx.length)], jitter = Math.random() * 26 - 13;
      out.innerHTML = '<p class="rl-hint spin-now">' + esc(t('spinning')) + '</p>';
      requestAnimationFrame(function () { wg.style.transition = 'transform 4.2s cubic-bezier(.12,.72,.08,1)'; wg.style.transform = 'rotate(' + (360 * 6 + 360 - (pick * 45 + 22.5) + jitter) + 'deg)'; });
      APP.later(function () { out.innerHTML = resultCard(res.res); btn.innerHTML = ic('lock'); view.querySelector('.rl').classList.add('won'); APP.renderDemo(); }, 4400);
    });
  };
  function profileForm() {
    var nat = RD.NATIONS.map(function (n) { return '<option value="' + n.id + '">' + esc(U.lang() === 'ko' ? n.ko : n.en) + '</option>'; }).join('');
    function radios(name, list, lbl) { return '<div class="rad">' + list.map(function (v) { return '<label><input type="radio" name="' + name + '" value="' + v + '"><span>' + esc(lbl(v)) + '</span></label>'; }).join('') + '</div>'; }
    return '<div class="rl pf"><div class="rl-h"><span class="kicker">' + esc(t('rl_title')) + ' · 1/2</span><h1>' + esc(t('pf_title')) + '</h1><p>' + esc(t('pf_sub')) + '</p></div>' +
      '<form id="pform" class="pform" novalidate>' +
      '<label class="fl">' + esc(t('nationality')) + '<select name="nat" required><option value="">' + esc(t('select')) + '</option>' + nat + '</select></label>' +
      '<fieldset><legend>' + esc(t('age')) + '</legend>' + radios('age', RD.AGES, function (v) { return v; }) + '</fieldset>' +
      '<fieldset><legend>' + esc(t('companion')) + '</legend>' + radios('companion', RD.COMPANIONS, function (v) { return t('cp_' + v); }) + '</fieldset>' +
      '<fieldset><legend>' + esc(t('gender')) + '</legend>' + radios('gender', RD.GENDERS, function (v) { return t('gd_' + v); }) + '</fieldset>' +
      '<label class="consent"><input type="checkbox" name="consent" value="1"><span>' + esc(t('consent')) + '</span></label><button type="button" class="linkbtn" id="cmore">' + esc(t('consent_more')) + '</button>' +
      '<p class="cdetail" id="cdetail" hidden>' + esc(t('consent_detail')) + '</p>' +
      '<button type="submit" class="btn pri wide" id="pgo" disabled>' + esc(t('next')) + ic('right') + '</button></form></div>';
  }

  /* ======================================================================
     FAVORITE · HELP · MORE
     ====================================================================== */
  var F = { view: 'list' };
  S.fav = function () {
    var list = ST.s.favs.map(function (id) { return ST.place(id); }).filter(Boolean);
    return '<div class="ph"><h1>' + esc(t('fav_title')) + '</h1><p>' + esc(t('picks_count', { n: list.length })) + '</p>' +
      (list.length ? '<div class="vt"><button type="button" class="' + (F.view === 'list' ? 'on' : '') + '" data-act="fview" data-v="list" aria-label="' + esc(t('view_list')) + '">' + ic('list') + '</button><button type="button" class="' + (F.view === 'map' ? 'on' : '') + '" data-act="fview" data-v="map" aria-label="' + esc(t('view_map')) + '">' + ic('map') + '</button></div>' : '') +
      (list.length ? (F.view === 'map' ? '<div class="cmap" id="fmap"></div><div id="fcard" class="pad"></div>' : '<div class="plist pad">' + list.map(placeRow).join('') + '</div>') :
        '<div class="empty big">' + ic('heart') + '<p>' + esc(t('fav_empty')) + '</p><a class="btn pri" href="#/picks">' + esc(t('m_picks')) + '</a></div>');
  };
  S.fav.mount = function (r, view) {
    var host = view.querySelector('#fmap'); if (!host) return;
    if (!SV.online()) { host.innerHTML = '<div class="map-off">' + ic('cloudoff') + '<p>' + esc(t('map_offline')) + '</p></div>'; return; }
    var list = ST.s.favs.map(function (id) { return ST.place(id); }).filter(Boolean); list.forEach(function (p) { p._coupon = hasCoupon(p); });
    var card = view.querySelector('#fcard');
    MAP.neighborhood(host, { places: list, center: U.xy(U.origin().lat, U.origin().lng), radiusM: 0, hotel: ST.hotel(), onPin: function (id) { card.innerHTML = placeRow(ST.place(id)); }, onBg: function () { card.innerHTML = ''; } });
  };
  A.fview = function (b) { F.view = b.getAttribute('data-v'); APP.render(); };

  S.help = function () {
    var h = ST.hotel();
    return '<div class="ph"><h1>' + esc(t('help_title')) + '</h1></div><div class="pad helps">' +
      (h ? '<a class="hcard red" href="' + esc(U.naver(h)) + '" target="_blank" rel="noopener" data-deeplink="hotel" data-app="naver">' + ic('nav') + '<span><b>' + esc(t('back_hotel')) + '</b><small>' + esc(t('back_hotel_s')) + ' · ' + esc(U.hotelName(h)) + '</small></span>' + ic('right') + '</a>' +
        '<button type="button" class="hcard" data-act="taxi">' + ic('car') + '<span><b>' + esc(t('taxi')) + '</b><small>' + esc(t('taxi_s')) + '</small></span>' + ic('right') + '</button>' +
        '<a class="hcard" href="tel:' + esc(h.phone) + '">' + ic('phone') + '<span><b>' + esc(t('front')) + '</b><small>' + esc(h.phone) + '</small></span><em>' + esc(t('call')) + '</em></a>' : '') +
      '<a class="hcard" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('international clinic Seoul') + '" target="_blank" rel="noopener">' + ic('plusbox') + '<span><b>' + esc(t('hospital')) + '</b><small>' + esc(t('hospital_s')) + '</small></span>' + ic('right') + '</a>' +
      '<h2 class="h2">' + esc(t('emergency')) + '</h2><div class="sos">' +
      '<a href="tel:112"><b>112</b><span>' + esc(t('police')) + '</span></a><a href="tel:119"><b>119</b><span>' + esc(t('fire')) + '</span></a><a href="tel:1330"><b>1330</b><span>' + esc(t('tourist_line')) + '</span></a></div></div>';
  };

  S.more = function () {
    var items = [['hotel', 'bed', 'm_hotel', 'm_hotel_s'], ['subway', 'train', 'm_subway', 'm_subway_s'], ['fav', 'heart', 'fav_title', null], ['help', 'help', 'help_title', 'need_help'], ['mine', 'ticket', 'cp_tab_mine', null], ['roulette', 'gift', 'rl_title', 'spin_sub']];
    return '<div class="ph"><h1>' + esc(t('more_title')) + '</h1></div><div class="pad more">' + items.map(function (x) {
      return '<a class="mrow" href="#/' + x[0] + '" data-menu="' + x[0] + '"><span class="mr-i">' + ic(x[1]) + '</span><span><b>' + esc(t(x[2])) + '</b>' + (x[3] ? '<small>' + esc(t(x[3])) + '</small>' : '') + '</span>' + ic('right') + '</a>';
    }).join('') +
      '<button type="button" class="mrow" data-act="lang"><span class="mr-i">' + ic('globe') + '</span><span><b>' + esc(t('change_lang')) + '</b><small>' + esc(window.I18N[U.lang()].lang_name) + '</small></span>' + ic('right') + '</button>' +
      '<a class="mrow" href="#/ops"><span class="mr-i">' + ic('chart') + '</span><span><b>' + esc(t('land_ops')) + '</b><small>' + esc(t('partner_sub')) + '</small></span>' + ic('right') + '</a><p class="fine">ROAMLY · ' + esc(t('sample_note')) + '</p></div>';
  };
})();
