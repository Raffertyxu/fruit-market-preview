/* Fruit shop website mockup, v3.
 * The home view ports the live storefront (fruit/index.html + fruit/app.js) with
 * static products instead of the 1SHOP API; the scroll / swipe / wheel behaviour
 * is kept identical. Other views extend the live theme (site-theme.css).
 * Nothing here talks to a server: the basket lives in sessionStorage only.
 */
(() => {
  'use strict';

  // ---------- helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = n => Number(n || 0).toLocaleString('zh-TW');
  const money = n => 'NT$ ' + num(n);
  const price = (n, cls = '') => '<span class="price ' + cls + '"><span class="cur">NT$</span><span class="amt">' + num(n) + '</span></span>';
  const pad = n => String(n).padStart(2, '0');
  const ART = new Set(Array.isArray(window.ART_AVAILABLE) ? window.ART_AVAILABLE : []);

  const FREE_SHIP = 3000; // placeholder threshold (needs client confirmation)
  const SHIP_FEE = 200;   // placeholder chilled-delivery fee

  // ---------- data (all placeholder; marked on screen) ----------
  const SHIP_LINE = '冷藏宅配，付款後 3–5 個工作天出貨；運費 NT$ 200，滿 NT$ 3,000 免運。';
  const PRODUCTS = [
    { slug: 'muscat', name: '麝香葡萄（綠）', en: 'MUSCAT GRAPE', mark: '價格示意・品種推測', variety: '推測為 Shine Muscat 類的綠色大粒葡萄', season: '8–10 月', desc: '翠綠大粒、皮薄，可以連皮吃。每串套上網套後裝盒出貨。',
      specs: [{ id: '1', label: '單串禮盒', price: 1280 }, { id: '2', label: '雙串裝', price: 2380 }, { id: '6', label: '六串整箱', price: 6680 }],
      storage: '整串裝袋冷藏，約可放 5–7 天；吃之前再剪下沖洗。', eat: '冰涼後連皮直接吃；也可以對半切，放在優格或蛋糕上。',
      ripe: '果粒飽滿、梗還是綠的最新鮮。', cut: '用剪刀從梗剪下，保留一點小梗比較不會破皮。' },
    { slug: 'apple', name: '蘋果', en: 'APPLE', mark: '價格示意・品種推測', variety: '推測為富士系蘋果', season: '10 月–隔年 1 月', desc: '在樹上慢慢著色的蘋果，比拳頭還大一圈，清脆多汁。',
      specs: [{ id: '6', label: '6 入盒', price: 980 }, { id: '12', label: '12 入箱', price: 1780 }],
      storage: '每顆裝袋冷藏，可放 2–3 週；和其他水果分開放。', eat: '洗淨連皮切片最脆；也可以烤成蘋果派或煮成果醬。',
      ripe: '拿起來沉手、敲起來聲音清脆；底部轉黃代表成熟。', cut: '切成四瓣去芯，泡一下淡鹽水比較不會變色。' },
    { slug: 'peach', name: '水蜜桃', en: 'WHITE PEACH', mark: '價格示意・品種推測', variety: '推測為白肉水蜜桃系', season: '7–9 月', desc: '每顆都套著白色網套，軟嫩多汁，是夏天的味道。',
      specs: [{ id: '6', label: '6 入禮盒', price: 1680 }, { id: '11', label: '11 入家庭箱', price: 2680 }, { id: '15', label: '15 入整箱', price: 3380 }],
      storage: '常溫放 1–2 天等果香出來，再冷藏 1–2 小時就能吃。', eat: '沿中線劃一圈、扭開去籽；冰過後切塊最好吃。',
      ripe: '果香明顯、輕捏果肩略有彈性就熟了；硬的先放常溫。', cut: '沿縫線劃一圈到籽，雙手反向扭開，再切瓣。' },
    { slug: 'orange', name: '香甜柑橘', en: 'MANDARIN', mark: '價格示意・品種待確認', variety: '品種待確認', season: '11 月–隔年 2 月', desc: '果皮薄、好剝，酸甜剛好，冬天放在桌上隨手一顆。',
      specs: [{ id: 'bag', label: '分享袋', price: 480 }, { id: 'box', label: '家庭箱', price: 980 }],
      storage: '通風陰涼處可放約一週；想放久一點就裝袋冷藏。', eat: '直接剝皮吃；果皮洗淨曬乾也能泡茶。',
      ripe: '果皮顏色均勻、拿起來沉手。', cut: '從蒂頭對面剝開，比較好剝。' },
    { slug: 'cherry', name: '山形櫻桃', en: 'CHERRY', mark: '價格示意・產地依箱印推斷', variety: '推測為日系紅黃色櫻桃；「山形」依箱印推斷', season: '6–7 月', desc: '紅中帶黃、帶著長梗，初夏只有短短幾週。',
      specs: [{ id: '1', label: '單盒', price: 1080 }, { id: '2', label: '雙盒', price: 1980 }],
      storage: '不要洗，冷藏保存，3–4 天內吃完。', eat: '吃之前用冷水快速沖洗，拿著梗直接吃。',
      ripe: '果梗翠綠、果皮有光澤；梗變褐色代表放比較久了。', cut: '直接吃；做甜點時可用吸管從蒂頭推出籽。' },
    { slug: 'pear', name: '梨', en: 'JAPANESE PEAR', mark: '價格示意・品種推測', variety: '推測為和梨（赤梨系）', season: '8–10 月', desc: '網室棚架下長大的大顆梨，果肉細、汁多。',
      specs: [{ id: '4', label: '4 入盒', price: 1280 }, { id: '8', label: '8 入箱', price: 2380 }],
      storage: '用紙包好、裝袋冷藏，約可放 1–2 週。', eat: '冰過後削皮切瓣，汁水最多；也可以燉成梨湯。',
      ripe: '果皮轉成均勻的黃褐色、有香氣即可。', cut: '削皮後縱切成瓣，再去掉果芯。' },
    { slug: 'strawberry', name: '草莓', en: 'STRAWBERRY', mark: '價格示意・品種待確認', variety: '品種待確認', season: '12 月–隔年 4 月', desc: '一顆一顆放在軟墊裡的大顆草莓，冬天限定。',
      specs: [{ id: '1', label: '單盒（10 入）', price: 980 }, { id: '2', label: '雙盒', price: 1880 }],
      storage: '不要洗，原盒冷藏，2–3 天內吃完最好。', eat: '吃之前帶蒂沖洗再去蒂；也很適合搭配鮮奶油。',
      ripe: '整顆紅到蒂頭、有光澤、香氣甜。', cut: '帶蒂沖洗、擦乾後再去蒂，可以對半切。' },
    { slug: 'black-grape', name: '黑葡萄', en: 'BLACK GRAPE', mark: '價格示意・品種推測', variety: '推測為巨峰系黑色大粒葡萄', season: '8–10 月', desc: '果粉飽滿、香氣濃，每串裝袋後套上淡紫色網套。',
      specs: [{ id: '2', label: '雙串禮盒', price: 1580 }, { id: '8', label: '八串整箱', price: 5680 }],
      storage: '果粉是天然的保護，冷藏前不要清洗，約可放 5 天。', eat: '冰鎮後剝皮吃；果皮香氣足，也適合打成果汁。',
      ripe: '果粉越完整越新鮮。', cut: '用剪刀一粒一粒剪下，留一點小梗。' }
  ];
  const BY_SLUG = Object.fromEntries(PRODUCTS.map(p => [p.slug, p]));
  const minPrice = p => Math.min(...p.specs.map(s => s.price));
  const maxPrice = p => Math.max(...p.specs.map(s => s.price));

  // ---------- watercolour or pencil placeholder ----------
  // Pencil outlines (viewBox 0 0 200 200) shown until the watercolour is delivered.
  const leaf = (x, y) => 'M' + x + ' ' + y + 'c12 -14 34 -18 50 -10c-12 14 -34 18 -50 10z M' + (x + 2) + ' ' + (y - 1) + 'c14 -6 30 -9 46 -9';
  const grapeCluster = () => [[76, 72], [100, 68], [124, 72], [64, 96], [88, 94], [112, 94], [136, 96], [76, 119], [100, 119], [124, 119], [88, 142], [112, 142], [100, 164]]
    .map(([x, y]) => 'M' + (x + 13) + ' ' + y + 'a13 13 0 1 1 -26 0a13 13 0 1 1 26 0').join(' ');
  const SKETCH = {
    peach: ['M100 54C62 40 34 72 38 112C42 150 72 172 100 170C130 172 160 150 162 112C166 72 138 40 100 54Z', 'M100 56C91 92 94 132 104 168', leaf(102, 52)],
    cherry: ['M101 140a29 29 0 1 1 -58 0a29 29 0 1 1 58 0', 'M160 148a27 27 0 1 1 -54 0a27 27 0 1 1 54 0', 'M74 111C82 82 98 54 118 34', 'M132 121C130 90 124 60 118 34', leaf(118, 34)],
    strawberry: ['M100 62C60 58 40 82 46 110C52 140 80 168 100 178C120 168 148 140 154 110C160 82 140 58 100 62Z', 'M68 66L84 52L94 64L100 44L106 64L116 52L132 66', 'M82 96l1 4M118 96l1 4M100 112l1 4M74 124l1 4M126 124l1 4M90 140l1 4M112 140l1 4M100 158l1 4'],
    pear: ['M100 42C88 42 84 58 84 74C84 94 58 108 56 138C54 166 78 182 100 182C122 182 146 166 144 138C142 108 116 94 116 74C116 58 112 42 100 42Z', 'M100 42C100 32 104 22 110 16', leaf(104, 30)],
    'black-grape': [grapeCluster(), 'M100 55C100 44 104 34 112 26', leaf(112, 30)],
    muscat: [grapeCluster(), 'M100 55C100 44 104 34 112 26', leaf(112, 30)],
    apple: ['M100 66C78 50 42 58 40 100C38 140 66 176 100 166C134 176 162 140 160 100C158 58 122 50 100 66Z', 'M100 66C100 52 102 40 108 30', leaf(106, 44)],
    orange: ['M162 112a62 62 0 1 1 -124 0a62 62 0 1 1 124 0', 'M100 50l0 6', leaf(100, 52)]
  };
  function sketch(slug) {
    const d = (SKETCH[slug] || ['M162 110a62 62 0 1 1 -124 0a62 62 0 1 1 124 0']).join(' ');
    return '<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false"><path class="pencil" filter="url(#pencil-wobble)" d="' + d + '"/><path class="pencil-2" transform="translate(1.6 1.2) rotate(.6 100 100)" d="' + d + '"/></svg>';
  }
  // mode: 'bare' (img or outline only) | 'card' | 'stage' | 'small'
  function art(slug, mode = 'bare', lazy = false) {
    const p = BY_SLUG[slug];
    const name = p ? p.name : slug;
    if (ART.has(slug)) return '<img src="img/art/' + esc(slug) + '.webp" alt="' + esc(name) + '水彩插畫" draggable="false"' + '>';
    const ph = '<span class="art-ph" role="img" aria-label="' + esc(name) + '（水彩插畫繪製中）">' + sketch(slug) + '</span>';
    if (mode === 'bare') return ph;
    return '<span class="art-wip is-' + mode + '">' + ph + '<span class="wip-name" aria-hidden="true">' + esc(name) + '</span><span class="wip-note">水彩插畫繪製中</span></span>';
  }

  // ---------- basket state (sessionStorage only) ----------
  const STORE = 'fm-mockup-basket-v3';
  let basket = [];
  try { basket = JSON.parse(sessionStorage.getItem(STORE) || '[]').filter(l => BY_SLUG[l.slug] && BY_SLUG[l.slug].specs.some(s => s.id === l.spec) && l.qty > 0); } catch { basket = []; }
  const saveBasket = () => { try { sessionStorage.setItem(STORE, JSON.stringify(basket)); } catch { /* storage may be unavailable */ } };
  const specOf = l => BY_SLUG[l.slug].specs.find(s => s.id === l.spec);
  const basketCount = () => basket.reduce((n, l) => n + l.qty, 0);
  const basketTotal = () => basket.reduce((n, l) => n + specOf(l).price * l.qty, 0);
  function addToBasket(slug, spec, qty) {
    const line = basket.find(l => l.slug === slug && l.spec === spec);
    if (line) line.qty = Math.min(99, line.qty + qty); else basket.push({ slug, spec, qty });
    saveBasket(); renderBasket();
  }
  function setQty(slug, spec, qty) {
    const line = basket.find(l => l.slug === slug && l.spec === spec);
    if (!line) return;
    if (qty <= 0) basket = basket.filter(l => l !== line); else line.qty = Math.min(99, qty);
    saveBasket(); renderBasket();
  }

  let toastTimer;
  function toast(text) { clearTimeout(toastTimer); $('#toast').textContent = text; toastTimer = setTimeout(() => { $('#toast').textContent = ''; }, 4000); }

  // =====================================================================
  // HOME — behaviour ported from the live fruit/app.js; v6 shop-front stage (storyboard-s0.md)
  // =====================================================================
  const root = $('#fruit-market');
  const H = s => root.querySelector(s);
  const fruits = PRODUCTS;
  let current = 0, busy = false, lastWheel = 0, wheelSum = 0;
  let motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let noticeTimer;
  const notice = text => { clearTimeout(noticeTimer); H('#status').textContent = text; noticeTimer = setTimeout(() => { H('#status').textContent = ''; }, 4000); };
  const homeActive = () => !root.hidden;
  const blocked = () => H('#cart-dialog').open || $('#menu').open;
  const stage = H('#s0-stage');
  // A product name's parenthetical ("（綠）") is set small on the stage; the dial and the index use the short form.
  const shortName = n => String(n).replace(/（[^）]*）/g, '').trim() || String(n);
  const nameHTML = n => esc(n).replace(/（([^）]*)）/g, '<small>（$1）</small>');
  // A rolling number: one 0-9 strip per digit, moved by --n (CSS transition); the value is in a screen-reader span.
  const DIGITS = '<span>' + [...'0123456789'].join('<br>') + '</span>';
  function odo(el, n, len = 2) {
    if (!el) return;
    const s = String(n).padStart(len, '0');
    if (el.dataset.len !== String(s.length)) { el.dataset.len = s.length; el.innerHTML = '<span class="sr-only"></span>' + [...s].map(() => '<span class="s0-dg" aria-hidden="true">' + DIGITS + '</span>').join(''); }
    el.firstChild.textContent = s;
    [...s].forEach((c, i) => el.children[i + 1].firstChild.style.setProperty('--n', c));
  }
  function setBuy(text, disabled) { H('#buy').disabled = disabled; H('.s0-buy-t').textContent = text; }

  // =====================================================================
  // S0 v6 shop front「今日選果」(storyboard-s0.md). The scroll / swipe / key behaviour and the hand-over are
  // ported unchanged from the live fruit/app.js; the stage is rebuilt in the magazine's language:
  // back (colour wash + outline number), mid (the watercolour), front (blurred neighbours), the arc dial,
  // the copy column, the index row and the basket. Everything is read from PRODUCTS (later the 1SHOP feed).
  // One switch is one camera move of ~1.1 s: the old fruit dollies back out of focus, the new one comes in
  // from the foreground and racks to sharp (0.25 s overlap, never both sharp); neighbours sweep past at
  // 1.5x; the copy leaves upward before the new copy rises (no overlapping words); numbers roll; the
  // wash cross-fades; the dial turns; the index line slides. Reduced motion / motion off / no GSAP:
  // a 0.3 s cross-fade.
  // =====================================================================
  const S0 = (() => {
    const STEP = 18; // degrees between two fruits on the dial (the live dialTurn step)
    const float = H('.s0-float'), ring = H('.s0-ring'), marks = H('.s0-marks'), washes = $$('.s0-wash', root);
    const near = { prev: H('.s0-nb.is-prev'), next: H('.s0-nb.is-next') };
    const FIELDS = [
      { el: H('#fruit-title .s0-in'), html: f => nameHTML(f.name), name: true },
      { el: H('#fruit-en'), html: f => esc(f.en || '') },
      { el: H('#fruit-description'), html: f => esc(f.desc) },
      { el: H('.s0-price .s0-in'), html: f => '<small>NT$</small><span id="fruit-price">' + num(f.specs[0].price) + '</span>' },
      { el: H('#catalog-note'), html: f => esc(f.specs[0].label) + '<i>　·　' + esc(f.mark) + '</i>' }
    ];
    let heroCur = null, washOn = 0, dialPos = 0, dialTw = null, geo = null, dots = [], labs = [], items = [];
    const outgoing = new Set();
    const vwPx = () => innerWidth / 100;
    const mob = () => innerWidth < 760;
    const live = () => fullMotion() && libs();
    // Focus is racked by cross-fading each watercolour with its registered out-of-focus copy (img/art/soft, built by
    // build_images.py): --f 1 = sharp, 0 = soft. A live CSS blur on a 400-540px layer cost 100-200 ms frames in testing.
    const softArt = slug => 'img/art/soft/' + slug + '.webp';
    const neighbours = k => ({ prev: k > 0 ? fruits[k - 1].slug : null, next: k < fruits.length - 1 ? fruits[k + 1].slug : null });
    function slot(slug) {
      const s = document.createElement('div'), p = BY_SLUG[slug];
      s.className = 's0-slot'; s.dataset.slug = slug;
      s.innerHTML = ART.has(slug) ? '<img class="s0-soft" src="' + softArt(slug) + '" alt="" draggable="false" decoding="async"><img class="s0-sharp" src="img/art/' + esc(slug) + '.webp" alt="' + esc(p ? p.name : slug) + '水彩插畫" draggable="false" decoding="async">' : art(slug);
      return s;
    }
    function nbImg(slug) {
      if (!slug || !ART.has(slug)) return null;
      const i = new Image(); i.className = 's0-nbi'; i.alt = ''; i.draggable = false; i.decoding = 'async'; i.src = softArt(slug); // pre-blurred: no live filter
      return i;
    }
    // index row + dial marks (built once from the product list)
    function build() {
      const thumb = f => '<span class="s0-thumb" aria-hidden="true">' + (ART.has(f.slug) ? '<img src="img/art/' + esc(f.slug) + '.webp" alt="" loading="lazy" decoding="async" draggable="false">' : sketch(f.slug)) + '</span>';
      H('#wheel').innerHTML = '<div class="s0-row">' + fruits.map((f, i) => (i ? '<i class="s0-link" aria-hidden="true"></i>' : '') +
        '<button type="button" class="s0-ix" data-fruit="' + i + '" id="wheel-' + esc(f.slug) + '" aria-label="選擇' + esc(f.name) + '"><b>' + pad(i + 1) + '</b><span>' + esc(shortName(f.name)) + '</span>' + thumb(f) + '</button>').join('') +
        '<i class="s0-prog" aria-hidden="true"><i></i><b></b></i></div>';
      marks.innerHTML = fruits.map((f, i) => '<i class="s0-dot"></i><span class="s0-lab" data-pick="' + i + '">' + esc(shortName(f.name)) + '</span>').join('');
      H('#s0-of').textContent = '/ ' + pad(fruits.length);
      dots = $$('.s0-dot', marks); labs = $$('.s0-lab', marks); items = $$('.s0-ix', root);
    }
    // ----- the dial: the ring turns STEP degrees per fruit; dots and names ride on it, names stay upright -----
    function measure() { const r = ring.offsetWidth / 2; geo = r > 0 ? { r, cx: ring.offsetLeft + r, cy: ring.offsetTop + r } : null; }
    function dial(pos) {
      dialPos = pos;
      if (!geo) measure();
      if (!geo) return;
      ring.style.transform = 'rotate(' + (-pos * STEP).toFixed(3) + 'deg)';
      for (let i = 0; i < dots.length; i++) {
        const a = (i - pos) * STEP * Math.PI / 180, x = (geo.cx + geo.r * Math.cos(a)).toFixed(1), y = (geo.cy + geo.r * Math.sin(a)).toFixed(1), d = Math.abs(i - pos);
        dots[i].style.transform = 'translate(' + x + 'px,' + y + 'px)';
        dots[i].classList.toggle('is-on', d < .5);
        const o = Math.max(0, 1 - d * .64);
        labs[i].style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-100%,-50%)';
        labs[i].style.opacity = o.toFixed(3);
        labs[i].style.visibility = o > 0 ? '' : 'hidden';
        labs[i].classList.toggle('is-on', d < .5);
      }
    }
    // ----- the index row: current item, progress line to its centre -----
    function index(k) {
      items.forEach((b, i) => b.setAttribute('aria-current', String(i === k)));
      const b = items[k], row = b && b.parentElement, prog = row && row.querySelector('.s0-prog');
      if (!prog || !row.offsetWidth) return;
      const c = b.offsetLeft + b.offsetWidth / 2;
      prog.style.setProperty('--p', (c / row.offsetWidth).toFixed(4));
      prog.style.setProperty('--px', c.toFixed(1) + 'px');
    }
    // everything that is a state rather than a camera move (synchronous, all modes)
    function chrome(k, turn) {
      const f = fruits[k];
      index(k);
      odo(H('#wheel-position'), k + 1);
      odo(H('#s0-num'), k + 1);
      if (turn) washOn ^= 1;
      washes[washOn].style.setProperty('--c', TONE[f.slug] || '#c9a76a');
      washes.forEach((w, i) => w.classList.toggle('is-on', i === washOn));
      H('#prev').disabled = k === 0;
      H('#next').setAttribute('aria-label', k === fruits.length - 1 ? '往下逛：果園與當季水果' : '下一種水果');
      H('#home-detail-link').href = '#p-' + f.slug;
      H('#home-detail-link').setAttribute('aria-label', '看' + f.name + '的規格與介紹');
      if (!busy) setBuy('放入菜籃', false);
    }
    // inline styles a camera move left behind (through GSAP when present, so its transform cache is reset too)
    const unstyle = el => { if (window.gsap) gsap.set(el, { clearProps: 'all' }); else el.removeAttribute('style'); };
    function clearFx() {
      if (window.gsap) {
        if (dialTw) dialTw.kill();
        FIELDS.forEach(fd => { if (fd.tl) fd.tl.kill(); fd.tl = null; gsap.killTweensOf(fd.el); });
        gsap.killTweensOf([heroCur, ...outgoing, ...$$('.s0-nbi', root)].filter(Boolean));
      }
      dialTw = null;
      FIELDS.forEach(fd => { if (fd.wa) fd.wa.cancel(); fd.wa = null; unstyle(fd.el); });
      outgoing.forEach(o => o.remove()); outgoing.clear();
    }
    // the current fruit without any camera move (first paint, coming home, settling after a mode change)
    function paint(k) {
      clearFx();
      const f = fruits[k], nb = neighbours(k);
      if (!heroCur || heroCur.dataset.slug !== f.slug) { float.innerHTML = ''; heroCur = slot(f.slug); float.append(heroCur); }
      unstyle(heroCur);
      ['prev', 'next'].forEach(side => { near[side].innerHTML = ''; const i = nbImg(nb[side]); if (i) near[side].append(i); });
      FIELDS.forEach(fd => { fd.el.innerHTML = fd.html(f); });
      chrome(k, false);
      measure(); dial(k);
    }
    // ----- one switch, full motion (GSAP) -----
    function move(k, d) {
      const f = fruits[k], vw = vwPx(), small = mob();
      chrome(k, true);
      // 1. the old fruit dollies back (scale .82, out of focus, 6vw against the move); anything older just goes
      outgoing.forEach(o => { gsap.killTweensOf(o); gsap.to(o, { opacity: 0, duration: .15, ease: 'none', onComplete: () => { o.remove(); outgoing.delete(o); } }); });
      const old = heroCur, s = slot(f.slug);
      heroCur = s; float.append(s);
      if (old) {
        gsap.killTweensOf(old); outgoing.add(old);
        gsap.to(old, { '--f': 0, duration: .4, ease: 'power1.inOut' });
        gsap.to(old, { x: -d * 6 * vw, scale: .82, opacity: 0, duration: .55, ease: 'power2.in', onComplete: () => { old.remove(); outgoing.delete(old); } });
      }
      // 2. the new one comes in from the foreground (scale 1.28, 12px, +8vw) and the focus lands on it; overlap .25 s
      gsap.timeline({ delay: .3 })
        .fromTo(s, { x: d * 8 * vw, scale: 1.28 }, { x: 0, scale: 1, duration: .8, ease: EASE }, 0)
        .fromTo(s, { '--f': 0 }, { '--f': 1, duration: .85, ease: 'power2.out' }, 0)
        .fromTo(s, { opacity: 0 }, { opacity: 1, duration: .5, ease: 'power1.out' }, 0);
      // 3. the neighbours in front of the lens are swapped, sweeping past at 1.5x the hero's travel
      const nb = neighbours(k);
      ['prev', 'next'].forEach((side, j) => {
        $$('.s0-nbi', near[side]).forEach(o => { gsap.killTweensOf(o); gsap.to(o, { x: -d * 18 * vw, opacity: 0, duration: .5, ease: 'power2.in', onComplete: () => o.remove() }); });
        const i = nbImg(nb[side]);
        if (i) { near[side].append(i); gsap.fromTo(i, { x: d * 18 * vw, opacity: 0 }, { x: 0, opacity: .35, duration: .7, delay: .1 + j * .05, ease: EASE }); }
      });
      // 4. copy: the old words leave upward first, then the new ones rise from below (one element per line)
      FIELDS.forEach((fd, i) => {
        if (fd.tl) fd.tl.kill();
        gsap.killTweensOf(fd.el);
        const tl = gsap.timeline({ delay: i * .035 })
          .to(fd.el, { yPercent: -105, opacity: 0, duration: .3, ease: 'power2.in' })
          .call(() => { fd.el.innerHTML = fd.html(f); })
          .fromTo(fd.el, { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .75, ease: EASE, immediateRender: false });
        // (immediateRender off: inside a timeline a fromTo would otherwise jump to its start state at once)
        if (fd.name) tl.fromTo(fd.el, { filter: 'blur(' + (small ? 4 : 8) + 'px)' }, { filter: 'blur(0px)', duration: .9, ease: EASE, clearProps: 'filter', immediateRender: false }, '<');
        fd.tl = tl;
      });
      // 5. the dial turns (the wash, the numbers and the index line move by CSS transitions)
      if (dialTw) dialTw.kill();
      const p = { v: dialPos };
      dialTw = gsap.to(p, { v: k, duration: .9, ease: 'power3.inOut', onUpdate: () => dial(p.v) });
    }
    // ----- one switch, reduced: a 0.3 s cross-fade (WAAPI, so no library is needed) -----
    function fade(k) {
      const f = fruits[k], nb = neighbours(k), can = !!Element.prototype.animate;
      chrome(k, true);
      outgoing.forEach(o => o.remove()); outgoing.clear();
      const old = heroCur, s = slot(f.slug);
      heroCur = s; float.append(s);
      if (old) {
        outgoing.add(old);
        const end = () => { old.remove(); outgoing.delete(old); };
        if (can) { const a = old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'linear', fill: 'forwards' }); a.onfinish = end; setTimeout(end, 600); } else end();
      }
      if (can) s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'linear' });
      ['prev', 'next'].forEach(side => {
        near[side].innerHTML = '';
        const i = nbImg(nb[side]); if (!i) return;
        near[side].append(i); if (can) i.animate([{ opacity: 0 }, { opacity: .35 }], { duration: 300, easing: 'linear' });
      });
      FIELDS.forEach(fd => {
        if (fd.wa) fd.wa.cancel();
        fd.el.innerHTML = fd.html(f);
        fd.wa = can ? fd.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'linear' }) : null;
      });
      dial(k);
    }
    function go(from, k, d) {
      if (!homeActive() || !heroCur) return paint(k);
      if (live()) move(k, d); else fade(k);
    }
    // ----- first arrival at home: the stage racks into focus -----
    function enter() {
      if (!live() || !heroCur) return;
      const ui = $$('.s0-kicker,.s0-no,.s0-en,.s0-desc,.s0-price,.s0-spec,.s0-cta', root), small = mob();
      const nameEl = FIELDS[0].el, rule = H('.s0-rule');
      const tl = gsap.timeline();
      tl.fromTo(H('.s0-washes'), { opacity: 0 }, { opacity: 1, duration: 2, ease: 'power1.out' }, 0)
        .fromTo(heroCur, { scale: 1.14, '--f': 0, opacity: 0 }, { scale: 1, '--f': 1, opacity: 1, duration: 1.6, ease: EASE }, .05)
        .fromTo(H('.s0-num'), { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.8, ease: EASE }, .1)
        .fromTo($$('.s0-nbi', root), { opacity: 0, x: (i, el) => (el.closest('.is-prev') ? -1 : 1) * 10 * vwPx() }, { opacity: .35, x: 0, duration: 1.8, ease: EASE, stagger: .12 }, .25)
        .fromTo(nameEl, { yPercent: 100, opacity: 0, filter: 'blur(' + (small ? 6 : 10) + 'px)', letterSpacing: '.16em' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', letterSpacing: '.04em', duration: 1.3, ease: EASE, clearProps: 'filter,letterSpacing' }, .3)
        .fromTo(ui, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .9, ease: EASE, stagger: .07 }, .45)
        .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: EASE }, .6)
        .fromTo($$('.s0-ring,.s0-arrows', root), { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power1.out', stagger: .2 }, .2)
        .fromTo($$('.s0-ix,.s0-link', root), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .7, ease: EASE, stagger: .03 }, .7)
        .fromTo($$('.s0-foot-top,.s0-basket', root), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, ease: EASE, stagger: .1 }, .9);
      const p = { v: current - 1.6 };
      tl.fromTo(H('.s0-marks'), { opacity: 0 }, { opacity: 1, duration: 1, ease: 'power1.out' }, .25)
        .to(p, { v: current, duration: 1.7, ease: 'power3.out', onUpdate: () => dial(p.v) }, .2);
      return tl;
    }
    // ----- add to basket: a copy of the hero flies on an arc into the basket (or the header count on phones) -----
    async function fly() {
      const src = heroImg(), small = mob(), tgt = small ? H('#cart-open') : H('.s0-bk');
      if (!fullMotion() || !src || !tgt) return;
      const a = src.getBoundingClientRect(), b = tgt.getBoundingClientRect();
      if (!a.width || !b.width) return;
      const g = new Image(); g.src = src.currentSrc || src.src; g.alt = ''; g.className = 'fx-ghost s0-fly';
      Object.assign(g.style, { width: a.width + 'px', height: a.height + 'px' });
      document.body.append(g);
      const s = [a.left + a.width / 2, a.top + a.height / 2], e = [b.left + b.width / 2, b.top + b.height * (small ? .5 : .52)];
      const c = [s[0] + (e[0] - s[0]) * .4, Math.min(s[1], e[1]) - Math.min(240, innerHeight * .24)];
      const k = small ? (b.height * 1.6) / a.height : .25, w = a.width, h = a.height; // storyboard: shrinks to .25 on the way
      const at = t => {
        const u = 1 - t, x = u * u * s[0] + 2 * u * t * c[0] + t * t * e[0], y = u * u * s[1] + 2 * u * t * c[1] + t * t * e[1];
        g.style.transform = 'translate(' + (x - w / 2).toFixed(1) + 'px,' + (y - h / 2).toFixed(1) + 'px) scale(' + (1 - (1 - k) * t).toFixed(4) + ') rotate(' + (t * 24).toFixed(2) + 'deg)';
        g.style.filter = 'blur(' + (Math.sin(Math.PI * Math.min(1, t * 1.15)) * 2).toFixed(2) + 'px)';
        g.style.opacity = t > .86 ? ((1 - t) / .14).toFixed(3) : '1';
      };
      at(0);
      try {
        await Promise.race([new Promise(res => {
          if (window.gsap) { const st = { t: 0 }; gsap.to(st, { t: 1, duration: .95, ease: 'power1.inOut', onUpdate: () => at(st.t), onComplete: res }); }
          else { const t0 = performance.now(); const f = n => { const t = Math.min(1, (n - t0) / 950); at(INOUT(t)); if (t < 1) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }
        }), new Promise(r => setTimeout(r, 1300))]);
      } finally { g.remove(); }
    }
    // the basket takes the weight: it sinks 4px and settles (S8's landing)
    function land() {
      if (!fullMotion()) return;
      const bk = mob() ? H('#cart-open b') : H('.s0-bk');
      if (!bk) return;
      if (window.gsap) gsap.timeline().to(bk, { y: 4, duration: .14, ease: 'power2.out' }).to(bk, { y: 0, duration: .55, ease: 'power2.inOut' });
      else if (bk.animate) bk.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(4px)', offset: .2 }, { transform: 'translateY(0)' }], { duration: 690, easing: 'ease-out' });
    }
    function heroImg() { return heroCur && (heroCur.querySelector('.s0-sharp') || heroCur.querySelector('img')); } // (a selector list would return the soft copy: it comes first)
    function relayout() { measure(); dial(dialTw ? dialPos : current); index(current); }
    function settle() { if (heroCur) paint(current); }
    // preload the watercolours once the page is idle, so a switch never waits on a download
    // (decode() as well: the first switch to a fruit otherwise stalls a frame or two on the image decode)
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1200)), warm = [];
    idle(() => fruits.forEach(f => { if (!ART.has(f.slug)) return; [f.slug, 'soft/' + f.slug].forEach(stem => { const i = new Image(); i.src = 'img/art/' + stem + '.webp'; warm.push(i); if (i.decode) i.decode().catch(() => {}); }); }));
    return { build, paint, go, enter, fly, land, heroImg, relayout, settle, softArt };
  })();

  function centerStrip(smooth) {
    if (!matchMedia('(max-width:759px)').matches) return;
    requestAnimationFrame(() => { const w = H('#wheel'), a = H('#wheel [aria-current=true]'); if (a) w.scrollTo({ left: a.offsetLeft + a.offsetWidth / 2 - w.clientWidth / 2, behavior: smooth && fullMotion() ? 'smooth' : 'instant' }); });
  }
  function select(index, direction = 1, quiet = false) {
    // v4: no endless loop - the picker stops at both ends and hands over to the page.
    const nextIndex = Math.max(0, Math.min(fruits.length - 1, index)), from = current;
    current = nextIndex;
    const f = fruits[current];
    syncCoverHero(f.slug);
    if (quiet || nextIndex === from) S0.paint(current); else S0.go(from, current, direction);
    centerStrip(!quiet);
  }
  H('#wheel').onclick = e => { const b = e.target.closest('[data-fruit]'); if (!b) return; const i = Number(b.dataset.fruit); if (i !== current) select(i, Math.sign(i - current)); };
  H('.s0-marks').onclick = e => { const b = e.target.closest('[data-pick]'); if (!b) return; const i = Number(b.dataset.pick); if (i !== current) select(i, Math.sign(i - current)); };
  H('#prev').onclick = () => { if (current > 0) select(current - 1, -1); };
  H('#next').onclick = () => step(1);
  // ---------- v4: wheel <-> page hand-over ----------
  // At the very top the wheel drives the fruit picker exactly like live (deltaY summed past 45,
  // 650ms throttle). Past the last fruit, one more step hands over to the page and glides to the
  // first photo section; on the first fruit an upward scroll stays native. Once the page has left
  // the top, the wheel is ordinary page scrolling; back at the top the picker takes over again.
  const LAST = () => fruits.length - 1;
  const atTop = () => window.scrollY <= 2;
  let handing = false, handTimer = 0, wasTop = true;
  // v4.1: hand over to the S1 cover. The picked watercolour flies into the cover's foreground
  // (HomeMotion.bridge) while Lenis (or native smooth scroll) glides down; Lenis restarts here.
  function handOff() {
    const cover = $('#s1');
    if (!cover || handing) return;
    const y = cover.getBoundingClientRect().top + window.scrollY;
    handing = true; clearTimeout(handTimer);
    const done = () => { handing = false; clearTimeout(handTimer); };
    handTimer = setTimeout(done, motion ? 1900 : 80);
    HomeMotion.bridge();
    Fx.scrollTo(y, { duration: 1.6, lock: true, done });
  }
  function step(d) {
    if (d > 0 && current === LAST()) return handOff();
    if (d < 0 && current === 0) return;
    select(current + d, d);
  }
  // Capture phase, so this runs before Lenis' own wheel listener; lenisStopPropagation makes Lenis
  // ignore events the picker consumed, and Fx.hold() stops Lenis while the picker owns the wheel.
  window.addEventListener('wheel', e => {
    if (!homeActive() || blocked() || e.ctrlKey) return;
    if (handing) { e.preventDefault(); e.lenisStopPropagation = true; return; } // let the hand-over glide finish
    if (!atTop()) return; // ordinary page scroll
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
    if (dy < 0 && current === 0) return; // first fruit + scroll up: native behaviour
    e.preventDefault(); e.lenisStopPropagation = true;
    Fx.hold();
    if (Date.now() - lastWheel < 650) return;
    wheelSum += dy;
    if (Math.abs(wheelSum) > 45) { const d = Math.sign(wheelSum); wheelSum = 0; lastWheel = Date.now(); step(d); }
  }, { passive: false, capture: true });
  // Arriving back at the top re-arms the throttle so trailing inertia does not flip fruits.
  // v6: at the top the stage owns vertical swipes (touch-action pan-x); below it, the page scrolls natively.
  window.addEventListener('scroll', () => { const t = atTop(); if (t && !wasTop) { lastWheel = Date.now(); wheelSum = 0; } if (t !== wasTop) stage.classList.toggle('is-top', t); wasTop = t; }, { passive: true });
  // Live listens for ArrowLeft/Right on the market root; the mockup also accepts Up/Down.
  // Keys only drive the picker while the page sits at the top; at either end they stay native.
  document.addEventListener('keydown', e => {
    if (!homeActive() || blocked() || e.altKey || e.ctrlKey || e.metaKey || e.target.closest('input,select,textarea,#home-more')) return;
    if (!atTop()) return;
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d || (d > 0 && current === LAST()) || (d < 0 && current === 0)) return;
    e.preventDefault(); select(current + d, d);
  });
  window.addEventListener('resize', () => { if (homeActive()) { S0.relayout(); centerStrip(false); } });
  if (document.fonts) document.fonts.ready.then(() => { if (homeActive()) S0.relayout(); });
  // Touch gestures follow the same direction as page scrolling: finger up = next.
  function bindMarketGestures(surface, onStep, isBlocked) {
    let gesture = null, suppressClick = false;
    surface.addEventListener('touchstart', e => { gesture = null; suppressClick = false; if (e.touches.length !== 1 || isBlocked() || e.target.closest('#buy,a,input,select,textarea')) return; const t = e.touches[0]; gesture = { x: t.clientX, y: t.clientY, done: false, inWheel: !!e.target.closest('#wheel') }; }, { passive: true });
    surface.addEventListener('touchmove', e => { if (e.touches.length !== 1 || isBlocked()) { gesture = null; return; } if (!gesture) return; const t = e.touches[0], dx = t.clientX - gesture.x, dy = t.clientY - gesture.y; if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) { if (e.cancelable) e.preventDefault(); if (!gesture.done && Math.abs(dy) > 48) { gesture.done = true; suppressClick = true; onStep(dy < 0 ? 1 : -1); } } }, { passive: false });
    surface.addEventListener('touchend', e => { if (!gesture || isBlocked()) { gesture = null; return; } const t = e.changedTouches[0], dx = t.clientX - gesture.x, dy = t.clientY - gesture.y; if (!gesture.done && !gesture.inWheel && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) { suppressClick = true; onStep(dx < 0 ? 1 : -1); } gesture = null; if (suppressClick) setTimeout(() => { suppressClick = false; }, 400); }, { passive: true });
    surface.addEventListener('touchcancel', () => { gesture = null; suppressClick = false; }, { passive: true });
    surface.addEventListener('click', e => { if (suppressClick) { e.preventDefault(); e.stopImmediatePropagation(); suppressClick = false; } }, true);
  }
  // v6: the whole stage takes vertical swipes while the page sits at the top (storyboard-s0: 在舞台上滑換下一個).
  bindMarketGestures(stage, step, () => blocked() || !atTop());
  // v4.1: Lenis must ignore the picker's own touches, otherwise its touchmove/touchend handling
  // (syncTouch off) cancels the hand-over glide that a swipe on the last fruit starts.
  ['touchstart', 'touchmove', 'touchend'].forEach(t => stage.addEventListener(t, e => { if (atTop() || handing) e.lenisStopPropagation = true; }, { passive: true }));
  H('#skip-wheel').onclick = handOff;

  H('#buy').onclick = async () => {
    if (busy) return;
    busy = true; setBuy('放入中…', true);
    const f = fruits[current], spec = f.specs[0];
    try { await S0.fly(); addToBasket(f.slug, spec.id, 1); S0.land(); notice('已將一份' + f.name + '（' + spec.label + '）放入菜籃。'); }
    finally { busy = false; setBuy('放入菜籃', false); }
  };

  function renderBasket() {
    const count = basketCount();
    H('#count').textContent = String(count);
    $('#head-count').textContent = String(count);
    const cap = H('#basket-caption');
    if (!cap.firstChild) cap.innerHTML = '菜籃 · <span class="s0-odo"></span> 份';
    odo(cap.querySelector('.s0-odo'), count, 1);
    H('#basket').setAttribute('aria-label', '打開我的菜籃（' + count + ' 份）');
    H('#basket-fruit').innerHTML = basket.slice(-6).map((l, i) => '<span style="position:absolute;inset:0;transform:translate(' + (i % 3 * 23 - 10) + '%,' + (Math.floor(i / 3) * -14) + '%) rotate(' + (i * 9 - 18) + 'deg)">' + art(l.slug) + '</span>').join('');
    H('#cart-items').innerHTML = basket.length ? basket.map(l => { const p = BY_SLUG[l.slug], s = specOf(l); return '<div class="cart-row"><div><strong>' + esc(p.name) + '</strong><small>' + esc(s.label) + '・價格示意</small><span>' + money(s.price * l.qty) + ' · ' + l.qty + ' 份</span></div><button data-remove="' + esc(l.slug + '|' + l.spec) + '" aria-label="移除' + esc(p.name + s.label) + '">移除</button></div>'; }).join('') : '<p>還沒有水果，先挑一樣喜歡的吧。</p>';
    H('#cart-total').textContent = basket.length ? '商品小計 ' + money(basketTotal()) : '';
    H('#checkout-link').hidden = !basket.length;
    if ($('#cart-body')) renderCartPage();
  }
  H('#cart-items').onclick = e => { const b = e.target.closest('[data-remove]'); if (!b) return; const [slug, spec] = b.dataset.remove.split('|'); setQty(slug, spec, 0); notice('已從菜籃移除。'); };
  const openCart = () => { renderBasket(); H('#cart-dialog').showModal(); };
  H('#cart-open').onclick = openCart; H('#basket').onclick = openCart;
  H('#close').onclick = () => H('#cart-dialog').close(); H('#continue').onclick = () => H('#cart-dialog').close();
  H('#checkout-link').onclick = () => H('#cart-dialog').close();
  function motionLabel() { root.dataset.motion = motion ? 'on' : 'off'; H('#motion').textContent = '動畫：' + (motion ? '開啟' : '關閉'); H('#motion').setAttribute('aria-pressed', String(motion)); }
  H('#motion').onclick = () => { motion = !motion; motionLabel(); Fx.apply(); HomeMotion.build(); };
  S0.build(); motionLabel();

  // =====================================================================
  // HOME v4.1 — "a fruit quarterly that moves" (十月號). Spec: storyboard.md (S1–S8).
  // Markup below is a complete static magazine; motion is layered on by HomeMotion.
  // =====================================================================
  const more = H('#home-more');
  const PH = Object.assign({}, window.HOME_PHOTOS || {}, window.PRODUCT_PHOTOS || {}, window.AI_PHOTOS || {});
  // v5.1: AI scenario images (img/ai-*.webp, build_images.py build_ai). They are generated pictures, NOT the shop's
  // orchard, staff, packing or delivery: every use carries the visible label AI_LABEL next to / on the picture and an
  // alt that starts with it (design-system.md §17). AI_POS keeps the hands and the fruit inside cover crops.
  const AI_LABEL = 'AI 生成情境示意';
  const AI_POS = { 'ai-peach-orchard-wide': '42% 42%', 'ai-peach-picking-close': '42% 50%', 'ai-peach-packing-netted-carton': '58% 42%', 'ai-pear-net-house-worker': '42% 40%',
    'ai-apple-orchard-inspection': '60% 50%', 'ai-black-grape-picking': '50% 45%', 'ai-green-grape-packing-box': '52% 50%', 'ai-cherry-packing-trays': '55% 50%', 'ai-carrying-carton-loading-concept': '45% 45%' };
  const isAI = stem => /^ai-/.test(stem);
  // on a picture: a rail spanning the frame with a sticky tag (index.html); with a class: a bare tag (the S4 stage)
  const aiTag = (cls = '') => (cls ? '<span class="ai-tag ' + cls + '">' + AI_LABEL + '</span>' : '<span class="ai-rail"><span class="ai-tag">' + AI_LABEL + '</span></span>');
  const altOf = (stem, cap) => (isAI(stem) ? AI_LABEL + '：' + cap : cap + '（客戶實拍）');
  const creditOf = stem => (isAI(stem) ? AI_LABEL : '客戶實拍');
  // <picture> with webp + jpg fallback; width/height reserve space (no layout shift).
  // v5: every client photo sits in a .grade wrapper (one shared film grade, see index.html).
  // p-* product photos and ai-* scenario images exist as webp only.
  function pic(stem, alt, o = {}) {
    const [w, h] = PH[stem] || [4, 3], webpOnly = /^(p|ai)-/.test(stem), pos = AI_POS[stem];
    const inner = '<picture>' + (o.tall ? '<source media="(max-width:767px) and (orientation:portrait)" type="image/webp" srcset="img/' + o.tall + '.webp">' : '') +
      (webpOnly ? '' : '<source type="image/webp" srcset="img/' + stem + '.webp">') + '<img src="img/' + stem + (webpOnly ? '.webp' : '.jpg') + '" alt="' + esc(alt) + '" width="' + w + '" height="' + h + '"' + (pos ? ' style="object-position:' + pos + '"' : '') + (o.eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"></picture>';
    // v7: .gk carries the picture and the grade's light leak / vignette, and takes the Ken Burns push as one cached layer
    return o.grade === false ? inner : '<span class="grade' + (o.noKb ? ' no-kb' : '') + '"><span class="gk">' + inner + '</span></span>';
  }
  const blurArt = slug => 'img/art/blur/' + slug + '.webp';
  const fore = (slug, extra = '') => ART.has(slug) ? '<img class="fx-fore" src="' + blurArt(slug) + '" alt="" aria-hidden="true" draggable="false" decoding="async"' + extra + '>' : '';
  // v5: each fruit's watercolour tone (colour washes, product page) and the flagged photos.
  const TONE = { muscat: '#a9bd62', apple: '#d8634c', peach: '#ef9d86', orange: '#f0a23c', cherry: '#c93a3f', pear: '#d6ad5c', strawberry: '#e0505b', 'black-grape': '#6f4a7e' };
  const HAND_NOTE = '需客戶確認：手部與身體入鏡';
  const artImg = (slug, cls = '', attrs = '') => ART.has(slug) ? '<img class="' + cls + '" src="img/art/' + esc(slug) + '.webp" alt="" loading="lazy" decoding="async" draggable="false"' + attrs + '>' : '<span class="art-ph ' + cls + '" aria-hidden="true"' + attrs + '>' + sketch(slug) + '</span>';

  // Season months parsed from the product data ("8–10 月", "10 月–隔年 1 月").
  const span = p => { const n = (p.season.match(/\d+/g) || []).map(Number); return [n[0], n[n.length - 1]]; };
  const inSeason = (p, m) => { const [a, b] = span(p); return a <= b ? m >= a && m <= b : m >= a || m <= b; };
  const MONTH_ZH = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
  const MONTH_EN = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const qMonth = Number(new URLSearchParams(location.search).get('month')); // ?month= previews other months
  const MONTH = qMonth >= 1 && qMonth <= 12 ? qMonth : new Date().getMonth() + 1;
  const ISSUE = { zh: '幸', mark: '幸 SHIAWASE', kana: 'しあわせ', no: 'No.' + pad(MONTH), en: MONTH_EN[MONTH - 1], year: new Date().getFullYear() };
  const SHORT = { muscat: ['麝香葡萄', 'MUSCAT GRAPE'], apple: ['蘋果', 'APPLE'], peach: ['水蜜桃', 'WHITE PEACH'], orange: ['香甜柑橘', 'MANDARIN'], cherry: ['山形櫻桃', 'CHERRY'], pear: ['梨', 'JAPANESE PEAR'], strawberry: ['草莓', 'STRAWBERRY'], 'black-grape': ['黑葡萄', 'BLACK GRAPE'] };
  const SEASON_PHOTO = {
    muscat: ['home-muscat-box', '單串禮盒裡的麝香葡萄'], apple: ['home-apple-tree', '樹上慢慢著色的蘋果'], pear: ['home-pear-hands', '剛採下、比手掌還大的梨', HAND_NOTE],
    'black-grape': ['home-black-grape-box', '套上淡紫網套的黑葡萄'], peach: ['home-peach-box11', '套著白網套的水蜜桃'], cherry: ['home-cherry-box', '滿滿兩盒的櫻桃'],
    strawberry: ['home-strawberry-box', '一顆顆放進軟墊的草莓']
  };
  const SEASON = (() => {
    let list = PRODUCTS.filter(p => inSeason(p, MONTH)), soon = false;
    const upcoming = PRODUCTS.filter(p => !inSeason(p, MONTH)).map(p => [p, (span(p)[0] - MONTH + 12) % 12]).sort((a, b) => a[1] - b[1]);
    if (!list.length) { list = upcoming.slice(0, 2).map(x => x[0]); soon = true; }
    list = list.slice(0, 4);
    return { list, soon, upcoming: upcoming.filter(x => !list.includes(x[0])).slice(0, 4).map(x => x[0]), title: MONTH_ZH[MONTH - 1] + (soon ? '月，等下一季' : '月正好吃') };
  })();

  // ---------- S1 cover ----------
  // Foreground fruit field: x (vw) / y (svh) centre, z (px), size (vw), rotation. [0] is the hero:
  // the fruit picked on the wheel, so the S0 -> S1 hand-over lands on the same watercolour.
  // v5: the hero sits on the mid-ground plane (z 40) where the first focus lands; near fruits blur.
  const S1_FRUITS = [
    { x: 63, y: 58, z: 40, s: 21, r: -8 }, { x: 14, y: 80, z: 260, s: 15, r: 12 }, { x: 86, y: 20, z: -220, s: 13, r: -16 },
    { x: 33, y: 15, z: -520, s: 11, r: 20, wide: 1 }, { x: 82, y: 88, z: 420, s: 17, r: 6, wide: 1 }, { x: 47, y: 42, z: -720, s: 9, r: -6, wide: 1 },
    { x: 7, y: 38, z: -360, s: 12, r: 14 }
  ];
  // lights in the orchard: soft bokeh discs that also fly past the lens during the dolly
  const S1_BOKEH = [{ x: 24, y: 28, z: 520, s: 9 }, { x: 74, y: 72, z: 300, s: 13 }, { x: 56, y: 18, z: -280, s: 6 }, { x: 36, y: 80, z: 700, s: 16 }, { x: 90, y: 44, z: -60, s: 7 }];
  const ART_FRUITS = ['muscat', 'peach', 'apple', 'cherry', 'black-grape', 'pear', 'strawberry', 'orange'].filter(s => ART.has(s));
  function s1Slugs(hero) {
    const rest = ART_FRUITS.filter(s => s !== hero);
    return S1_FRUITS.map((f, i) => (i ? rest[(i - 1) % rest.length] : hero));
  }
  const s1HTML = () => {
    const hero = ART.has(fruits[current].slug) ? fruits[current].slug : ART_FRUITS[0];
    const slugs = s1Slugs(hero);
    // v5: one focus + one group of words per frame - the contents list and the end kicker are gone.
    return '<section class="mg mg-cover" id="s1" data-folio="01" data-sec="封面" data-tone="dark" aria-labelledby="s1-title"><div class="s1-stage"><div class="s1-cam">' +
      '<div class="s1-bg" data-depth="0">' + pic('home-hero-pear', '網室棚架下結實纍纍的梨園（客戶實拍）', { eager: true, tall: 'home-hero-pear-tall' }) +
      '<picture class="s1-soft" aria-hidden="true"><source media="(max-width:767px) and (orientation:portrait)" srcset="img/home-hero-pear-tall-soft.webp"><img src="img/home-hero-pear-soft.webp" alt="" decoding="async"></picture><i class="s1-dim" aria-hidden="true"></i></div>' +
      '<div class="s1-mast" data-depth=".45"><p class="s1-masthead s1-logo"><img src="img/brand/shiawase-logo-paper.svg" alt="幸 SHIAWASE しあわせ" width="529" height="1068" decoding="async" fetchpriority="high"></p>' +
      '<p class="s1-meta">SHIAWASE<span class="kana s1-kana">しあわせ</span><b>' + ISSUE.no + '</b>' + ISSUE.en + ' ' + ISSUE.year +
      '<span class="s1-tokushu"><i class="tk">特集</i>' + MONTH_ZH[MONTH - 1] + '月<span class="kana">の</span>果物</span></p></div>' +
      '<div class="s1-world" aria-hidden="true">' + S1_FRUITS.map((f, i) => '<img class="s1-fruit' + (f.wide ? ' is-wide' : '') + (i ? '' : ' is-hero') + '" src="img/art/' + slugs[i] + '.webp" alt="" draggable="false" data-slug="' + slugs[i] + '" data-depth="' + (f.z > 200 ? 1 : f.z > -300 ? .7 : .35) + '" data-breathe style="--x:' + f.x + ';--y:' + f.y + ';--z:' + f.z + ';--s:' + f.s + ';--r:' + f.r + '">').join('') +
      S1_BOKEH.map(b => '<i class="s1-bokeh" style="--x:' + b.x + ';--y:' + b.y + ';--z:' + b.z + ';--s:' + b.s + '"></i>').join('') + '</div></div>' +
      '<i class="s1-leak" aria-hidden="true"></i>' + fore('peach') +
      '<div class="s1-end" data-depth=".3"><h2 class="s1-title" id="s1-title">從果園，到你家。</h2><p class="s1-sub">在產地等果實熟成才採收，套網、裝箱，一路冷藏送到你家門口。<small>文案示意</small></p></div>' +
      '<span class="s1-cap">網室棚架下的梨園・客戶實拍</span></div></section>';
  };
  // Keep the S1 hero in step with the wheel (and avoid showing the same fruit twice).
  function syncCoverHero(slug) {
    if (!ART.has(slug)) return;
    const imgs = $$('#s1 .s1-fruit', more); if (!imgs.length) return;
    s1Slugs(slug).forEach((s, i) => { if (imgs[i].dataset.slug !== s) { imgs[i].dataset.slug = s; imgs[i].src = 'img/art/' + s + '.webp'; } });
  }

  // ---------- S2 contents ----------
  // v5: row 1 carries the feature's opening photo; scrolling on pushes through it into S3 (FLIP).
  const S3_OPEN = 'home-apple-canopy';
  const TOC = [['s3', 'P.06', SEASON.title, 'IN SEASON', S3_OPEN], ['s4', 'P.12', '從採收到你家', 'FROM HARVEST TO YOUR DOOR', 'home-cherry-orchard'],
    ['s5', 'P.18', '果園日誌', 'ORCHARD JOURNAL', 'home-grape-vine'], ['s6', 'P.24', '送禮之書', 'THE GIFT BOOK', 'home-peach-giftbox'], ['s7', 'P.30', '安心宅配', 'DELIVERY PROMISE', 'home-grape-box8']];
  const s2HTML = () => '<section class="mg mg-toc" id="s2" data-folio="03" data-sec="目次" aria-labelledby="s2-title">' +
    '<span class="s2-num mg-outline" aria-hidden="true" data-depth=".1">' + pad(MONTH) + '</span><div class="mg-wrap s2-grid">' +
    '<div class="s2-side" data-depth=".3"><span class="mg-kicker">CONTENTS · ' + ISSUE.no + ' · ' + ISSUE.en + '<span class="kana mg-kana">もくじ</span></span><h2 class="s2-title v" id="s2-title">目次</h2>' +
    '<p class="s2-note"><b>編輯手記</b>' + MONTH_ZH[MONTH - 1] + '月，梨正甜，蘋果在枝頭慢慢轉紅。這一期，我們從果園一路走到你家門口。<small>文案示意</small></p></div>' +
    '<ol class="s2-list">' + TOC.map(([id, no, t, en, img], i) => '<li><button type="button" class="s2-row" data-goto="' + id + '" data-peek="' + img + '" id="toc-' + id + '"><span class="s2-name">' + (i ? '' : '<i class="tk">特集</i>') + t + '</span><span class="s2-lead" aria-hidden="true"></span><span class="s2-no"><span class="sr-only">第 </span>' + no.slice(2) + '<span class="sr-only"> 頁</span></span><span class="s2-en">' + en + '</span><span class="s2-arr" aria-hidden="true">↘</span>' +
      (i ? '' : '<span class="s2-thumb" aria-hidden="true"><span class="grade no-kb"><span class="gk"><img src="img/' + img + '.webp" alt="" loading="lazy" decoding="async"></span></span></span>') + '</button></li>').join('') + '</ol></div>' +
    artImg('orange', 'mg-art s2-art', ' data-depth=".9" data-breathe') + fore('apple') +
    '<div class="s2-peek" aria-hidden="true">' + TOC.map(t => '<img src="img/' + t[4] + '.webp" alt="" loading="lazy" decoding="async" data-peek="' + t[4] + '">').join('') + '</div></section>';

  // ---------- S3 feature (horizontal track) ----------
  function s3HTML() {
    const L = SEASON.list;
    // v5: one focus + one group of words - name, two lines, a price line; the folio joins the caption.
    const FORE_FOR = { muscat: 'peach', apple: 'cherry', pear: 'apple', 'black-grape': 'muscat', peach: 'strawberry', cherry: 'pear', strawberry: 'orange', orange: 'black-grape' };
    const spread = (p, i) => {
      const ph = SEASON_PHOTO[p.slug], [nm] = SHORT[p.slug] || [p.name, ''];
      return '<article class="s3-panel s3-spread' + (i % 2 ? ' is-flip' : '') + '" aria-labelledby="s3-n-' + p.slug + '">' +
        '<span class="s3-wash" aria-hidden="true" style="--wash:' + (TONE[p.slug] || '#e9a07a') + '"></span>' +
        '<span class="s3-num mg-outline" aria-hidden="true" data-depth=".1">' + pad(i + 1) + '</span>' +
        '<a class="s3-photo" href="#p-' + p.slug + '" id="s3-ph-' + p.slug + '" data-cursor="看看" data-depth=".2" aria-label="看' + esc(p.name) + '">' + (ph ? '<div class="s3-photo-in">' + pic(ph[0], ph[1] + '（客戶實拍）') + '</div>'
          : '<div class="s3-nophoto" role="img" aria-label="' + esc(p.name) + '：照片待客戶提供">' + artImg(p.slug) + '<em>照片待客戶提供</em></div>') + '</a>' +
        (ph ? artImg(p.slug, 'mg-art s3-art', ' data-depth=".85" data-breathe') : '') +
        '<div class="s3-text" data-depth=".4"><h3 class="s3-name v" id="s3-n-' + p.slug + '">' + nm + '</h3>' +
        '<p class="s3-desc">' + esc(p.desc) + '</p><p class="s3-price">NT$ ' + num(minPrice(p)) + ' 起<span class="mark">價格示意</span><a class="hm-link" href="#p-' + p.slug + '" id="s3-go-' + p.slug + '">看商品 ↗</a></p></div>' +
        '<span class="s3-cap">P.' + pad(7 + i * 2) + '　攝影：客戶實拍｜' + (ph ? esc(ph[1]) + (ph[2] ? '・' + ph[2] : '') : '照片待客戶提供') + '</span>' +
        fore(FORE_FOR[p.slug] || 'peach', i % 2 ? ' data-mob="0"' : '') + '</article>';
    };
    const quote = '<div class="s3-panel s3-quote"><span class="qmark mg-outline" aria-hidden="true">「</span><blockquote class="s3-q">等果實自己熟，<br>再把它送到你手上。</blockquote><cite>— 編輯部・文案示意</cite></div>';
    const qAt = Math.min(2, L.length);
    const body = L.map((p, i) => spread(p, i) + (i === qAt - 1 ? quote : '')).join('');
    const soon = SEASON.upcoming.length ? '<div class="s3-panel s3-outro"><span class="mg-kicker">COMING SOON</span><h3>即將開賣</h3><ul class="s3-soon">' +
      SEASON.upcoming.map(p => '<li>' + artImg(p.slug) + '<b>' + esc((SHORT[p.slug] || [p.name])[0]) + '</b><span>' + span(p)[0] + ' 月開賣</span></li>').join('') + '</ul><span class="mark" style="margin-top:14px">產季為示意，需客戶確認</span></div>' : '';
    return '<section class="mg mg-feature" id="s3" data-folio="06" data-sec="' + SEASON.title + '" aria-labelledby="s3-title"><div class="s3-pin"><div class="s3-track">' +
      '<div class="s3-panel s3-intro"><span class="s3-open" aria-hidden="true">' + pic(S3_OPEN, '', { noKb: true }) + '</span>' +
      '<span class="s3-num mg-outline" aria-hidden="true" data-depth=".15">06</span><span class="mg-kicker">' + (SEASON.soon ? 'COMING SOON' : 'IN SEASON') + ' · ' + ISSUE.en + '<span class="kana mg-kana">きせつのくだもの</span></span><p class="mg-tokushu"><i class="tk">特集</i>' + MONTH_ZH[MONTH - 1] + '月<span class="kana">の</span>果物</p>' +
      '<h2 class="mg-h s3-h" id="s3-title">' + SEASON.title.replace('月', '月<br>') + '</h2><p>現在正好吃的水果，各自一個跨頁。</p><span class="mark" style="margin-top:12px">產季為示意・需客戶確認</span></div>' +
      body + soon + '</div></div></section>';
  }

  // ---------- S4 harvest -> door ----------
  // [name, en, line 1, line 2, stage key (img/s4g-*, s4gp-*), photo stem, caption, note]. Photo stems starting with
  // ai- are AI scenario images (labelled everywhere); the others are client photos. Step 5 (cold delivery) has no
  // picture on purpose: no AI image may stand in for a delivery method the shop has not confirmed.
  const S4_OPEN = ['s4-ai-peach-orchard-wide', 'ai-peach-orchard-wide', '桃樹下，伸手採桃的工作者'];
  const STEPS = [
    ['採收', 'HARVEST', '等果實在枝頭熟成的那一天才採，', '不提早摘下來催熟。', 's4-ai-peach-picking-close', 'ai-peach-picking-close', '從枝頭摘下水蜜桃', ''],
    ['選果', 'SORTING', '一顆一顆看大小、果色與外觀，', '分出等級和尺寸。', 's4-sorting', 'home-apple-fist', '握拳比對樹上蘋果的大小', '分級方式需客戶確認'],
    ['套網', 'NETTING', '每串葡萄、每顆桃都套上網套，', '減少運送時的碰撞。', 's4-netting', 'home-grape-net', '套上網套的綠色葡萄', ''],
    ['裝箱', 'PACKING', '依入數排進紙箱，', '空隙用緩衝墊填好，再封箱。', 's4-ai-peach-packing-netted-carton', 'ai-peach-packing-netted-carton', '套著白網套的水蜜桃排進紙箱', ''],
    ['冷藏配送', 'COLD DELIVERY', '封箱後以冷藏宅配送出，', '維持新鮮的溫度，直到你打開箱子。', '', '', '', '配送方式需客戶確認']
  ];
  const ICON = {
    truck: '<svg viewBox="0 0 64 64" aria-hidden="true"><path pathLength="100" d="M6 18h32v26H6z"/><path pathLength="100" d="M38 26h10l8 9v9H38"/><circle pathLength="100" cx="17" cy="46" r="5"/><circle pathLength="100" cx="47" cy="46" r="5"/><path pathLength="100" d="M22 25v12M16 31h12M18 27l8 8M26 27l-8 8"/></svg>',
    cold: '<svg class="hm-icon" viewBox="0 0 64 64" aria-hidden="true"><path pathLength="100" d="M32 6v52"/><path pathLength="100" d="M9.5 19l45 26"/><path pathLength="100" d="M9.5 45l45-26"/><path pathLength="100" d="M25 9l7 7 7-7M25 55l7-7 7 7"/><path pathLength="100" d="M8 28l9-2.5-2.5-9M56 36l-9 2.5 2.5 9"/><path pathLength="100" d="M8 36l9 2.5-2.5 9M56 28l-9-2.5 2.5-9"/></svg>',
    date: '<svg class="hm-icon" viewBox="0 0 64 64" aria-hidden="true"><rect pathLength="100" x="9" y="13" width="46" height="42" rx="2"/><path pathLength="100" d="M9 25h46"/><path pathLength="100" d="M21 8v10M43 8v10"/><path pathLength="100" d="M23 40l6 6 13-13"/></svg>',
    care: '<svg class="hm-icon" viewBox="0 0 64 64" aria-hidden="true"><path pathLength="100" d="M8 20l24-11 24 11v25L32 56 8 45z"/><path pathLength="100" d="M8 20l24 11 24-11"/><path pathLength="100" d="M32 31v25"/><path pathLength="100" d="M40 36c3-3 8-1 8 3 0 4-8 9-8 9s-8-5-8-9c0-4 5-6 8-3z"/></svg>'
  };
  const s4HTML = () => '<section class="mg mg-process" id="s4" data-folio="12" data-sec="從採收到你家" data-tone="dark" aria-labelledby="s4-title"><div class="s4-pin">' +
    '<div class="s4-open"><div class="s4-col s4-col-l" data-depth=".4"><span class="mg-kicker">FROM HARVEST TO YOUR DOOR · P.12<span class="kana mg-kana">とどくまで</span></span><h2 class="s4-title" id="s4-title">從採收，<br>到你家</h2></div>' +
    '<figure class="s4-fig"><div class="s4-ph">' + pic(S4_OPEN[1], altOf(S4_OPEN[1], S4_OPEN[2])) + aiTag() + '</div><figcaption>開場・' + S4_OPEN[2] + '（' + AI_LABEL + '）</figcaption></figure>' +
    '<div class="s4-col s4-col-r"><p>在產地等果實熟成才採，選果、套網、裝箱，再一路冷藏送到你家。五個步驟，一步一個畫面。</p><ol class="s4-toc">' + STEPS.map((s, i) => '<li><b>' + pad(i + 1) + '</b>' + s[0] + '</li>').join('') + '</ol><span class="mark">流程依照片整理・需客戶確認</span></div></div>' +
    '<div class="s4-scene"></div></div>' +
    '<ol class="s4-list">' + STEPS.map(([t, en, d1, d2, , img, cap, mk], i) => '<li class="s4-item"><div class="s4-item-ph">' + (img ? pic(img, altOf(img, cap)) + (isAI(img) ? aiTag() : '') : '<div class="s4-wait" role="img" aria-label="冷藏配送照片待客戶提供">' + ICON.truck + '<strong>冷藏配送</strong><em>照片待客戶提供</em></div>') + '</div>' +
      '<div class="s4-item-tx"><span class="mg-outline" aria-hidden="true">' + pad(i + 1) + '</span><h3>' + t + ' <span class="sr-only">' + en + '</span></h3><p>' + d1 + d2 + '</p>' + (img ? '<span class="s4-credit' + (isAI(img) ? ' ai-credit' : '') + '">' + cap + '・' + creditOf(img) + '</span>' : '') + (mk ? '<span class="mark">' + mk + '</span>' : '') + '</div></li>').join('') + '</ol></section>';

  // ---------- S5 orchard journal ----------
  // v5: three depth planes - far (0.8x size, 2px blur, 0.7x speed), mid (1x), near (larger, sharp, 1.25x).
  const JOURNAL = [['home-peach-hands', '雙手捧著剛採的大顆水蜜桃', 1, 'mid', HAND_NOTE], ['home-grape-vine', '棚架上半套著果袋的黑葡萄', .7, 'far'], ['home-cherry-hands', '櫻桃樹下，一手一顆', 1.25, 'near'],
    ['home-peach-box15', '十五顆排好的水蜜桃，等著出貨', 1.25, 'near'], ['home-grape-box8', '八串黑葡萄，排好等出貨', .7, 'far'], ['home-peach-pink-box', '整箱粉紅色的水蜜桃', 1, 'mid']];
  const PLANE_DEPTH = { far: .15, mid: .45, near: .8 };
  const s5HTML = () => '<section class="mg mg-journal" id="s5" data-folio="18" data-sec="果園日誌" aria-labelledby="s5-title"><span class="s5-ghost mg-outline" aria-hidden="true">JOURNAL</span><div class="mg-wrap s5-grid">' +
    '<header class="s5-head"><h2 class="s5-title v" id="s5-title">果園日誌</h2><p class="s5-stamp">' + ISSUE.year + '.' + pad(MONTH) + ' · 梨園（示意）</p><p class="kana mg-kana s5-kana">季節のたより</p><p class="s5-lead">店家在產地與出貨現場隨手拍下的日常。</p><a class="hm-link" href="#origin" id="hm-journal-more">看產地故事 ↗</a></header>' +
    JOURNAL.map(([img, cap, sp, plane, note], i) => '<figure class="s5-item j' + (i + 1) + '" data-speed="' + sp + '" data-plane="' + plane + '" data-depth="' + PLANE_DEPTH[plane] + '" data-cursor="看看"><div class="s5-ph">' + pic(img, cap + '（客戶實拍）') + '</div><figcaption><span>' + esc(cap) + (note ? '<span class="mark" style="display:block;font-size:10px">' + note + '</span>' : '') + '</span><span>客戶實拍・P.' + (18 + i) + '</span></figcaption></figure>').join('') +
    '</div>' + artImg('cherry', 'mg-art s5-art a1', ' data-depth="1" data-breathe') + artImg('apple', 'mg-art s5-art a2', ' data-depth=".9" data-breathe') + fore('pear') + '</section>';

  // ---------- S6 the gift book ----------
  const OCC = [['1–2 月', '年節', '蘋果、草莓正當季，紅通通的最討喜。'], ['5 月', '母親節', '預購初夏的櫻桃，或挑一盒草莓收尾。'], ['9 月', '中秋', '葡萄與梨的季節，8 月開放預購。']];
  const s6HTML = () => '<section class="mg mg-gift" id="s6" data-folio="24" data-sec="送禮之書" aria-labelledby="s6-title"><div class="s6-pin"><span class="s6-ghost mg-outline" aria-hidden="true" data-depth=".1">GIFT</span>' +
    '<div class="s6-head"><span class="mg-kicker">THE GIFT BOOK · P.24<span class="kana mg-kana">おくりもの</span></span><h2 id="s6-title">送禮之書</h2></div>' +
    '<div class="s6-desk"><div class="s6-book">' +
    '<div class="s6-page s6-left"><span class="mg-kicker">OCCASIONS</span><h3>依季節，送一份甜</h3><ul class="s6-occ">' + OCC.map(([w, t, d], i) => '<li><span class="when">' + w + '</span><b>' + t + '</b><p>' + d + '</p></li>').join('') + '</ul><span class="mark" style="margin-top:12px">檔期為示意</span><span class="s6-pno">P.25</span><i class="s6-light"></i></div>' +
    '<div class="s6-page s6-right"><span class="mg-kicker">RECOMMENDED</span><h3>禮盒推薦</h3><div class="s6-cards">' + ['peach', 'muscat', 'apple'].map(s => '<a class="s6-card" href="#p-' + s + '" id="s6-card-' + s + '">' + artImg(s) + '<b>' + esc((SHORT[s] || [s])[0]) + '</b><span>NT$ ' + num(minPrice(BY_SLUG[s])) + ' 起</span></a>').join('') + '</div>' +
    '<a class="hm-link" href="#gift" id="hm-gift-more">看送禮專區 ↗</a><span class="mark" style="display:block;margin-top:12px">禮盒內容與價格皆為示意</span><span class="s6-pno">P.26</span><i class="s6-light"></i></div>' +
    '<div class="s6-cover"><div class="s6-front">' + pic('home-peach-giftbox', '六入水蜜桃禮盒，每顆套著白網套（客戶實拍）') + '<div class="s6-frame"><span>SHIAWASE ・ <span class="kana">しあわせ</span></span><strong>送禮之書</strong><em>GIFT BOOK · ' + ISSUE.no + '</em></div></div>' +
    '<div class="s6-back"></div></div>' +
    '<div class="s6-shadow" aria-hidden="true"></div></div></div>' + artImg('peach', 'mg-art s6-art a1', ' data-depth=".9" data-breathe') + artImg('cherry', 'mg-art s6-art a2', ' data-depth="1" data-breathe') + fore('strawberry', ' data-mob="0"') + '</div></section>';

  // ---------- S7 delivery promise + FAQ ----------
  const FAQ = [
    ['水果什麼時候出貨？', '現貨於付款後 3–5 個工作天出貨；預購的水果依產季開賣後，依訂單順序出貨。'],
    ['收到時有破損怎麼辦？', '請在到貨 24 小時內拍下外箱與受損水果的照片聯繫客服，確認後補寄或部分退款。'],
    ['可以指定到貨日嗎？', '可以指定到貨日期（不含週日與國定假日）；遇天候或產地狀況可能調整。'],
    ['收到後要怎麼保存？', '請立即開箱，依各水果的保存方式冷藏或常溫放置；每種水果的做法整理在「吃法與保存」。']
  ];
  const s7HTML = () => '<section class="mg mg-care" id="s7" data-folio="30" data-sec="安心宅配" aria-labelledby="s7-title"><span class="s7-ghost mg-outline" aria-hidden="true" data-depth=".1">30</span><div class="mg-wrap" data-depth=".3">' +
    '<div class="mg-head"><div><span class="mg-kicker">DELIVERY PROMISE · P.30<span class="kana mg-kana">あんしんして</span></span><h2 id="s7-title">安心宅配</h2></div><span class="mark">以下規則與數字皆為示意・需客戶確認</span></div>' +
    '<ul class="s7-cols">' + [['cold', '5', '°C 以下', '全程冷藏', '低溫宅配，水果離開產地後一路保持冷藏。'], ['date', '3–5', '個工作天', '指定到貨日', '付款後出貨；結帳時可選擇到貨日期，方便安排收件與送禮。'], ['care', '24', '小時內', '破損理賠', '到貨 24 小時內拍照回報，確認後補寄或部分退款。']]
      .map(([k, n, u, t, d]) => '<li>' + ICON[k] + '<p class="s7-big"><span class="s7-num">' + n + '</span><span class="s7-unit">' + u + '</span></p><h3>' + t + '</h3><p>' + d + '</p><span class="mark">示意</span></li>').join('') + '</ul>' +
    '<div class="hm-faq"><div><span class="mg-kicker">FAQ</span><h3 class="faq-h">常見問題</h3><p style="margin:18px 0 0"><a class="hm-link" href="#service" id="hm-faq-more">配送與售後 ↗</a></p></div>' +
    '<div class="hm-faq-list">' + FAQ.map(([q, a], i) => '<div class="hm-qa"><h3><button type="button" class="hm-q" id="hm-q-' + (i + 1) + '" aria-expanded="false" aria-controls="hm-a-' + (i + 1) + '">' + q + '<i aria-hidden="true"></i></button></h3><div class="hm-a" id="hm-a-' + (i + 1) + '" role="region" aria-labelledby="hm-q-' + (i + 1) + '" inert><div><p>' + a + '<span class="mark">需客戶確認</span></p></div></div></div>').join('') + '</div></div></div>' +
    artImg('orange', 'mg-art s7-art', ' data-depth=".9" data-breathe') + fore('muscat', ' data-mob="0"') + '</section>';

  // ---------- S8 back cover ----------
  const s8HTML = () => '<section class="mg mg-back" id="s8" data-folio="36" data-sec="封底" aria-labelledby="s8-line"><span class="s8-ghost mg-outline" aria-hidden="true">' + ISSUE.no + '</span><div class="mg-wrap">' +
    '<p class="s8-line" id="s8-line">挑一籃，<br>今天的新鮮。</p>' +
    '<div class="s8-basket" aria-hidden="true">' + [[-30, 18, 120], [86, 4, 180], [62, 64, 90]].map(([x, y, s]) => '<i class="s8-bokeh" style="left:' + x + '%;top:' + y + '%;width:' + s + 'px;height:' + s + 'px"></i>').join('') + fore('cherry') + '<div class="s8-bk"><img src="img/art/basket.webp" alt="" loading="lazy" decoding="async"><div class="s8-drop">' + ['peach', 'apple', 'muscat', 'cherry', 'pear'].filter(s => ART.has(s)).map(s => '<img src="img/art/' + s + '.webp" alt="" loading="lazy" decoding="async">').join('') + '</div><img class="s8-front" src="img/art/basket.webp" alt="" loading="lazy" decoding="async"></div></div>' +
    '<button type="button" class="hm-back" id="hm-back">回到選果 <span aria-hidden="true">↑</span></button><div class="s8-folio s8-oku"><img class="s8-logo" src="img/brand/shiawase-logo.svg" alt="幸 SHIAWASE" width="529" height="1068" loading="lazy" decoding="async"><dl><div><dt>誌名</dt><dd>幸 SHIAWASE <span class="kana">しあわせ</span></dd></div><div><dt>號數</dt><dd>' + ISSUE.no + '　' + ISSUE.en + ' ' + ISSUE.year + '</dd></div>' +
    '<div><dt>攝影</dt><dd>客戶實拍・部分為 AI 生成示意圖</dd></div><div><dt>發行</dt><dd>幸 SHIAWASE（網站樣稿）</dd></div></dl><p class="s8-end">P.36 — 完</p><span class="hanko" aria-hidden="true">幸</span></div>' +
    '<div class="hm-foot"><span>新鮮的事，慢慢挑。・網站樣稿，內容為示意</span><nav aria-label="首頁頁尾連結"><a href="#catalog" id="hm-f-catalog">所有商品</a><a href="#origin" id="hm-f-origin">產地故事</a><a href="#about-mockup" id="hm-f-about">樣稿說明</a><a href="#design-system" id="hm-f-ds">設計系統</a></nav></div></div></section>';

  // v5: a breathing page between shots - a 1px line that draws itself slowly, and a folio.
  const breath = no => '<div class="mg-breath" aria-hidden="true"><i></i><span>P.' + no + '</span></div>';
  more.innerHTML = s1HTML() + breath('02') + s2HTML() + breath('05') + s3HTML() + breath('11') + s4HTML() + breath('17') + s5HTML() + breath('23') + s6HTML() + breath('29') + s7HTML() + breath('35') + s8HTML();
  // v8: running head (hashira) at the top of each spread + a vertical English label in the margin
  const EDGE = { s2: 'CONTENTS', s3: 'SPECIAL FEATURE', s4: 'FROM HARVEST TO YOUR DOOR', s5: 'ORCHARD JOURNAL', s6: 'THE GIFT BOOK', s7: 'DELIVERY PROMISE', s8: 'COLOPHON' };
  $$('.mg', more).forEach(sec => { if (sec.id === 's1') return; sec.insertAdjacentHTML('beforeend', '<p class="mg-hashira" aria-hidden="true"><b>幸</b>SHIAWASE<span>' + ISSUE.no + '</span><span>' + esc(sec.dataset.sec || '') + '</span></p>' + (EDGE[sec.id] ? '<span class="mg-edge" aria-hidden="true">' + EDGE[sec.id] + '　' + sec.dataset.folio + '</span>' : '')); });
  H('#home-first').dataset.folio = 'hide';

  // FAQ: grid-rows 0fr -> 1fr gives a smooth height transition without measuring.
  more.addEventListener('click', e => {
    const q = e.target.closest('.hm-q');
    if (q) { const a = $('#' + q.getAttribute('aria-controls')), open = q.getAttribute('aria-expanded') !== 'true'; q.setAttribute('aria-expanded', String(open)); a.classList.toggle('is-open', open); a.inert = !open; }
    const go = e.target.closest('[data-goto]');
    if (go) { const t = $('#' + go.dataset.goto, more); if (t) Fx.scrollTo(t.getBoundingClientRect().top + window.scrollY, { duration: 1.6 }); }
    if (e.target.closest('#hm-back')) {
      Fx.scrollTo(0, { duration: 2, done: () => H('#fruit-title').focus({ preventScroll: true }) });
    }
  });
  H('#fruit-title').setAttribute('tabindex', '-1');

  // =====================================================================
  // MOTION — shared helpers, loop registry, site chrome (Fx) and the home scenes (HomeMotion).
  // GSAP 3.15 + ScrollTrigger + SplitText (cdnjs) and Lenis 1.3.26 (jsDelivr) are optional:
  // without them every section above is a complete, static magazine page.
  // =====================================================================
  const docEl = document.documentElement;
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const fineMQ = matchMedia('(hover: hover) and (pointer: fine)');
  const libs = () => !!(window.gsap && window.ScrollTrigger);
  const fullMotion = () => motion && !reduceMQ.matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // cubic-bezier(.16,1,.3,1) — the live site's ease (expo.out-like) — solved by bisection.
  const bezier = (x1, y1, x2, y2) => t => {
    if (t <= 0) return 0; if (t >= 1) return 1;
    const bx = u => 3 * u * (1 - u) * (1 - u) * x1 + 3 * u * u * (1 - u) * x2 + u * u * u;
    const by = u => 3 * u * (1 - u) * (1 - u) * y1 + 3 * u * u * (1 - u) * y2 + u * u * u;
    let lo = 0, hi = 1, u = t; for (let i = 0; i < 22; i++) { u = (lo + hi) / 2; if (bx(u) < t) lo = u; else hi = u; }
    return by(u);
  };
  const EASE = bezier(.16, 1, .3, 1);
  const INOUT = bezier(.65, 0, .35, 1);
  // WebKit (Safari, and every iOS browser) renders SVG filters on the CPU: measured 266 ms/frame for the
  // bleed at 1440px in WebKit 26 vs 17 ms in Chrome (reference/bleed-test.html), so WebKit gets the
  // clip-path fallback. A runtime frame-time guard also falls back anywhere the filter is too slow.
  const UA = navigator.userAgent;
  const isWebKit = /AppleWebKit/.test(UA) && !/Chrome|Chromium|Edg\//.test(UA) || /CriOS|FxiOS|EdgiOS/.test(UA);

  // One loop registry for everything per-frame (Lenis, cursor, handheld camera, skew, previews).
  // Driven by gsap.ticker when GSAP is present, else by a single requestAnimationFrame chain.
  const Loops = (() => {
    const fns = new Map();
    let raf = 0, onTicker = false, fy = null;
    // v7: the page's scroll offset is read once per frame and shared (every window.scrollY read that follows style writes
    // forces a style recalc / layout; three loops used to read it after other loops had written). Lenis hands over
    // the offset it has just scrolled to.
    const run = () => { const t = performance.now(); fy = null; for (const fn of fns.values()) fn(t); };
    const frame = () => { raf = 0; if (!fns.size) return; run(); raf = requestAnimationFrame(frame); };
    function start() {
      if (!fns.size) return;
      if (window.gsap) { if (!onTicker) { gsap.ticker.add(run); onTicker = true; } }
      else if (!raf) raf = requestAnimationFrame(frame);
    }
    function stopIfIdle() {
      if (fns.size) return;
      if (onTicker) { gsap.ticker.remove(run); onTicker = false; }
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }
    return {
      add(key, fn) { fns.set(key, fn); start(); },
      remove(key) { fns.delete(key); stopIfIdle(); },
      has: key => fns.has(key),
      count: () => fns.size,
      keys: () => [...fns.keys()],
      driven: () => (onTicker ? 1 : 0) + (raf ? 1 : 0),
      y: () => (fy === null ? (fy = window.scrollY) : fy),
      setY: v => { fy = v; }
    };
  })();
  // v7: viewport size for the per-frame loops, refreshed on resize (registered before every other resize listener)
  const VP = { w: innerWidth, h: innerHeight };
  addEventListener('resize', () => { VP.w = innerWidth; VP.h = innerHeight; });

  // =====================================================================
  // Air — v5 site-wide depth layer, all in ONE loop ('air'):
  //  · bokeh: 12 warm discs (6 on phones) drawn with soft radial gradients (no filter blur), three
  //    depths; they drift slowly, and scroll / cursor move them by depth (near ones move most);
  //  · cursor parallax: every [data-depth] (0-1) element follows the pointer, 6px (depth 0) to
  //    18px (depth 1), lerp .08; touch devices get a very light automatic drift instead;
  //  · breathing: [data-breathe] watercolours float 6px and rotate ±1.5° on 6-9 s periods, out of step.
  // Parallax and breathing write the individual `translate` / `rotate` properties, so they compose
  // with GSAP's `transform` without fighting it. Only elements inside the viewport are touched.
  // Photos in view also get the slow Ken Burns push (.kb-on, CSS animation 1 -> 1.06, 12 s).
  // =====================================================================
  const Air = (() => {
    const layer = $('#fx-air');
    // x, y (0-1 of the viewport), size (px), depth (1 near, .55 mid, .25 far)
    const SPEC = [[.08, .2, 230, 1], [.84, .12, 170, 1], [.64, .8, 210, 1], [.3, .64, 120, .55], [.9, .58, 96, .55], [.47, .3, 76, .55],
      [.2, .92, 150, 1], [.72, .38, 48, .25], [.14, .46, 58, .25], [.55, .07, 42, .25], [.38, .86, 64, .25], [.95, .86, 46, .25]];
    const MOBILE_SET = [0, 2, 3, 5, 7, 10];
    const LOOK = {
      1: 'radial-gradient(closest-side,#f4b27814 0%,#f4b2780b 50%,#f4b27800 100%)',
      .55: 'radial-gradient(closest-side,#f6be880d 0%,#f6be8812 80%,#f6be8800 100%)',
      .25: 'radial-gradient(closest-side,#facd9630 0%,#facd9612 50%,#facd9600 100%)'
    };
    // over dark shots the discs switch to brighter, creamier stops (cheaper than a screen blend)
    const LOOK_DARK = {
      1: 'radial-gradient(closest-side,#ffe4bc4d 0%,#ffd6a026 50%,#ffd6a000 100%)',
      .55: 'radial-gradient(closest-side,#fff0d81c 0%,#ffe6c42a 78%,#ffe6c430 90%,#ffe6c400 100%)',
      .25: 'radial-gradient(closest-side,#fff4e0b8 0%,#ffe8c44d 50%,#ffe8c400 100%)'
    };
    let bo = [], items = [], vis = new Set(), io = null, kio = null, dio = null, on = false, built = -1;
    const m = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPM = e => { if (e.pointerType && e.pointerType !== 'mouse') return; m.tx = e.clientX / innerWidth * 2 - 1; m.ty = e.clientY / innerHeight * 2 - 1; };
    function makeBokeh() {
      const mob = innerWidth < 768;
      if (built === (mob ? 1 : 0)) return;
      built = mob ? 1 : 0;
      const spec = mob ? MOBILE_SET.map(i => SPEC[i]) : SPEC;
      layer.innerHTML = spec.map(([, , s, d]) => '<i class="fx-bo" style="width:' + Math.round(s * (mob ? .7 : 1)) + 'px;height:' + Math.round(s * (mob ? .7 : 1)) + 'px;--bg:' + LOOK[d] + ';--bgd:' + LOOK_DARK[d] + '"></i>').join('');
      bo = $$('.fx-bo', layer).map((el, i) => { const [x, y, s, d] = spec[i]; return { el, x, y, s: s * (mob ? .7 : 1), d, ph: i * 1.7, sp: 9000 + i * 1300 }; });
    }
    function frame(t) {
      if (fineMQ.matches) { m.x += (m.tx - m.x) * .08; m.y += (m.ty - m.y) * .08; }
      else { m.x = Math.sin(t / 3100) * .35; m.y = Math.cos(t / 3900) * .3; }
      const W = VP.w, Hh = VP.h, sy = Loops.y();
      for (const b of bo) {
        const k = b.d >= 1 ? .34 : b.d > .5 ? .16 : .05, span = Hh + b.s * 2;
        const x = b.x * W + Math.sin(t / b.sp + b.ph) * 46 * b.d - m.x * (6 + 12 * b.d) * 2.2 - b.s / 2;
        const y = (((b.y * Hh - sy * k + Math.cos(t / (b.sp * 1.3) + b.ph) * 34 * b.d) % span) + span) % span - b.s - m.y * (6 + 12 * b.d) * 2.2;
        b.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      }
      for (const it of vis) {
        const px = -m.x * it.amp, py = -m.y * it.amp;
        let by = 0;
        if (it.br) { by = Math.sin(t / it.p1 * 6.2832 + it.f1) * 6; it.el.style.rotate = (Math.sin(t / it.p2 * 6.2832 + it.f2) * 1.5).toFixed(3) + 'deg'; }
        it.el.style.translate = px.toFixed(2) + 'px ' + (py + by).toFixed(2) + 'px';
      }
    }
    function clear() {
      if (io) { io.disconnect(); io = null; }
      if (kio) { kio.disconnect(); kio = null; }
      if (dio) { dio.disconnect(); dio = null; }
      items.forEach(it => { it.el.style.translate = ''; it.el.style.rotate = ''; });
      items = []; vis.clear();
    }
    // (re)collect the layered elements of the page that is on screen
    function scan(...scopes) {
      clear();
      if (!on) return;
      let n = 0;
      scopes.filter(Boolean).forEach(sc => $$('[data-depth],[data-breathe]', sc).forEach(el => {
        const d = el.hasAttribute('data-depth') ? clamp(parseFloat(el.dataset.depth) || 0, 0, 1) : 0, br = el.hasAttribute('data-breathe');
        const i = n++;
        items.push({ el, amp: el.hasAttribute('data-depth') ? 6 + 12 * d : 0, br, p1: 6000 + (i * 977) % 3000, p2: 6500 + (i * 613) % 2500, f1: i * 2.1, f2: i * 1.3 });
      }));
      const byEl = new Map(items.map(it => [it.el, it]));
      io = new IntersectionObserver(es => es.forEach(e => { const it = byEl.get(e.target); if (!it) return; if (e.isIntersecting) vis.add(it); else vis.delete(it); }), { rootMargin: '15% 0px' });
      items.forEach(it => io.observe(it.el));
      kio = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('kb-on', e.isIntersecting)), { rootMargin: '5% 0px' });
      scopes.filter(Boolean).forEach(sc => $$('.grade:not(.no-kb)', sc).forEach(g => kio.observe(g)));
      // v7: photos are decoded about a screen before they arrive, so the first frame that shows one does not wait on it
      dio = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; dio.unobserve(e.target); const im = e.target.querySelector('img'); if (im && im.decode) im.decode().catch(() => {}); }), { rootMargin: '120% 0px' });
      scopes.filter(Boolean).forEach(sc => $$('.grade', sc).forEach(g => dio.observe(g)));
    }
    function start() {
      if (on) return;
      on = true; makeBokeh();
      addEventListener('pointermove', onPM, { passive: true });
      Loops.add('air', frame);
    }
    function stop() {
      if (!on) return;
      on = false; clear(); Loops.remove('air');
      removeEventListener('pointermove', onPM);
    }
    addEventListener('resize', () => { if (on) makeBokeh(); });
    return { start, stop, scan, count: () => items.length, visible: () => vis.size, bokeh: () => bo.length };
  })();

  // Split helpers. Chars use GSAP SplitText (mask: 'chars') when loaded, else a small fallback.
  // Lines are measured once (CJK text has no spaces, so lines are grouped by each char's top).
  const splits = [];
  function splitChars(el, mask = true) {
    if (!el) return [];
    if (window.SplitText) { const s = SplitText.create(el, mask ? { type: 'chars', charsClass: 'fx-ch', mask: 'chars' } : { type: 'chars', charsClass: 'fx-ch' }); splits.push(s); return s.chars; }
    const orig = el.innerHTML, out = [];
    splits.push({ revert: () => { el.innerHTML = orig; } });
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const c of n.textContent) {
          if (/\s/.test(c)) { frag.append(c); continue; }
          const s = document.createElement('span');
          s.className = 'fx-ch'; s.style.display = 'inline-block'; s.textContent = c; out.push(s);
          if (!mask) { frag.append(s); continue; }
          const m = document.createElement('span');
          m.className = 'fx-ch-mask'; m.style.cssText = 'display:inline-block;overflow:clip';
          m.append(s); frag.append(m);
        }
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.nodeName !== 'BR') walk(n);
    });
    walk(el); return out;
  }
  function splitLines(el) {
    if (!el) return [];
    const orig = el.innerHTML, units = [];
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const c of n.textContent) { const s = document.createElement('span'); s.textContent = c; frag.append(s); units.push(s); }
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.nodeName !== 'BR') units.push(n);
    });
    const rows = [];
    let top = null;
    units.forEach(u => { const t = Math.round(u.getBoundingClientRect().top); if (top === null || Math.abs(t - top) > 4) { rows.push([]); top = t; } rows[rows.length - 1].push(u); });
    const html = rows.map(r => '<span class="fx-ln"><span>' + r.map(u => u.outerHTML).join('') + '</span></span>').join('');
    el.innerHTML = html;
    splits.push({ revert: () => { el.innerHTML = orig; } });
    return $$('.fx-ln>span', el);
  }
  const riseChars = (chars, vars = {}) => gsap.fromTo(chars, { yPercent: 112 }, { yPercent: 0, duration: .9, ease: EASE, stagger: .03, ...vars });
  // v5 headline entrance, "blur to sharp": the title racks from blur(10px) to 0 (6px on phones) as one
  // filter element (keeps the blur budget), while its characters arrive one after another and the
  // tracking closes from +0.12em to normal (as transforms, so no per-frame layout). 1.2 s.
  function blurIn(el, vars = {}, o = {}) {
    if (!el || !window.gsap) return null;
    const chars = splitChars(el, false);
    if (!chars.length) return null;
    const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize) || 48, vert = /^vertical/.test(cs.writingMode);
    const d = .12 * fs, st = o.stagger ?? .05, B = innerWidth < 768 ? 6 : 10, axis = vert ? 'y' : 'x';
    const tl = gsap.timeline(vars);
    tl.fromTo(el, { filter: 'blur(' + B + 'px)' }, { filter: 'blur(0px)', duration: 1.2 + st * (chars.length - 1) * .5, ease: EASE, onComplete: () => { el.style.filter = ''; } }, 0)
      .fromTo(chars, { opacity: 0, [axis]: i => i * d }, { opacity: 1, [axis]: 0, duration: 1.2, ease: EASE, stagger: st }, 0);
    return tl;
  }
  // body copy: line by line, fade in and rise 12px
  const riseLines = (el, trigger, vars = {}) => el && gsap.fromTo(splitLines(el), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .9, ease: EASE, stagger: .08, scrollTrigger: { trigger: trigger || el, start: 'top 82%', once: true }, ...vars });

  // =====================================================================
  // Fx — site-wide chrome: Lenis, folio + progress line, film grain, cursor, page curtain
  // =====================================================================
  const Fx = (() => {
    let lenis = null, maxScroll = 1, maxAt = 0, io = null, curtainBusy = false;
    const chrome = $('#fx-chrome'), bar = $('#fx-bar'), fNo = $('#fx-page'), fSec = $('#fx-sec'), fIssue = $('#fx-issue');
    const cursor = $('#fx-cursor'), curtain = $('#fx-curtain'), air = $('#fx-air');
    fIssue.textContent = ISSUE.mark + ' ' + ISSUE.no;

    // ----- progress line (cached max scroll; no layout reads per frame) -----
    const measure = () => { maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight); maxAt = performance.now(); };
    // v7: read the offset first, then write (the next scroll listener reuses it instead of forcing a style recalc)
    let lastY = 0;
    const onScroll = () => {
      const y = lastY = window.scrollY;
      if (performance.now() - maxAt > 1500) measure();
      bar.style.transform = 'scaleX(' + clamp(y / maxScroll, 0, 1).toFixed(4) + ')';
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', measure);

    // ----- folio: which section crosses the middle of the viewport -----
    function setFolio(el) {
      const hide = el.dataset.folio === 'hide';
      chrome.classList.toggle('is-hidden', hide);
      chrome.classList.toggle('is-dark', el.dataset.tone === 'dark');
      air.classList.toggle('is-dark', el.dataset.tone === 'dark'); // bokeh glows (screen blend) over dark shots
      if (!hide) { fNo.textContent = 'P.' + el.dataset.folio; fSec.textContent = el.dataset.sec || ''; }
    }
    function watch(nodes) {
      if (io) io.disconnect();
      if (!nodes.length) return;
      setFolio(nodes[0]);
      io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setFolio(e.target); }), { rootMargin: '-49% 0px -49% 0px' });
      nodes.forEach(n => io.observe(n));
      measure(); onScroll();
    }

    // ----- Lenis smooth scroll (synced to ScrollTrigger) -----
    function lenisOn() {
      if (lenis || !window.Lenis || !fullMotion()) return;
      try { lenis = new Lenis({ lerp: .08, smoothWheel: true, syncTouch: false, prevent: n => n.nodeName === 'DIALOG' }); } catch { lenis = null; return; }
      lenis.on('scroll', () => Loops.setY(window.scrollY));
      if (libs()) lenis.on('scroll', ScrollTrigger.update);
      Loops.add('lenis', t => { if (lenis) lenis.raf(t); });
    }
    function lenisOff() { if (!lenis) return; Loops.remove('lenis'); lenis.destroy(); lenis = null; }
    function scrollTo(y, o = {}) {
      if (lenis) { lenis.start(); lenis.scrollTo(y, { duration: o.duration ?? 1.4, easing: INOUT, lock: !!o.lock, force: true, onComplete: () => o.done && o.done() }); return; }
      const smooth = fullMotion() && !o.instant;
      window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
      if (o.done) setTimeout(o.done, smooth ? 900 : 0);
    }
    const hold = () => { if (lenis && !lenis.isStopped) lenis.stop(); };
    const release = () => { if (lenis && lenis.isStopped) lenis.start(); };
    // Touch and scrollbar drags must never meet a stopped Lenis (it cancels touchmove).
    addEventListener('touchstart', () => { if (!handing) release(); }, { passive: true, capture: true });
    addEventListener('scroll', () => { if (lastY > 4 && !handing) release(); }, { passive: true });

    // ----- cursor (fine pointers only): dot, "看看" disc over photos, shrinks on links -----
    const cur = { x: -200, y: -200, tx: -200, ty: -200, on: false, state: '' };
    const stepCursor = () => {
      cur.x += (cur.tx - cur.x) * .2; cur.y += (cur.ty - cur.y) * .2;
      cursor.style.transform = 'translate3d(' + cur.x.toFixed(1) + 'px,' + cur.y.toFixed(1) + 'px,0)';
      if (Math.abs(cur.tx - cur.x) < .2 && Math.abs(cur.ty - cur.y) < .2) Loops.remove('cursor');
    };
    const onMove = e => { if (e.pointerType !== 'mouse') return; cur.tx = e.clientX; cur.ty = e.clientY; cursor.classList.remove('is-out'); if (!Loops.has('cursor')) Loops.add('cursor', stepCursor); };
    const onOver = e => {
      const t = e.target instanceof Element ? e.target : null; if (!t) return;
      const look = t.closest('[data-cursor]'), link = !look && t.closest('a,button,summary,label,input,select,textarea,[role=button]');
      const st = look ? 'look' : link ? 'link' : '';
      if (st !== cur.state) { cursor.classList.remove('is-look', 'is-link'); if (st) cursor.classList.add('is-' + st); cur.state = st; }
      if (look) cursor.querySelector('span').textContent = look.dataset.cursor || '看看';
    };
    const onLeave = () => cursor.classList.add('is-out');
    function cursorOn() {
      if (cur.on || !fineMQ.matches || !fullMotion()) return;
      cur.on = true; docEl.classList.add('fx-cursor-on');
      addEventListener('pointermove', onMove, { passive: true }); document.addEventListener('pointerover', onOver); document.documentElement.addEventListener('pointerleave', onLeave);
    }
    function cursorOff() {
      if (!cur.on) return; cur.on = false; docEl.classList.remove('fx-cursor-on'); Loops.remove('cursor');
      removeEventListener('pointermove', onMove); document.removeEventListener('pointerover', onOver); document.documentElement.removeEventListener('pointerleave', onLeave);
    }

    // ----- page curtain: paper wipes bottom -> top (0.7 s), then the new title rises -----
    const FOLIOS = { home: ['01', '封面'], catalog: ['40', '所有商品'], origin: ['44', '產地故事'], gift: ['52', '送禮'], guide: ['56', '吃法與保存'], service: ['60', '配送與售後'], cart: ['64', '我的菜籃'], checkout: ['66', '結帳'], 'about-mockup': ['70', '樣稿說明'], 'design-system': ['72', '設計系統'] };
    const folioOf = key => /^p-/.test(key) ? ['42', (BY_SLUG[key.slice(2)] || {}).name || '商品'] : FOLIOS[key] || ['00', ''];
    const wait = (anim, ms) => Promise.race([anim.finished.catch(() => {}), new Promise(r => setTimeout(r, ms))]);
    let routedResolve = null;
    // ----- P0: a product link carries its watercolour into the product hero (FLIP over the curtain) -----
    const ART_SRC = 'img[src*="img/art/"]:not([src*="/blur/"]):not([src*="basket"])';
    function flipStart(from, key) {
      const slug = key.slice(2);
      if (!ART.has(slug)) return null;
      const src = from && (from.querySelector(ART_SRC) || (from.closest('.card,.s3-spread,.product,.p6-item,.s6-card,.guide-item,.cart-item') || from).querySelector(ART_SRC));
      const r = src && src.getBoundingClientRect();
      const g = new Image(); g.src = 'img/art/' + slug + '.webp'; g.alt = ''; g.className = 'fx-ghost fx-p0';
      g.style.zIndex = '96';
      const box = r && r.width > 8 && r.bottom > 0 && r.top < innerHeight ? r : { left: innerWidth / 2 - 90, top: innerHeight / 2 - 90, width: 180, height: 180, none: 1 };
      Object.assign(g.style, { width: box.width + 'px', height: box.height + 'px', transform: 'translate(' + box.left + 'px,' + box.top + 'px)', transformOrigin: '0 0', opacity: box.none ? '0' : '1' });
      document.body.append(g);
      if (src) src.style.visibility = 'hidden';
      return { g, box, src };
    }
    function flipLand(f) {
      const t = $('.p1-fruit', view());
      if (!t) { f.g.remove(); return null; }
      t.style.opacity = '0';
      const r = t.getBoundingClientRect(), k = r.width / f.box.width;
      const a = f.g.animate([{ transform: 'translate(' + f.box.left + 'px,' + f.box.top + 'px) scale(1) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + r.left + 'px,' + r.top + 'px) scale(' + k.toFixed(4) + ') rotate(0deg)', opacity: 1 }], { duration: 1000, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
      return wait(a, 1300).then(() => {
        t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'linear' }).finished.catch(() => {}).then(() => { t.style.opacity = ''; });
        return wait(f.g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }), 500);
      }).finally(() => { f.g.remove(); if (f.src) f.src.style.visibility = ''; t.style.opacity = ''; });
    }
    const view = () => $('#view');
    async function navigate(hash, from) {
      if (curtainBusy) return;
      curtainBusy = true;
      let flip = null;
      try {
        const key = hash.slice(1), [no, name] = folioOf(key);
        flip = /^p-/.test(key) ? flipStart(from, key) : null;
        curtain.innerHTML = '<p><small>P.' + no + ' · ' + ISSUE.mark + '</small>' + esc(name) + '<span class="hanko">幸</span></p>';
        if ($('#menu').open) $('#menu').close();
        if (H('#cart-dialog').open) H('#cart-dialog').close();
        curtain.getAnimations().forEach(a => a.cancel());
        curtain.classList.add('is-run');
        await wait(curtain.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 340, easing: 'cubic-bezier(.7,0,.3,1)', fill: 'forwards' }), 600);
        await new Promise(r => { routedResolve = r; location.hash = hash; setTimeout(r, 500); });
        const landing = flip ? flipLand(flip) : null;
        flip = null;
        await reveal();
        if (landing) await landing;
      } finally { curtainBusy = false; if (flip) { flip.g.remove(); if (flip.src) flip.src.style.visibility = ''; } }
    }
    async function reveal() {
      curtain.classList.add('is-run');
      curtain.getAnimations().forEach(a => a.cancel());
      const a = curtain.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
      titleIn();
      await wait(a, 700);
      curtain.classList.remove('is-run'); curtain.getAnimations().forEach(x => x.cancel());
    }
    // v5: the new page's title racks from blur to sharp (the product page runs its own P1 entrance)
    function titleIn() {
      if (!libs() || !fullMotion()) return;
      const h = root.hidden ? $('#view h1') : null;
      if (!h || h.closest('.pd5')) return;
      const s = window.SplitText ? SplitText.create(h, { type: 'chars', charsClass: 'fx-ch' }) : null;
      if (!s) return;
      const fs = parseFloat(getComputedStyle(h).fontSize) || 48;
      gsap.fromTo(h, { filter: 'blur(10px)' }, { filter: 'blur(0px)', duration: 1.4, ease: EASE, delay: .12, onComplete: () => { h.style.filter = ''; } });
      gsap.fromTo(s.chars, { opacity: 0, x: i => i * .12 * fs }, { opacity: 1, x: 0, duration: 1.2, ease: EASE, stagger: .05, delay: .12, onComplete: () => s.revert() });
    }
    document.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !fullMotion()) return;
      const a = e.target.closest('a[href^="#"]'); if (!a || a.target) return;
      const h = a.getAttribute('href');
      if (!/^#[a-z0-9-]+$/.test(h) || h === '#view' || h === (location.hash || '#home')) return;
      e.preventDefault(); navigate(h, a);
    });

    // ----- apply the current motion setting (toggle / reduced motion) -----
    function jump(y) { if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); }
    function apply() {
      const on = fullMotion();
      if (window.gsap) gsap.ticker.lagSmoothing(0);
      docEl.classList.toggle('fx-on', on);
      if (on) { lenisOn(); cursorOn(); Air.start(); } else { lenisOff(); cursorOff(); Air.stop(); }
    }
    function routed(key, node, first) {
      if (routedResolve) { const r = routedResolve; routedResolve = null; r(); }
      else if (!first && fullMotion()) reveal(); // back / forward: still wipe the curtain away
      if (lenis) lenis.resize();
      watch(node ? [node] : [H('#home-first'), ...$$('.mg', more)]);
    }
    if (document.fonts) document.fonts.ready.then(measure);
    return { apply, scrollTo, jump, hold, release, routed, watch, folioOf, lenis: () => lenis, curtainBusy: () => curtainBusy };
  })();

  // =====================================================================
  // v7: the S4 watercolour bleed on the GPU. The bleed was an SVG <mask> whose content ran two SVG filter chains on
  // every scroll frame (feTurbulence -> feDisplacementMap -> feGaussianBlur -> feTurbulence + feComposite +
  // feComponentTransfer for the mask, turbulence -> displacement -> blur for the rim): about 30 ms of GPU time per
  // frame on an integrated GPU. This is the same chain, primitive by primitive, in a handful of WebGL2 passes:
  //  · feTurbulence: the spec's reference Perlin noise with the same seeds (the lattice is built from the seed exactly
  //    like the spec and Skia), sampled where Chrome samples it (device pixel x + 1, y + 1);
  //  · feDisplacementMap: the 8-bit premultiplied noise is un-premultiplied (R -> x, B -> y) and the circles / ring
  //    strokes are evaluated at the displaced point;
  //  · feGaussianBlur: like Skia's GPU blur - a sigma above 4 is blurred at 4/sigma of the size (repeated bilinear
  //    halvings), keeping one texel of spread, then re-expanded bilinearly;
  //  · feComposite arithmetic (premultiplied, clamped), feFuncA slope / intercept, the mask's luminance (Rec.709);
  // every intermediate is rounded to 8 bits like the browser's own render targets. Checked against Chrome's own SVG
  // output (reference/visual-parity.md): mean error 0.1-0.4 of 255, at most a few levels along the bleed's edge.
  // The canvas draws the OUTGOING frame with alpha (1 - mask) and the rim on top of it, over the incoming frame (an
  // ordinary layer) - the same picture as "incoming frame masked over the outgoing one".
  // =====================================================================
  function S4BleedGL(canvas, cw, ch, dpr) {
    const gl = window.WebGL2RenderingContext && canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    if (!gl) return null;
    const W = Math.max(1, Math.round(cw * dpr)), H = Math.max(1, Math.round(ch * dpr)), BS = 256;
    canvas.width = W; canvas.height = H;
    // the feTurbulence lattice for a seed (SVG spec reference code: Park-Miller generator, gradients, selector shuffle)
    const lattice = seed => {
      const M = 2147483647, A = 16807, Q = 127773, R = 2836;
      let s = Math.trunc(seed);
      if (s <= 0) s = -(s % (M - 1)) + 1;
      if (s > M - 1) s = M - 1;
      const rnd = () => { s = A * (s % Q) - R * Math.trunc(s / Q); if (s <= 0) s += M; return s; };
      const grad = [0, 1, 2, 3].map(() => new Float64Array(BS * 2)), sel = [];
      for (let k = 0; k < 4; k++) for (let i = 0; i < BS; i++) {
        for (let j = 0; j < 2; j++) grad[k][i * 2 + j] = ((rnd() % (BS + BS)) - BS) / BS;
        const n = Math.hypot(grad[k][i * 2], grad[k][i * 2 + 1]);
        grad[k][i * 2] /= n; grad[k][i * 2 + 1] /= n;
      }
      for (let i = 0; i < BS; i++) sel[i] = i;
      for (let i = BS - 1; i > 0; i--) { const k = sel[i], j = rnd() % BS; sel[i] = sel[j]; sel[j] = k; }
      return { sel, grad };
    };
    const VS = '#version 300 es\nin vec2 aP; void main(){ gl_Position = vec4(aP, 0.0, 1.0); }';
    const HEAD = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
uniform sampler2D uGA, uGB; out vec4 o;
// fractalNoise, one octave, all four channels; uGA / uGB hold the gradient of lattice corner (bx, by) for channels 0-1 / 2-3
vec4 noise4(vec2 v) {
  vec2 t = v + 4096.0; vec2 ft = floor(t); ivec2 it = ivec2(ft); vec2 r0 = t - ft, r1 = r0 - 1.0;
  int bx0 = it.x & 255, bx1 = (bx0 + 1) & 255, by0 = it.y & 255, by1 = (by0 + 1) & 255;
  vec2 s = r0 * r0 * (3.0 - 2.0 * r0);
  vec4 a0 = texelFetch(uGA, ivec2(bx0, by0), 0), a1 = texelFetch(uGB, ivec2(bx0, by0), 0);
  vec4 u00 = vec4(dot(r0, a0.xy), dot(r0, a0.zw), dot(r0, a1.xy), dot(r0, a1.zw));
  vec2 q = vec2(r1.x, r0.y); a0 = texelFetch(uGA, ivec2(bx1, by0), 0); a1 = texelFetch(uGB, ivec2(bx1, by0), 0);
  vec4 u10 = vec4(dot(q, a0.xy), dot(q, a0.zw), dot(q, a1.xy), dot(q, a1.zw));
  q = vec2(r0.x, r1.y); a0 = texelFetch(uGA, ivec2(bx0, by1), 0); a1 = texelFetch(uGB, ivec2(bx0, by1), 0);
  vec4 u01 = vec4(dot(q, a0.xy), dot(q, a0.zw), dot(q, a1.xy), dot(q, a1.zw));
  a0 = texelFetch(uGA, ivec2(bx1, by1), 0); a1 = texelFetch(uGB, ivec2(bx1, by1), 0);
  vec4 u11 = vec4(dot(r1, a0.xy), dot(r1, a0.zw), dot(r1, a1.xy), dot(r1, a1.zw));
  vec4 a = u00 + s.x * (u10 - u00), b = u01 + s.x * (u11 - u01);
  return a + s.y * (b - a);
}
vec4 q8(vec4 v) { return floor(clamp(v, 0.0, 1.0) * 255.0 + 0.5) / 255.0; }
float q8(float v) { return floor(clamp(v, 0.0, 1.0) * 255.0 + 0.5) / 255.0; }
`;
    // displaced sources (device px, rows top-down): R = the mask's white circles, G = the rim's ring strokes (alpha)
    const FS_D = HEAD + `
uniform vec4 uC[5]; uniform float uBf, uSc, uSw; uniform vec4 uReg;
float disc(vec2 p, vec4 c) { return clamp(c.z - length(p - c.xy) + 0.5, 0.0, 1.0); }
float ring(vec2 p, vec4 c) { return clamp(uSw * 0.5 - abs(length(p - c.xy) - c.z) + 0.5, 0.0, 1.0); }
void main() {
  vec2 p = floor(gl_FragCoord.xy) - 12.0;
  if (p.x < uReg.x || p.y < uReg.y || p.x >= uReg.z || p.y >= uReg.w) { o = vec4(0.0); return; }
  vec4 lo = clamp((noise4((p + 1.0) * uBf) + 1.0) * 0.5, 0.0, 1.0);
  vec4 pm = q8(vec4(lo.rgb * lo.a, lo.a));
  vec3 un = pm.a > 0.0 ? pm.rgb / pm.a : vec3(0.0);
  vec2 sp = p + 0.5 + uSc * (vec2(un.r, un.b) - 0.5);
  float m = 1.0, r = 1.0;
  for (int k = 0; k < 5; k++) { m *= 1.0 - disc(sp, uC[k]); r *= 1.0 - 0.38 * ring(sp, uC[k]); }
  o = q8(vec4(1.0 - m, 1.0 - r, 0.0, 0.0));
}`;
    // bilinear rescale (clamp) of a source rectangle: target texel centre (i + .5) <- source (i + .5) * uScale
    const FS_RS = HEAD + `
uniform sampler2D uSrc; uniform vec2 uOrg, uSrcSize, uScale;
vec4 at(ivec2 Q) { Q = clamp(Q, ivec2(0), ivec2(uSrcSize) - 1); return texelFetch(uSrc, ivec2(uOrg) + Q, 0); }
void main() {
  vec2 t = gl_FragCoord.xy * uScale - 0.5; vec2 f0 = floor(t), fr = t - f0; ivec2 i0 = ivec2(f0);
  o = q8(mix(mix(at(i0), at(i0 + ivec2(1, 0)), fr.x), mix(at(i0 + ivec2(0, 1)), at(i0 + ivec2(1, 1)), fr.x), fr.y));
}`;
    // separable Gaussian (radius <= 12: sigma <= 4 by construction), transparent outside; the output may be uPad
    // texels larger on each side (the spread Skia keeps for the re-expansion)
    const FS_BLUR = HEAD + `
uniform sampler2D uSrc; uniform vec2 uDir, uLim; uniform float uK, uNorm, uR; uniform ivec2 uPad;
void main() {
  ivec2 P = ivec2(gl_FragCoord.xy) - uPad, L = ivec2(uLim) - 1, D = ivec2(uDir); vec4 s = vec4(0.0);
  for (int i = -12; i <= 12; i++) {
    float fi = float(i);
    ivec2 Q = P + D * i;
    float w = abs(fi) <= uR && Q.x >= 0 && Q.y >= 0 && Q.x <= L.x && Q.y <= L.y ? exp(-fi * fi * uK) * uNorm : 0.0;
    s += texelFetch(uSrc, clamp(Q, ivec2(0), L), 0) * w;
  }
  o = q8(s);
}`;
    // full-resolution Gaussian (sigma <= 4) over the 12-px zero-padded textures: the centre tap plus six bilinear
    // pairs per side (the same linear-sampling shortcut Skia's GPU blur uses)
    const FS_BLURL = HEAD + `
uniform sampler2D uSrc; uniform vec2 uDir, uTex; uniform vec2 uOff[6]; uniform float uWc, uWp[6];
void main() {
  vec2 c = gl_FragCoord.xy; vec4 s = texture(uSrc, c / uTex) * uWc;
  for (int i = 0; i < 6; i++) { vec2 d = uDir * uOff[i].x; s += (texture(uSrc, (c + d) / uTex) + texture(uSrc, (c - d) / uTex)) * uWp[i]; }
  o = q8(s);
}`;
    // final: mask -> outgoing frame with alpha (1 - mask), rim on top (premultiplied, into the canvas: row 0 = bottom)
    const FS_F = HEAD + `
uniform sampler2D uM, uRm, uPhoto; uniform vec2 uMSize, uMUp, uRSize, uRUp, uPhotoSize; uniform int uMLow, uRLow;
uniform vec4 uReg; uniform float uHf, uDpr, uH; uniform vec3 uRimC, uMat;
float tap(sampler2D t, vec2 sz, ivec2 Q, int c) { Q = clamp(Q, ivec2(0), ivec2(sz) - 1); vec4 v = texelFetch(t, Q, 0); return c == 0 ? v.r : v.g; }
float field(sampler2D t, vec2 sz, vec2 up, int low, ivec2 P, int c) {
  if (low == 0) return tap(t, sz, P + 12, c);
  vec2 q = (vec2(P) + 0.5 - uReg.xy) / up + 0.5; vec2 f0 = floor(q), fr = q - f0; ivec2 i0 = ivec2(f0);
  return q8(mix(mix(tap(t, sz, i0, c), tap(t, sz, i0 + ivec2(1, 0), c), fr.x), mix(tap(t, sz, i0 + ivec2(0, 1), c), tap(t, sz, i0 + ivec2(1, 1), c), fr.x), fr.y));
}
void main() {
  ivec2 P = ivec2(int(gl_FragCoord.x), int(uH) - 1 - int(gl_FragCoord.y)); vec2 p = vec2(P);
  float m = 0.0, ra = 0.0;
  if (!(p.x < uReg.x || p.y < uReg.y || p.x >= uReg.z || p.y >= uReg.w)) {
    float soft = field(uM, uMSize, uMUp, uMLow, P, 0);
    vec4 hi = clamp((noise4((p + 1.0) * uHf) + 1.0) * 0.5, 0.0, 1.0);
    hi = q8(vec4(hi.rgb * hi.a, hi.a));
    vec4 g = clamp(vec4(soft) + 0.6 * hi - 0.3, 0.0, 1.0); g.rgb = min(g.rgb, g.a); g = q8(g);
    float a2 = clamp(3.2 * g.a - 1.1, 0.0, 1.0);
    vec4 res = q8(vec4((g.a > 0.0 ? g.rgb / g.a : vec3(0.0)) * a2, a2));
    m = q8(dot(res.rgb, vec3(0.2126, 0.7152, 0.0722)));
    ra = field(uRm, uRSize, uRUp, uRLow, P, 1);
  }
  vec2 u = ((p + 0.5) / uDpr - uMat.yz) / uMat.x;
  vec3 ph = texture(uPhoto, u / uPhotoSize).rgb;
  float a = 1.0 - m;
  o = vec4(uRimC * ra + (1.0 - ra) * ph * a, ra + (1.0 - ra) * a);
}`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader'); return s; };
    const prog = fs => {
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'aP'); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
      const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, a.name); }
      return { p, u };
    };
    const P = { D: prog(FS_D), RS: prog(FS_RS), BLUR: prog(FS_BLUR), BLURL: prog(FS_BLURL), F: prog(FS_F) };
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.BLEND);
    // gradient of every lattice corner (bx, by) = gradient[sel[sel[bx] + by]] (the spec's b00 lookup), per seed:
    // GA = channels 0-1, GB = channels 2-3
    const corners = L => {
      const ga = new Float32Array(BS * BS * 4), gb = new Float32Array(BS * BS * 4), sel = i => L.sel[i % BS];
      for (let by = 0; by < BS; by++) for (let bx = 0; bx < BS; bx++) {
        const g = sel(sel(bx) + by), o = (by * BS + bx) * 4;
        ga[o] = L.grad[0][g * 2]; ga[o + 1] = L.grad[0][g * 2 + 1]; ga[o + 2] = L.grad[1][g * 2]; ga[o + 3] = L.grad[1][g * 2 + 1];
        gb[o] = L.grad[2][g * 2]; gb[o + 1] = L.grad[2][g * 2 + 1]; gb[o + 2] = L.grad[3][g * 2]; gb[o + 3] = L.grad[3][g * 2 + 1];
      }
      return [ga, gb];
    };
    const tex = (w, h, filter, fmt, data) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (fmt === 'f') gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, data);
      else if (w) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      return t;
    };
    const [loA, loB] = corners(lattice(11)).map(d => tex(BS, BS, gl.NEAREST, 'f', d)), [hiA, hiB] = corners(lattice(3)).map(d => tex(BS, BS, gl.NEAREST, 'f', d));
    const fbo = (w, h, filter) => { const t = tex(w, h, filter || gl.NEAREST); const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, f, w, h }; };
    // low-res buffers: the first halving step or the final 4/sigma size, whichever is larger, plus the kept spread
    const lowDims = sigma => [Math.max(Math.ceil(W / 2), Math.floor(W * 4 / sigma)) + 2, Math.max(Math.ceil(H / 2), Math.floor(H * 4 / sigma)) + 2];
    const [MW, MH] = lowDims(9 * dpr), [RW, RH] = lowDims(Math.max(4.01, 4 * dpr));
    const PD = 12, DW = W + 2 * PD, DH = H + 2 * PD;
    const T = { D: fbo(DW, DH, gl.LINEAR), a: fbo(MW, MH), b: fbo(MW, MH), c: 4 * dpr > 4 ? fbo(RW, RH) : null, d: 4 * dpr > 4 ? fbo(RW, RH) : null, fx: null, fy: null };
    const photos = [];
    // Gaussian taps exp(-i^2 / 2 sigma^2) over [-r, r], r = ceil(3 sigma) (<= 12 here), normalised to 1
    const kernel = sigma => { const r = Math.min(12, Math.ceil(sigma * 3)); let s = 0; for (let i = -r; i <= r; i++) s += Math.exp(-i * i / (2 * sigma * sigma)); return { r, k: 1 / (2 * sigma * sigma), norm: 1 / s }; };
    const use = (pr, t) => { gl.useProgram(pr.p); gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.f : null); gl.viewport(0, 0, t ? t.w : W, t ? t.h : H); };
    const noiseTex = (pr, a, b) => { bind(pr, 'uGA', 4, a); bind(pr, 'uGB', 5, b); };
    const bind = (pr, name, unit, t) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(pr.u[name], unit); };
    const draw = () => gl.drawArrays(gl.TRIANGLES, 0, 3);
    // separable blur of src (w x h) into b through a; pad > 0 keeps pad texels of spread on each side
    const blur = (src, w, h, sx, sy, a, b, pad) => {
      [[src, a, [1, 0], sx, [pad, 0], [w + 2 * pad, h], [w, h]], [a.t, b, [0, 1], sy, [0, pad], [w + 2 * pad, h + 2 * pad], [w + 2 * pad, h]]].forEach(([s, dst, dir, sg, pd, size, lim]) => {
        const k = kernel(sg);
        use(P.BLUR, { f: dst.f, w: size[0], h: size[1] }); bind(P.BLUR, 'uSrc', 1, s);
        gl.uniform2f(P.BLUR.u.uDir, dir[0], dir[1]); gl.uniform1f(P.BLUR.u.uR, k.r); gl.uniform1f(P.BLUR.u.uK, k.k); gl.uniform1f(P.BLUR.u.uNorm, k.norm); gl.uniform2f(P.BLUR.u.uLim, lim[0], lim[1]); gl.uniform2i(P.BLUR.u.uPad, pd[0], pd[1]);
        draw();
      });
    };
    // one channel of D blurred with sigma (device px) inside the region -> { t, size, up, low }
    const blurred = (sigma, reg, bufs) => {
      const rw = reg[2] - reg[0], rh = reg[3] - reg[1];
      if (sigma <= 4) {
        if (!T.fx) { T.fx = fbo(DW, DH, gl.LINEAR); T.fy = fbo(DW, DH, gl.LINEAR); }
        const r = Math.min(12, Math.ceil(sigma * 3)), w = []; let sum = 0;
        for (let i = 0; i <= 12; i++) { w[i] = i <= r ? Math.exp(-i * i / (2 * sigma * sigma)) : 0; sum += i ? 2 * w[i] : w[i]; }
        const off = new Float32Array(12), wp = new Float32Array(6);
        for (let k = 0; k < 6; k++) { const a = w[2 * k + 1] / sum, b = w[2 * k + 2] / sum; wp[k] = a + b; off[k * 2] = a + b > 0 ? (2 * k + 1) + b / (a + b) : 1; }
        [[T.D.t, T.fx, [1, 0]], [T.fx.t, T.fy, [0, 1]]].forEach(([src, dst, dir]) => {
          use(P.BLURL, dst); bind(P.BLURL, 'uSrc', 1, src);
          gl.uniform2f(P.BLURL.u.uDir, dir[0], dir[1]); gl.uniform2f(P.BLURL.u.uTex, DW, DH); gl.uniform2fv(P.BLURL.u.uOff, off); gl.uniform1f(P.BLURL.u.uWc, w[0] / sum); gl.uniform1fv(P.BLURL.u.uWp, wp);
          draw();
        });
        return { t: T.fy.t, size: [DW, DH], up: [1, 1], low: 0 };
      }
      const fw = Math.max(1, Math.floor(rw * 4 / sigma)), fh = Math.max(1, Math.floor(rh * 4 / sigma));
      let src = T.D.t, org = [reg[0] + PD, reg[1] + PD], sw = rw, shh = rh, k = 0;
      while (sw !== fw || shh !== fh) {
        const nw = sw > fw * 2 ? Math.max(Math.ceil(sw / 2), fw) : fw, nh = shh > fh * 2 ? Math.max(Math.ceil(shh / 2), fh) : fh, dst = bufs[k++ % 2];
        use(P.RS, { f: dst.f, w: nw, h: nh }); bind(P.RS, 'uSrc', 1, src);
        gl.uniform2f(P.RS.u.uOrg, org[0], org[1]); gl.uniform2f(P.RS.u.uSrcSize, sw, shh); gl.uniform2f(P.RS.u.uScale, sw / nw, shh / nh);
        draw(); src = dst.t; org = [0, 0]; sw = nw; shh = nh;
        if (k > 12) break;
      }
      const into = k % 2 ? [bufs[1], bufs[0]] : [bufs[0], bufs[1]]; // never blur in place
      blur(src, fw, fh, sigma * fw / rw, sigma * fh / rh, into[0], into[1], 1);
      return { t: into[1].t, size: [fw + 2, fh + 2], up: [rw / fw, rh / fh], low: 1 };
    };
    let lost = false;
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; });
    return {
      ok: () => !lost,
      has: i => !!photos[i],
      // upload frame i's bitmap once (decoded <img>); linear filtering like the compositor's own layer
      setPhoto(i, img) {
        if (lost || !img || !img.naturalWidth) return;
        const t = photos[i] ? photos[i].t : tex(0, 0, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
        photos[i] = { t, size: [img.naturalWidth, img.naturalHeight] };
      },
      // st: circles [[cx, cy, r] x5], sc, bf, reg [x0, y0, x1, y1] (user px, rounded like the SVG attributes),
      // photo index + its matrix [k, tx, ty] (user px)
      draw(st) {
        if (lost) return false;
        const ph = photos[st.photo]; if (!ph) return false;
        const reg = st.reg.map(v => Math.round(v * dpr)), c = new Float32Array(20);
        st.circles.forEach((q, i) => { c[i * 4] = q[0] * dpr; c[i * 4 + 1] = q[1] * dpr; c[i * 4 + 2] = q[2] * dpr; });
        use(P.D, T.D); noiseTex(P.D, loA, loB);
        gl.uniform4fv(P.D.u.uC, c); gl.uniform1f(P.D.u.uBf, st.bf / dpr); gl.uniform1f(P.D.u.uSc, st.sc * dpr); gl.uniform1f(P.D.u.uSw, 7 * dpr);
        gl.uniform4f(P.D.u.uReg, reg[0], reg[1], reg[2], reg[3]);
        draw();
        const M = blurred(9 * dpr, reg, [T.a, T.b]), RM = blurred(4 * dpr, reg, [T.c, T.d]);
        use(P.F, null); noiseTex(P.F, hiA, hiB);
        bind(P.F, 'uM', 1, M.t); bind(P.F, 'uRm', 2, RM.t); bind(P.F, 'uPhoto', 3, ph.t);
        gl.uniform2f(P.F.u.uMSize, M.size[0], M.size[1]); gl.uniform2f(P.F.u.uMUp, M.up[0], M.up[1]); gl.uniform1i(P.F.u.uMLow, M.low);
        gl.uniform2f(P.F.u.uRSize, RM.size[0], RM.size[1]); gl.uniform2f(P.F.u.uRUp, RM.up[0], RM.up[1]); gl.uniform1i(P.F.u.uRLow, RM.low);
        gl.uniform4f(P.F.u.uReg, reg[0], reg[1], reg[2], reg[3]); gl.uniform1f(P.F.u.uHf, .09 / dpr); gl.uniform1f(P.F.u.uDpr, dpr); gl.uniform1f(P.F.u.uH, H);
        gl.uniform3f(P.F.u.uRimC, 122 / 255, 90 / 255, 54 / 255); gl.uniform3f(P.F.u.uMat, st.mat[0], st.mat[1], st.mat[2]); gl.uniform2f(P.F.u.uPhotoSize, ph.size[0], ph.size[1]);
        draw();
        return true;
      },
      destroy() { const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); }
    };
  }

  // =====================================================================
  // HomeMotion — the eight shots. Built inside gsap.context(); kill() reverts everything
  // (ScrollTriggers, pins, splits, inline styles, loops, listeners).
  // =====================================================================
  const HomeMotion = (() => {
    let ctx = null, mode = 'none', cleanups = [], builtW = 0, builtH = 0, beforeFonts = false;
    const vel = { y: 0, v: 0, t: 0 };
    const isVisible = new WeakMap();
    let vio = null;
    const visible = el => isVisible.get(el) === true;
    const onCleanup = fn => cleanups.push(fn);
    const W = () => VP.w, Hh = () => VP.h; // v7: cached viewport (no layout read per frame)

    // ---------- S0 -> S1: the picked watercolour grows, goes soft mid-flight and lands on the S1 hero ----------
    // (v6: the stage's own copy is hidden for the flight, so the fruit is never on screen twice; the rest of
    // the stage fades with the scroll - sceneShop)
    let heroFade = { v: 1 }, renderCover = null;
    function bridge() {
      if (mode !== 'full') return;
      const src = S0.heroImg(), hero = $('#s1 .s1-fruit.is-hero', more);
      if (!src || !hero) return;
      const r = src.getBoundingClientRect(); if (!r.width) return;
      const g = document.createElement('div'), slug = src.closest('.s0-slot') ? src.closest('.s0-slot').dataset.slug : '';
      g.className = 'fx-ghost s0-ghost';
      g.innerHTML = (slug ? '<img class="s0-soft" src="' + S0.softArt(slug) + '" alt="">' : '') + '<img class="s0-sharp" src="' + esc(src.currentSrc || src.src) + '" alt="">';
      g.style.width = r.width + 'px'; g.style.height = r.height + 'px';
      document.body.append(g);
      const f = S1_FRUITS[0], mob = W() < 768, k = mob ? 1.9 : 1, z = f.z * (mob ? .62 : 1), sc = 1200 / (1200 - z);
      const w = f.s * k * W() / 100 * sc, cx = W() / 2 + (f.x / 100 * W() - W() / 2) * sc, cy = Hh() / 2 + (f.y / 100 * Hh() - Hh() / 2) * sc;
      const held = src.closest('.s0-hero') || src, show = () => { held.style.visibility = ''; }; // the fruit and its contact shadow
      held.style.visibility = 'hidden';
      gsap.set(g, { x: r.left, y: r.top, rotation: 0 });
      heroFade.v = 0; if (renderCover) renderCover();
      gsap.timeline({ onComplete: () => { g.remove(); show(); } })
        .to(g, { x: cx - w / 2, y: cy - w / 2, width: w, height: w, rotation: f.r, duration: 1.45, ease: 'expo.inOut' }, 0)
        .fromTo(g, { '--f': 1 }, { '--f': .12, duration: .6, ease: 'power2.in' }, 0)
        .to(g, { '--f': 1, duration: .6, ease: 'power2.out' }, .75)
        .to(heroFade, { v: 1, duration: .5, ease: 'none', onUpdate: () => renderCover && renderCover() }, 1.1)
        .to(g, { scale: 1.18, opacity: 0, duration: .5, ease: 'power2.out' }, 1.15);
      onCleanup(() => { g.remove(); show(); });
    }

    // ---------- shared v5 helpers ----------
    // centre of a foreground pass through one corner (sx/sy: 1 = right/bottom), u = 0..1: it enters past
    // one edge near the corner and leaves past the neighbouring edge, crossing the corner's quarter
    const cornerPath = (sx, sy, u, cw, ch, F) => [sx ? .6 * cw + (cw + .2 * F - .6 * cw) * u : .4 * cw + (-.2 * F - .4 * cw) * u,
      sy ? ch + .3 * F + (.15 * ch - ch - .3 * F) * u : -.3 * F + (.85 * ch + .3 * F) * u];
    const offTop = el => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };
    const offLeft = el => { let x = 0; for (let n = el; n; n = n.offsetParent) x += n.offsetLeft; return x; };
    // Extreme-foreground pass for a scrolling section: a pre-blurred watercolour (30-45vw) crosses one
    // corner at ~2x the scroll speed (moves (speed-1) x span relative to its section while the page
    // scrolls span viewport heights). Phones skip the passes marked data-mob="0" (half of them).
    function forePass(el, trigger, o = {}) {
      if (!el || (W() < 768 && el.dataset.mob === '0')) return;
      const sp = o.speed ?? 2, span = o.span ?? 1.3;
      gsap.fromTo(el, { y: () => (sp - 1) * span * Hh() / 2, x: () => (o.x0 ?? .05) * W(), rotation: o.r0 ?? -14, opacity: 1 },
        { y: () => -(sp - 1) * span * Hh() / 2, x: () => (o.x1 ?? -.08) * W(), rotation: o.r1 ?? 12, ease: 'none',
          scrollTrigger: { trigger, start: o.start || 'top 70%', end: () => '+=' + span * Hh(), scrub: .4, invalidateOnRefresh: true } });
    }

    // ---------- S1 cover: dolly 1600 + roll ±1.5° + two-stage focus + handheld ----------
    function sceneCover() {
      const sec = $('#s1', more); if (!sec) return;
      const stage = $('.s1-stage', sec), cam = $('.s1-cam', sec), bg = $('.s1-bg', sec), mast = $('.s1-mast', sec), world = $('.s1-world', sec);
      const mob = W() < 768, ZK = mob ? .62 : 1, DOLLY = mob ? 1100 : 1600, BLUR = mob ? 4 : 8, BGS = mob ? .55 : 1;
      const soft = $('.s1-soft', sec), dim = $('.s1-dim', sec);
      world.style.setProperty('--zk', ZK);
      const items = [...$$('.s1-fruit', sec).filter(el => !(mob && el.classList.contains('is-wide'))), ...$$('.s1-bokeh', sec)]
        .map(el => ({ el, z: Number(el.style.getPropertyValue('--z')) * ZK, b: -1, o: -1, hero: el.classList.contains('is-hero'), bokeh: el.classList.contains('s1-bokeh') }));
      const HZ = S1_FRUITS[0].z * ZK; // mid-ground plane: the first focus lands on the hero fruit
      const fo = $(':scope .s1-stage > .fx-fore', sec);
      if (fo) Object.assign(fo.style, { left: '0', top: '0', zIndex: '5' });
      const S = { p: 0 }, hh = { x: 0, y: 0, tx: 0, ty: 0 };
      let titleOn = false, roll = 0;
      const writeCam = () => { cam.style.transform = 'rotateX(' + hh.y.toFixed(3) + 'deg) rotateY(' + hh.x.toFixed(3) + 'deg) rotateZ(' + roll.toFixed(3) + 'deg)'; };
      const mLogo = $('.s1-masthead img', sec);
      const titleTl = blurIn($('.s1-title', sec), { paused: true });
      if (titleTl) titleTl.fromTo([$('.s1-sub', sec), $('.s1-cap', sec)], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .9, ease: EASE, stagger: .1 }, .35);
      const render = () => {
        const p = S.p, dz = DOLLY * p;
        world.style.transform = 'translate3d(0,0,' + dz.toFixed(1) + 'px)';
        // two-stage focus: (1) locked on the mid-ground fruit while the camera pushes in, so the
        // near fruit blur as they pass the lens; (2) a rack focus back to the orchard photo
        const f2 = INOUT(clamp((p - .42) / .4, 0, 1)), fp = (HZ + dz) * (1 - f2) - 2400 * f2;
        for (const it of items) {
          const ze = it.z + dz;
          // gone before it fills the lens (perspective 1200: ze 960 = 5x), so no giant blurred layers
          const o = clamp(1 - (ze - 760) / 200, 0, 1) * (it.hero ? heroFade.v : 1);
          if (Math.abs(o - it.o) > .004) { it.el.style.opacity = o.toFixed(3); it.el.style.visibility = o > 0 ? '' : 'hidden'; it.o = o; }
          if (it.bokeh || o <= 0) continue;
          const b = Math.round(Math.min(BLUR, Math.abs(ze - fp) * BLUR / 650) * 4) / 4;
          if (b !== it.b) { it.el.style.filter = b > 0 ? 'blur(' + b + 'px)' : 'none'; it.b = b; }
        }
        const e = INOUT(clamp((p - .4) / .45, 0, 1));
        // focus pull on the orchard: the pre-blurred, pre-graded soft frame cross-fades away (no live blur on
        // a full-screen layer); a dark veil stands in for brightness .85 -> 1
        soft.style.opacity = ((1 - e) * BGS).toFixed(3);
        dim.style.opacity = (.15 * (1 - e)).toFixed(3);
        bg.style.transform = 'translateZ(-400px) scale(' + (1.34 * (1.25 - .25 * e)).toFixed(4) + ')';
        mast.style.transform = 'translate3d(0,0,' + (400 * clamp(p / .55, 0, 1)).toFixed(1) + 'px)';
        mast.style.opacity = clamp(1 - (p - .28) / .26, 0, 1).toFixed(3);
        roll = Math.sin(p * Math.PI * 2) * 1.5; // the camera rolls ±1.5° on the push
        writeCam();
        // while the focus racks back, one pre-blurred peach sweeps past the lower-right corner (~2x)
        if (fo) {
          const u = (p - .5) / .3;
          if (u <= 0 || u >= 1) { if (fo.style.opacity !== '0') fo.style.opacity = '0'; }
          else {
            const cw = W(), ch = Hh(), F = cw * (mob ? .34 : .42), [X, Y] = cornerPath(1, 1, u, cw, ch, F);
            fo.style.opacity = '1';
            fo.style.transform = 'translate3d(' + (X - F / 2).toFixed(1) + 'px,' + (Y - F / 2).toFixed(1) + 'px,0) rotate(' + (-14 + 30 * u).toFixed(1) + 'deg)';
          }
        }
        if (p > .8 && !titleOn) { titleOn = true; if (titleTl) titleTl.timeScale(1).play(); }
        else if (p < .72 && titleOn) { titleOn = false; if (titleTl) titleTl.timeScale(1.6).reverse(); }
      };
      renderCover = render;
      onCleanup(() => { renderCover = null; heroFade.v = 1; [world, bg, mast, cam, stage, fo, soft, dim].forEach(el => el && el.removeAttribute('style')); items.forEach(it => { it.el.style.cssText = it.el.dataset.css; delete it.el.dataset.css; }); });
      items.forEach(it => { it.el.dataset.css = it.el.style.cssText; });
      gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: '+=225%', pin: true, scrub: .8 }, onUpdate: render }).to(S, { p: 1, ease: 'none', duration: 1 });
      // masthead racks into focus as the camera arrives
      if (mLogo) gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 55%', toggleActions: 'play none none reverse' } })
        .fromTo($('.s1-masthead', sec), { filter: 'blur(10px)' }, { filter: 'blur(0px)', duration: 1.6, ease: EASE, onComplete: () => { $('.s1-masthead', sec).style.filter = ''; } }, 0)
        .fromTo(mLogo, { clipPath: 'inset(0% 0% 100% 0%)', y: 18 }, { clipPath: 'inset(0% 0% -2% 0%)', y: 0, duration: 1.5, ease: EASE }, 0); // brush reveal, top to bottom
      gsap.fromTo($$('.s1-meta', sec), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: EASE, delay: .4, scrollTrigger: { trigger: sec, start: 'top 55%', toggleActions: 'play none none reverse' } });
      render();
      // S1 -> S2 "tilt down": once the cover lets go, the whole scene rises and settles back to 0.96
      const b1 = $('.mg-breath', more);
      if (b1) gsap.fromTo(stage, { scale: 1, yPercent: 0 }, { scale: .96, yPercent: -3, ease: 'none', immediateRender: false, scrollTrigger: { trigger: b1, start: 'top bottom', end: 'bottom 35%', scrub: .6 } });
      // handheld: mouse tilts the camera rig ±4° (lerp .06); touch devices drift slightly on their own
      const onPM = e => { hh.tx = (e.clientX / W() - .5) * 8; hh.ty = -(e.clientY / Hh() - .5) * 8; };
      if (fineMQ.matches) { addEventListener('pointermove', onPM, { passive: true }); onCleanup(() => removeEventListener('pointermove', onPM)); }
      Loops.add('s1-hand', t => {
        if (!visible(sec)) return;
        if (!fineMQ.matches) { hh.tx = Math.sin(t / 2600) * 1.2; hh.ty = Math.cos(t / 3400) * .8; }
        const nx = hh.x + (hh.tx - hh.x) * .06, ny = hh.y + (hh.ty - hh.y) * .06;
        if (Math.abs(nx - hh.x) + Math.abs(ny - hh.y) < .0005) return;
        hh.x = nx; hh.y = ny; writeCam();
      });
    }

    // ---------- S2 contents: tilt-down entry, static camera, lines draw, cursor-follow preview ----------
    function sceneToc() {
      const sec = $('#s2', more); if (!sec) return;
      const list = $('.s2-list', sec), lis = $$('li', list), grid = $('.s2-grid', sec);
      // S1 -> S2: the contents page comes up from below tilted 8° and levels out
      gsap.fromTo(grid, { rotateX: 8, y: 90, transformOrigin: '50% 0%' }, { rotateX: 0, y: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 12%', scrub: .6 } });
      blurIn($('.s2-title', sec), { scrollTrigger: { trigger: sec, start: 'top 72%', toggleActions: 'play none none reverse' } }, { stagger: .14 });
      gsap.fromTo(splitLines($('.s2-note', sec)), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .9, ease: EASE, stagger: .08, scrollTrigger: { trigger: sec, start: 'top 55%', once: true } });
      gsap.fromTo(lis, { '--line': 0 }, { '--line': 1, duration: 1.6, ease: EASE, stagger: .16, scrollTrigger: { trigger: list, start: 'top 80%', once: true } });
      gsap.fromTo($$('.s2-row>*:not(.s2-thumb)', list), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.1, ease: EASE, stagger: .04, clearProps: 'transform,opacity', scrollTrigger: { trigger: list, start: 'top 80%', once: true } });
      gsap.fromTo($('.s2-thumb', list), { opacity: 0, scale: .9 }, { opacity: 1, scale: 1, duration: 1.2, ease: EASE, delay: .3, clearProps: 'transform', scrollTrigger: { trigger: list, start: 'top 80%', once: true } });
      // v7: layers that share one scroll range share one ScrollTrigger (same scrub, same progress for each tween)
      const art = $('.s2-art', sec), par = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: .6 } });
      par.fromTo($('.s2-num', sec), { yPercent: -12 }, { yPercent: 22, ease: 'none', duration: 1 }, 0);
      if (art) par.fromTo(art, { y: 160, rotation: -10 }, { y: -180, rotation: 12, ease: 'none', duration: 1 }, 0);
      forePass($(':scope > .fx-fore', sec), sec, { start: 'top 20%', x0: .04, x1: -.1, r0: -10, r1: 16 });
      if (!fineMQ.matches) return;
      const peek = $('.s2-peek', sec), imgs = $$('img', peek);
      const P = { x: 0, y: 0, tx: 0, ty: 0, r: 0, on: false, s: 0 };
      const show = id => imgs.forEach(i => i.classList.toggle('is-on', i.dataset.peek === id));
      const onMove = e => { P.tx = e.clientX; P.ty = e.clientY; if (!P.on) { P.x = P.tx; P.y = P.ty; } };
      const onOver = e => { const row = e.target.closest('.s2-row'); if (!row) return; show(row.dataset.peek); P.on = true; };
      const onOut = e => { if (!list.contains(e.relatedTarget)) P.on = false; };
      list.addEventListener('pointermove', onMove); list.addEventListener('pointerover', onOver); list.addEventListener('pointerout', onOut);
      onCleanup(() => { list.removeEventListener('pointermove', onMove); list.removeEventListener('pointerover', onOver); list.removeEventListener('pointerout', onOut); peek.removeAttribute('style'); imgs.forEach(i => i.classList.remove('is-on')); });
      Loops.add('s2-peek', () => {
        const ts = P.on ? 1 : 0;
        if (!P.on && P.s < .002) return;
        P.x += (P.tx - P.x) * .1; P.y += (P.ty - P.y) * .1; P.s += (ts - P.s) * .12;
        P.r += (clamp(-(P.tx - P.x) * .06, -6, 6) - P.r) * .2;
        peek.style.opacity = P.s.toFixed(3);
        peek.style.transform = 'translate3d(' + P.x.toFixed(1) + 'px,' + P.y.toFixed(1) + 'px,0) rotate(' + P.r.toFixed(2) + 'deg) scale(' + (.86 + .14 * P.s).toFixed(3) + ')';
      });
    }

    // ---------- S3 feature: push through row 1's photo, lateral track, washes, 2x foreground ----------
    function sceneFeature() {
      const sec = $('#s3', more); if (!sec) return;
      const pin = $('.s3-pin', sec), track = $('.s3-track', sec), panels = $$('.s3-panel', track);
      const photos = $$('.s3-photo', sec), intro = $('.s3-intro', sec), open = $('.s3-open', sec);
      const wide = W() >= 900;
      const introTrig = wide ? { trigger: pin, start: 'top top', toggleActions: 'play none none reverse' } : { trigger: intro, start: 'top 50%', toggleActions: 'play none none reverse' };
      blurIn($('.s3-h', sec), { scrollTrigger: introTrig }, { stagger: .06 });
      gsap.fromTo($$('.s3-intro>p,.s3-intro .mark,.s3-intro .mg-kicker', sec), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: EASE, stagger: .1, delay: .35, scrollTrigger: { ...introTrig } });
      let hTween = null;
      if (wide) {
        const dist = () => Math.max(0, track.scrollWidth - W());
        hTween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true } });
        const layer = (el, from, to, panel, range) => el && gsap.fromTo(el, from, { ...to, ease: 'none', scrollTrigger: { trigger: panel, containerAnimation: hTween, start: range ? range[0] : 'left right', end: range ? range[1] : 'right left', scrub: true, invalidateOnRefresh: true } });
        // hold the opening frame for 45vw of travel (the intro panel is 145vw wide and its contents
        // counter-move), then the photo is left behind more slowly than the track (in-frame parallax)
        const HOLD = .45;
        gsap.fromTo([...intro.children], { x: 0 }, { x: () => HOLD * W(), ease: 'none', scrollTrigger: { trigger: intro, containerAnimation: hTween, start: 'left left', end: () => 'left ' + (-HOLD * 100) + '%', scrub: true, invalidateOnRefresh: true } });
        layer($('.grade', open), { xPercent: 0 }, { xPercent: 24 }, intro, [() => 'left ' + (-HOLD * 100) + '%', 'right left']);
        panels.forEach(panel => {
          const D = () => W() + panel.offsetWidth;
          // v7: every layer that runs over the panel's whole pass ('left right' -> 'right left', scrub true) sits in one
          // timeline with one ScrollTrigger (it was one ScrollTrigger per layer)
          const pass = gsap.timeline({ scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true, invalidateOnRefresh: true } });
          const lay = (el, from, to) => el && pass.fromTo(el, from, { ...to, ease: 'none', duration: 1 }, 0);
          lay($('.s3-wash', panel), { x: () => -.3 * D() }, { x: () => .3 * D() });                                   // colour wash: 0.4x
          // outline number: 0.6x, faded at both ends so neighbouring numbers never meet across the 40vw gaps
          const num = panel !== intro && $('.s3-num', panel);
          if (num) pass.fromTo(num, { x: () => -.2 * D() }, { x: () => .2 * D(), ease: 'none', duration: 1 }, 0)
            .fromTo(num, { opacity: 0 }, { opacity: 1, ease: 'none', duration: .28 }, 0).to(num, { opacity: 0, ease: 'none', duration: .24 }, .76);
          lay($('.s3-photo-in', panel), { xPercent: -8 }, { xPercent: 8 });                                          // in-frame counter move
          lay($('.s3-art', panel), { x: () => .175 * D(), rotation: -8 }, { x: () => -.175 * D(), rotation: 9 });    // watercolour: 1.35x
          lay($('.fx-fore', panel), { x: () => .5 * D(), y: () => Hh() * .08, rotation: -18, opacity: 1 }, { x: () => -.5 * D(), y: () => -Hh() * .34, rotation: 16, opacity: 1 }); // extreme foreground: 2x
          if (!pass.getChildren().length) pass.scrollTrigger.kill();
          const name = $('.s3-name', panel);
          if (name) {
            blurIn(name, { scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left 62%', toggleActions: 'play none none reverse' } }, { stagger: .08 });
            gsap.fromTo($$('.s3-text>p,.s3-cap', panel), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: EASE, stagger: .08, delay: .3, scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left 55%', toggleActions: 'play none none reverse' } });
          }
        });
        const q = $('.s3-q', sec);
        if (q) blurIn(q, { scrollTrigger: { trigger: q.parentNode, containerAnimation: hTween, start: 'left 70%', toggleActions: 'play none none reverse' } }, { stagger: .04 });
      } else {
        panels.forEach(panel => {
          const sc = { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: .6 };
          const num = $('.s3-num', panel), inner = $('.s3-photo-in', panel), art = $('.s3-art', panel), wash = $('.s3-wash', panel);
          // v7: the panel's parallax layers share one ScrollTrigger (same range, same scrub)
          const pass = gsap.timeline({ scrollTrigger: sc });
          if (num && panel !== intro) pass.fromTo(num, { y: -60 }, { y: 90, ease: 'none', duration: 1 }, 0);
          if (wash) pass.fromTo(wash, { yPercent: -18 }, { yPercent: 18, ease: 'none', duration: 1 }, 0);
          if (inner) pass.fromTo(inner, { yPercent: -6 }, { yPercent: 6, ease: 'none', duration: 1 }, 0);
          if (art) pass.fromTo(art, { y: 140, rotation: -8 }, { y: -140, rotation: 8, ease: 'none', duration: 1 }, 0);
          if (!pass.getChildren().length) pass.scrollTrigger.kill();
          forePass($('.fx-fore', panel), panel, { start: 'top 60%', span: 1.1, x0: .3, x1: .1 });
          const name = $('.s3-name', panel);
          if (name) blurIn(name, { scrollTrigger: { trigger: panel, start: 'top 70%', toggleActions: 'play none none reverse' } }, { stagger: .08 });
        });
        const q = $('.s3-q', sec);
        if (q) blurIn(q, { scrollTrigger: { trigger: q, start: 'top 80%', toggleActions: 'play none none reverse' } }, { stagger: .04 });
      }
      // S2 -> S3 "push through": row 1's photo grows from its thumbnail into the feature's opening
      // frame (FLIP: a fixed ghost interpolates the live thumbnail rect to the live target rect).
      const thumb = $('#s2 .s2-thumb', more);
      if (thumb && open) {
        const flip = document.createElement('div');
        flip.className = 'fx-flip'; flip.setAttribute('aria-hidden', 'true');
        flip.innerHTML = '<span class="grade"><span class="gk"><img src="img/' + S3_OPEN + '.webp" alt="" decoding="async"></span></span><i class="fx-flip-shade"></i>';
        document.body.append(flip);
        onCleanup(() => flip.remove());
        const tImg = $('img', thumb), shade = $('.fx-flip-shade', flip), G = {};
        const measure = () => {
          G.tx = offLeft(thumb); G.tw = thumb.offsetWidth; G.th = thumb.offsetHeight; G.tDoc = offTop(thumb) - G.th / 2; // translate: 0 -50%
          if (wide) { G.ox = 0; G.ow = W(); G.oh = Hh(); G.oDoc = hTween.scrollTrigger.start; }
          else { G.ox = offLeft(open); G.ow = open.offsetWidth; G.oh = open.offsetHeight; G.oDoc = offTop(open); }
          G.s0 = G.tDoc + G.th / 2 - Hh() * .42; G.s1 = Math.max(G.s0 + 10, G.oDoc);
        };
        ScrollTrigger.addEventListener('refresh', measure);
        onCleanup(() => { ScrollTrigger.removeEventListener('refresh', measure); tImg.style.opacity = ''; open.style.visibility = ''; });
        measure();
        let active = false;
        Loops.add('s3-flip', () => {
          const sy = Loops.y(), p = (sy - G.s0) / (G.s1 - G.s0);
          // while the ghost travels, the real thumbnail and the real opening frame stay hidden (no double image)
          if (p <= 0 || p >= 1) { if (active) { active = false; flip.style.visibility = 'hidden'; tImg.style.opacity = ''; open.style.visibility = ''; } return; }
          if (!active) { active = true; flip.style.visibility = 'visible'; tImg.style.opacity = '0'; open.style.visibility = 'hidden'; }
          const e = INOUT(p), ty = G.tDoc - sy, oy = G.oDoc - sy;
          flip.style.transform = 'translate3d(' + (G.tx + (G.ox - G.tx) * e).toFixed(1) + 'px,' + (ty + (oy - ty) * e).toFixed(1) + 'px,0)';
          flip.style.width = (G.tw + (G.ow - G.tw) * e).toFixed(1) + 'px';
          flip.style.height = (G.th + (G.oh - G.th) * e).toFixed(1) + 'px';
          shade.style.opacity = wide ? e.toFixed(3) : '0';
        });
      }
      // velocity skew (max ±3°), back to 0 when the scroll stops
      let k = 0;
      Loops.add('s3-skew', () => {
        if (!visible(sec)) return;
        const target = clamp(vel.v * .06, -3, 3), n = k + (target - k) * .14;
        if (Math.abs(n - k) < .002 && Math.abs(target) < .01) { if (k !== 0) { k = 0; photos.forEach(p => { p.style.transform = ''; }); } return; }
        k = n; const s = 'skewX(' + (-k).toFixed(3) + 'deg)';
        photos.forEach(p => { p.style.transform = s; });
      });
      onCleanup(() => photos.forEach(p => { p.style.transform = ''; }));
    }

    // ---------- S4 harvest -> door: dolly-zoom opening, then a fixed camera that pans each photo,
    //            watercolour bleeds between steps, a foreground pass per step, and a sinking exit ----------
    let bleedMode = isWebKit ? 'clip' : 'svg';
    function sceneProcess() {
      const sec = $('#s4', more); if (!sec) return;
      const pin = $('.s4-pin', sec), scene = $('.s4-scene', sec);
      const cw = W(), ch = Hh(), mob = cw < 768, portrait = ch > cw * 1.05, N = STEPS.length;
      // v5.1: layer 0 is the opening frame (AI orchard), layers 1..N are the five steps
      const LAY = [['', '', '', '', S4_OPEN[0], S4_OPEN[1], S4_OPEN[2], ''], ...STEPS], NL = LAY.length, AIL = LAY.map(s => isAI(s[5]));
      const NS = 'http://www.w3.org/2000/svg';
      const lobes = [[0, 0, 1], [.55, -.32, .62], [-.6, .3, .55], [.25, .58, .5], [-.38, -.5, .48]];
      const origins = [[.5, .5], [.42, .55], [.36, .58], [.66, .42], [.46, .52], [.58, .5]];
      const filt = (id, blur, fine) => '<filter id="' + id + '" class="s4-fr" filterUnits="userSpaceOnUse" x="0" y="0" width="' + cw + '" height="' + ch + '" color-interpolation-filters="sRGB">' +
        '<feTurbulence class="s4-tb" type="fractalNoise" baseFrequency="0.006" numOctaves="1" seed="11" result="lo"/>' +
        '<feDisplacementMap class="s4-dp" in="SourceGraphic" in2="lo" scale="120" xChannelSelector="R" yChannelSelector="B" result="d"/>' +
        '<feGaussianBlur in="d" stdDeviation="' + blur + '" result="soft"/>' +
        (fine ? '<feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="1" seed="3" result="hi"/><feComposite in="soft" in2="hi" operator="arithmetic" k1="0" k2="1" k3="0.6" k4="-0.3" result="g"/><feComponentTransfer in="g"><feFuncA type="linear" slope="3.2" intercept="-1.1"/></feComponentTransfer>' : '') + '</filter>';
      const circles = cls => lobes.map(() => '<circle class="' + cls + '" r="0"/>').join('');
      // v7: every frame of the stage is its own composited layer instead of one big SVG that was re-rastered on every
      // scroll frame (photos + mask + rim). A photo is an <img> sized exactly like <image preserveAspectRatio="xMidYMid
      // slice"> (cover, centred) whose push/pan is a compositor transform (will-change: no re-raster while it moves);
      // the bleeding frame's wrapper references the very same SVG <mask> (CSS mask), so only the mask layer is
      // re-rastered while a bleed runs. The rim keeps its own filtered SVG on top. Same pixels, far less raster work.
      const vbox = '<svg viewBox="0 0 ' + cw + ' ' + ch + '" aria-hidden="true" focusable="false">';
      const layer = (s, i) => {
        if (!s[4]) {
          const fw = cw * .88, fh = ch * .8, ix = cw * .06, iy = ch * .1, sc = Math.min(cw, ch) / 520;
          return '<div class="s4-l" data-k="' + i + '" style="display:none">' + vbox + '<rect width="' + cw + '" height="' + ch + '" fill="#303b24"/><rect x="' + ix + '" y="' + iy + '" width="' + fw + '" height="' + fh + '" fill="none" stroke="#f7f2e7" stroke-opacity=".45"/>' +
            '<g transform="translate(' + (cw * (mob ? .5 : .32) - 32 * sc * 1.6) + ' ' + (ch * (mob ? .3 : .42) - 32 * sc * 1.6) + ') scale(' + (sc * 1.6) + ')" fill="none" stroke="#f7f2e7" stroke-width="' + (1 / (sc * 1.6)) + '" stroke-linecap="round" stroke-linejoin="round">' + ICON.truck.replace(/^<svg[^>]*>|<\/svg>$/g, '') + '</g>' +
            '<text x="' + cw * (mob ? .5 : .32) + '" y="' + (ch * (mob ? .3 : .42) + 90 * sc) + '" text-anchor="middle" fill="#e9b49c" font-size="' + Math.round(12 * Math.max(1, sc * .8)) + '" letter-spacing="4" font-family="Noto Sans TC, sans-serif">照片待客戶提供</text></svg></div>';
        }
        // v5: graded bitmaps (build_images.py bakes the .grade look in; a CSS grade here would cost a pass per frame)
        const href = 'img/' + (portrait ? 's4gp-' : 's4g-') + s[4].slice(3) + '.webp';
        // v7: the stage bitmaps are fetched when the section comes near (first load no longer carries ~1 MB of them)
        return '<div class="s4-l" data-k="' + i + '" style="display:none"><img class="s4-im" data-src="' + href + '" alt="" draggable="false" decoding="async"></div>';
      };
      const FG = ['cherry', 'apple', 'muscat', 'peach', 'orange'];
      const openCredit = '開場　' + S4_OPEN[2] + '・' + AI_LABEL;
      scene.innerHTML = '<div class="s4-media"><svg class="s4-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' + filt('s4wc', 9, true) + filt('s4wr', 4, false) +
        '<mask id="s4m" maskUnits="userSpaceOnUse" x="0" y="0" width="' + cw + '" height="' + ch + '"><g filter="url(#s4wc)" fill="#fff">' + circles('s4-lb') + '</g></mask>' +
        '<clipPath id="s4c"><polygon class="s4-poly" points="0,0"/></clipPath></defs></svg><div class="s4-vb" style="width:' + cw + 'px;height:' + ch + 'px">' + LAY.map(layer).join('') +
        '<canvas class="s4-gl" aria-hidden="true"></canvas><div class="s4-rimbox">' + vbox + '<g class="s4-rim" filter="url(#s4wr)" fill="none" stroke="#7a5a36" stroke-opacity=".38" stroke-width="7" style="display:none">' + circles('s4-rk') + '</g></svg></div></div><div class="s4-shade"></div><div class="s4-veil"></div>' + aiTag('s4-ai') + '</div>' +
        '<div class="s4-stepbox" data-depth=".45">' + STEPS.map(([t, en, d1, d2, , , , mk], i) => '<div class="s4-step" data-k="' + i + '"><span class="s4-no" aria-hidden="true">' + pad(i + 1) + '</span><h3 class="v">' + t + '<span class="sr-only"> ' + en + '</span></h3><p><span class="fx-ln"><span>' + d1 + '</span></span><span class="fx-ln"><span>' + d2 + '</span></span>' + (mk ? '<small>' + mk + '</small>' : '') + '</p></div>').join('') + '</div>' +
        '<div class="s4-dots" aria-hidden="true">' + STEPS.map(() => '<i></i>').join('') + '<span>' + openCredit + '</span></div><span class="s4-cap" aria-hidden="true"></span>' +
        '<img class="s4-fly" src="img/art/peach.webp" alt="" draggable="false" data-depth=".95">' +
        FG.map((f, i) => '<img class="fx-fore s4-fore" data-k="' + i + '" src="' + blurArt(f) + '" alt="" draggable="false"' + (mob && i % 2 ? ' hidden' : '') + '>').join('');
      onCleanup(() => { scene.innerHTML = ''; });
      const media = $('.s4-media', scene), shade = $('.s4-shade', scene), veil = $('.s4-veil', scene), layers = $$('.s4-l', scene);
      const lb = $$('.s4-lb', scene), rk = $$('.s4-rk', scene), rim = $('.s4-rim', scene), poly = $('.s4-poly', scene);
      const tbs = $$('.s4-tb', scene), dps = $$('.s4-dp', scene), frs = $$('.s4-fr', scene);
      const stepbox = $('.s4-stepbox', scene), steps = $$('.s4-step', scene), dotsBox = $('.s4-dots', scene), dots = $$('.s4-dots i', scene), counter = $('.s4-dots span', scene), cap = $('.s4-cap', scene), fly = $('.s4-fly', scene);
      const colL = $('.s4-col-l', sec), fgs = $$('.s4-fore', scene), aiEl = $('.s4-ai', scene);
      // the old root <svg viewBox="0 0 cw ch" preserveAspectRatio="xMidYMid slice"> filled .s4-media: the frame box
      // .s4-vb (cw x ch) gets the same uniform scale and centring (identity whenever the stage is the viewport size)
      const vb = $('.s4-vb', scene);
      const fitBox = () => {
        const mw = media.clientWidth || cw, mh = media.clientHeight || ch, k = Math.max(mw / cw, mh / ch);
        const x = (mw - cw * k) / 2, y = (mh - ch * k) / 2;
        vb.style.transform = Math.abs(k - 1) < 1e-4 && Math.abs(x) < .01 && Math.abs(y) < .01 ? '' : 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) scale(' + k.toFixed(5) + ')';
      };
      fitBox();
      ScrollTrigger.addEventListener('refresh', fitBox);
      onCleanup(() => ScrollTrigger.removeEventListener('refresh', fitBox));
      // photo frames: the <img> keeps its natural pixel size at (0,0) and one matrix maps it the way the old
      // <image width=cw height=ch preserveAspectRatio="xMidYMid slice" transform="translate(..) scale(s) translate(..)">
      // did (cover scale c and centring x0/y0, then the push/pan) - no fractional layout box, so nothing is snapped
      const ims = layers.map(l => $('.s4-im', l));
      const cover = im => {
        const nw = im.naturalWidth, nh = im.naturalHeight; if (!nw || !nh) return;
        const c = Math.max(cw / nw, ch / nh);
        im._cv = { c, x0: (cw - nw * c) / 2, y0: (ch - nh * c) / 2 };
        im.style.width = nw + 'px'; im.style.height = nh + 'px';
        if (im._last) setIm(im, ...im._last);
      };
      const setIm = (im, s, px, py) => {
        im._last = [s, px, py];
        const v = im._cv; if (!v) return;
        const S = +s.toFixed(4), A = +(cw / 2 + px).toFixed(1), B = +(ch / 2 + py).toFixed(1);
        const tf = 'matrix(' + (S * v.c).toFixed(6) + ',0,0,' + (S * v.c).toFixed(6) + ',' + (A + S * (v.x0 - cw / 2)).toFixed(3) + ',' + (B + S * (v.y0 - ch / 2)).toFixed(3) + ')';
        if (im._tf !== tf) { im._tf = tf; im.style.transform = tf; }
      };
      ims.forEach(im => { if (!im) return; if (im.complete && im.naturalWidth) cover(im); else im.addEventListener('load', () => cover(im), { once: true }); });
      // decode every frame of the stage before the section arrives (a first bleed must not wait on a decode)
      // v7: the bleed runs on the GPU when WebGL2 is there (S4BleedGL); otherwise the CSS mask / clip-path paths below
      const glc = $('.s4-gl', scene);
      let glb = null;
      if (bleedMode === 'svg' && glc) { try { glb = S4BleedGL(glc, cw, ch, devicePixelRatio || 1); } catch (err) { glb = null; } }
      onCleanup(() => { if (glb) glb.destroy(); glb = null; });
      // the outgoing frames (0..NL-2) are textures for the GPU bleed: uploaded one per idle slot after decoding
      const idle = window.requestIdleCallback ? fn => requestIdleCallback(fn, { timeout: 250 }) : fn => setTimeout(fn, 60);
      let upQ = [], upT = 0;
      const pump = () => { upT = 0; const j = upQ.shift(); if (j === undefined || !glb) return; glb.setPhoto(j, ims[j]); if (upQ.length) upT = idle(pump); };
      onCleanup(() => { upQ = []; if (upT && window.cancelIdleCallback) cancelIdleCallback(upT); });
      const dio = new IntersectionObserver(es => {
        if (!es.some(e => e.isIntersecting)) return;
        dio.disconnect();
        ims.forEach((im, j) => {
          if (!im) return;
          if (!im.getAttribute('src')) im.src = im.dataset.src;
          if (!im.decode) return;
          im.decode().then(() => { if (glb && j < NL - 1) { upQ.push(j); if (!upT) upT = idle(pump); } }).catch(() => {});
        });
      }, { rootMargin: '200% 0px' });
      dio.observe(sec);
      onCleanup(() => dio.disconnect());
      // step texts: chars per name (blur-to-sharp), lines per description
      const stepChars = steps.map(s => splitChars($('h3', s), false));
      const stepNos = $$('.s4-no', scene), stepH = steps.map(s => $('h3', s));
      let shown = -1;
      function showStep(k) {
        if (k === shown) return;
        const prev = shown; shown = k;
        if (prev >= 0) gsap.to([stepChars[prev], stepNos[prev], $$('.fx-ln>span', steps[prev])].flat(), { yPercent: -60, opacity: 0, duration: .32, ease: 'power2.in', overwrite: true, onComplete: () => { if (shown !== prev) steps[prev].classList.remove('is-on'); } });
        dots.forEach((d, i) => d.classList.toggle('is-on', i === k));
        // -1 = opening frame, -2 = sinking exit (the row is fading out: keep its last text)
        if (k < 0) { cap.textContent = ''; if (k === -1) counter.textContent = openCredit; return; }
        steps[k].classList.add('is-on');
        // v5: one line of small type for the frame - progress and the photo credit share the dots row
        // (v5.1: AI scenario images are credited as such; the .s4-ai label on the picture covers the bleeds too)
        counter.textContent = pad(k + 1) + ' / ' + pad(N) + '　' + (STEPS[k][6] ? STEPS[k][6] + '・' + creditOf(STEPS[k][5]) : '照片待客戶提供');
        cap.textContent = '';
        const d0 = prev >= 0 ? .3 : 0, fs = parseFloat(getComputedStyle(stepH[k]).fontSize) || 80;
        gsap.fromTo(stepNos[k], { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, ease: EASE, delay: d0, overwrite: true });
        gsap.fromTo(stepH[k], { filter: 'blur(' + (mob ? 6 : 10) + 'px)' }, { filter: 'blur(0px)', duration: 1.3, ease: EASE, delay: d0 + .04, overwrite: true, onComplete: () => { stepH[k].style.filter = ''; } });
        gsap.fromTo(stepChars[k], { yPercent: 0, y: i => i * .12 * fs, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: EASE, stagger: .06, delay: d0 + .04, overwrite: true });
        gsap.fromTo($$('.fx-ln>span', steps[k]), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .9, ease: EASE, stagger: .08, delay: d0 + .2, overwrite: true });
      }
      // bleed renderers (unchanged from v4.1)
      const R = j => { const [ox, oy] = origins[j]; return Math.hypot(Math.max(ox, 1 - ox) * cw, Math.max(oy, 1 - oy) * ch) + 140; };
      let masked = -1, slow = 0, lastT = 0, glShown = false;
      // the GPU path can take bleed j when frame j - 1 (the outgoing one) is uploaded
      const gpuFor = j => !!(glb && bleedMode === 'svg' && glb.ok() && glb.has(j - 1) && ims[j - 1] && ims[j - 1]._cv);
      function showGl(on) { if (on !== glShown) { glShown = on; glc.style.display = on ? 'block' : ''; } }
      function setBleed(j, f) {
        const [ox, oy] = origins[j], cx = ox * cw, cy = oy * ch, r = R(j) * f, gpu = gpuFor(j);
        if (masked !== j || (gpu ? masked >= 0 && !glShown : glShown)) {
          clearBleed(); masked = j;
          if (gpu) showGl(true);
          else if (bleedMode === 'svg') { layers[j].style.mask = 'url(#s4m)'; rim.style.display = ''; } else layers[j].style.clipPath = 'url(#s4c)';
        }
        if (bleedMode === 'svg') {
          // the same rounded values the SVG attributes always carried feed both renderers
          const cs = lobes.map(([dx, dy, k], i) => [(cx + dx * r * .75).toFixed(1), (cy + dy * r * .75).toFixed(1), Math.max(0, r * k * (i ? .9 + .1 * Math.sin(f * 6 + i + j) : 1)).toFixed(1)]);
          const sc = Math.min(150, 40 + r * .2).toFixed(1), bf = (.0055 + .0015 * Math.sin(f * Math.PI * 2 + j)).toFixed(4);
          const m = r * 1.35 + 90, x0 = Math.max(0, cx - m), y0 = Math.max(0, cy - m), x1 = Math.min(cw, cx + m), y1 = Math.min(ch, cy + m);
          const rx = x0.toFixed(0), ry = y0.toFixed(0), rwd = Math.max(1, x1 - x0).toFixed(0), rht = Math.max(1, y1 - y0).toFixed(0);
          if (gpu) {
            const v = ims[j - 1]._cv, [s0, px, py] = ims[j - 1]._last, S = +s0.toFixed(4), A = +(cw / 2 + px).toFixed(1), B = +(ch / 2 + py).toFixed(1);
            glb.draw({ circles: cs.map(q => q.map(Number)), sc: +sc, bf: +bf, reg: [+rx, +ry, +rx + +rwd, +ry + +rht], photo: j - 1, mat: [S * v.c, A + S * (v.x0 - cw / 2), B + S * (v.y0 - ch / 2)] });
          } else {
            cs.forEach(([x, y, rr], i) => {
              lb[i].setAttribute('cx', x); lb[i].setAttribute('cy', y); lb[i].setAttribute('r', rr);
              rk[i].setAttribute('cx', x); rk[i].setAttribute('cy', y); rk[i].setAttribute('r', rr);
            });
            dps.forEach(d => d.setAttribute('scale', sc)); tbs.forEach(t => t.setAttribute('baseFrequency', bf));
            frs.forEach(fl => { fl.setAttribute('x', rx); fl.setAttribute('y', ry); fl.setAttribute('width', rwd); fl.setAttribute('height', rht); });
          }
          // frame-time guard: if the bleed cannot keep up here, switch to the clip-path fallback
          const now = performance.now(), dt = now - lastT; lastT = now;
          if (dt > 45 && dt < 400) { if (++slow > 8) { bleedMode = 'clip'; const keep = masked; clearBleed(); masked = -1; setBleed(keep, f); } } else slow = Math.max(0, slow - 1);
        } else {
          const pts = [], n = 72;
          for (let a = 0; a < n; a++) {
            const th = a / n * Math.PI * 2, w = 1 + .07 * Math.sin(3 * th + f * 4 + j) + .045 * Math.sin(5 * th - f * 3) + .03 * Math.sin(9 * th + f * 6);
            pts.push((cx + Math.cos(th) * r * w).toFixed(1) + ',' + (cy + Math.sin(th) * r * w).toFixed(1));
          }
          poly.setAttribute('points', pts.join(' '));
        }
      }
      function clearBleed() {
        if (masked >= 0 && layers[masked]) { layers[masked].style.mask = ''; layers[masked].style.clipPath = ''; }
        if (masked >= 0 || glShown) { rim.style.display = 'none'; showGl(false); }
        masked = -1;
      }
      // timeline in screen heights (desktop): dolly .6 + hold .3 + 5 x (bleed 1.2 + hold .3) + sink .6 = 9
      // (v5.1: one more bleed - the opening orchard now has its own frame before step 1; phones keep the .88 ratio)
      const DZ = .6, HOLD = .3, BL = 1.2, GAP = .3, SINK = .6, TOT = DZ + HOLD + (NL - 1) * (BL + GAP) + SINK, LEN = TOT * (mob ? .88 : 1);
      const bleedAt = j => DZ + HOLD + (j - 1) * (BL + GAP);
      const CORNER = [[1, 1], [0, 0], [0, 1], [1, 0], [1, 1]];
      const T = { open: 0, k: 0, sink: 0, t: 0 };
      let lastVis = '', lastShow = '';
      const draw = () => {
        const o = T.open, eo = INOUT(o), k = T.k, es = INOUT(T.sink), tt = T.t;
        // dolly zoom: the orchard grows while the foreground fruit shrinks - the space stretches
        const flyOut = clamp((tt - DZ) / .5, 0, 1);
        fly.style.transform = 'translate3d(' + (cw * (mob ? .02 + .08 * eo : .18 + .07 * eo)).toFixed(1) + 'px,' + (ch * (mob ? .06 + .12 * eo : .04 + .14 * eo) - ch * .1 * flyOut).toFixed(1) + 'px,0) rotate(' + (-10 + 18 * eo).toFixed(2) + 'deg) scale(' + (1.6 - .95 * eo).toFixed(3) + ')';
        fly.style.opacity = (1 - flyOut).toFixed(3);
        colL.style.opacity = clamp(1 - (o - .45) / .45, 0, 1).toFixed(3);
        colL.style.transform = 'translate3d(0,' + (-ch * .06 * eo).toFixed(1) + 'px,0)';
        shade.style.opacity = (.62 + .38 * eo).toFixed(3);
        veil.style.opacity = (1 - eo).toFixed(3); // a left-hand veil keeps the opening title legible
        // layers: i fully in, i+1 bleeding in with progress f
        const i = Math.min(NL - 1, Math.floor(k + 1e-6)), f = k - i, bleeding = f > .001 && i + 1 < NL;
        const vis = layers.map((l, j) => (j === i || (j === i + 1 && f > .001) ? '1' : '0')).join('');
        // v5.1: the AI label stays on whenever any AI picture is on screen, including half-way through a bleed
        if (vis !== lastVis) { aiEl.classList.toggle('is-on', AIL.some((a, j) => a && vis[j] === '1')); lastVis = vis; }
        // each photo: slow push (Ken Burns) + the camera pans across it (alternating direction)
        layers.forEach((l, j) => {
          const im = ims[j];
          if (vis[j] !== '1' || !im) return;
          const life = clamp((k - j + 1) / 2, 0, 1), dir = j % 2 ? -1 : 1;
          const s = j === 0 ? 1 + .26 * eo + .06 * clamp(k / 1.5, 0, 1) : 1.08 + .06 * life;
          const px = dir * (life - .5) * .05 * cw * (j === 0 ? Math.min(1, k * 2) : 1), py = (life - .5) * .02 * ch;
          setIm(im, s, px, py);
        });
        // v7: during a GPU bleed the canvas paints the outgoing frame, so only the incoming one stays a layer
        const gpu = bleeding && gpuFor(i + 1);
        const show = layers.map((l, j) => (gpu ? j === i + 1 : vis[j] === '1') ? '1' : '0').join('');
        if (show !== lastShow) { layers.forEach((l, j) => { l.style.display = show[j] === '1' ? '' : 'none'; }); lastShow = show; }
        if (bleeding) setBleed(i + 1, f); else clearBleed();
        showStep(o < .98 ? -1 : es > .45 ? -2 : Math.max(-1, Math.min(N - 1, Math.floor(k + .62) - 1)));
        // a blurred watercolour sweeps past one corner for every step (2x: across in half a screen)
        const F = cw * (mob ? .34 : .42);
        fgs.forEach((g, j) => {
          if (g.hidden) return;
          const u = (tt - (j ? bleedAt(j) + .3 : .42)) / .55;
          if (u <= 0 || u >= 1) { if (g.style.opacity !== '0') g.style.opacity = '0'; return; }
          const [X, Y] = cornerPath(CORNER[j][0], CORNER[j][1], u, cw, ch, F);
          g.style.opacity = '1';
          g.style.transform = 'translate3d(' + (X - F / 2).toFixed(1) + 'px,' + (Y - F / 2).toFixed(1) + 'px,0) rotate(' + (-16 + 30 * u).toFixed(1) + 'deg)';
        });
        // S4 -> S5 "crane up": the last frame sinks and fades while the journal rises from below
        media.style.transform = es ? 'translate3d(0,' + (es * ch * .38).toFixed(1) + 'px,0)' : '';
        media.style.opacity = (1 - es).toFixed(3);
        stepbox.style.opacity = dotsBox.style.opacity = cap.style.opacity = (1 - Math.min(1, es * 1.6)).toFixed(3);
      };
      const tl = gsap.timeline({ scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + Hh() * LEN, pin: true, scrub: .7, invalidateOnRefresh: true }, onUpdate: draw });
      tl.to(T, { open: 1, duration: DZ, ease: 'none' }).to({}, { duration: HOLD });
      for (let j = 1; j < NL; j++) tl.to(T, { k: j, duration: BL, ease: 'none' }).to({}, { duration: GAP });
      tl.to(T, { sink: 1, duration: SINK, ease: 'none' });
      tl.to(T, { t: TOT, duration: TOT, ease: 'none' }, 0);
      blurIn($('.s4-title', sec), { scrollTrigger: { trigger: sec, start: 'top 62%', toggleActions: 'play none none reverse' } }, { stagger: .06 });
      gsap.fromTo($$('.s4-col-l .mg-kicker', sec), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .9, ease: EASE, scrollTrigger: { trigger: sec, start: 'top 62%', once: true } });
      onCleanup(() => { colL.style.transform = ''; colL.style.opacity = ''; });
      draw();
    }

    // ---------- S5 journal: three depth planes rising at three speeds, focus pull on hover ----------
    function sceneJournal() {
      const sec = $('#s5', more); if (!sec) return;
      blurIn($('.s5-title', sec), { scrollTrigger: { trigger: sec, start: 'top 70%', toggleActions: 'play none none reverse' } }, { stagger: .12 });
      riseLines($('.s5-lead', sec), sec, { scrollTrigger: { trigger: sec, start: 'top 60%', once: true } });
      gsap.fromTo($$('.s5-stamp,.s5-head .hm-link', sec), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .9, ease: EASE, stagger: .1, scrollTrigger: { trigger: sec, start: 'top 60%', once: true } });
      const items = $$('.s5-item', sec), mob = W() < 768;
      // S4 -> S5 "crane up": each plane enters from further below, at its own speed (0.7x / 1x / 1.25x)
      items.forEach(it => {
        const sp = mob ? 1 + (Number(it.dataset.speed) - 1) * .4 : Number(it.dataset.speed);
        const D = () => Hh() + it.offsetHeight;
        gsap.fromTo(it, { y: () => (sp - 1) * D() / 2 }, { y: () => -(sp - 1) * D() / 2, ease: 'none', scrollTrigger: { trigger: it, start: 'top bottom', end: 'bottom top', scrub: .6, invalidateOnRefresh: true } });
        gsap.fromTo($('picture', it), { scale: 1.16 }, { scale: 1, duration: 1.8, ease: EASE, scrollTrigger: { trigger: it, start: 'top 92%', once: true } });
      });
      const par = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: .6 } }); // v7: one trigger, same range
      par.fromTo($('.s5-ghost', sec), { yPercent: -10, scale: 1.08 }, { yPercent: 30, scale: 1, ease: 'none', duration: 1 }, 0);
      $$('.s5-art', sec).forEach((a, i) => par.fromTo(a, { y: 220, rotation: i ? 14 : -14 }, { y: -260, rotation: i ? -10 : 10, ease: 'none', duration: 1 }, 0));
      forePass($(':scope > .fx-fore', sec), sec, { start: 'top 40%', span: 1.4, x0: -.02, x1: .1, r0: 10, r1: -16 });
      const phs = $$('.s5-ph', sec);
      let k = 0;
      Loops.add('s5-skew', () => {
        if (!visible(sec)) return;
        const target = clamp(vel.v * .045, -2, 2), n = k + (target - k) * .14;
        if (Math.abs(n - k) < .002 && Math.abs(target) < .01) { if (k !== 0) { k = 0; phs.forEach(p => { p.style.transform = ''; }); } return; }
        k = n; const s = 'skewY(' + k.toFixed(3) + 'deg)';
        phs.forEach(p => { p.style.transform = s; });
      });
      onCleanup(() => phs.forEach(p => { p.style.transform = ''; }));
    }

    // ---------- S6 gift book: the camera swings from 55° overhead to 20° and pushes in as the cover opens ----------
    function sceneGift() {
      const sec = $('#s6', more); if (!sec) return;
      const mob = W() < 768, pin = $('.s6-pin', sec), book = $('.s6-book', sec), cover = $('.s6-cover', sec), shadow = $('.s6-shadow', sec), desk = $('.s6-desk', sec);
      const lightR = $('.s6-right .s6-light', sec);
      blurIn($('.s6-head h2', sec), { scrollTrigger: { trigger: sec, start: 'top 70%', toggleActions: 'play none none reverse' } }, { stagger: .1 });
      // the left page is printed on the back of the cover: move its nodes there (moved back on kill)
      const left = $('.s6-left', sec), back = $('.s6-back', sec), moved = [...left.childNodes];
      back.append(...moved);
      onCleanup(() => left.append(...moved));
      const lightL = $('.s6-light', back);
      gsap.set(book, { rotateX: mob ? 40 : 55, x: mob ? 0 : () => -book.offsetWidth / 4, y: () => Hh() * (mob ? .02 : .05), scale: mob ? .9 : .8, transformOrigin: '50% 60%' });
      const light = () => {
        const a = Math.abs(Number(gsap.getProperty(cover, mob ? 'rotateX' : 'rotateY')) || 0);
        lightR.style.opacity = (a <= 90 ? Math.sin(a * Math.PI / 180) * .9 : clamp((150 - a) / 60, 0, 1) * .9).toFixed(3);
        lightL.style.opacity = (clamp((a - 110) / 55, 0, 1) * .8 * (1 - clamp((a - 160) / 10, 0, 1) * .5)).toFixed(3);
      };
      const tl = gsap.timeline({ scrollTrigger: { trigger: pin, start: 'top top', end: '+=' + (mob ? 180 : 165) + '%', pin: true, scrub: .8 }, onUpdate: light });
      tl.to(book, { x: 0, y: mob ? () => book.offsetHeight / 2 : 0, rotateX: mob ? 14 : 20, scale: mob ? 1 : 1.06, duration: .64, ease: 'power1.inOut' }, .06)
        .to($('.s6-head', sec), { opacity: 0, y: -24, duration: .26, ease: 'power1.in' }, .3)
        .fromTo(cover, mob ? { rotateX: 0 } : { rotateY: 0 }, { ...(mob ? { rotateX: 165 } : { rotateY: -165 }), duration: .66, ease: 'power1.inOut' }, .1)
        .fromTo(shadow, { scaleX: 1, opacity: .6, xPercent: 0 }, { scaleX: mob ? 1.1 : 1.08, opacity: 1, xPercent: 0, duration: .66, ease: 'power1.inOut' }, .1)
        .fromTo($$('.s6-occ li', sec), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .14, stagger: .06, ease: 'power2.out' }, .6)
        .fromTo($$('.s6-card', sec), { opacity: 0, y: 22, rotation: (i) => [-3, 2, -1][i] }, { opacity: 1, y: 0, rotation: 0, duration: .16, stagger: .06, ease: 'power2.out' }, .66)
        .fromTo($$('.s6-right .hm-link,.s6-page .mark', sec), { opacity: 0 }, { opacity: 1, duration: .1 }, .84)
        .to({}, { duration: .14 });
      const par = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: .6 } }); // v7: one trigger, same range
      par.fromTo($('.s6-ghost', sec), { yPercent: -16 }, { yPercent: 24, ease: 'none', duration: 1 }, 0);
      $$('.s6-art', sec).forEach((a, i) => par.fromTo(a, { y: 180, x: i ? 40 : -40, rotation: i ? 18 : -12 }, { y: -220, x: i ? -30 : 30, rotation: i ? -8 : 10, ease: 'none', duration: 1 }, 0));
      forePass($(':scope .s6-pin > .fx-fore', sec), sec, { start: 'top 115%', span: 1.1, x0: .02, x1: -.06 }); // done before the pin locks
      // S5 -> S6 "focus pull": the journal racks out to 8px and fades while the book racks in from 8px
      const s5 = $('#s5', more), grid5 = s5 && $('.s5-grid', s5), FB = mob ? 6 : 8, fx = { a: 0, b: 1 };
      const setF = (el, v) => { el.style.filter = v > .05 ? 'blur(' + v.toFixed(2) + 'px)' : ''; };
      if (grid5) gsap.fromTo(fx, { a: 0 }, { a: 1, ease: 'none', scrollTrigger: { trigger: s5, start: 'bottom 85%', end: 'bottom 12%', scrub: .5 }, onUpdate: () => { setF(grid5, fx.a * FB); grid5.style.opacity = (1 - fx.a).toFixed(3); } });
      gsap.fromTo(fx, { b: 1 }, { b: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top 98%', end: 'top 18%', scrub: .5 }, onUpdate: () => { setF(desk, fx.b * FB); desk.style.opacity = (1 - .75 * fx.b).toFixed(3); } });
      onCleanup(() => { [grid5, desk].forEach(el => { if (el) { el.style.filter = ''; el.style.opacity = ''; } }); });
      light();
    }

    // ---------- S7 promise: icons draw, numbers roll ----------
    function sceneCare() {
      const sec = $('#s7', more); if (!sec) return;
      blurIn($('.mg-head h2', sec), { scrollTrigger: { trigger: sec, start: 'top 72%', toggleActions: 'play none none reverse' } }, { stagger: .1 });
      $$('.s7-cols li', sec).forEach((li, i) => {
        const paths = $$('[pathLength]', li), numEl = $('.s7-num', li), final = numEl.textContent, nums = (final.match(/\d+/g) || []).map(Number), o = { p: 0 };
        numEl.textContent = final.replace(/\d+/g, '0');
        onCleanup(() => { numEl.textContent = final; });
        gsap.timeline({ scrollTrigger: { trigger: li, start: 'top 82%', once: true }, delay: i * .18 })
          .fromTo(paths, { strokeDasharray: 100, strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 2, ease: EASE, stagger: .12 }, 0)
          .to(o, { p: 1, duration: 1.8, ease: EASE, onUpdate: () => { let n = 0; numEl.textContent = final.replace(/\d+/g, () => String(Math.round(nums[n++] * o.p))); } }, .1)
          .fromTo($$('h3,p:not(.s7-big),.s7-unit', li), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: EASE, stagger: .08 }, .25);
      });
      gsap.fromTo($$('.hm-qa', sec), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .9, ease: EASE, stagger: .08, scrollTrigger: { trigger: $('.hm-faq-list', sec), start: 'top 84%', once: true } });
      const art = $('.s7-art', sec), par = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: .6 } }); // v7: one trigger
      par.fromTo($('.s7-ghost', sec), { yPercent: -10 }, { yPercent: 26, ease: 'none', duration: 1 }, 0);
      if (art) par.fromTo(art, { y: 160, rotation: -12 }, { y: -200, rotation: 10, ease: 'none', duration: 1 }, 0);
      forePass($(':scope > .fx-fore', sec), sec, { start: 'top 55%', span: 1.3, x0: -.06, x1: .06, r0: 12, r1: -14 });
    }

    // ---------- S8 back cover: crane down to the basket; bokeh and a blurred fruit pass as fruit falls in ----------
    function sceneBack() {
      const sec = $('#s8', more); if (!sec) return;
      const line = $('.s8-line', sec), basket = $('.s8-basket', sec), bk = $('.s8-bk', sec), drops = $$('.s8-drop img', sec);
      blurIn(line, { scrollTrigger: { trigger: line, start: 'top 80%', toggleActions: 'play none none reverse' } }, { stagger: .06 });
      const crane = { trigger: sec, start: 'top bottom', end: 'top 0%', scrub: .8 };
      gsap.timeline({ scrollTrigger: { ...crane, invalidateOnRefresh: true } }) // v7: the three crane layers share one trigger
        .fromTo(line, { y: () => -Hh() * .18 }, { y: 0, ease: 'none', duration: 1 }, 0)
        .fromTo(basket, { y: () => Hh() * .28 }, { y: 0, ease: 'none', duration: 1 }, 0)
        .fromTo($('.s8-ghost', sec), { y: () => -Hh() * .34, scale: 1.22 }, { y: 0, scale: 1, ease: 'none', duration: 1 }, 0);
      gsap.set(drops, { y: () => -Hh() * .75, opacity: 0 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: basket, start: 'top 78%', once: true } });
      drops.forEach((d, i) => {
        const t = i * .36;
        tl.to(d, { opacity: 1, duration: .08 }, t)
          .to(d, { y: 0, duration: .66, ease: 'power2.in' }, t)              // gravity
          .to(d, { y: -7, duration: .16, ease: 'power1.out' }, t + .66)      // a small settle, no cartoon bounce
          .to(d, { y: 0, duration: .22, ease: 'power1.in' }, t + .82);
      });
      const land = (drops.length - 1) * .36 + .66;
      tl.to(bk, { y: 4, duration: .14, ease: 'power2.out' }, land).to(bk, { y: 0, duration: .55, ease: 'power2.inOut' }, land + .14);
      // in front of the lens while the fruit falls: three bokeh discs drift across, one blurred fruit sweeps past
      const bks = $$('.s8-bokeh', sec), fo = $('.fx-fore', basket);
      if (bks.length) tl.fromTo(bks, { opacity: 0, x: -50, y: 40 }, { opacity: 1, x: 30, y: -20, duration: 1.6, ease: 'sine.inOut', stagger: .25 }, 0).to(bks, { opacity: 0, x: 70, duration: 1.1, ease: 'sine.in', stagger: .15 }, 1.6);
      if (fo) tl.fromTo(fo, { opacity: 1, x: () => W() * .12, y: () => Hh() * .3, rotation: -16 }, { x: () => -W() * .7, y: () => -Hh() * .45, rotation: 22, duration: 1.7, ease: 'power1.inOut' }, .5).set(fo, { opacity: 0 });
      gsap.fromTo($$('#hm-back,.s8-folio', sec), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .9, ease: EASE, stagger: .1, scrollTrigger: { trigger: basket, start: 'top 70%', once: true } });
    }

    // breathing pages: a 1px line draws itself slowly as the page passes
    function sceneBreath() {
      $$('.mg-breath', more).forEach(b => {
        gsap.fromTo($('i', b), { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: b, start: 'top 92%', end: 'bottom 30%', scrub: 1.2 } });
        gsap.fromTo($('span', b), { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: b, start: 'top 60%', end: 'center 45%', scrub: 1 } });
      });
    }

    // ---------- S0 shop front: entrance on arrival, and the stage fading off as the page leaves the top ----------
    function sceneShop() {
      const first = H('#home-first');
      if (window.scrollY < 4) S0.enter();
      const leave = { trigger: first, start: 'top top', end: 'bottom 25%', scrub: .6 };
      gsap.fromTo(H('.s0-ui'), { opacity: 1, yPercent: 0 }, { opacity: 0, yPercent: -5, ease: 'none', immediateRender: false, scrollTrigger: leave });
      gsap.fromTo(H('.s0-scene'), { opacity: 1, yPercent: 0 }, { opacity: .2, yPercent: 6, ease: 'none', immediateRender: false, scrollTrigger: { ...leave } }); // the scene lags behind (parallax)
    }

    function full() {
      sceneShop(); sceneCover(); sceneToc(); sceneFeature(); sceneProcess(); sceneJournal(); sceneGift(); sceneCare(); sceneBack(); sceneBreath();
      // shared: scroll velocity (px per frame) for the skew effects; section visibility gates loops
      vel.y = window.scrollY; vel.t = performance.now(); vel.v = 0;
      Loops.add('vel', t => { const y = Loops.y(), dt = Math.max(1, t - vel.t); const v = (y - vel.y) / dt * 16.67; vel.v += (v - vel.v) * .3; vel.y = y; vel.t = t; });
      vio = new IntersectionObserver(es => es.forEach(e => isVisible.set(e.target, e.isIntersecting)), { rootMargin: '10% 0px' });
      $$('.mg', more).forEach(s => vio.observe(s));
      onCleanup(() => { vio.disconnect(); vio = null; });
    }
    // Reduced motion or "動畫：關閉": static magazine layout, short fades only (no GSAP needed).
    function lite() {
      const els = $$('.mg-kicker,.mg h2,.mg-h,.s1-masthead,.s1-meta,.s1-end,.s2-list li,.s2-note,.s3-panel,.s4-open>*,.s4-item,.s5-head,.s5-item,.s6-head,.s6-book,.s7-cols li,.hm-faq,.s8-line,.s8-basket,#hm-back', more);
      docEl.classList.add('fx-lite');
      els.forEach(el => el.classList.add('fx-fade'));
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
      els.forEach(el => io.observe(el));
      // fallback for fast jumps (keyboard End, scrollbar drags): anything already above the fold is shown too
      let pend = 0;
      const sweep = () => { pend = 0; let left = 0; const lim = innerHeight * .94; els.forEach(el => { if (el.classList.contains('is-in')) return; if (el.getBoundingClientRect().top < lim) { el.classList.add('is-in'); io.unobserve(el); } else left++; }); if (!left) removeEventListener('scroll', onSc); };
      const onSc = () => { if (!pend) pend = requestAnimationFrame(sweep); };
      addEventListener('scroll', onSc, { passive: true });
      onCleanup(() => { io.disconnect(); removeEventListener('scroll', onSc); if (pend) cancelAnimationFrame(pend); els.forEach(el => el.classList.remove('fx-fade', 'is-in')); docEl.classList.remove('fx-lite'); });
    }
    function kill() {
      S0.settle(); // a switch still in flight lands on its final frame
      cleanups.splice(0).reverse().forEach(fn => { try { fn(); } catch (err) { console.warn(err); } });
      if (ctx) { ctx.revert(); ctx = null; }
      splits.splice(0).forEach(s => s.revert());
      ['s1-hand', 's2-peek', 's3-flip', 's3-skew', 's5-skew', 'vel'].forEach(k => Loops.remove(k));
      docEl.classList.remove('fx-live', 'fx-lite');
      mode = 'none';
    }
    function build() {
      kill();
      if (!homeActive()) return;
      if (!fullMotion()) { lite(); mode = 'lite'; Air.scan(); return; }
      if (!libs()) { mode = 'static'; Air.scan(more, H('#home-first')); return; } // no GSAP: the static magazine (+ air layer)
      gsap.registerPlugin(ScrollTrigger); if (window.SplitText) gsap.registerPlugin(SplitText);
      ScrollTrigger.config({ ignoreMobileResize: true });
      docEl.classList.add('fx-live');
      builtW = W(); builtH = Hh();
      beforeFonts = !!document.fonts && document.fonts.status !== 'loaded';
      ctx = gsap.context(full, more);
      ScrollTrigger.refresh();
      mode = 'full';
      Air.scan(more, H('#home-first'));
    }
    let rt = 0;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (mode !== 'full') return;
        const crossed = [768, 900].some(b => (builtW < b) !== (W() < b));
        if (crossed || Math.abs(W() - builtW) > 40 || Math.abs(Hh() - builtH) > 160) build(); else ScrollTrigger.refresh();
      }, 250);
    });
    reduceMQ.addEventListener('change', () => { Fx.apply(); if (homeActive()) build(); });
    // Lines are measured when the scenes are built; if the web fonts arrived later, rebuild once
    // (only while the visitor is still at the top, so nothing visibly resets mid-page).
    if (document.fonts) document.fonts.ready.then(() => { if (mode !== 'full' || !libs()) return; if (beforeFonts && window.scrollY < 4) build(); else ScrollTrigger.refresh(); });
    return { build, kill, bridge, count: () => (libs() ? ScrollTrigger.getAll().length : 0), loops: () => Loops.count(), loopKeys: () => Loops.keys(), driven: () => Loops.driven(), mode: () => mode, bleedMode: () => bleedMode };
  })();
  window.__homeMotion = HomeMotion; // inspection hooks for the mockup's own tests
  window.__fx = Fx;

  // =====================================================================
  // INNER PAGES
  // =====================================================================
  const crumb = (...items) => '<nav class="crumb" aria-label="導覽路徑"><a href="#home">首頁</a>' + items.map((it, i) => '<i aria-hidden="true">›</i>' + (i === items.length - 1 ? '<span aria-current="page">' + esc(it[0]) + '</span>' : '<a href="#' + it[1] + '">' + esc(it[0]) + '</a>')).join('') + '</nav>';
  // v4.1: magazine headings on every inner page — folio number, English kicker, large Mincho title.
  let pageKey = 'home';
  const head = (kicker, title, lead, mark) => '<div class="page-head mag-head"><div class="mh-top"><b>P.' + Fx.folioOf(pageKey)[0] + '</b><span class="kicker">' + kicker + '</span></div><h1 tabindex="-1">' + title + '</h1>' + (lead ? '<p class="lead">' + lead + '</p>' : '') + (mark ? '<span class="mark" style="margin-top:10px">' + mark + '</span>' : '') + '</div>';
  const secHead = (id, title, mark) => '<div class="sec-head"><h2 class="sec-title" id="' + id + '">' + title + '</h2>' + (mark ? '<span class="mark">' + mark + '</span>' : '') + '</div>';
  const rangeHTML = p => price(minPrice(p)) + (maxPrice(p) > minPrice(p) ? ' <span aria-hidden="true">-</span> ' + price(maxPrice(p)) : '');
  const card = (p, idp = 'card') => '<article class="card"><a class="card-art" href="#p-' + p.slug + '" id="' + idp + '-art-' + p.slug + '" aria-label="看' + esc(p.name) + '">' + art(p.slug, 'card', true) + '</a><div class="card-body"><h2 class="card-title"><a href="#p-' + p.slug + '" id="' + idp + '-name-' + p.slug + '">' + esc(p.name) + '</a></h2><span class="mark">' + esc(p.mark) + '</span><div class="price-wrap" style="margin:12px 0 18px">' + rangeHTML(p) + '</div><a class="btn btn-block" href="#p-' + p.slug + '" id="' + idp + '-buy-' + p.slug + '">選購</a></div></article>';

  const pages = {};
  const TITLES = { catalog: '所有商品', origin: '產地故事', gift: '送禮', guide: '吃法與保存', service: '配送與售後', cart: '我的菜籃', checkout: '結帳', 'about-mockup': '樣稿說明', 'design-system': '設計系統' };

  pages.catalog = () => '<div class="wrap">' + crumb(['所有商品']) +
    '<div class="cat-tools mag-head"><div class="mh-top"><b>P.40</b><span class="kicker">ALL FRUIT</span></div><h1 tabindex="-1">所有商品</h1><p>共 ' + PRODUCTS.length + ' 項・<span style="color:var(--fm-mark)">價格與規格皆為示意</span></p></div>' +
    '<div class="cards">' + PRODUCTS.map(p => card(p)).join('') + '</div></div>';

  // =====================================================================
  // v5 PRODUCT PAGE (#p-{slug}): a short film about one fruit (storyboard-v5.md §二).
  // P1 orbit close-up · P2 origin photos · P3 flavour · P4 purchase · P5 storage · P6 see also,
  // plus a fixed buy bar once the hero has scrolled away. The markup is a complete static page;
  // ProductMotion layers the camera moves on top (GSAP), Air adds bokeh / parallax / breathing.
  // =====================================================================
  // v5.1: client photos first, then (for six fruits) one AI scenario image that shows what the photos do not -
  // picking, tending or packing. Captions describe only what is in the picture (pear: tending, not how it is picked;
  // apple: checking the size on the tree, not harvesting). Strawberry and orange have no matching AI image.
  const PD_PHOTOS = {
    muscat: [['home-muscat-box', '單串禮盒裡的麝香葡萄'], ['home-grape-net', '套上綠網套的兩串葡萄'], ['p-muscat-case', '六串整箱，等著出貨'], ['ai-green-grape-packing-box', '裝袋、套上綠網的葡萄排進紙箱']],
    apple: [['home-apple-tree', '樹上慢慢著色的蘋果'], ['home-apple-fist', '握拳比一比，比拳頭還大'], ['home-apple-canopy', '抬頭看，滿樹正在著色'], ['ai-apple-orchard-inspection', '在樹旁握拳，看看蘋果長多大了']],
    peach: [['home-peach-giftbox', '六入禮盒，每顆套著白網套'], ['home-peach-box11', '十一入整箱'], ['home-peach-hands', '雙手捧著剛採的大桃', HAND_NOTE], ['ai-peach-picking-close', '從枝頭摘下水蜜桃']],
    orange: [],
    cherry: [['home-cherry-box', '滿滿兩盒的櫻桃'], ['home-cherry-orchard', '剛採下、還帶著長梗'], ['home-cherry-hands', '櫻桃樹下，一手一顆'], ['ai-cherry-packing-trays', '透明盒裝的櫻桃放進白色紙箱']],
    pear: [['home-hero-pear', '網室棚架下結實纍纍的梨'], ['home-pear-hands', '比手掌還大的梨', HAND_NOTE], ['ai-pear-net-house-worker', '網室裡照料還套著紙袋的梨']],
    strawberry: [['home-strawberry-box', '一顆顆放進軟墊的草莓'], ['p-strawberry-detail', '局部：紅到蒂頭的光澤']],
    'black-grape': [['home-black-grape-box', '雙串禮盒，套著淡紫網套'], ['home-grape-vine', '棚架上半套果袋的黑葡萄'], ['home-grape-box8', '八串整箱，排好等出貨'], ['ai-black-grape-picking', '手托黑葡萄串，剪下果梗']]
  };
  // sweetness, acidity, texture (soft 0 - crisp 10), texture words - all placeholders, marked 示意
  const FLAVOR = { muscat: [9, 1, 7, '皮薄脆口'], apple: [7, 3, 9, '清脆多汁'], peach: [8, 2, 2, '軟嫩多汁'], orange: [7, 4, 5, '果肉細、汁多'],
    cherry: [8, 3, 6, '飽滿有彈性'], pear: [7, 1, 8, '細緻爽脆'], strawberry: [7, 4, 3, '柔軟多汁'], 'black-grape': [8, 2, 5, '果肉 Q 彈'] };
  const P_FORE = { muscat: 'cherry', apple: 'pear', peach: 'cherry', orange: 'apple', cherry: 'peach', pear: 'apple', strawberry: 'cherry', 'black-grape': 'peach' };
  // thin-line illustrations for P5 (drawn with stroke-dashoffset)
  const ILL = {
    ripe: slug => '<svg class="p5-ill" viewBox="0 0 200 200" aria-hidden="true"><path pathLength="100" d="' + (SKETCH[slug] || SKETCH.orange).join(' ') + '"/></svg>',
    store: () => '<svg class="p5-ill" viewBox="0 0 64 64" aria-hidden="true"><rect pathLength="100" x="26" y="6" width="12" height="38" rx="6"/><circle pathLength="100" cx="32" cy="50" r="8"/><path pathLength="100" d="M32 24v20"/><path pathLength="100" d="M44 14h8M44 22h8M44 30h8"/></svg>',
    cut: () => '<svg class="p5-ill" viewBox="0 0 64 64" aria-hidden="true"><path pathLength="100" d="M6 50L42 14c4-4 10-4 12 0L20 48z"/><path pathLength="100" d="M6 50l8 6"/><path pathLength="100" d="M36 56a12 12 0 0 1 24 0z"/></svg>',
    eat: () => '<svg class="p5-ill" viewBox="0 0 64 64" aria-hidden="true"><path pathLength="100" d="M8 32h48c0 13-10 22-24 22S8 45 8 32z"/><path pathLength="100" d="M22 24c2-6 7-8 10-5s8 2 10-4"/><path pathLength="100" d="M50 10l-8 16"/></svg>'
  };
  function productPage(p) {
    const others = PRODUCTS.filter(x => x.slug !== p.slug);
    const [nm, en] = SHORT[p.slug] || [p.name, ''];
    const s0 = p.specs[0], photos = PD_PHOTOS[p.slug] || [], [sw, so, tx, txt] = FLAVOR[p.slug] || [7, 3, 5, ''];
    const rest = p.name.startsWith(nm) ? p.name.slice(nm.length) : '';
    const fruit = ART.has(p.slug) ? '<img class="p1-fruit" src="img/art/' + esc(p.slug) + '.webp" alt="' + esc(p.name) + '水彩插畫" draggable="false" data-breathe>' : '<span class="p1-fruit">' + art(p.slug, 'stage') + '</span>';
    const p1 = '<section class="p1" aria-labelledby="pd-title"><div class="p1-stage">' +
      '<span class="p1-wash" aria-hidden="true" data-depth=".08"></span>' +
      '<div class="p1-orbit" data-depth=".6"><div class="p1-turn">' + fruit + '</div><span class="p1-shadow" aria-hidden="true"></span></div>' +
      [[10, 20, 96, .9], [80, 72, 170, 1], [64, 12, 58, .5]].map(([x, y, s, d]) => '<i class="p1-bokeh" aria-hidden="true" data-depth="' + d + '" style="left:' + x + '%;top:' + y + '%;width:' + s + 'px;height:' + s + 'px"></i>').join('') +
      fore(P_FORE[p.slug] || 'cherry') +
      '<div class="p1-copy"><h1 class="p1-name" id="pd-title" tabindex="-1" data-depth=".4">' + esc(nm) + (rest ? '<span class="sr-only">' + esc(rest) + '</span>' : '') + '</h1>' +
      '<p class="p1-en">' + esc(en) + '・產季 ' + esc(p.season) + '</p>' +
      '<p class="p1-price"><small id="p1-spec">' + esc(s0.label) + '</small><span id="p1-amt">' + price(s0.price) + '</span> <span class="mark">' + esc(p.mark) + '</span></p>' +
      '<div class="p1-cta"><button class="btn" type="button" id="p1-add">放入菜籃 ＋</button><button type="button" class="p1-more" id="p1-more">選規格與數量 ↓</button></div></div></div></section>';
    const hasAI = photos.some(([stem]) => isAI(stem));
    const p2 = '<section class="p2" aria-labelledby="p2-title"><div class="p2-head"><span class="mg-kicker">ORCHARD &amp; PACKING · P.43</span><h2 class="p-h" id="p2-title">產地與包裝</h2>' +
      '<p>' + (photos.length ? '店家在產地與出貨現場拍下的' + esc(nm) + '。' + (hasAI ? '最後一張是「' + AI_LABEL + '」，補上實拍裡還沒有的畫面，不是店家的果園或包裝紀錄。' : '') : esc(nm) + '的產地照片還沒有到，先用水彩跨頁代替。') + '</p></div>' +
      '<div class="p2-pin"><div class="p2-track">' + (photos.length ? photos.map(([stem, cap, note], i) => {
        const [w, h] = PH[stem] || [4, 5], ai = isAI(stem);
        return '<figure class="p2-shot" data-depth="' + [.2, .45, .32, .38][i] + '"><span class="p2-no mg-outline" aria-hidden="true">' + pad(i + 1) + '</span><div class="p2-frame" style="--ar:' + w + '/' + h + '">' + pic(stem, altOf(stem, cap)) + (ai ? aiTag() : '') + '</div>' +
          '<figcaption><span>' + pad(i + 1) + '　' + esc(cap) + (note ? '<br><span class="mark">' + note + '</span>' : '') + '</span><span' + (ai ? ' class="ai-credit"' : '') + '>' + creditOf(stem) + '</span></figcaption></figure>';
      }).join('') : '<figure class="p2-shot"><div class="p2-wc" role="img" aria-label="' + esc(p.name) + '：照片待客戶提供">' + artImg(p.slug) + '<em>照片待客戶提供</em></div><figcaption><span>水彩跨頁・暫代實拍</span><span class="mark">照片待客戶提供</span></figcaption></figure>') +
      '</div></div></section>';
    const rule = (v, lo, hi) => '<div class="p3-rule" aria-hidden="true"><svg viewBox="0 0 100 40" preserveAspectRatio="none">' +
      Array.from({ length: 11 }, (_, i) => '<line class="tk" x1="' + i * 10 + '" y1="' + (i % 5 ? 24 : 8) + '" x2="' + i * 10 + '" y2="40"/>').join('') +
      '<line x1="0" y1="40" x2="100" y2="40"/><line class="mk" x1="' + v * 10 + '" y1="0" x2="' + v * 10 + '" y2="40"/></svg><span class="l">' + lo + '</span><span class="r">' + hi + '</span></div>';
    const p3 = '<section class="p3" aria-labelledby="p3-title"><span class="mg-kicker">FLAVOUR · P.44</span><h2 class="p-h" id="p3-title">風味</h2>' +
      '<span class="mark" style="margin-top:14px">以下數值皆為示意・需客戶提供實測</span><div class="p3-rows">' +
      [['甜度', 'SWEETNESS', sw, '淡', '甜'], ['酸度', 'ACIDITY', so, '低', '高'], ['口感', 'TEXTURE・' + txt, tx, '軟', '脆']].map(([t, e, v, lo, hi]) =>
        '<div class="p3-row"><p class="p3-label">' + t + '<small>' + e + '</small></p><p class="p3-num" aria-label="' + t + ' ' + v + ' / 10（示意）"><b data-to="' + v + '">' + v + '</b><small>/ 10</small></p>' + rule(v, lo, hi) + '</div>').join('') + '</div></section>';
    const p4 = '<section class="p4" id="p4" aria-labelledby="p4-title"><div class="p4-art" aria-hidden="true">' + (ART.has(p.slug) ? '<img src="img/art/' + esc(p.slug) + '.webp" alt="" draggable="false">' : art(p.slug, 'card')) + '</div>' +
      '<form class="p4-form" id="pd-form" novalidate><span class="mg-kicker">ORDER · P.46</span><h2 class="p-h" id="p4-title">選購</h2>' +
      '<fieldset class="p4-opts" aria-describedby="spec-note"><legend>規格</legend>' + p.specs.map((s, i) => '<label class="p4-opt"><input type="radio" name="spec" id="spec-' + esc(s.id) + '" value="' + esc(s.id) + '"' + (i ? '' : ' checked') + '><span>' + esc(s.label) + '<b>' + money(s.price) + '</b></span></label>').join('') + '</fieldset>' +
      '<div class="p4-row"><div><span class="field-title" id="qty-label">數量</span><div class="qty" role="group" aria-labelledby="qty-label"><button type="button" id="qty-minus" aria-label="減少數量">−</button><input id="qty" type="number" inputmode="numeric" min="1" max="99" value="1" aria-label="數量"><button type="button" id="qty-plus" aria-label="增加數量">＋</button></div></div>' +
      '<div class="pd-total"><span>小計</span><span id="pd-sub">' + price(s0.price, 'price-lg') + '</span></div></div>' +
      '<div class="pd-actions"><button class="btn" type="submit" id="pd-add">放入菜籃 ＋</button><button class="btn btn-line" type="button" id="pd-now">直接結帳</button></div>' +
      '<span class="mark" id="spec-note" style="display:block;margin-top:18px;font-size:11px">' + esc(p.mark) + '・規格與價格需客戶提供正式資料</span></form></section>';
    // P5 pictures: client photos only (v5.1 - the AI scenario image stays in P2, labelled)
    const real = photos.filter(([stem]) => !isAI(stem)), small = [real[1], real[2] || real[0]];
    const steps = [['熟成判斷', p.ripe, ILL.ripe(p.slug)], ['保存', p.storage, ILL.store()], ['切法', p.cut, ILL.cut()], ['吃法', p.eat + '', ILL.eat()]];
    const p5 = '<section class="p5" aria-labelledby="p5-title"><span class="mg-kicker">KEEP & ENJOY · P.48</span><h2 class="p-h" id="p5-title">保存與吃法</h2><div class="p5-cols">' +
      [0, 1].map(c => '<div class="p5-col" data-depth="' + (c ? .4 : .2) + '">' + steps.slice(c * 2, c * 2 + 2).map(([t, d, ill], j) => {
        const i = c * 2 + j, ph = i === 1 ? small[0] : i === 2 ? small[1] : null;
        return '<article class="p5-step"><span class="p5-no" aria-hidden="true">' + pad(i + 1) + '</span><div class="p5-body"><h3>' + t + '</h3><p>' + esc(d) + '</p><div class="p5-media">' + ill +
          (ph ? '<div class="p5-ph">' + pic(ph[0], ph[1] + '（客戶實拍）') + '</div>' : '') + '</div></div></article>';
      }).join('') + '</div>').join('') + '</div><p style="margin:clamp(40px,6vw,72px) 0 0"><a class="hm-link" href="#guide" id="pd-guide">所有水果的吃法與保存 ↗</a>　<a class="hm-link" href="#service" id="pd-service">配送與售後 ↗</a></p></section>';
    const item = (o, dup) => '<a class="p6-item" href="#p-' + o.slug + '" id="p6-' + o.slug + (dup ? '-b' : '') + '" draggable="false"' + (dup ? ' tabindex="-1" aria-hidden="true"' : '') + '>' +
      (ART.has(o.slug) ? '<img src="img/art/' + esc(o.slug) + '.webp" alt="" loading="lazy" decoding="async" draggable="false">' : art(o.slug, 'small')) + '<b>' + esc((SHORT[o.slug] || [o.name])[0]) + '</b><span>NT$ ' + num(minPrice(o)) + ' 起</span></a>';
    const p6 = '<section class="p6" aria-labelledby="p6-title"><span class="mg-kicker">SEE ALSO · P.50</span><h2 class="p-h" id="p6-title">也看看</h2>' +
      '<div class="p6-strip" id="p6-strip"><div class="p6-track">' + others.map(o => item(o)).join('') + others.map(o => item(o, 1)).join('') + '</div></div></section>';
    const bar = '<div class="buybar" id="buybar" role="region" aria-label="購買列">' + (ART.has(p.slug) ? '<img class="bb-art" src="img/art/' + esc(p.slug) + '.webp" alt="" draggable="false">' : '') +
      '<div class="bb-name"><b>' + esc(p.name) + '</b><span>' + esc(p.mark) + '</span></div><label class="sr-only" for="bb-spec">規格</label><select id="bb-spec">' +
      p.specs.map(s => '<option value="' + esc(s.id) + '">' + esc(s.label) + '・' + money(s.price) + '</option>').join('') + '</select><button class="btn" type="button" id="bb-add">放入菜籃 ＋</button></div>';
    return '<div class="pd5" style="--tone:' + (TONE[p.slug] || '#e9a07a') + '"><div class="wrap">' + crumb(['所有商品', 'catalog'], [p.name]) + '</div>' + p1 + p2 + p3 + p4 + p5 + p6 + '</div>' + bar;
  }
  // P4 fly-in: the watercolour arcs into the header basket (same motion as the home "放入菜籃")
  async function flyToBasket(slug, srcEl) {
    if (!fullMotion() || !srcEl || !ART.has(slug)) return;
    const s = srcEl.getBoundingClientRect(); if (!s.width) return;
    let t = $('#head-count').getBoundingClientRect();
    if (t.bottom < 0 || !t.width) t = { left: innerWidth - 64, top: 14, width: 26, height: 26 };
    const size = Math.min(170, Math.max(64, s.width * .5)), el = new Image();
    el.src = 'img/art/' + slug + '.webp'; el.alt = ''; el.className = 'fx-ghost';
    Object.assign(el.style, { width: size + 'px', height: size + 'px', zIndex: '97' });
    const x0 = s.left + s.width / 2 - size / 2, y0 = s.top + s.height / 2 - size / 2, x1 = t.left + t.width / 2 - size / 2, y1 = t.top + t.height / 2 - size / 2;
    document.body.append(el);
    const a = el.animate([{ transform: 'translate(' + x0 + 'px,' + y0 + 'px) rotate(8deg) scale(1)', opacity: 1 },
      { transform: 'translate(' + (x0 + (x1 - x0) * .5) + 'px,' + (Math.min(y0, y1) - 120) + 'px) rotate(-25deg) scale(.8)', offset: .5, opacity: 1 },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px) rotate(-50deg) scale(.2)', opacity: .25 }], { duration: 760, easing: 'cubic-bezier(.4,0,.7,1)' }).finished;
    try { await Promise.race([a, new Promise(r => setTimeout(r, 1000))]); } finally { el.remove(); }
  }
  const pdCleanups = [];
  function bindProduct(p) {
    const form = $('#pd-form'), bb = $('#bb-spec'), bar = $('#buybar');
    const qty = () => Math.max(1, Math.min(99, parseInt($('#qty').value, 10) || 1));
    const spec = () => p.specs.find(s => s.id === (form.elements.spec.value || p.specs[0].id)) || p.specs[0];
    const update = () => {
      const s = spec();
      $('#pd-sub').innerHTML = price(s.price * qty(), 'price-lg');
      $('#p1-spec').textContent = s.label; $('#p1-amt').innerHTML = price(s.price);
      if (bb.value !== s.id) bb.value = s.id;
    };
    form.addEventListener('change', update);
    bb.addEventListener('change', () => { const r = [...form.elements.spec].find(x => x.value === bb.value); if (r) { r.checked = true; update(); } });
    $('#qty').addEventListener('input', update);
    $('#qty').addEventListener('blur', () => { $('#qty').value = qty(); update(); });
    $('#qty-minus').onclick = () => { $('#qty').value = Math.max(1, qty() - 1); update(); };
    $('#qty-plus').onclick = () => { $('#qty').value = Math.min(99, qty() + 1); update(); };
    let busyAdd = false;
    const add = async (src, n) => {
      if (busyAdd) return;
      busyAdd = true;
      const s = spec();
      try { await flyToBasket(p.slug, src); } finally { busyAdd = false; }
      addToBasket(p.slug, s.id, n);
      toast('已放入菜籃：' + p.name + '（' + s.label + '）× ' + n);
      const c = $('#head-count'); if (c && fullMotion()) c.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
    };
    form.addEventListener('submit', e => { e.preventDefault(); add($('.p4-art'), qty()); });
    $('#p1-add').onclick = () => add($('.p1-fruit'), 1);
    $('#bb-add').onclick = () => add($('.bb-art') || bar, 1);
    $('#p1-more').onclick = () => { const t = $('#p4'); if (t) Fx.scrollTo(t.getBoundingClientRect().top + window.scrollY - 24, { duration: 1.6 }); };
    $('#pd-now').onclick = () => { addToBasket(p.slug, spec().id, qty()); location.hash = '#checkout'; };
    // the fixed buy bar: shown once the hero has scrolled away, hidden while the full P4 form is on screen
    let past = false, p4In = false;
    const hero = $('.p1'), p4 = $('#p4');
    const sync = () => { const on = past && !p4In; bar.classList.toggle('is-on', on); document.body.classList.toggle('has-buybar', on); };
    const io = new IntersectionObserver(es => { es.forEach(e => { if (e.target === p4) p4In = e.isIntersecting; else past = !e.isIntersecting && e.boundingClientRect.top < 0; }); sync(); }, { threshold: 0 });
    io.observe(hero); io.observe(p4);
    pdCleanups.push(() => { io.disconnect(); document.body.classList.remove('has-buybar'); });
  }
  function unbindProduct() { pdCleanups.splice(0).forEach(fn => fn()); }

  // ---------- ProductMotion: P1-P6 camera moves (GSAP); P6 strip drift/drag works without GSAP ----------
  const ProductMotion = (() => {
    let ctx = null, cleanups = [], mode = 'none', builtW = 0, cur = null, mySplits = [];
    const onCleanup = fn => cleanups.push(fn);
    const W = () => innerWidth, Hh = () => innerHeight;
    function kill() {
      cleanups.splice(0).reverse().forEach(fn => { try { fn(); } catch (err) { console.warn(err); } });
      if (ctx) { ctx.revert(); ctx = null; }
      mySplits.splice(0).forEach(s => { try { s.revert(); } catch (err) { /* already gone */ } });
      Loops.remove('p6-strip');
      if (mode === 'full') docEl.classList.remove('fx-live');
      mode = 'none';
    }
    // P6: other fruit on a slow horizontal drift; drag with inertia; hover focus (no GSAP needed)
    function strip(pd) {
      const s = $('#p6-strip', pd); if (!s || !fullMotion()) return;
      const track = $('.p6-track', s), items = $$('.p6-item', track);
      let half = 1, sw = 1, P = [], x = 0, v = 0, drag = null, moved = 0, lastT = 0, vis = false;
      const measure = () => { half = Math.max(1, track.scrollWidth / 2); sw = s.clientWidth; P = items.map(it => [it.offsetLeft, it.offsetWidth]); };
      measure();
      const io = new IntersectionObserver(es => { vis = es[0].isIntersecting; }, { rootMargin: '10% 0px' }); io.observe(s);
      const AUTO = -.022; // px per ms
      Loops.add('p6-strip', t => {
        const dt = Math.min(50, t - (lastT || t)); lastT = t;
        if (!vis) return;
        if (!drag) { v *= Math.pow(.94, dt / 16.7); x += (AUTO + v) * dt; }
        x = ((x % half) - half) % half;
        track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
        items.forEach((it, i) => { const l = P[i][0] + x; it.classList.toggle('is-vis', l + P[i][1] > 0 && l < sw); });
      });
      const down = e => { if (e.button) return; drag = { x0: e.clientX, xs: x, lx: e.clientX, lt: performance.now(), vx: 0 }; moved = 0; s.classList.add('is-drag'); try { s.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ } };
      const move = e => { if (!drag) return; const now = performance.now(), dx = e.clientX - drag.lx; drag.vx = drag.vx * .6 + (dx / Math.max(1, now - drag.lt)) * .4; drag.lx = e.clientX; drag.lt = now; x = drag.xs + (e.clientX - drag.x0); moved = Math.max(moved, Math.abs(e.clientX - drag.x0)); };
      const up = () => { if (!drag) return; v = clamp(drag.vx, -3, 3); drag = null; s.classList.remove('is-drag'); };
      const click = e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } };
      const over = e => { const it = e.target.closest('.p6-item'); items.forEach(i => i.classList.toggle('is-hot', i === it)); s.classList.toggle('is-hover', !!it); };
      const leave = () => { items.forEach(i => i.classList.remove('is-hot')); s.classList.remove('is-hover'); };
      s.addEventListener('pointerdown', down); s.addEventListener('pointermove', move); s.addEventListener('pointerup', up); s.addEventListener('pointercancel', up);
      s.addEventListener('click', click, true); s.addEventListener('pointerover', over); s.addEventListener('pointerleave', leave);
      addEventListener('resize', measure);
      onCleanup(() => {
        io.disconnect(); removeEventListener('resize', measure);
        s.removeEventListener('pointerdown', down); s.removeEventListener('pointermove', move); s.removeEventListener('pointerup', up); s.removeEventListener('pointercancel', up);
        s.removeEventListener('click', click, true); s.removeEventListener('pointerover', over); s.removeEventListener('pointerleave', leave);
        track.style.transform = ''; items.forEach(i => i.classList.remove('is-vis', 'is-hot'));
      });
    }
    function scenes(pd) {
      const mob = W() < 768, wide = W() >= 900;
      // P1 single-fruit close-up: orbit + push (pinned 220vh). rotateY -14° -> 14°, centre -> left
      // third, scale 1.15 -> .85; bokeh drift at their depth; one blurred fruit passes the lens.
      const p1 = $('.p1', pd), turn = $('.p1-turn', p1), orbit = $('.p1-orbit', p1), wash = $('.p1-wash', p1), copy = $('.p1-copy', p1);
      blurIn($('.p1-name', p1), { delay: .45 }, { stagger: .12 });
      gsap.fromTo($$('.p1-en,.p1-price,.p1-cta', p1), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.1, ease: EASE, stagger: .12, delay: .75 });
      const tl1 = gsap.timeline({ scrollTrigger: { trigger: p1, start: 'top top', end: '+=120%', pin: true, scrub: .8, invalidateOnRefresh: true } });
      tl1.fromTo(turn, { rotateY: -14, scale: 1.15 }, { rotateY: 14, scale: .85, ease: 'none', duration: 1 }, 0)
        .fromTo(orbit, { x: 0, y: 0 }, { x: () => (mob ? -W() * .14 : -(orbit.offsetLeft + orbit.offsetWidth / 2 - W() / 3)), y: () => (mob ? -Hh() * .05 : 0), ease: 'none', duration: 1 }, 0)
        .fromTo($('.p1-shadow', p1), { scaleX: 1, opacity: 1 }, { scaleX: .78, opacity: .7, ease: 'none', duration: 1 }, 0)
        .fromTo(wash, { x: () => W() * .05 }, { x: () => -W() * .1, ease: 'none', duration: 1 }, 0)
        .fromTo(copy, { y: 0 }, { y: () => -Hh() * .04, ease: 'none', duration: 1 }, 0);
      $$('.p1-bokeh', p1).forEach((b, i) => tl1.fromTo(b, { y: 0 }, { y: () => -Hh() * [.3, .55, .16][i], x: () => W() * [.04, -.06, .02][i], ease: 'none', duration: 1 }, 0));
      const fo = $('.fx-fore', p1);
      if (fo && !(mob && fo.dataset.mob === '0')) tl1.fromTo(fo, { x: () => W() * .1, y: () => Hh() * .25, rotation: -16, opacity: 1 }, { x: () => -W() * .42, y: () => -Hh() * .9, rotation: 18, ease: 'power1.inOut', duration: .55 }, .3).set(fo, { opacity: 0 }, .86);
      // P2 origin photos: dolly zoom into the first picture, then a lateral move across wide gaps
      const p2 = $('.p2', pd), pin2 = $('.p2-pin', p2), track = $('.p2-track', p2), shots = $$('.p2-shot', track);
      blurIn($('#p2-title', p2), { scrollTrigger: { trigger: p2, start: 'top 72%', toggleActions: 'play none none reverse' } }, { stagger: .1 });
      gsap.fromTo($$('.p2-head .mg-kicker,.p2-head p', p2), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: EASE, stagger: .1, scrollTrigger: { trigger: p2, start: 'top 70%', once: true } });
      const first = shots[0], frame1 = first && $('.p2-frame,.p2-wc', first), in1 = first && $('.p2-frame>.grade,.p2-wc>img', first);
      if (wide) {
        const dist = Math.max(0, track.scrollWidth - W()), DZ = Hh() * .7, LAT = dist * 1.15;
        const tl2 = gsap.timeline({ scrollTrigger: { trigger: pin2, start: 'top top', end: '+=' + Math.round(DZ + LAT), pin: true, scrub: .8 } });
        if (frame1) tl2.fromTo(frame1, { clipPath: 'inset(17% 23% 17% 23%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power1.inOut', duration: DZ }, 0);
        if (in1) tl2.fromTo(in1, { scale: 1.45 }, { scale: 1, ease: 'power1.inOut', duration: DZ }, 0);
        tl2.to(track, { x: -dist, ease: 'none', duration: LAT }, DZ);
        // in-frame parallax: 1.2x overscan so the +-9% move never uncovers the frame (the v5.1 AI label sits on the frame)
        shots.slice(1).forEach(sh => { const g = $('.p2-frame>.grade', sh); if (g) tl2.fromTo(g, { xPercent: -9, scale: 1.2 }, { xPercent: 9, scale: 1.2, ease: 'none', duration: LAT }, DZ); });
        $$('figcaption', track).forEach((c, i) => tl2.fromTo(c, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: DZ * .4, ease: 'none' }, i ? DZ + LAT * (i / shots.length) * .8 : DZ * .6));
      } else {
        if (frame1) gsap.fromTo(frame1, { clipPath: 'inset(14% 18% 14% 18%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: first, start: 'top 88%', end: 'top 22%', scrub: .6 } });
        if (in1) gsap.fromTo(in1, { scale: 1.4 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: first, start: 'top 88%', end: 'top 22%', scrub: .6 } });
        shots.slice(1).forEach((sh, i) => gsap.fromTo(sh, { x: () => (i % 2 ? -1 : 1) * W() * .14 }, { x: 0, ease: 'none', scrollTrigger: { trigger: sh, start: 'top bottom', end: 'top 35%', scrub: .6, invalidateOnRefresh: true } }));
      }
      // P3 flavour: a still camera; big thin numbers roll from 0, ruler ticks draw one by one
      const p3 = $('.p3', pd);
      blurIn($('#p3-title', p3), { scrollTrigger: { trigger: p3, start: 'top 72%', toggleActions: 'play none none reverse' } }, { stagger: .12 });
      $$('.p3-row', p3).forEach(row => {
        const b = $('.p3-num b', row), to = Number(b.dataset.to), o = { v: 0 };
        b.textContent = '0';
        onCleanup(() => { b.textContent = String(to); });
        gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 80%', once: true } })
          .fromTo($('.p3-label', row), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: EASE }, 0)
          .to(o, { v: to, duration: 2, ease: EASE, onUpdate: () => { b.textContent = String(Math.round(o.v)); } }, .1)
          .fromTo($$('.p3-rule line.tk', row), { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: .6, ease: EASE, stagger: .08 }, .15)
          .fromTo($('.p3-rule line.mk', row), { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: .9, ease: EASE }, 1.1)
          .fromTo($$('.p3-rule span', row), { opacity: 0 }, { opacity: 1, duration: .8 }, 1.2);
      });
      // P4 purchase: a locked-off camera; the options rise in, the small watercolour turns slowly (CSS)
      const p4 = $('.p4', pd);
      blurIn($('#p4-title', p4), { scrollTrigger: { trigger: p4, start: 'top 72%', toggleActions: 'play none none reverse' } }, { stagger: .12 });
      gsap.fromTo($$('.p4-opt,.p4-row,.p4 .pd-actions', p4), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, ease: EASE, stagger: .08, scrollTrigger: { trigger: $('.p4-opts', p4), start: 'top 80%', once: true } });
      gsap.fromTo($('.p4-art', p4), { opacity: 0, scale: .9 }, { opacity: 1, scale: 1, duration: 1.4, ease: EASE, scrollTrigger: { trigger: p4, start: 'top 70%', once: true } });
      // P5 storage & eating: crane up - the two columns rise at two speeds, line drawings draw slowly
      const p5 = $('.p5', pd);
      blurIn($('#p5-title', p5), { scrollTrigger: { trigger: p5, start: 'top 72%', toggleActions: 'play none none reverse' } }, { stagger: .1 });
      $$('.p5-col', p5).forEach((c, i) => gsap.fromTo(c, { y: () => Hh() * (i ? .22 : .08) }, { y: () => -Hh() * (i ? .14 : .04), ease: 'none', scrollTrigger: { trigger: p5, start: 'top bottom', end: 'bottom top', scrub: .7, invalidateOnRefresh: true } }));
      $$('.p5-step', p5).forEach(st => {
        gsap.timeline({ scrollTrigger: { trigger: st, start: 'top 80%', once: true } })
          .fromTo($$('h3,p,.p5-no', st), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, ease: EASE, stagger: .1 }, 0)
          .fromTo($$('.p5-ill [pathLength]', st), { strokeDasharray: 100, strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 2.6, ease: 'power1.inOut', stagger: .2 }, .2);
        const ph = $('.p5-ph .grade', st);
        if (ph) gsap.fromTo(ph, { yPercent: 8 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: st, start: 'top bottom', end: 'bottom top', scrub: .7 } });
      });
      // P6 heading
      blurIn($('#p6-title', pd), { scrollTrigger: { trigger: $('.p6', pd), start: 'top 72%', toggleActions: 'play none none reverse' } }, { stagger: .1 });
    }
    function build(p) {
      kill();
      const pd = $('#view .pd5'); if (!pd) return;
      cur = p; builtW = W();
      if (!fullMotion()) { mode = 'lite'; return; }
      strip(pd);
      if (!libs()) { mode = 'static'; return; }
      gsap.registerPlugin(ScrollTrigger); if (window.SplitText) gsap.registerPlugin(SplitText);
      docEl.classList.add('fx-live');
      const before = splits.length;
      ctx = gsap.context(() => scenes(pd), pd);
      mySplits = splits.splice(before);
      ScrollTrigger.refresh();
      mode = 'full';
    }
    let rt = 0;
    addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (mode !== 'full' || !cur || !$('#view .pd5')) return;
        const crossed = [768, 900].some(b => (builtW < b) !== (W() < b));
        if (crossed || Math.abs(W() - builtW) > 40) { build(cur); Air.scan($('#view')); } else ScrollTrigger.refresh();
      }, 250);
    });
    reduceMQ.addEventListener('change', () => { if (cur && $('#view .pd5')) { build(cur); Air.scan($('#view')); } });
    return { build, kill, mode: () => mode, count: () => (libs() ? ScrollTrigger.getAll().length : 0) };
  })();
  window.__product = ProductMotion;
  window.__air = Air;

  const fig = (src, cap, mark, ar) => '<figure class="ed-figure"><img src="img/' + src + '" alt="' + esc(cap) + '"' + (ar ? ' style="--ar:' + ar + '"' : '') + '><figcaption><span>' + esc(cap) + '</span>' + (mark ? '<span class="mark">' + mark + '</span>' : '') + '</figcaption></figure>';
  // v5.1: an AI scenario image in the editorial layout - label on the picture, credit in the caption, alt prefixed
  const aiFig = (stem, cap, credit = AI_LABEL, altNote = '') => '<figure class="ed-figure"><div class="ed-ph">' + pic(stem, altOf(stem, cap + altNote), { noKb: true }) + aiTag() + '</div><figcaption><span>' + esc(cap) + '</span><span class="mark">' + esc(credit) + '</span></figcaption></figure>';
  pages.origin = () => '<div class="wrap">' + crumb(['產地故事']) +
    head('FROM THE ORCHARD', '產地故事', '從果園到你家門口，一顆水果會經過採收、選果、套網、裝箱和冷藏配送。標「客戶實拍」的是店家在產地與出貨現場拍的照片；標「' + AI_LABEL + '」的是 AI 生成的情境圖，只用來補上還缺的流程畫面，不是店家的果園、人員或包裝紀錄。', '文案示意・產地需客戶確認') +
    '<div class="ed-hero" style="padding-top:0">' + fig('hero-pear-orchard.jpg', '網室棚架下的梨園（客戶實拍）', '', '2/1') + '</div>' +
    '<section class="ed-row" aria-labelledby="o1"><div class="ed-text c-1-5"><span class="ed-no">01</span><h2 id="o1">採收</h2><p>在果園等到果實熟成的那一天才採，不提早摘下來催熟。</p><span class="mark">文案示意</span></div><div class="c-6-13"><div class="ed-pair">' + fig('peach-orchard-farmer.jpg', '手托剛採的水蜜桃，背景是採收中的果園（客戶實拍）', '畫面有人物・需取得肖像同意') + aiFig('ai-black-grape-picking', '手托黑葡萄串，剪下果梗') + '</div></div></section>' +
    '<section class="ed-row" aria-labelledby="o2"><div class="c-2-6">' + fig('apple-fist.jpg', '握拳比對樹上蘋果的大小（客戶實拍）') + '</div><div class="ed-text c-8-13"><span class="ed-no">02</span><h2 id="o2">選果</h2><p>一顆一顆看大小、果色和外觀，分出等級與尺寸，再決定裝進哪一種盒子。</p><span class="mark">分級方式需客戶確認</span></div></section>' +
    '<section class="ed-row" aria-labelledby="o3"><div class="ed-text c-1-5"><span class="ed-no">03</span><h2 id="o3">套網與裝箱</h2><p>每串葡萄、每顆桃都套上網套，減少運送時的碰撞；再依入數排進紙箱，空隙用緩衝墊填好。</p></div><div class="c-6-13"><div class="ed-pair">' + fig('grape-green-double.jpg', '套上網套的綠色葡萄（客戶實拍）') + fig('peach-box15.jpg', '排進紙箱的水蜜桃（客戶實拍）') + '</div><div class="ed-after">' + aiFig('ai-green-grape-packing-box', '裝袋、套上綠網的葡萄排進紙箱') + '</div></div></section>' +
    '<p class="ed-quote">等果實自己熟，<br>再把它送到你手上。<small>文案示意</small></p>' +
    '<section class="ed-row" aria-labelledby="o4"><div class="c-1-8"><div class="ed-pair">' + fig('cherry-orchard-hand.jpg', '櫻桃樹下現採（客戶實拍）') + fig('grape-black-vine.jpg', '棚架上套袋的黑葡萄（客戶實拍）') + '</div>' + '<div style="width:62%;margin:clamp(24px,4vw,48px) 0 0 auto">' + fig('apple-tree.jpg', '樹上慢慢著色的蘋果（客戶實拍）') + '</div></div><div class="ed-text c-9-13"><span class="ed-no">04</span><h2 id="o4">果園裡的日常</h2><p>櫻桃、葡萄、蘋果和梨，各有各的季節。我們跟著產季走，當季的才出貨。</p></div></section>' +
    '<section class="ed-row ed-cont" aria-label="果園裡的照料"><div class="ed-text c-1-5"><p>網室裡還套著紙袋的梨、枝頭上正在長大的蘋果，採收前都要一再巡看。</p><span class="mark">文案示意</span></div><div class="c-6-13"><div class="ed-pair">' + aiFig('ai-pear-net-house-worker', '網室裡照料還套著紙袋的梨') + aiFig('ai-apple-orchard-inspection', '在樹旁握拳，看看蘋果長多大了') + '</div></div></section>' +
    '<section class="ed-row ed-last" aria-labelledby="o5"><div class="ed-text c-2-6"><span class="ed-no">05</span><h2 id="o5">冷藏配送</h2><p>封箱後以冷藏宅配送出，維持新鮮的溫度，直到你打開箱子的那一刻。</p><span class="mark">缺少照片：封箱與冷藏配送，待客戶提供</span></div><div class="ed-text c-7-12"><p class="muted" style="font-size:13px">之後會在這裡放封箱、冷藏車與開箱的照片，讓客人知道水果一路是怎麼被照顧的。</p></div></section></div>';

  pages.gift = () => '<div class="wrap">' + crumb(['送禮']) +
    head('GIFTS', '送禮', '把當季的甜裝進盒子裡，寄給想念的人。', '禮盒內容、價格與檔期皆為示意') +
    '<section class="section"><div class="split"><div class="split-art">' + art('peach', 'card') + '</div><div><span class="kicker">PEACH GIFT BOX</span><h2 class="sec-title" style="margin-bottom:14px">一盒六顆，剛剛好的心意</h2><p class="body-copy">白色內盒、每顆套上網套。適合帶去拜訪，或直接寄給遠方的家人。</p><span class="mark" style="margin:6px 0 22px">需客戶確認：自有禮盒外觀（目前照片看不出品牌）</span><a class="btn" href="#p-peach" id="gift-peach">看水蜜桃禮盒</a></div></div></section>' +
    '<section class="section" aria-labelledby="box-title">' + secHead('box-title', '禮盒推薦') + '<div class="cards more-row" style="padding:0">' + ['peach', 'muscat', 'black-grape', 'cherry'].map(s => card(BY_SLUG[s], 'gift')).join('') + '</div></section>' +
    '<section class="section" aria-labelledby="occ-title">' + secHead('occ-title', '節慶送禮', '檔期示意') + '<div class="trio">' +
    [['1–2 月', '年節', '蘋果、草莓正當季，紅通通的最討喜。', ['apple', 'strawberry']], ['5 月', '母親節', '預購初夏的山形櫻桃，或挑一盒草莓收尾。', ['cherry', 'strawberry']], ['9 月', '中秋', '葡萄與梨的季節，8 月開放預購。', ['muscat', 'pear']]]
      .map(([w, t, d, s]) => '<div><span class="when">' + w + '</span><h3>' + t + '</h3><p>' + d + '</p>' + s.map(x => '<a href="#p-' + x + '" id="occ-' + t + '-' + x + '">' + BY_SLUG[x].name + '</a>').join('、') + '</div>').join('') +
    '</div></section>' +
    '<section class="section" aria-labelledby="msg-title">' + secHead('msg-title', '禮籤留言', '是否提供此服務需客戶確認') + '<div class="msg"><div>' +
    '<div class="field"><label for="msg-to">給</label><input id="msg-to" maxlength="20" value="親愛的媽媽"></div>' +
    '<div class="field"><label for="msg-text">想說的話（最多 80 字）</label><textarea id="msg-text" maxlength="80">謝謝你一直以來的照顧，這盒是今年最甜的一季。</textarea></div>' +
    '<div class="field"><label for="msg-from">署名</label><input id="msg-from" maxlength="20" value="小安"></div></div>' +
    '<div class="slip" aria-live="polite"><span class="slip-k">GIFT NOTE・禮籤預覽</span><span id="pv-to"></span><br><span id="pv-text"></span><span class="from" id="pv-from"></span></div></div></section></div>';
  function syncSlip() { if (!$('#pv-to')) return; $('#pv-to').textContent = ($('#msg-to').value || '　') + '：'; $('#pv-text').textContent = $('#msg-text').value; $('#pv-from').textContent = '— ' + ($('#msg-from').value || '　'); }

  pages.guide = () => '<div class="wrap">' + crumb(['吃法與保存']) +
    head('HOW TO ENJOY', '吃法與保存', '怎麼看熟了沒、怎麼放、怎麼切。', '一般常識整理・需依實際品種確認') +
    '<div class="guide-list" style="margin-bottom:clamp(48px,7vw,88px)">' + PRODUCTS.map(p => '<article class="guide-item" aria-labelledby="g-' + p.slug + '"><a class="guide-art" href="#p-' + p.slug + '" id="guide-art-' + p.slug + '" aria-label="看' + esc(p.name) + '">' + art(p.slug, 'small', true) + '</a><div><h2 id="g-' + p.slug + '">' + esc(p.name) + '</h2><span class="mark" style="font-size:11px">產季 ' + esc(p.season) + '（需客戶確認）</span><dl><div><dt>熟成判斷</dt><dd>' + esc(p.ripe) + '</dd></div><div><dt>保存</dt><dd>' + esc(p.storage) + '</dd></div><div><dt>切法與吃法</dt><dd>' + esc(p.cut) + '</dd></div></dl></div></article>').join('') + '</div></div>';

  pages.service = () => '<div class="wrap">' + crumb(['配送與售後']) +
    head('DELIVERY & CARE', '配送與售後', '水果是生鮮，從出貨到開箱，每一步我們都想說清楚。', '以下規則皆為示意・需客戶確認') +
    // v5.1: shipping times get their own section so the generic AI loading scene never sits next to the cold-delivery
    // copy (it must not read as proof of a cold chain or of the shop's real dispatch); the rules text is unchanged.
    '<section class="section" aria-labelledby="out-title">' + secHead('out-title', '出貨時間') + '<div class="svc-ship">' +
    aiFig('ai-carrying-carton-loading-concept', '抱著整箱水蜜桃走向車子的工作者', 'AI 生成通用情境示意，非店家實際出貨流程', '（通用情境，非店家實際出貨流程）') + '<div class="rules">' +
    [['出貨時間', '現貨於付款後 3–5 個工作天出貨；預購商品依產季開賣後，依訂單順序出貨。'], ['指定到貨日', '可指定到貨日期（不含週日與國定假日）；遇天候或產地狀況可能調整。']]
      .map(([t, d]) => '<div><h3>' + t + '</h3><p>' + d + '</p></div>').join('') + '</div></div></section>' +
    // v5.1: damage claims sit between the shipping section (AI loading scene) and the cold-delivery rules,
    // so the generic loading picture and the cold-chain copy are a whole section apart
    '<section class="section" aria-labelledby="claim-title">' + secHead('claim-title', '破損理賠流程', '需客戶確認') + '<ol class="seq">' +
    ['到貨 24 小時內，拍下外箱與受損水果的照片', '透過客服管道提供訂單編號與照片（客服管道待提供）', '客服確認後回覆處理方式', '依狀況補寄或部分退款'].map(t => '<li>' + t + '</li>').join('') + '</ol></section>' +
    '<section class="section" aria-labelledby="ship-title">' + secHead('ship-title', '配送方式') + '<div class="rules">' +
    [['冷藏配送', '全程低溫宅配，運費 ' + money(SHIP_FEE) + '，滿 ' + money(FREE_SHIP) + ' 免運。'], ['到貨處理', '收到後請立即開箱，確認數量與外觀，並依各水果的保存方式冷藏或常溫放置。']]
      .map(([t, d]) => '<div><h3>' + t + '</h3><p>' + d + '</p></div>').join('') + '</div></section>' +
    '<section class="section" aria-labelledby="faq-title" style="padding-bottom:clamp(56px,8vw,96px)">' + secHead('faq-title', '常見問題', '示意') + '<div class="faq">' +
    [['可以寄送外島嗎？', '目前僅配送台灣本島（示意，需確認）。'], ['預購的水果什麼時候會收到？', '依各水果產季開賣後陸續出貨，出貨前會先通知您。'], ['收件人不在家怎麼辦？', '冷藏宅配會再聯繫收件人改約時間；請盡量填寫方便收件的時段。'], ['可以取消訂單嗎？', '出貨前可以取消；水果屬生鮮食品，出貨後恕不接受非品質因素的退貨。'], ['可以開統一編號嗎？', '結帳時可填寫統一編號（實際作法需確認）。']]
      .map(([q, a], i) => '<details id="faq-' + (i + 1) + '"><summary>' + q + '</summary><p>' + a + '</p></details>').join('') + '</div></section></div>';

  // ---------- basket page (live /cart) ----------
  const shipFee = () => (basketTotal() >= FREE_SHIP || !basket.length ? 0 : SHIP_FEE);
  pages.cart = () => '<div class="wrap-narrow cart-page"><div class="info-box"><strong>這是網站樣稿。</strong>菜籃只存在這個瀏覽器分頁，不會成立訂單。<br>正式上線後，會員登入與註冊沿用 1SHOP 平台。</div><span class="kicker" style="display:block;margin-top:clamp(28px,4vw,40px)">P.64 · BASKET</span><h1 class="mag-h1" tabindex="-1" style="margin-top:10px">目前已經選購</h1><div id="cart-body"></div></div>';
  function renderCartPage() {
    const body = $('#cart-body'); if (!body) return;
    const items = basket.length ? basket.map(l => { const p = BY_SLUG[l.slug], s = specOf(l), key = esc(l.slug + '|' + l.spec), idk = esc(l.slug + '-' + l.spec);
      return '<div class="cart-item"><a class="cart-thumb" href="#p-' + p.slug + '" id="ct-' + idk + '" aria-label="看' + esc(p.name) + '">' + art(p.slug) + '</a><div><h2><a href="#p-' + p.slug + '">' + esc(p.name) + '</a></h2><span class="spec">' + esc(s.label) + '・單價 ' + money(s.price) + '</span><br><div class="qty" role="group" aria-label="' + esc(p.name) + '數量"><button type="button" data-q="' + key + '" data-d="-1" id="cq-minus-' + idk + '" aria-label="減少">−</button><input type="number" min="1" max="99" value="' + l.qty + '" data-qi="' + key + '" id="cq-' + idk + '" aria-label="' + esc(p.name + s.label) + '數量"><button type="button" data-q="' + key + '" data-d="1" id="cq-plus-' + idk + '" aria-label="增加">＋</button></div></div>' +
        '<div class="line-sum">' + price(s.price * l.qty) + '<button type="button" class="remove" data-rm="' + key + '" id="cr-' + idk + '">移除</button></div></div>'; }).join('')
      : '<div class="cart-empty">購物車「沒有產品」，請先將產品「加入購物車」<br><a class="link-arrow" href="#catalog" id="cart-empty-link" style="display:inline-block;margin-top:14px">去看看所有商品 ↗</a></div>';
    const fee = shipFee();
    body.innerHTML = '<div class="cart-card">' + items + '<div class="cart-total"><div><span>商品小計</span>' + price(basketTotal()) + '</div><div><span>運費（冷藏宅配・示意）</span><span>' + (basket.length ? (fee ? money(fee) : '免運') : '—') + '</span></div><div class="grand"><span>合計</span>' + price(basketTotal() + fee) + '</div></div></div>' +
      '<div class="cart-cta"><button class="btn btn-block" type="button" id="go-checkout"' + (basket.length ? '' : ' disabled') + '>前往結帳</button><p>滿 ' + money(FREE_SHIP) + ' 免運・運費與付款方式皆為示意</p></div>';
  }
  document.addEventListener('click', e => {
    const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
    if (q) { const [slug, spec] = q.dataset.q.split('|'); const l = basket.find(x => x.slug === slug && x.spec === spec); if (l) setQty(slug, spec, l.qty + Number(q.dataset.d)); }
    if (rm) { const [slug, spec] = rm.dataset.rm.split('|'); setQty(slug, spec, 0); toast('已從菜籃移除。'); }
    if (e.target.closest('#go-checkout')) location.hash = '#checkout';
  });
  document.addEventListener('change', e => { const i = e.target.closest('[data-qi]'); if (!i) return; const [slug, spec] = i.dataset.qi.split('|'); setQty(slug, spec, Math.max(1, parseInt(i.value, 10) || 1)); });

  // ---------- checkout (3 steps, never submits) ----------
  let coStep = 1, coDone = false;
  const coData = {};
  pages.checkout = () => { coStep = 1; coDone = false; return '<div class="wrap-narrow cart-page">' + crumb(['我的菜籃', 'cart'], ['結帳']) + '<span class="kicker" style="display:block;margin-top:clamp(28px,4vw,40px)">P.66 · CHECKOUT</span><h1 class="mag-h1" tabindex="-1" style="margin-top:10px">結帳</h1><div id="co-body"></div></div>'; };
  function renderCheckout() {
    const body = $('#co-body'); if (!body) return;
    if (!basket.length && !coDone) { body.innerHTML = '<div class="cart-card"><div class="cart-empty">菜籃是空的，先挑一樣喜歡的水果吧。<br><a class="link-arrow" href="#catalog" id="co-empty-link" style="display:inline-block;margin-top:14px">去看看所有商品 ↗</a></div></div>'; return; }
    const steps = '<ol class="steps" aria-label="結帳步驟">' + ['收件資訊', '配送與付款', '確認訂單'].map((t, i) => '<li' + (coStep === i + 1 && !coDone ? ' aria-current="step"' : '') + (coStep > i + 1 || coDone ? ' class="done"' : '') + '><span class="circle">' + (i + 1) + '</span>' + t + '</li>').join('') + '</ol>';
    if (coDone) { body.innerHTML = steps + '<div class="co-card co-done" id="co-done"><span class="mark">MOCKUP・樣稿</span><h2 tabindex="-1">這是樣稿，不會送出訂單</h2><p>沒有建立訂單，也沒有收款。<br>正式上線時，這一步會進入 1SHOP 平台的結帳與付款流程。</p><a class="btn" href="#home" id="co-home">回首頁逛逛</a></div>'; return; }
    const v = k => esc(coData[k] || '');
    let inner = '';
    if (coStep === 1) inner = '<h2>收件資訊</h2><div class="row2"><div class="field"><label for="co-name">收件人姓名</label><input id="co-name" name="name" autocomplete="off" value="' + v('name') + '"></div><div class="field"><label for="co-phone">手機號碼</label><input id="co-phone" name="phone" inputmode="tel" autocomplete="off" value="' + v('phone') + '"></div></div>' +
      '<div class="row2"><div class="field"><label for="co-city">縣市</label><select id="co-city" name="city">' + ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市', '其他縣市'].map(c => '<option' + (coData.city === c ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></div><div class="field"><label for="co-date">指定到貨日</label><select id="co-date" name="date"><option>不指定</option><option>平日上午</option><option>平日下午</option></select></div></div>' +
      '<div class="field"><label for="co-addr">地址</label><input id="co-addr" name="addr" autocomplete="off" value="' + v('addr') + '"><span class="hint">樣稿不會檢查或儲存欄位內容，可以留白直接下一步。</span></div>';
    if (coStep === 2) inner = '<h2>配送與付款</h2><span class="field-title" style="margin-top:0">配送方式</span><label class="choice"><input type="radio" name="ship" id="co-ship-cold" checked><span><strong>冷藏宅配</strong><small>運費 ' + money(SHIP_FEE) + '，滿 ' + money(FREE_SHIP) + ' 免運（示意）</small></span></label>' +
      '<span class="field-title">付款方式</span><label class="choice"><input type="radio" name="pay" id="co-pay-atm" checked><span><strong>ATM 轉帳</strong><small>下單後提供虛擬帳號（示意）</small></span></label><label class="choice"><input type="radio" name="pay" id="co-pay-cod"><span><strong>貨到付款</strong><small>是否提供需客戶確認</small></span></label><label class="choice"><input type="radio" name="pay" id="co-pay-card"><span><strong>信用卡</strong><small>正式上線時會跳轉到第三方付款頁面填寫，本站不收集卡號</small></span></label>' +
      '<div class="field" style="margin-top:16px"><label for="co-note">備註（選填）</label><textarea id="co-note" name="note">' + v('note') + '</textarea></div>';
    if (coStep === 3) { const fee = shipFee(); inner = '<h2>確認訂單</h2><div class="co-summary">' + basket.map(l => '<div><span>' + esc(BY_SLUG[l.slug].name + '・' + specOf(l).label) + ' × ' + l.qty + '</span><span>' + money(specOf(l).price * l.qty) + '</span></div>').join('') + '<div><span>運費（示意）</span><span>' + (fee ? money(fee) : '免運') + '</span></div><div><strong style="font-weight:500">合計</strong>' + price(basketTotal() + fee, 'price-lg') + '</div></div>'; }
    body.innerHTML = steps + '<form class="co-card" id="co-form" novalidate>' + inner + '<div class="co-nav">' + (coStep > 1 ? '<button type="button" class="btn btn-line" id="co-back">上一步</button>' : '<a class="btn btn-line" href="#cart" id="co-back-cart">回菜籃</a>') + '<button type="submit" class="btn" id="co-next">' + (coStep === 3 ? '送出訂單' : '下一步') + '</button></div>' + (coStep === 3 ? '<span class="mark" style="margin-top:12px;font-size:11px">樣稿：按下後不會送出任何資料</span>' : '') + '</form>';
  }
  document.addEventListener('submit', e => {
    if (e.target.id !== 'co-form') return;
    e.preventDefault(); // mockup: never submits anywhere
    $$('input[name],select[name],textarea[name]', e.target).forEach(i => { if (i.type !== 'radio') coData[i.name] = i.value; });
    if (coStep < 3) coStep++; else coDone = true;
    renderCheckout(); window.scrollTo({ top: 0 });
    const h = $('#co-done h2') || $('#co-form h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  });
  document.addEventListener('click', e => { if (e.target.closest('#co-back')) { coStep = Math.max(1, coStep - 1); renderCheckout(); } });

  // ---------- mockup notes ----------
  const notes = items => '<ul class="notes-list">' + items.map(([t, d, m]) => '<li><strong>' + t + (m ? '<span class="mark">' + m + '</span>' : '') + '</strong><span>' + d + '</span></li>').join('') + '</ul>';
  pages['about-mockup'] = () => '<div class="wrap">' + crumb(['樣稿說明']) +
    head('ABOUT THIS MOCKUP', '樣稿說明', '這是「網站做出來大概長什麼樣」的樣稿。可以點、可以逛、可以把水果放進菜籃，但不會成立任何訂單。凡是旁邊有陶土紅小字（例如「價格示意」「需客戶確認」）的內容，都是我們先代填的，需要您提供或確認後才會換成正式內容。正式店面仍在 1SHOP 平台上，這份樣稿與它完全分開。') +
    '<section class="section" aria-labelledby="ver-title">' + secHead('ver-title', '這一版改了什麼', '第六版・10 月 16 日') + notes([
      ['正式店名：幸 SHIAWASE', '店名確定，「店名暫定」的標示已拿掉。頁首、選單、頁尾、封面刊頭與封底都換上客戶提供的毛筆字 logo（向量檔，深色照片上用紙色版）；品牌朱紅 #A32136 取自 logo，是全站唯一的強調色，只用在印章、頁碼、編號與細線重點。'],
      ['像一本日本生活誌', '首頁每個跨頁上緣加了柱（小字刊名與章節）、邊欄直排英文小標；目次用點線引導到頁碼，特集加上朱紅「特集」標記；各章有一行假名小副標（如「もくじ」「季節のたより」）；封底改成奧付（誌名、號數、攝影、發行）與朱紅落款印章。日文字型只用在假名，漢字仍用思源宋體／黑體繁中。'],
      ['更深、更慢、更美', '全站照片套用同一套電影調色；畫面上多了一層暖色散景光點與「鏡頭前」掠過的模糊水果；滑鼠移動時各層依深度位移；水彩水果會輕輕呼吸。每一鏡的捲動放慢約 1.5 倍，鏡頭之間有只放一條細線的「呼吸頁」，畫面上的小字也減少了。'],
      ['鏡頭不再硬切', '封面俯降到目次、目次的照片放大成特集開場、特集滑動變焦進入「從採收到你家」、最後一張下沉時果園日誌升起、日誌失焦時送禮之書對焦。'],
      ['商品頁也是一部短片', '每種水果的商品頁：水彩從你點的地方飛進主視覺，接著環繞特寫、產地與包裝、風味、選購、保存與吃法、也看看。第一個畫面就有價格與「放入菜籃」，往下捲後底部會出現固定的購買列。'],
      ['首頁改成一本會動的季刊', '輪盤下方改成《幸》：封面、目次、特集「十月正好吃」、從採收到你家、果園日誌、送禮之書、安心宅配、封底，共八個鏡頭，每一鏡都有運鏡、前中後景深與特效（招牌是照片像水彩暈開的轉場）。輪盤在最後一種水果時再往下捲，選中的水果會飛進封面。'],
      ['全站動態', '平滑捲動、頁碼與閱讀進度線、膠片顆粒、游標「看看」、換頁時紙色帷幕由下往上擦過；其他頁的大標改成雜誌式（頁碼、英文小標、大號明朝體）。'],
      ['回到官網的設計', '全站改用已上線官網的設計語言：奶油紙色、橄欖墨色、1px 細線、水彩插畫與大量留白。規格整理在「<a href="#design-system">設計系統</a>」頁。'],
      ['首頁與官網一致', '首頁就是官網首頁（輪盤、菜籃、水果三欄），滾輪、手機上滑、左右滑、上下箭頭的切換方式都和官網相同；只是商品改成靜態資料。'],
      ['新增入口', '官網首頁本來沒有選單；樣稿在右上角「查看菜籃」旁加了「選單」文字按鈕，以及頁尾的「所有商品」。'],
      ['照片的位置', '客戶實拍照片用在首頁區塊、「產地故事」頁與商品頁的「產地與包裝」，用留白多的雜誌式版面；商品卡與商品頁主視覺用水彩插畫。手部與身體入鏡的兩張（手捧梨、手捧桃）旁標「需客戶確認」。另有幾張 AI 生成情境圖，見下一段。']
    ]) + '</section>' +
    '<section class="section" aria-labelledby="ai-title">' + secHead('ai-title', 'AI 生成情境圖', '10 月 13 日補充') + notes([
      ['這是什麼', '我們用 AI 生成了 9 張果園、採收、照料、裝箱與搬運的情境圖，補上客戶照片裡還沒有的畫面。它們<strong>不是</strong>店家的果園、員工、包裝或物流實拍。每張圖的左上角都壓著小字「' + AI_LABEL + '」，在動態鏡頭、滿版畫面與水彩暈染轉場中也一直看得到；圖說與替代文字（alt）同樣寫明。客戶照片維持標「客戶實拍」。'],
      ['首頁「從採收到你家」（3 張）', '開場推近的桃園全景（工作者在桃樹下採桃）、第 1 步「採收」（從枝頭摘下水蜜桃）、第 4 步「裝箱」（套白網套的水蜜桃排進紙箱，實拍只有裝好的箱子）。第 2 步選果、第 3 步套網維持客戶實拍。'],
      ['商品頁「產地與包裝」（6 張）', '每種水果在實拍之後多一張：水蜜桃（從枝頭摘桃）、梨（網室裡照料套袋的梨）、蘋果（在樹旁看蘋果長多大）、黑葡萄（剪下果梗）、麝香葡萄（裝袋套網後排進紙箱）、山形櫻桃（盒裝櫻桃放進白箱）。草莓與香甜柑橘沒有對應的圖，維持原狀。'],
      ['「產地故事」頁（4 張）', '採收段落的黑葡萄剪梗、套網與裝箱段落的綠葡萄裝箱，以及新增的「果園裡的照料」：網室裡的梨、樹旁檢視蘋果。原本的客戶實拍全部保留。'],
      ['「配送與售後」頁（1 張）', '「出貨時間」段落放一張抱著紙箱走向車子的通用情境圖，圖說寫「AI 生成通用情境示意，非店家實際出貨流程」。這一段不提冷藏；「配送方式」（冷藏配送）移到「破損理賠流程」之後，圖和冷藏的說明中間隔著一整段。'],
      ['刻意不做的事', '第 5 步「冷藏配送」不放任何 AI 圖，維持「照片待客戶提供」；裝車圖不出現在任何冷藏、冷鏈的文字旁，避免替還沒確認的配送方式背書。梨的圖只說「照料」，不說成實際的摘法；蘋果的圖是「檢視大小」，不是採收。', '原則'],
      ['正式上線前的建議', '盡量換成店家自己拍的照片（採收動作、裝箱過程、出貨與冷藏配送）。若決定沿用 AI 圖，請保留「' + AI_LABEL + '」標示與圖說，不要拿掉，也不要寫成店家的實際流程。', '建議']
    ]) + '</section>' +
    '<section class="section" aria-labelledby="art-title">' + secHead('art-title', '水彩插畫進度') + notes([
      ['已完成', '全部 9 張：麝香葡萄（綠）、黑葡萄、水蜜桃、山形櫻桃、蘋果、梨、草莓、香甜柑橘、菜籃。'],
      ['之後新增商品', '新水果請照同一套規格繪製（1254×1254、透明背景、植物寫實水彩），風格才會一致。']
    ]) + '</section>' +
    '<section class="section" aria-labelledby="need-title">' + secHead('need-title', '需要您提供的資料') + notes([
      ['店名與 logo', '店名已確定為「幸 SHIAWASE」，網站已換上客戶提供的毛筆字 logo。若有品牌規範（標準色號、最小尺寸、周圍留白）請一併提供。'],
      ['價格與規格', '每項商品的規格（幾入、幾串、重量）、售價、是否有禮盒版本。'],
      ['產地與品種', '每種水果的產地、品種名稱、實際產季月份。'],
      ['配送與理賠規則', '運費、免運門檻、出貨時間、可配送地區、破損理賠流程、客服聯絡方式。'],
      ['品牌故事', '店家的起源、和果園的關係（自家果園或合作農家）、想對客人說的話。'],
      ['缺少的照片', '自有包裝外盒與禮盒外觀、原生橫式的高解析照片、水果切面照、蘋果與梨的出貨包裝、草莓產地照、可放「關於我們」的人像（需授權）、封箱與冷藏配送過程、送禮情境。']
    ]) + '</section>' +
    '<section class="section" aria-labelledby="infer-title">' + secHead('infer-title', '依照片推斷、待您確認') + notes([
      ['日本產地定位', '櫻桃箱印「山形」、葡萄袋上的日文、日式網室梨園與網套包裝，讓我們推斷主打「日本產地直送的季節水果」。全站文案以此為假設。', '推斷'],
      ['品種', '頁面上的品種都是依外觀推測（例如白肉水蜜桃系、Shine Muscat 類、巨峰系、富士系、赤梨系和梨），並已標註「推測」。', '推測'],
      ['產季月份', '商品頁的產季（櫻桃 6–7 月、桃 7–9 月、葡萄 8–10 月、梨 8–10 月、蘋果 10–1 月、柑橘 11–2 月、草莓 12–4 月）為示意。', '示意'],
      ['浮水印照片', '有一張水蜜桃照片帶有其他店家的浮水印，以及一張棚拍的櫻桃照片，看起來不像同一批拍攝。我們不確定與貴店的關係，所以這兩張都沒有放進樣稿。']
    ]) + '</section>' +
    '<section class="section" aria-labelledby="pre-title">' + secHead('pre-title', '使用前需確認') + notes([
      ['冷藏配送照片待提供', '首頁「從採收到你家」的第五步「冷藏配送」目前沒有照片，先用細線框標示「照片待客戶提供」。需要封箱、冷藏車或開箱的照片。這一步刻意不用 AI 生成的裝車圖代替。', '待客戶提供'],
      ['首頁動態與 1SHOP', '首頁的捲動動態使用 GSAP 3.15.0（含 ScrollTrigger、SplitText，從 cdnjs.cloudflare.com 載入）與 Lenis 1.3.26（從 cdn.jsdelivr.net 載入）。日後移植到 1SHOP 的程式區塊時，要先確認平台允許載入外部 script；不允許的話，頁面內容仍會完整顯示，只是沒有動態。', '需確認'],
      ['人物肖像同意', '「手托水蜜桃、背景有農友採收」的照片（原檔 2DD67FF6）中有可辨識的人物，目前放在「產地故事」的採收段落。正式上線前需要取得當事人的肖像使用同意；若無法取得，會換成其他照片。', '需客戶確認'],
      ['未使用的照片', '一張綠葡萄照片色偏太嚴重、一張葡萄照片與另一張重複，這兩張沒有使用。'],
      ['照片位置資訊', '樣稿裡的照片都已縮小，並移除拍攝資訊（包含可能的 GPS 位置）。']
    ]) + '<p style="margin:32px 0 clamp(40px,6vw,72px)"><a class="btn" href="#home" id="about-home">回首頁逛逛</a></p></section></div>';

  // ---------- design system ----------
  pages['design-system'] = () => {
    const sw = (name, v, use) => '<div class="ds-sw"><i style="background:' + v + '"></i><b>' + name + '</b><code>' + esc(v) + '</code><br>' + use + '</div>';
    const ty = (label, spec, html) => '<div><small>' + label + '<br>' + spec + '</small>' + html + '</div>';
    const p0 = BY_SLUG.muscat;
    return '<div class="wrap">' + crumb(['設計系統']) +
      head('DESIGN SYSTEM', '設計系統', '把已上線官網的設計語言整理成規格：大量留白、寫實水彩插畫、1px 細線、克制的字距、奶油紙色與橄欖墨色，陶土紅只用在小字。數值來自官網實際樣式，內容與 design-system.md 一致。') +
      '<section class="section" aria-labelledby="ds-brand">' + secHead('ds-brand', '品牌：幸 SHIAWASE', '第六版') + '<div class="ds-grid2"><div class="ds-logos"><figure><img src="img/brand/shiawase-logo.svg" alt="幸 SHIAWASE logo，朱紅" width="529" height="1068" loading="lazy"><figcaption>朱紅版・紙色底</figcaption></figure><figure class="is-dark"><img src="img/brand/shiawase-logo-paper.svg" alt="幸 SHIAWASE logo，紙色" width="529" height="1068" loading="lazy"><figcaption>紙色版・深色照片上</figcaption></figure><figure><span class="hanko" style="font-size:40px">幸</span><figcaption>落款印章</figcaption></figure></div>' +
      '<ul class="ds-specs"><li><b>檔案</b>：img/brand/shiawase-logo.svg／.png（朱紅）、shiawase-logo-paper.svg／.png（紙色），透明背景，向量路徑取自客戶原檔。</li><li><b>品牌色</b>：朱紅 #A32136，全站唯一強調色，少量使用。</li><li><b>版面語彙</b>：柱（頁面上緣小字刊名與章節）、頁碼、直書大標、邊欄直排英文、目次點線引導、「特集」朱紅標記、封底奧付與落款印章。</li><li><b>字型</b>：漢字一律 Noto Serif TC／Noto Sans TC；Noto Serif JP 只載入假名（Google Fonts text= 子集），用在「しあわせ」等小副標。</li></ul></div></section>' +
      '<section class="section" aria-labelledby="ds-c">' + secHead('ds-c', '色彩') + '<div class="ds-swatches">' +
      sw('紙色 paper', '#f7f2e7', '內頁背景') + sw('首頁紙色', 'oklch(96.5% .015 85)', '首頁背景') + sw('卡片 card', '#fcf8ee', '卡片、資料欄、欄位') + sw('淡底 wash', '#edead8', '商品圖底、頁尾、合計') +
      sw('橄欖墨 ink', '#303b24', '文字、主要按鈕') + sw('次要 muted', '#706f5b', '說明文字') + sw('細線 line', '#c9c4aa', '1px 分隔線、邊框') + sw('朱紅 shu（品牌色）', '#a32136', '取自 logo；唯一強調色：印章、頁碼、編號、標註小字、細線重點') +
      sw('水果色暈 tone', '#ef9d86', '店頭與商品頁的水彩色暈（每種水果一色，約 12% 不透明）') + sw('外框數字 stroke', '#303b2433', '店頭、目次的超大外框編號（1px，不填色）') + '</div></section>' +
      '<section class="section" aria-labelledby="ds-grade">' + secHead('ds-grade', '照片調色（.grade）', '第五版') + '<div class="ds-grid2"><div class="ds-grade">' +
      '<figure><div class="ds-ph"><img src="img/home-peach-box11.webp" alt="原圖：十一入整箱的水蜜桃（客戶實拍）" loading="lazy"></div><figcaption>原圖</figcaption></figure>' +
      '<figure><div class="ds-ph">' + pic('home-peach-box11', '調色後：十一入整箱的水蜜桃（客戶實拍）', { noKb: true }) + '</div><figcaption>調色後（.grade）</figcaption></figure></div>' +
      '<ul class="ds-specs"><li><b>濾鏡</b>：saturate(.9) contrast(.93) brightness(1.03) sepia(.07)，讓不同手機拍的照片像同一部片。</li><li><b>暖色漏光</b>：左上角暖杏色 radial-gradient，soft-light 混合，不透明度 .14。</li><li><b>暗角</b>：radial-gradient 由中心透明到邊緣 6% 橄欖墨。</li><li><b>慢推</b>：照片在畫面中時 scale 1 → 1.06，12 秒來回（減少動態時關閉）。</li></ul></div></section>' +
      '<section class="section" aria-labelledby="ds-t">' + secHead('ds-t', '字體與字級', 'Noto Serif TC ＋ Noto Sans TC') + '<div class="ds-type">' +
      ty('字標', 'logo 圖（SVG）＋ SHIAWASE 9px・.34em', '<span class="brand-demo"><img src="img/brand/shiawase-logo.svg" alt="幸 SHIAWASE" width="27" height="54"><span>SHIAWASE<small class="kana">しあわせ</small></span></span>') +
      ty('假名副標', 'Noto Serif JP（只載入假名）12px・.4em', '<span class="kana" style="font-size:15px;letter-spacing:.4em">季節のたより</span>') +
      ty('店頭品名', '明朝 44–96px・300・.04em（括號內小字）', '<span style="font-family:var(--fm-display);font-size:44px;font-weight:300;letter-spacing:.04em">麝香葡萄<small style="font-size:.32em;color:var(--fm-muted)">（綠）</small></span>') +
      ty('頁面標題', '明朝 28px・400・.1em', '<span style="font-family:var(--fm-display);font-size:28px;letter-spacing:.1em">目前已經選購</span>') +
      ty('卡片品名', '明朝 18px・400', '<span style="font-family:var(--fm-display);font-size:18px">山形櫻桃</span>') +
      ty('正文', '黑體 13–14px・行高 1.9–2・.06em', '<span style="font-size:14px;line-height:2;letter-spacing:.06em">翠綠大粒、皮薄，可以連皮吃。</span>') +
      ty('標註小字', '黑體 12px・陶土紅・.08em', '<span class="mark">價格示意・品種推測</span>') +
      ty('英文小標', '黑體 9px・.3em', '<span class="kicker" style="margin:0">THE FRUIT COLLECTION</span>') +
      ty('價格', '明朝 NT$ 11–14px ＋ 數字 18–26px 700', price(1280, 'price-lg')) + '</div></section>' +
      '<section class="section" aria-labelledby="ds-l">' + secHead('ds-l', '線條與留白') + '<div class="ds-grid2"><ul class="ds-specs"><li><b>線寬</b>：一律 1px；合計區上緣與規格區用 1px 虛線。</li><li><b>圓角</b>：首頁店頭的主要按鈕是 1px 細邊膠囊（高 52px），上一個／下一個是 44px 細線圓鈕；內頁卡片與按鈕 3px 12px 4px 10px（手繪紙卡的不規則角）。</li><li><b>陰影</b>：實心位移 2px 3px 0，不模糊。</li></ul><ul class="ds-specs"><li><b>間距</b>：8／16／24／40px；段落之間 64–96px。</li><li><b>版寬</b>：內頁 1110px，左右至少 16px；首頁左右 5vw。</li><li><b>首頁</b>：頁首 76px（手機 58px），其下整個畫面是店頭舞台；左右邊距 clamp(24px, 5vw, 88px)。</li></ul></div></section>' +
      '<section class="section" aria-labelledby="ds-b">' + secHead('ds-b', '按鈕') + '<div class="ds-demo"><a class="btn" href="#catalog" id="ds-btn-primary">選購</a><button class="btn btn-line" type="button" id="ds-btn-line">繼續挑水果</button><button class="btn" type="button" id="ds-btn-disabled" disabled>售完</button><button class="text-btn" type="button" id="ds-btn-text">查看菜籃 <b class="count-ring">2</b></button>' +
      '<span style="display:inline-grid;place-items:center;width:44px;height:44px;border-radius:50%;border:1px solid #303b2459;font-size:15px" aria-hidden="true">↓</span>' +
      '<span style="display:inline-flex;align-items:center;gap:22px;height:52px;padding:0 26px 0 30px;border:1px solid var(--fm-ink);border-radius:26px;font-size:13px;letter-spacing:.2em" aria-hidden="true">放入菜籃 <span>→</span></span></div></section>' +
      '<section class="section" aria-labelledby="ds-m">' + secHead('ds-m', '標籤小字') + '<div class="ds-grid2"><div><span class="mark">價格示意・品種推測</span><span style="display:block;font-family:var(--fm-display);font-size:24px;letter-spacing:.05em;margin-top:4px">麝香葡萄（綠）</span></div><ul class="ds-specs"><li>照官網測試商品的做法（品名上方的「串接測試・請勿下單」）。</li><li>不用框框、印章、徽章或浮動吊牌。</li><li>頁面最上方一條 26px 細提示列，連到樣稿說明。</li></ul></div></section>' +
      '<section class="section" aria-labelledby="ds-w">' + secHead('ds-w', '店頭：選果轉盤與菜籃', '第六版・storyboard-s0.md') + '<div class="ds-grid2"><ul class="ds-specs"><li><b>構圖</b>（寬 760 以上，含 960）：滿畫面舞台分三層——後景是該水果的水彩色暈與超大外框編號，中景是約 60vh 的主角水彩（持續呼吸、下方接觸陰影），前景是前一個／下一個水果，模糊、放大 1.3 倍、0.35 不透明，部分出畫。</li><li><b>選果轉盤</b>：1px 細線圓弧，圓心在畫面左外側；細刻度每 6°、主刻度與圓點每 18°，切換時整圈轉 18°（0.9 秒），目前品名用細明朝體，前後各一個淡出。</li><li><b>索引列</b>：01–08 序號＋品名，細線相連，目前項有底線，下方進度細線滑到目前位置；游標停留時浮出水彩縮圖。寬度 760 以下收起轉盤，索引列改水平滑動、目前項置中。</li></ul><ul class="ds-specs"><li><b>切換運鏡</b>（約 1.1 秒）：舊水果後退（縮到 .82、失焦、反向位移 6vw），新水果從前景進來（1.28 倍、失焦、+8vw）再對焦；重疊 0.25 秒，不會同時清楚。失焦用預先算好的模糊圖交叉淡化（img/art/soft/），不即時套模糊濾鏡。文字先往上退、新字再從下方推上來；編號用數字滾動。減少動態或「動畫：關閉」只做 0.3 秒交叉淡化。</li><li><b>菜籃</b>：右下角水彩籃（130–176px），上方小字「菜籃 · 2 份」；手機收進頁首只顯示數量。放入時主角水果的複本沿弧線飛入（縮到約 .25、轉 24°、2px 運動模糊），籃子下沉 4px 再回穩，數量滾動加 1。</li><li><b>切換方式</b>：滾輪累積 45 以上、間隔 650ms；手機在舞台上滑；↑↓ 圓鈕、方向鍵、點索引或轉盤品名。最後一種再往下就交棒給封面。</li></ul></div></section>' +
      '<section class="section" aria-labelledby="ds-card">' + secHead('ds-card', '商品卡') + '<div class="cards more-row" style="padding:0">' + card(p0, 'ds') + card(BY_SLUG.peach, 'ds') + '</div></section>' +
      '<section class="section" aria-labelledby="ds-f">' + secHead('ds-f', '表單') + '<div class="ds-grid2"><div><div class="field"><label for="ds-input">收件人姓名</label><input id="ds-input" placeholder="例如：王小明"></div><span class="field-title" style="margin-top:0">規格</span><div class="var-tags"><label class="var-tag"><input type="radio" name="ds-spec" id="ds-spec-1" checked><span>單串禮盒</span></label><label class="var-tag"><input type="radio" name="ds-spec" id="ds-spec-2"><span>雙串裝</span></label></div></div><ul class="ds-specs"><li>欄位：卡片底、1px 細線、最小高 42px；聚焦時邊框變墨色。</li><li>規格：選中改墨色底；售完為停用樣式。</li><li>樣稿的表單一律不送出，結帳最後顯示「這是樣稿，不會送出訂單」。</li></ul></div></section>' +
      '<section class="section" aria-labelledby="ds-v5">' + secHead('ds-v5', '第五版加強：景深、運鏡、留白', 'storyboard-v5.md') + '<ul class="notes-list">' + [
        ['空氣層', '固定在畫面上的 12 個暖色散景光點（手機 6 個），三個深度，用柔邊 radial-gradient 畫、不用模糊濾鏡；緩慢漂移，捲動與滑鼠移動時近的動得多。深色鏡頭時改用 screen 混合發光。', '所有分層元素加 data-depth（0–1），跟著游標位移 6–18px（lerp .08），觸控改成輕微自動漂移；水彩水果持續呼吸（上下 6px、±1.5°、6–9 秒）。'],
        ['前景遮擋', '每個主要鏡頭有一顆 30–45vw 的模糊水彩以約 2 倍速從畫面一角掠過。模糊是預先算好的圖（img/art/blur/），不佔模糊濾鏡的預算。', '手機減半。'],
        ['留白', '左右邊距 clamp(24px, 8vw, 160px)；每鏡捲動長度約 1.5 倍；鏡頭之間有 36vh 的呼吸頁（1px 細線慢慢畫出＋頁碼）；每個畫面一個焦點、最多兩行小字。', '大標改為「模糊到清晰」進場：整個標題 blur(10px) → 0，逐字錯開、字距由 +.12em 收回，1.2 秒。'],
        ['鏡頭交接', 'S1→S2 俯降（封面上移、縮到 .96，目次帶 rotateX 8° 進來）；S2→S3 推近穿越（目次第一列的照片放大成特集開場照片）；S3→S4 滑動變焦（前景水果縮小、背景照片放大，60vh）；S4→S5 升鏡（最後一張下沉淡出、照片牆三個深度升起）；S5→S6 焦點轉移（照片牆模糊 8px 淡出、書由 8px 對焦）。', ''],
        ['商品頁', 'P0 水彩從點擊處飛到主視覺（FLIP）＋紙色帷幕；P1 單果環繞推近（固定 220vh）；P2 產地與包裝：滑動變焦＋橫移；P3 風味大數字與刻度尺；P4 選購（底線畫出、飛入菜籃）；P5 保存與吃法升鏡；P6 也看看水平帶（漂移、拖曳、慣性、焦點）。捲過主視覺後出現固定購買列。', '']
      ].map(([t, a, m]) => '<li><strong>' + t + '</strong><span>' + a + (m ? '<br><span style="color:var(--fm-muted)">' + m + '</span>' : '') + '</span></li>').join('') + '</ul></section>' +
      '<section class="section" aria-labelledby="ds-home">' + secHead('ds-home', '首頁分鏡（幸 SHIAWASE 季刊）', '第四版之一') + '<ul class="notes-list">' + [
        ['S1 封面', '運鏡：推軌＋焦點轉移。固定畫面 250vh；CSS 3D（perspective 1200px），world 層往鏡頭推 1100（手機 760）。', '景深：後景梨園照片 blur 14 → 0、scale 1.25 → 1、亮度 .85 → 1；中景直書刊頭往鏡頭 translateZ 0 → 400 後淡出；前景 7 顆水彩水果（手機 4 顆）依「與焦平面的距離」計算模糊 0–8px（手機 0–4px）。滑鼠移動時整組鏡頭 ±4° 手持晃動；輪盤交棒時選中的水果放大淡出、落到封面前景。'],
        ['S2 目次', '運鏡：靜止。左側直書「目次」、右側頁碼列；1px 線依序由左往右畫出。', '游標移到列上時，代表照片跟著游標浮出（280px、lerp .1、反向旋轉 ±6°），文字右移 12px；點擊用平滑捲動到該區。'],
        ['S3 特集', '運鏡：橫移。垂直捲動驅動水平軌道（放在固定、溢出隱藏的容器裡）。每種當季水果一個跨頁，中間插入引言頁。', '外框大編號 0.6 倍速、照片框內反向位移、水彩 1.35 倍速＋2px 模糊；捲動速度造成照片 skewX（最多 ±3°）。寬度 900 以下改直向，三層視差保留。'],
        ['S4 從採收到你家', '運鏡：推近穿越＋固定鏡頭換景。小照片從兩欄文字之間放大到滿版，兩欄往左右滑出。', '水彩暈染：SVG mask＋feTurbulence＋feDisplacementMap，半徑隨捲動、邊緣持續流動；Safari／iOS 改用 clip-path 不規則圓。每張照片 Ken Burns 1.0 → 1.06；直書步驟名與步驟數字逐字換場。'],
        ['S5 果園日誌', '運鏡：多層速度的升降鏡頭。6 張照片寬 22–40vw 錯位、超出欄線。', '每張照片捲動速度 0.85–1.2；hover 照片放大 1.06、圖說由下滑出、游標「看看」；捲動速度造成 skewY（最多 ±2°）。'],
        ['S6 送禮之書', '運鏡：俯視固定＋翻頁。固定畫面 200vh，中央一本立體的書。', '封面沿書脊翻開 rotateY 0 → -165°（perspective 1600px），左頁印在封面背面；書下陰影與頁面明暗隨角度變化；手機改為封面往上翻（rotateX）。'],
        ['S7 安心宅配', '運鏡：靜止。三欄承諾＋4 題問答。', '1px 圖示 stroke-dashoffset 畫出；大數字從 0 滾到目標值（皆標示意）；問答 grid-template-rows 平順展開。'],
        ['S8 封底', '運鏡：降鏡。巨大明朝體短句逐字推上來。', '5 顆水彩水果依序落進菜籃（重力緩動、落地輕微回彈），最後一顆落下時菜籃下沉 4px；「回到選果」平滑捲回頂端，輪盤接手。']
      ].map(([t, a, m]) => '<li><strong>' + t + '</strong><span>' + a + '<br><span style="color:var(--fm-muted)">' + m + '</span></span></li>').join('') + '</ul></section>' +
      '<section class="section" aria-labelledby="ds-motion">' + secHead('ds-motion', '動態規格') + '<div class="ds-grid2"><ul class="ds-specs">' +
        '<li><b>函式庫</b>：GSAP 3.15.0 ＋ ScrollTrigger ＋ SplitText（cdnjs.cloudflare.com）、Lenis 1.3.26（cdn.jsdelivr.net，cdnjs 沒有 Lenis），都鎖定版本，放在 app.js 之前。</li>' +
        '<li><b>緩動與時長</b>：cubic-bezier(.16,1,.3,1)（與官網相同）；大標逐字 0.9 秒、間隔 0.03 秒；跟著捲動的一律線性 scrub 0.6–1。</li>' +
        '<li><b>屬性</b>：只動 transform、opacity、filter（少量模糊）、clip-path、mask；不在每格量測版面。同時最多 8 個模糊元素。</li>' +
        '<li><b>全站</b>：Lenis 平滑捲動（lerp .08）、左下頁碼與右下期數、頂端 1px 閱讀進度線、膠片顆粒（每 0.12 秒跳一格）、游標「看看」、換頁紙色帷幕（0.7 秒）。</li></ul><ul class="ds-specs">' +
        '<li><b>輪盤交棒</b>：頁面在頂端時滾輪切換水果（Lenis 暫停）；最後一種再往下，Lenis 恢復並平滑捲到封面；回到頂端 650ms 後輪盤重新接手。手機只有選果帶接受上滑。</li>' +
        '<li><b>漸進增強與減少動態</b>：GSAP 沒載入時是完整的靜態雜誌版面；prefers-reduced-motion 或「動畫：關閉」時取消固定畫面與捲動動畫，只剩 0.4 秒淡入。</li>' +
        '<li><b>生命週期</b>：首頁動態建在 gsap.context() 內，換頁離開時 revert（ScrollTrigger、固定畫面、拆字、迴圈全部清掉），回首頁再重建；跨越 768／900 寬度時重建。</li></ul></div></section>' +
      '<section class="section" aria-labelledby="ds-a" style="padding-bottom:clamp(56px,8vw,96px)">' + secHead('ds-a', '水彩插畫規格') + '<div class="ds-grid2"><ul class="ds-specs"><li>寫實植物水彩，含葉、枝或切面；透明背景；原檔 1254×1254。</li><li>放在 fruit/assets/{slug}.png；執行 build_images.py 轉成 img/art/{slug}.webp（長邊 900px）並更新清單。</li><li>不加框、不裁圓。尚未交付的插畫顯示 1px 鉛筆線輪廓、明朝體品名與「水彩插畫繪製中」。</li></ul><div class="more-row" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px"><div class="card-art" style="border-radius:var(--fm-radius)">' + art('apple', 'card') + '</div><div class="card-art" style="border-radius:var(--fm-radius)">' + art('cherry', 'card') + '</div></div></div></section></div>';
  };

  // =====================================================================
  // ROUTER (hash: letters, digits and "-" only)
  // =====================================================================
  const site = $('#site'), view = $('#view'), menu = $('#menu');
  let firstRoute = true;
  function route() {
    const h = location.hash.replace(/^#/, '') || 'home';
    if (!/^[a-z0-9-]+$/.test(h)) { history.replaceState(null, '', '#home'); return route(); }
    const prod = /^p-(.+)$/.exec(h);
    ProductMotion.kill(); unbindProduct(); // nothing from the previous product page survives a route change
    if (menu.open) menu.close();
    if (H('#cart-dialog').open) H('#cart-dialog').close();
    if (h === 'home') {
      const wasHidden = root.hidden;
      root.hidden = false; site.hidden = true;
      document.documentElement.classList.add('route-home'); document.body.classList.add('route-home');
      document.title = '幸 SHIAWASE｜網站樣稿';
      select(current, 1, true); renderBasket();
      if (wasHidden) Fx.jump(0);
      // (re)build home motion after layout; leaving home kills it (see below)
      const first = firstRoute;
      requestAnimationFrame(() => { if (homeActive()) { HomeMotion.build(); Fx.routed('home', null, first); } });
      firstRoute = false; return;
    }
    let html;
    pageKey = h;
    if (prod && BY_SLUG[prod[1]]) { html = productPage(BY_SLUG[prod[1]]); document.title = BY_SLUG[prod[1]].name + '｜幸 SHIAWASE'; }
    else if (pages[h]) { html = pages[h](); document.title = TITLES[h] + '｜幸 SHIAWASE'; }
    else { history.replaceState(null, '', '#home'); return route(); }
    HomeMotion.kill(); // no home ScrollTriggers survive outside home
    root.hidden = true; site.hidden = false;
    document.documentElement.classList.remove('route-home'); document.body.classList.remove('route-home');
    const [fno, fname] = Fx.folioOf(h);
    view.innerHTML = '<div class="page" data-folio="' + fno + '" data-sec="' + esc(fname) + '"><div class="wrap run-head" aria-hidden="true"><span><b>P.' + fno + '</b>　' + esc(fname) + '</span><span>' + ISSUE.mark + ' ' + ISSUE.no + '</span></div>' + html + '</div>';
    const navKey = prod ? 'catalog' : h;
    $$('#site-nav a').forEach(a => { if (a.getAttribute('href') === '#' + navKey) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (prod) {
      const p = BY_SLUG[prod[1]];
      bindProduct(p);
      requestAnimationFrame(() => { if ($('#view .pd5')) { ProductMotion.build(p); Air.scan(view); } });
    } else Air.scan(view);
    if (h === 'cart') renderCartPage();
    if (h === 'checkout') renderCheckout();
    if (h === 'gift') { syncSlip(); ['msg-to', 'msg-text', 'msg-from'].forEach(id => $('#' + id).addEventListener('input', syncSlip)); }
    Fx.jump(0);
    Fx.routed(h, view.firstChild, firstRoute);
    if (!firstRoute) { const t = $('#view h1'); if (t) t.focus({ preventScroll: true }); }
    firstRoute = false;
    renderBasket();
  }

  $('#menu-open').onclick = () => menu.showModal();
  $('#menu-open-home').onclick = () => menu.showModal();
  $('#menu-close').onclick = () => menu.close();
  menu.addEventListener('click', e => { if (e.target.closest('a') && e.target.closest('a').getAttribute('href') === location.hash) menu.close(); });
  $('#skip-link').addEventListener('click', e => { e.preventDefault(); const t = root.hidden ? $('#view h1') || view : $('#fruit-title'); t.setAttribute('tabindex', '-1'); t.focus(); });
  window.addEventListener('hashchange', route);
  Fx.apply();
  route();
})();
