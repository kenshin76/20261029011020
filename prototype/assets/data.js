/* ROAMLY 프로토타입 — 시연용 가상 데이터
   호텔·매장·쿠폰·배너·주소·전화번호·지표는 모두 가상입니다. */
(function () {
  'use strict';

  /* 1차 적용 호텔 기준 좌표 (지도 투영 기준점) */
  var BASE = { lat: 37.55642, lng: 126.92218 };
  var M_LAT = 111000, M_LNG = 88050, UNIT = 4; /* 지도 1단위 = 4m */
  function ll(x, y) {
    return {
      lat: +(BASE.lat - (y - 500) * UNIT / M_LAT).toFixed(6),
      lng: +(BASE.lng + (x - 500) * UNIT / M_LNG).toFixed(6)
    };
  }

  var CATS = [
    { id: 'food', color: '#966449', icon: 'food' },
    { id: 'cafe', color: '#8E724B', icon: 'cafe' },
    { id: 'night', color: '#686B85', icon: 'night' },
    { id: 'shop', color: '#537987', icon: 'shop' },
    { id: 'beauty', color: '#996F7D', icon: 'beauty' },
    { id: 'culture', color: '#49816E', icon: 'culture' }
  ];

  /* ---------- 호텔 (운영 시트 「호텔」 탭, 약 30필드) ---------- */
  var HOTELS = [
    {
      code: 'HDL01', status: 'active', name_en: 'Hotel Lane Hongdae', name_ko: '호텔 레인 홍대', area_en: 'Hongdae', area_ko: '홍대',
      address_ko: '서울 마포구 와우산로 000 (가상 주소)', address_en: '000 Wausan-ro, Mapo-gu, Seoul (sample)', lat: BASE.lat, lng: BASE.lng,
      phone: '02-0000-1201', checkin: '15:00', checkout: '11:00', wifi_ssid: 'LANE_GUEST', wifi_pw: 'hello2026',
      breakfast_place: '2F Lane Kitchen', breakfast_hours: '07:00-10:00', breakfast_price: '25,000',
      restaurant_name: 'Lane Kitchen', restaurant_hours: '11:30-22:00', bar_name: 'Sky Lane (12F)', bar_hours: '18:00-01:00',
      fitness_hours: '06:00-23:00', laundry: 'B1 coin laundry · 24h', luggage: 'Front desk · free on check-out day', parking: 'B1 · ₩15,000 / night',
      airport_bus: 'Stop 200 m · every 20 min', convenience: '1F next door · 24h', atm: 'Lobby (global cards)', adapter: 'Free at front desk',
      umbrella: 'Free loan at front desk', smoking: '1F outdoor area only', late_checkout: 'Until 13:00 · ₩30,000', quiet_hours: '22:00-07:00',
      floors: 'B1|Parking · Coin laundry · Fitness;1F|Lobby · Front desk · Luggage;2F|Lane Kitchen · Breakfast;3F-11F|Guest rooms;12F|Sky Lane rooftop bar',
      perks: 'K-Glow Beauty Lab 15% off|c05;Welcome drink at Sky Lane|;Free city map & adapter|',
      art: 0
    },
    {
      code: 'YNL02', status: 'active', name_en: 'Yeonnam Loft Hotel', name_ko: '연남 로프트 호텔', area_en: 'Yeonnam', area_ko: '연남',
      address_ko: '서울 마포구 성미산로 000 (가상 주소)', address_en: '000 Seongmisan-ro, Mapo-gu, Seoul (sample)', lat: ll(640, 300).lat, lng: ll(640, 300).lng,
      phone: '02-0000-2202', checkin: '15:00', checkout: '11:00', wifi_ssid: 'LOFT_FREE', wifi_pw: 'loft2026',
      breakfast_place: '1F Loft Café', breakfast_hours: '07:30-10:30', breakfast_price: '18,000',
      restaurant_name: 'Loft Café', restaurant_hours: '07:30-20:00', bar_name: 'Loft Terrace', bar_hours: '19:00-24:00',
      fitness_hours: '—', laundry: '3F washer & dryer · free', luggage: 'Lobby lockers', parking: 'Not available',
      airport_bus: 'Hongik Univ. Stn (AREX) 9 min walk', convenience: '50 m · 24h', atm: 'Convenience store', adapter: 'Free at front desk',
      umbrella: 'Free loan', smoking: 'Non-smoking building', late_checkout: 'Until 12:00 · free on request', quiet_hours: '22:00-07:00',
      floors: '1F|Lobby · Loft Café;2F-6F|Guest rooms;7F|Loft Terrace',
      perks: 'Yeonnam Forest Bakery free Americano|c06;Free bike map|',
      art: 1
    },
    {
      code: 'HPJ04', status: 'active', name_en: 'Hapjeong Riverside Hotel', name_ko: '합정 리버사이드 호텔', area_en: 'Hapjeong', area_ko: '합정',
      address_ko: '서울 마포구 양화로 000 (가상 주소)', address_en: '000 Yanghwa-ro, Mapo-gu, Seoul (sample)', lat: ll(330, 690).lat, lng: ll(330, 690).lng,
      phone: '02-0000-4404', checkin: '15:00', checkout: '12:00', wifi_ssid: 'RIVERSIDE', wifi_pw: 'river2026',
      breakfast_place: '3F Dining', breakfast_hours: '06:30-10:00', breakfast_price: '28,000',
      restaurant_name: 'River Dining', restaurant_hours: '11:30-21:30', bar_name: 'Lounge 3', bar_hours: '17:00-24:00',
      fitness_hours: '06:00-22:00', laundry: 'Service · same day', luggage: 'Front desk', parking: 'B2 · ₩20,000 / night',
      airport_bus: 'Hapjeong Stn 3 min walk', convenience: '1F · 07:00-24:00', atm: 'B1', adapter: 'Front desk',
      umbrella: 'Front desk', smoking: 'Outdoor area', late_checkout: 'Until 14:00 · ₩40,000', quiet_hours: '22:00-07:00',
      floors: 'B2|Parking;1F|Lobby;3F|River Dining · Lounge 3;4F-15F|Guest rooms', perks: 'Bibim Table 10% off|c07', art: 2
    },
    {
      code: 'SGS05', status: 'active', name_en: 'Sangsu Design Stay', name_ko: '상수 디자인 스테이', area_en: 'Sangsu', area_ko: '상수',
      address_ko: '서울 마포구 독막로 000 (가상 주소)', address_en: '000 Dongmak-ro, Mapo-gu, Seoul (sample)', lat: ll(560, 760).lat, lng: ll(560, 760).lng,
      phone: '02-0000-5505', checkin: '16:00', checkout: '11:00', wifi_ssid: 'DESIGNSTAY', wifi_pw: 'stay2026',
      breakfast_place: 'Room delivery', breakfast_hours: '08:00-10:00', breakfast_price: '15,000',
      restaurant_name: '—', restaurant_hours: '—', bar_name: '—', bar_hours: '—',
      fitness_hours: '—', laundry: 'Washer in room', luggage: 'Lobby lockers', parking: 'Not available',
      airport_bus: 'Sangsu Stn 4 min walk', convenience: '30 m · 24h', atm: 'Convenience store', adapter: 'In room',
      umbrella: 'Lobby', smoking: 'Non-smoking building', late_checkout: 'Until 12:00', quiet_hours: '22:00-08:00',
      floors: '1F|Lobby · Lockers;2F-5F|Guest rooms', perks: 'Dessert 39 free topping|', art: 3
    },
    {
      code: 'SCG03', status: 'closed', name_en: 'Sinchon Garden Stay', name_ko: '신촌 가든 스테이', area_en: 'Sinchon', area_ko: '신촌',
      address_ko: '서울 서대문구 연세로 000 (가상 주소)', address_en: '000 Yonsei-ro, Seodaemun-gu, Seoul (sample)', lat: ll(840, 520).lat, lng: ll(840, 520).lng,
      phone: '02-0000-3303', checkin: '15:00', checkout: '11:00', wifi_ssid: '-', wifi_pw: '-',
      breakfast_place: '-', breakfast_hours: '-', breakfast_price: '-', restaurant_name: '-', restaurant_hours: '-', bar_name: '-', bar_hours: '-',
      fitness_hours: '-', laundry: '-', luggage: '-', parking: '-', airport_bus: '-', convenience: '-', atm: '-', adapter: '-', umbrella: '-',
      smoking: '-', late_checkout: '-', quiet_hours: '-', floors: '', perks: '', art: 4
    }
  ];

  /* ---------- 장소 (운영 시트 「장소」 탭) ---------- */
  function P(id, cat, x, y, en, ko, ja, zh, addr, hours, brk, closed, opts) {
    var c = ll(x, y);
    var r = {
      id: id, cat: cat, name_en: en, name_ko: ko, name_ja: ja, name_zh: zh, address_ko: addr,
      lat: c.lat, lng: c.lng, hours: hours, break_time: brk || '', closed_days: closed || '',
      area: 'hongdae', staff_pick: '', staff_name: '', local_fav: 'N', slots: '', price: '₩₩', desc_en: '', desc_ko: '', active: 'Y'
    };
    for (var k in opts) r[k] = opts[k];
    return r;
  }
  var PLACES = [
    P('p01', 'food', 545, 545, 'Mapo Charcoal Galbi', '마포 숯불갈비', 'マポ炭火カルビ', '麻浦炭火排骨', '서울 마포구 와우산로 0길 11', '16:00-24:00', '', 'Mon',
      { staff_pick: 'Order the marinated pork galbi — staff grill it at your table.', staff_name: 'Minji · Front desk', slots: 'dinner,night', price: '₩₩',
        desc_en: 'Charcoal-grilled Korean BBQ loved by locals after work. English menu with photos.', desc_ko: '퇴근길 현지인이 즐겨 찾는 숯불 고기집. 사진이 있는 영어 메뉴판을 갖추었습니다.' }),
    P('p02', 'cafe', 455, 430, 'Slowpour Coffee Lab', '슬로우푸어 커피랩', 'スローポア・コーヒーラボ', '慢滴咖啡实验室', '서울 마포구 어울마당로 0길 22', '08:00-21:00', '', '',
      { local_fav: 'Y', slots: 'morning,lunch', price: '₩', desc_en: 'Hand-drip specialty coffee and a quiet window bar. Great first stop of the day.', desc_ko: '핸드드립 스페셜티 커피와 조용한 창가 자리. 하루를 시작하기 좋은 곳.' }),
    P('p03', 'food', 600, 470, 'Hongdae Kalguksu House', '홍대 칼국수집', '弘大カルグクス', '弘大刀切面馆', '서울 마포구 홍익로 0길 7', '10:30-21:00', '15:00-17:00', 'Sun',
      { local_fav: 'Y', staff_pick: 'Hand-cut noodles in clam broth. Go before 12:00 to skip the line.', staff_name: 'Jun · Concierge', slots: 'lunch', price: '₩',
        desc_en: 'Hand-cut noodle soup made the same way for 20 years.', desc_ko: '20년째 같은 방식으로 만드는 손칼국수.' }),
    P('p04', 'night', 520, 615, 'Neon Alley Pocha', '네온골목 포차', 'ネオン路地ポチャ', '霓虹巷大排档', '서울 마포구 잔다리로 0길 5', '18:00-03:00', '', '',
      { slots: 'night', price: '₩₩', desc_en: 'Retro street-tent bar with spicy rice cakes and soju cocktails.', desc_ko: '떡볶이와 소주 칵테일을 즐기는 레트로 포장마차.' }),
    P('p05', 'beauty', 470, 520, 'K-Glow Beauty Lab', '케이글로우 뷰티랩', 'Kグロウ・ビューティーラボ', 'K光彩美妆实验室', '서울 마포구 양화로 0길 30', '11:00-22:00', '', '',
      { staff_pick: 'Skin test is free — staff speak English, Japanese and Chinese.', staff_name: 'Minji · Front desk', slots: 'lunch,dinner', price: '₩₩',
        desc_en: 'K-beauty select shop with a free skin-tone test bar.', desc_ko: '무료 피부 톤 테스트 바를 갖춘 K-뷰티 편집숍.' }),
    P('p06', 'shop', 575, 400, 'Wave Vinyl & Records', '웨이브 레코드', 'ウェーブ・レコード', '浪潮黑胶唱片', '서울 마포구 와우산로 0길 18', '12:00-21:00', '', 'Tue',
      { local_fav: 'Y', slots: 'lunch,dinner', price: '₩₩', desc_en: 'K-indie and city-pop vinyl, with listening booths.', desc_ko: '인디·시티팝 LP와 청음 부스가 있는 레코드숍.' }),
    P('p07', 'culture', 640, 520, 'Mural Street Walk', '홍대 벽화거리', '弘大壁画通り', '弘大壁画街', '서울 마포구 와우산로 0길 일대', '00:00-24:00', '', '',
      { slots: 'morning,lunch,dinner', price: 'Free', desc_en: 'Ever-changing street art along the hill. Best light before 10:00.', desc_ko: '언덕길을 따라 바뀌는 거리 벽화. 오전 10시 전 빛이 가장 좋습니다.' }),
    P('p08', 'cafe', 560, 330, 'Yeonnam Forest Bakery', '연남숲 베이커리', '延南の森ベーカリー', '延南森林面包店', '서울 마포구 동교로 0길 9', '07:30-19:00', '', 'Wed',
      { local_fav: 'Y', staff_pick: 'Salt bread comes out of the oven at 08:00 and 13:00.', staff_name: 'Jun · Concierge', slots: 'morning,lunch', price: '₩',
        desc_en: 'Neighborhood bakery facing the forest park.', desc_ko: '숲길이 보이는 동네 빵집.' }),
    P('p09', 'food', 430, 580, 'Bibim Table', '비빔테이블', 'ビビンテーブル', '拌饭餐桌', '서울 마포구 양화로 0길 41', '11:00-21:00', '15:30-17:00', '',
      { staff_pick: 'Vegetarian bibimbap on request — just show the card.', staff_name: 'Sora · Front desk', slots: 'lunch,dinner', price: '₩₩',
        desc_en: 'Seasonal bibimbap bowls and a vegetarian set.', desc_ko: '제철 비빔밥과 채식 메뉴.' }),
    P('p10', 'night', 495, 470, 'Rooftop 21 Bar', '루프탑21', 'ルーフトップ21', '屋顶21酒吧', '서울 마포구 어울마당로 0길 21, 7층', '19:00-02:00', '', '',
      { slots: 'night', price: '₩₩₩', desc_en: 'Highballs with a view over the Hongdae lights.', desc_ko: '홍대 야경을 내려다보는 하이볼 바.' }),
    P('p11', 'shop', 610, 560, 'Hongdae Free Market', '홍대 프리마켓', '弘大フリーマーケット', '弘大自由市场', '서울 마포구 와우산로 0길 놀이터 앞', '13:00-18:00', '', 'Mon,Tue,Wed,Thu,Fri,Sun',
      { local_fav: 'Y', slots: 'lunch', price: 'Free', desc_en: 'Saturday handmade market with local artists and live busking.', desc_ko: '토요일마다 열리는 수공예 마켓과 거리 공연.' }),
    P('p12', 'culture', 600, 380, 'Gyeongui Line Forest Park', '경의선숲길', '京義線森の道', '京义线林荫道', '서울 마포구 연남동 일대', '00:00-24:00', '', '',
      { staff_pick: 'Walk north for 15 minutes — cafés line both sides.', staff_name: 'Sora · Front desk', slots: 'morning,lunch,dinner', price: 'Free',
        desc_en: 'A 6 km park built over an old railway — perfect for a morning walk.', desc_ko: '옛 철길 위에 만든 공원. 아침 산책에 좋습니다.' }),
    P('p13', 'food', 525, 500, 'Seoul Street Toast', '서울 길거리 토스트', 'ソウル屋台トースト', '首尔街头吐司', '서울 마포구 와우산로 0길 3', '07:00-14:00', '', '',
      { local_fav: 'Y', slots: 'morning', price: '₩', desc_en: 'Egg-and-cabbage toast, made fresh in under 3 minutes.', desc_ko: '3분 만에 만들어 주는 계란 양배추 토스트.' }),
    P('p14', 'beauty', 420, 470, 'Mint Nail & Lash', '민트 네일', 'ミント・ネイル', '薄荷美甲', '서울 마포구 어울마당로 0길 14', '11:00-21:00', '', 'Sun',
      { slots: 'lunch,dinner', price: '₩₩', desc_en: 'Walk-in gel nails with K-pop inspired designs.', desc_ko: 'K-팝 스타일 디자인 젤네일, 예약 없이 방문 가능.' }),
    P('p15', 'cafe', 540, 640, 'Dessert 39', '디저트39', 'デザート39', '甜品39', '서울 마포구 잔다리로 0길 39', '12:00-23:00', '', '',
      { slots: 'lunch,dinner,night', price: '₩', desc_en: 'Bingsu shaved ice and strawberry cakes until late.', desc_ko: '늦은 밤까지 즐기는 빙수와 딸기 케이크.' }),
    P('p16', 'night', 470, 660, 'Live Club Riff', '라이브클럽 리프', 'ライブクラブ・リフ', '即兴现场俱乐部', '서울 마포구 잔다리로 0길 16, B1', '20:00-04:00', '', 'Mon,Tue,Wed',
      { local_fav: 'Y', slots: 'night', price: '₩₩', desc_en: 'Indie bands every night from Thursday to Sunday.', desc_ko: '목요일부터 일요일까지 매일 밤 인디 밴드 공연.' }),
    P('p17', 'shop', 445, 505, 'Hanji Paper & Stationery', '한지 문구점', '韓紙文具店', '韩纸文具店', '서울 마포구 홍익로 0길 25', '11:00-20:00', '', '',
      { slots: 'lunch,dinner', price: '₩', desc_en: 'Hand-made Korean paper goods — light, flat and easy to pack.', desc_ko: '가볍고 납작해 챙기기 쉬운 한지 소품.' }),
    P('p18', 'food', 160, 560, 'Mangwon Market Bites', '망원시장 먹거리', '望遠市場グルメ', '望远市场小吃', '서울 마포구 포은로 0길 (망원시장)', '10:00-20:00', '', '',
      { local_fav: 'Y', slots: 'lunch,dinner', price: '₩', desc_en: 'Fried chicken, croquettes and hotteok — a local market food crawl.', desc_ko: '닭강정·고로케·호떡까지, 동네 시장 먹거리 투어.' }),
    P('p19', 'culture', 170, 800, 'Mangwon Han River Park', '망원한강공원', '望遠漢江公園', '望远汉江公园', '서울 마포구 망원동 한강공원', '00:00-24:00', '', '',
      { staff_pick: 'Rent a bike and ride to the sunset — 25 minutes from the hotel.', staff_name: 'Jun · Concierge', slots: 'dinner', price: 'Free',
        desc_en: 'Riverside lawns, bike rental and convenience-store ramen by the water.', desc_ko: '강변 잔디밭과 자전거 대여, 물가에서 먹는 편의점 라면.' }),
    P('p20', 'food', 330, 640, 'Hapjeong Ramen Bar', '합정 라멘바', '合井ラーメンバー', '合井拉面吧', '서울 마포구 양화로 0길 8', '11:30-22:00', '15:00-17:00', '',
      { local_fav: 'Y', slots: 'lunch,dinner,night', price: '₩', desc_en: 'Rich pork-bone ramen with a Korean chili twist.', desc_ko: '고춧가루로 맛을 낸 진한 돈코츠 라멘.' }),
    /* 서울 전역 보기용 */
    { id: 's01', cat: 'food', name_en: 'Myeongdong Night Snacks', name_ko: '명동 야시장 먹거리', name_ja: '明洞ナイト屋台', name_zh: '明洞夜市小吃', address_ko: '서울 중구 명동 일대', lat: 37.5636, lng: 126.9850,
      hours: '16:00-23:00', break_time: '', closed_days: '', area: 'myeongdong', staff_pick: '', staff_name: '', local_fav: 'N', slots: 'dinner,night', price: '₩', desc_en: 'Street-food stalls along the shopping lanes every evening.', desc_ko: '매일 저녁 쇼핑 거리에 늘어서는 길거리 음식.', active: 'Y' },
    { id: 's02', cat: 'cafe', name_en: 'Seongsu Brick Café', name_ko: '성수 벽돌카페', name_ja: '聖水レンガカフェ', name_zh: '圣水砖墙咖啡', address_ko: '서울 성동구 성수동 일대', lat: 37.5445, lng: 127.0559,
      hours: '10:00-22:00', break_time: '', closed_days: '', area: 'seongsu', staff_pick: '', staff_name: '', local_fav: 'Y', slots: 'lunch,dinner', price: '₩₩', desc_en: 'A converted factory café in Seoul’s hippest district.', desc_ko: '공장을 개조한 성수동 카페.', active: 'Y' },
    { id: 's03', cat: 'food', name_en: 'Itaewon World Food Street', name_ko: '이태원 세계음식거리', name_ja: '梨泰院ワールドフード通り', name_zh: '梨泰院世界美食街', address_ko: '서울 용산구 이태원동 일대', lat: 37.5345, lng: 126.9946,
      hours: '11:00-24:00', break_time: '', closed_days: '', area: 'itaewon', staff_pick: '', staff_name: '', local_fav: 'N', slots: 'lunch,dinner,night', price: '₩₩', desc_en: 'Dozens of cuisines in one walkable street.', desc_ko: '세계 각국 음식이 모인 거리.', active: 'Y' },
    { id: 's04', cat: 'culture', name_en: 'Ikseon Hanok Alley', name_ko: '익선동 한옥거리', name_ja: '益善洞韓屋通り', name_zh: '益善洞韩屋街', address_ko: '서울 종로구 익선동 일대', lat: 37.5743, lng: 126.9898,
      hours: '00:00-24:00', break_time: '', closed_days: '', area: 'jongno', staff_pick: '', staff_name: '', local_fav: 'Y', slots: 'lunch,dinner', price: 'Free', desc_en: 'Narrow lanes of 1920s hanok houses turned into cafés and shops.', desc_ko: '1920년대 한옥이 카페와 상점으로 바뀐 골목.', active: 'Y' },
    { id: 's05', cat: 'shop', name_en: 'Gangnam Underground Mall', name_ko: '강남 지하상가', name_ja: '江南地下街', name_zh: '江南地下商街', address_ko: '서울 강남구 강남역 일대', lat: 37.4979, lng: 127.0276,
      hours: '10:00-22:00', break_time: '', closed_days: '', area: 'gangnam', staff_pick: '', staff_name: '', local_fav: 'N', slots: 'lunch,dinner', price: '₩', desc_en: 'Fashion and accessories under the busiest crossing in Seoul.', desc_ko: '강남역 지하의 패션·잡화 상가.', active: 'Y' }
  ];

  /* ---------- 쿠폰 (운영 시트 「쿠폰」 탭) — PIN은 시트에 없음, 서버 별도 보관 ---------- */
  var COUPONS = [
    { id: 'c01', place_id: 'p01', title_en: 'Free soda + 10% off', title_ko: '음료 1병 무료 + 10% 할인', daily_limit: 30, cond_en: 'Table of 2+ · dine-in', cond_ko: '2인 이상 · 매장 식사', active: 'Y' },
    { id: 'c02', place_id: 'p02', title_en: 'Free size-up on any drink', title_ko: '모든 음료 사이즈 업', daily_limit: 40, cond_en: '1 per order', cond_ko: '주문당 1회', active: 'Y' },
    { id: 'c03', place_id: 'p03', title_en: 'Free dumplings with 2 bowls', title_ko: '칼국수 2그릇 주문 시 만두 무료', daily_limit: 15, cond_en: 'Lunch only', cond_ko: '점심 시간 한정', active: 'Y' },
    { id: 'c04', place_id: 'p04', title_en: 'Free side dish', title_ko: '사이드 메뉴 1개 무료', daily_limit: 25, cond_en: 'Ages 19+ for drinks', cond_ko: '주류는 만 19세 이상', active: 'Y' },
    { id: 'c05', place_id: 'p05', title_en: '15% off + mask sheet set', title_ko: '15% 할인 + 마스크팩 세트', daily_limit: 20, cond_en: 'Purchase ₩30,000+', cond_ko: '30,000원 이상 구매', active: 'Y' },
    { id: 'c06', place_id: 'p08', title_en: 'Free Americano with any pastry', title_ko: '빵 구매 시 아메리카노 무료', daily_limit: 30, cond_en: 'Until 11:00', cond_ko: '오전 11시까지', active: 'Y' },
    { id: 'c07', place_id: 'p09', title_en: '10% off your bill', title_ko: '식사 금액 10% 할인', daily_limit: 30, cond_en: 'Dine-in', cond_ko: '매장 식사', active: 'Y' },
    { id: 'c08', place_id: 'p10', title_en: '2-for-1 highball 19:00–21:00', title_ko: '하이볼 1+1 (19~21시)', daily_limit: 20, cond_en: 'Ages 19+', cond_ko: '만 19세 이상', active: 'Y' },
    { id: 'c09', place_id: 'p14', title_en: '₩5,000 off gel nails', title_ko: '젤네일 5,000원 할인', daily_limit: 12, cond_en: 'Walk-in', cond_ko: '현장 방문', active: 'Y' },
    { id: 'c10', place_id: 'p17', title_en: 'Free postcard set', title_ko: '엽서 세트 증정', daily_limit: 10, cond_en: 'Any purchase', cond_ko: '구매 고객', active: 'Y' }
  ];
  /* 오늘 이미 다른 투숙객이 발급한 수량 (가상) */
  var SEED_ISSUED = { c01: 12, c02: 21, c03: 14, c04: 9, c05: 11, c06: 18, c07: 7, c08: 13, c09: 5, c10: 10 };
  /* 시연용 매장 직원 PIN — 실제 서비스에서는 서버에 해시로 보관 */
  var DEMO_PIN = { p01: '4821', p02: '1357', p03: '2468', p04: '9012', p05: '7350', p08: '5126', p09: '3804', p10: '6639', p14: '2591', p17: '8070', p15: '4410', p13: '1928' };

  /* ---------- 배너 (운영 시트 「배너」 탭) ---------- */
  var BANNERS = [
    { id: 'b01', advertiser: 'K-Glow Beauty Lab', place_id: 'p05', title_en: 'Glow up in Hongdae', sub_en: 'Free skin-tone test + mask set with your coupon', title_ko: '홍대에서 피부 톤 체크', sub_ko: '쿠폰으로 마스크팩 세트 증정', tone: 'pink', active: 'Y' },
    { id: 'b02', advertiser: 'Rooftop 21 Bar', place_id: 'p10', title_en: 'Sunset highballs, 2-for-1', sub_en: 'Every day 19:00–21:00 · 7 min walk', title_ko: '노을 하이볼 1+1', sub_ko: '매일 19~21시 · 도보 7분', tone: 'violet', active: 'Y' },
    { id: 'b03', advertiser: 'Mapo Charcoal Galbi', place_id: 'p01', title_en: 'Korean BBQ like a local', sub_en: 'English menu · free soda with coupon', title_ko: '현지인처럼 즐기는 숯불구이', sub_ko: '영어 메뉴 · 쿠폰으로 음료 무료', tone: 'coral', active: 'Y' },
    { id: 'b04', advertiser: 'Hanji Paper & Stationery', place_id: 'p17', title_en: 'Souvenirs that fly light', sub_en: 'Hand-made Korean paper goods', title_ko: '가볍게 챙기는 기념품', sub_ko: '손으로 만든 한지 소품', tone: 'teal', active: 'Y' }
  ];

  /* ---------- 룰렛 규칙표 (G0 승인 규칙의 시연판) ---------- */
  var ROULETTE = {
    tiers: [
      { id: 'gold', weight: 6, color: '#D9B66F' },
      { id: 'silver', weight: 22, color: '#CFDAD5' },
      { id: 'bronze', weight: 32, color: '#BA8865' },
      { id: 'welcome', weight: 40, color: '#A4C5B1' }
    ],
    /* 동반 형태별 상품 풀. adult: 주류 포함 상품 (18–24 연령대에는 제외) */
    pools: {
      solo:    { gold: ['r_g_bibim'], silver: ['r_s_coffee', 'r_s_record'], bronze: ['r_b_post', 'r_b_toast'] },
      couple:  { gold: ['r_g_rooftop', 'r_g_bibim'], silver: ['r_s_dessert', 'r_s_coffee'], bronze: ['r_b_post'] },
      friends: { gold: ['r_g_pocha', 'r_g_rooftop'], silver: ['r_s_dessert', 'r_s_nail'], bronze: ['r_b_toast', 'r_b_post'] },
      family:  { gold: ['r_g_bibim'], silver: ['r_s_dessert'], bronze: ['r_b_toast', 'r_b_post'] }
    },
    prizes: {
      r_g_bibim:   { place_id: 'p09', title_en: 'Free bibimbap set for one', title_ko: '비빔밥 세트 1인 무료', limit: 3, adult: false },
      r_g_rooftop: { place_id: 'p10', title_en: 'Two free signature highballs', title_ko: '시그니처 하이볼 2잔 무료', limit: 3, adult: true },
      r_g_pocha:   { place_id: 'p04', title_en: 'Free sharing platter', title_ko: '모둠 안주 무료', limit: 2, adult: true },
      r_s_coffee:  { place_id: 'p02', title_en: 'Free hand-drip coffee', title_ko: '핸드드립 커피 무료', limit: 10, adult: false },
      r_s_record:  { place_id: 'p06', title_en: '₩10,000 off any LP', title_ko: 'LP 10,000원 할인', limit: 5, adult: false },
      r_s_dessert: { place_id: 'p15', title_en: 'Free mini bingsu', title_ko: '미니 빙수 무료', limit: 8, adult: false },
      r_s_nail:    { place_id: 'p14', title_en: 'Free nail art on 2 fingers', title_ko: '네일아트 2개 무료', limit: 6, adult: false },
      r_b_post:    { place_id: 'p17', title_en: 'Free Hanji bookmark', title_ko: '한지 책갈피 증정', limit: 30, adult: false },
      r_b_toast:   { place_id: 'p13', title_en: 'Free drink with any toast', title_ko: '토스트 주문 시 음료 무료', limit: 30, adult: false },
      r_w_welcome: { place_id: 'p13', title_en: 'Welcome pass: 10% off at Seoul Street Toast', title_ko: '웰컴 혜택: 서울 길거리 토스트 10% 할인', limit: 0, adult: false }
    },
    /* 오늘 이미 소진된 수량 (가상) — 금상은 대부분 소진 상태 */
    seedUsed: { r_g_bibim: 3, r_g_rooftop: 2, r_g_pocha: 2, r_s_coffee: 4, r_s_record: 1, r_s_dessert: 5, r_s_nail: 2, r_b_post: 9, r_b_toast: 11 }
  };

  var NATIONS = [
    { id: 'US', en: 'United States', ko: '미국' }, { id: 'JP', en: 'Japan', ko: '일본' }, { id: 'CN', en: 'China', ko: '중국' },
    { id: 'TW', en: 'Taiwan', ko: '대만' }, { id: 'HK', en: 'Hong Kong', ko: '홍콩' }, { id: 'SG', en: 'Singapore', ko: '싱가포르' },
    { id: 'TH', en: 'Thailand', ko: '태국' }, { id: 'VN', en: 'Vietnam', ko: '베트남' }, { id: 'PH', en: 'Philippines', ko: '필리핀' },
    { id: 'GB', en: 'United Kingdom', ko: '영국' }, { id: 'FR', en: 'France', ko: '프랑스' }, { id: 'DE', en: 'Germany', ko: '독일' },
    { id: 'AU', en: 'Australia', ko: '호주' }, { id: 'CA', en: 'Canada', ko: '캐나다' }, { id: 'XX', en: 'Other', ko: '기타' }
  ];

  /* ---------- 지하철 (시연 데이터: 약 300역 중 44역) ---------- */
  var LINES = [
    { id: '1', color: '#0052A4' }, { id: '2', color: '#00A84D' }, { id: '3', color: '#EF7C1C' }, { id: '4', color: '#00A5DE' },
    { id: '5', color: '#996CAC' }, { id: '6', color: '#CD7C2F' }, { id: 'A', color: '#0090D2' }, { id: 'K', color: '#77C4A3' }
  ];
  function S(id, en, ko, ja, zh, lines, x, y) { return { id: id, en: en, ko: ko, ja: ja, zh: zh, lines: lines, x: x, y: y }; }
  var STATIONS = [
    S('239', 'Hongik Univ.', '홍대입구', '弘大入口', '弘大入口', ['2', 'A', 'K'], 250, 330),
    S('238', 'Hapjeong', '합정', '合井', '合井', ['2', '6'], 250, 430),
    S('237', 'Dangsan', '당산', '堂山', '堂山', ['2'], 250, 560),
    S('236', 'Yeongdeungpo-gu Office', '영등포구청', '永登浦区庁', '永登浦区厅', ['2', '5'], 300, 640),
    S('234', 'Sindorim', '신도림', '新道林', '新道林', ['1', '2'], 360, 700),
    S('232', 'Guro Digital Complex', '구로디지털단지', '九老デジタル団地', '九老数码园区', ['2'], 440, 760),
    S('230', 'Sillim', '신림', '新林', '新林', ['2'], 530, 790),
    S('226', 'Sadang', '사당', '舎堂', '舍堂', ['2', '4'], 650, 790),
    S('223', 'Seoul Nat’l Univ. of Education', '교대', '教大', '教大', ['2', '3'], 760, 790),
    S('222', 'Gangnam', '강남', '江南', '江南', ['2'], 840, 790),
    S('221', 'Yeoksam', '역삼', '駅三', '驿三', ['2'], 910, 790),
    S('220', 'Seolleung', '선릉', '宣陵', '宣陵', ['2'], 980, 780),
    S('219', 'Samseong', '삼성', '三成', '三成', ['2'], 1040, 750),
    S('216', 'Jamsil', '잠실', '蚕室', '蚕室', ['2'], 1110, 690),
    S('212', 'Konkuk Univ.', '건대입구', '建大入口', '建大入口', ['2'], 1110, 560),
    S('211', 'Seongsu', '성수', '聖水', '圣水', ['2'], 1080, 470),
    S('208', 'Wangsimni', '왕십리', '往十里', '往十里', ['2', '5', 'K'], 1010, 380),
    S('206', 'Sindang', '신당', '新堂', '新堂', ['2', '6'], 930, 330),
    S('205', 'Dongdaemun History & Culture Park', '동대문역사문화공원', '東大門歴史文化公園', '东大门历史文化公园', ['2', '4', '5'], 850, 330),
    S('203', 'Euljiro 3(sam)-ga', '을지로3가', '乙支路3街', '乙支路3街', ['2', '3'], 720, 330),
    S('202', 'Euljiro 1(il)-ga', '을지로입구', '乙支路入口', '乙支路入口', ['2'], 640, 330),
    S('201', 'City Hall', '시청', '市庁', '市厅', ['1', '2'], 560, 330),
    S('243', 'Chungjeongno', '충정로', '忠正路', '忠正路', ['2', '5'], 470, 330),
    S('242', 'Ahyeon', '아현', '阿峴', '阿岘', ['2'], 410, 330),
    S('241', 'Ewha Womans Univ.', '이대', '梨大', '梨大', ['2'], 360, 330),
    S('240', 'Sinchon', '신촌', '新村', '新村', ['2'], 305, 330),
    S('A01', 'Incheon Int’l Airport T1', '인천공항1터미널', '仁川空港第1ターミナル', '仁川机场1号航站楼', ['A'], 40, 560),
    S('A06', 'Gimpo Int’l Airport', '김포공항', '金浦空港', '金浦机场', ['A', '5'], 100, 430),
    S('A08', 'Digital Media City', '디지털미디어시티', 'デジタルメディアシティ', '数码媒体城', ['A', '6', 'K'], 170, 260),
    S('A10', 'Gongdeok', '공덕', '孔徳', '孔德', ['A', '5', '6', 'K'], 400, 450),
    S('133', 'Seoul Station', '서울역', 'ソウル駅', '首尔站', ['1', '4', 'A', 'K'], 520, 450),
    S('425', 'Hoehyeon', '회현', '会賢', '会贤', ['4'], 600, 450),
    S('424', 'Myeong-dong', '명동', '明洞', '明洞', ['4'], 660, 420),
    S('423', 'Chungmuro', '충무로', '忠武路', '忠武路', ['3', '4'], 730, 400),
    S('327', 'Gyeongbokgung', '경복궁', '景福宮', '景福宫', ['3'], 600, 170),
    S('328', 'Anguk', '안국', '安国', '安国', ['3'], 660, 200),
    S('329', 'Jongno 3(sam)-ga', '종로3가', '鍾路3街', '钟路3街', ['1', '3', '5'], 700, 260),
    S('130', 'Jonggak', '종각', '鐘閣', '钟阁', ['1'], 640, 260),
    S('623', 'Mangwon', '망원', '望遠', '望远', ['6'], 180, 400),
    S('624', 'Sangsu', '상수', '上水', '上水', ['6'], 300, 470),
    S('625', 'Gwangheungchang', '광흥창', '広興倉', '广兴仓', ['6'], 350, 500),
    S('630', 'Itaewon', '이태원', '梨泰院', '梨泰院', ['6'], 680, 560),
    S('K24', 'Gajwa', '가좌', '加佐', '加佐', ['K'], 210, 300),
    S('634', 'Yaksu', '약수', '薬水', '药水', ['3', '6'], 860, 420)
  ];
  /* 노선도 선형 (시연용 단순화 노선도) */
  var LINE_PATHS = {
    '2': ['239', '240', '241', '242', '243', '201', '202', '203', '205', '206', '208', '211', '212', '216', '219', '220', '221', '222', '223', '226', '230', '232', '234', '236', '237', '238', '239'],
    'A': ['A01', 'A06', 'A08', '239', 'A10', '133'],
    'K': ['A08', 'K24', '239', 'A10', '133'],
    '6': ['A08', '623', '238', '624', '625', 'A10', '630', '634', '206'],
    '4': ['226', '133', '425', '424', '423', '205'],
    '3': ['327', '328', '329', '203', '423', '634', '223'],
    '5': ['A06', '236', 'A10', '243', '329', '205', '208'],
    '1': ['234', '133', '201', '130', '329']
  };

  /* ---------- 운영 지표 (가상 이력) ---------- */
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  var NAT_W = { US: 14, JP: 18, CN: 15, TW: 9, HK: 4, SG: 6, TH: 6, VN: 4, PH: 3, GB: 4, FR: 3, DE: 3, AU: 4, CA: 2, XX: 3 };
  var HOUR_W = [2, 1, 1, 0, 0, 0, 1, 3, 6, 8, 9, 8, 7, 6, 5, 5, 6, 7, 9, 10, 9, 7, 5, 3];
  var HOTEL_SCALE = { HDL01: 1, YNL02: 0.62, HPJ04: 0.85, SGS05: 0.4 };

  function buildHistory(days) {
    var out = [];
    var codes = Object.keys(HOTEL_SCALE);
    for (var d = days; d >= 1; d--) {
      codes.forEach(function (code, ci) {
        var r = rng(d * 97 + ci * 7919 + 13);
        var sc = HOTEL_SCALE[code];
        var target = Math.round((62 + r() * 30) * sc);
        var delivered = Math.round(target * (0.82 + r() * 0.14));
        var recorded = !(code === 'HPJ04' && (d % 5 === 0 || d < 3)); /* 일부 날짜 배포 기록 누락 */
        var qr = Math.round(delivered * (0.31 + r() * 0.16));
        var issued = Math.round(qr * (0.55 + r() * 0.18));
        var redeemed = Math.round(issued * (0.34 + r() * 0.17));
        var amountN = Math.round(redeemed * (0.55 + r() * 0.2));
        var amount = Math.round(amountN * (16000 + r() * 14000) / 100) * 100;
        var imp = Math.round(qr * (5.2 + r() * 2.4));
        var clk = Math.round(imp * (0.032 + r() * 0.03));
        out.push({ day: d, hotel: code, target: recorded ? target : null, delivered: recorded ? delivered : null, qr: qr, issued: issued, redeemed: redeemed, amount: amount, amountN: amountN, imp: imp, clk: clk });
      });
    }
    return out;
  }

  window.RD = {
    /* 표시 이미지와 오프라인 저장 목록이 같은 자산 목록을 사용합니다. */
    PHOTOS: ['seoul-v2', 'hotel-v2', 'hotel-room-v2', 'hotel-exterior-v2', 'cafe-v2', 'dining-v2', 'restaurant-v2', 'shop-v2', 'beauty-v2', 'night-v2', 'park-v2', 'noodles-v2', 'market-v2', 'vinyl-v2', 'cosmetics-v2', 'river-v2', 'hanok-v2'],
    BASE: BASE, UNIT: UNIT, M_LAT: M_LAT, M_LNG: M_LNG,
    CATS: CATS, HOTELS: HOTELS, PLACES: PLACES, COUPONS: COUPONS, BANNERS: BANNERS,
    SEED_ISSUED: SEED_ISSUED, DEMO_PIN: DEMO_PIN, ROULETTE: ROULETTE, NATIONS: NATIONS,
    LINES: LINES, STATIONS: STATIONS, LINE_PATHS: LINE_PATHS,
    NAT_W: NAT_W, HOUR_W: HOUR_W, HISTORY: buildHistory(14), rng: rng,
    AGES: ['18-24', '25-34', '35-44', '45-54', '55+'],
    COMPANIONS: ['solo', 'couple', 'friends', 'family'],
    GENDERS: ['female', 'male', 'other', 'na'],
    OPS_ACCOUNTS: [
      { id: 'pm', label: '서비스 운영 PM', email: 'pm@demo.roamly', password: 'roamly2026', role: 'PM · 전체 호텔' },
      { id: 'ad', label: '광고 리포트 담당', email: 'ads@demo.roamly', password: 'ads2026', role: '리포트 조회' }
    ],
    SHEET_COLS: {
      hotels: ['code', 'status', 'name_en', 'name_ko', 'address_ko', 'lat', 'lng', 'phone', 'checkin', 'checkout', 'wifi_ssid', 'breakfast_hours', 'bar_hours', 'perks'],
      places: ['id', 'cat', 'name_en', 'name_ko', 'address_ko', 'lat', 'lng', 'hours', 'break_time', 'closed_days', 'local_fav', 'active'],
      coupons: ['id', 'place_id', 'title_en', 'title_ko', 'daily_limit', 'cond_en', 'active'],
      banners: ['id', 'advertiser', 'place_id', 'title_en', 'sub_en', 'tone', 'active']
    }
  };
})();
