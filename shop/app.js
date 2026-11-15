const SIZES = ['S', 'M', 'L', 'XL'];
const FREE_SHIPPING_MIN = 50000;
const SHIPPING_FEE = 3000;

const PRODUCTS = [
  { id: 1, name: '베이직 반팔 티셔츠', category: '상의', price: 19000, date: '2026-11-01', tag: '신상', tags: ['반팔', '기본', '코튼'],
    stock: { 블랙: [5, 8, 6, 3], 화이트: [4, 7, 5, 2], 그레이: [0, 3, 4, 1] } },
  { id: 2, name: '오버핏 스트릿 후디', category: '상의', price: 49000, date: '2026-10-20', tag: '베스트', tags: ['후디', '오버핏', '스트릿'],
    stock: { 블랙: [2, 4, 3, 1], 그레이: [3, 5, 2, 0], 네이비: [1, 2, 2, 2] } },
  { id: 3, name: '롱슬리브 헨리넥', category: '상의', price: 29000, date: '2026-10-28', tag: '', tags: ['긴팔', '헨리넥'],
    stock: { 화이트: [3, 3, 2, 0], 베이지: [0, 0, 0, 0] } },
  { id: 4, name: '나일론 윈드브레이커', category: '아우터', price: 69000, date: '2026-11-05', tag: '신상', tags: ['바람막이', '나일론', '스트릿'],
    stock: { 블랙: [1, 2, 2, 0], 올리브: [2, 3, 1, 1] } },
  { id: 5, name: '기본 옥스포드 셔츠', category: '상의', price: 39000, date: '2026-09-30', tag: '', tags: ['셔츠', '기본'],
    stock: { 네이비: [2, 3, 1, 0], 화이트: [0, 2, 3, 1] } },
  { id: 6, name: '워시드 데님 팬츠', category: '하의', price: 59000, date: '2026-10-10', tag: '베스트', tags: ['데님', '팬츠', '와이드'],
    stock: { 블랙: [3, 4, 2, 1], 네이비: [2, 2, 0, 0] } },
  { id: 7, name: '카고 조거 팬츠', category: '하의', price: 45000, date: '2026-11-08', tag: '신상', tags: ['카고', '조거', '팬츠'],
    stock: { 베이지: [2, 3, 3, 1], 올리브: [0, 1, 2, 2] } },
  { id: 8, name: '코듀로이 숏 팬츠', category: '하의', price: 25000, date: '2026-09-15', tag: '', tags: ['숏팬츠', '코듀로이'],
    stock: { 베이지: [0, 2, 2, 0], 네이비: [1, 1, 0, 0] } },
];

const $ = (sel) => document.querySelector(sel);
const val = (key) => document.querySelector(`[data-key="${key}"]`).value;
const won = (n) => n.toLocaleString('ko-KR') + '원';
const find = (id) => PRODUCTS.find((p) => p.id === id);
const stockOf = (p, color, size) => p.stock[color]?.[SIZES.indexOf(size)] ?? 0;

function hasStock(p, color = '', size = '') {
  return Object.entries(p.stock).some(([c, counts]) =>
    (!color || c === color) && counts.some((n, i) => n > 0 && (!size || SIZES[i] === size)));
}

const wishlist = new Set();
let cart = [];
let current = null;
let toastTimer;

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
}

function visibleProducts() {
  const q = $('#search').value.trim().toLowerCase();
  const category = val('category');
  const size = val('size');
  const color = val('color');
  const maxPrice = Number(val('maxPrice')) || Infinity;

  const list = PRODUCTS.filter((p) =>
    (!q || p.name.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))) &&
    (!category || p.category === category) &&
    ((!color && !size) || hasStock(p, color, size)) &&
    p.price <= maxPrice);

  const sorters = {
    new: (a, b) => b.date.localeCompare(a.date),
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
  };
  return list.sort(sorters[val('sort')]);
}

function cardHtml(p) {
  const soldOut = !hasStock(p);
  const badge = soldOut ? '품절' : p.tag;
  const wished = wishlist.has(p.id);
  return `
    <article class="card" data-id="${p.id}" tabindex="0">
      <div class="thumb">
        ${badge ? `<span class="badge">${badge}</span>` : ''}
        <button class="heart" type="button" aria-label="위시리스트" aria-pressed="${wished}" data-wish="${p.id}">${wished ? '♥' : '♡'}</button>
        이미지 준비중
      </div>
      <h3>${p.name}</h3>
      <p class="price">${won(p.price)}</p>
    </article>`;
}

function renderGrid() {
  const list = visibleProducts();
  $('#grid').innerHTML = list.length
    ? list.map(cardHtml).join('')
    : '<p class="empty" style="grid-column:1/-1">조건에 맞는 상품이 없습니다.</p>';
}

function toggleWish(btn) {
  const id = Number(btn.dataset.wish);
  const on = !wishlist.has(id);
  if (on) wishlist.add(id);
  else wishlist.delete(id);
  btn.textContent = on ? '♥' : '♡';
  btn.setAttribute('aria-pressed', String(on));
  toast(on ? '위시리스트에 담았습니다.' : '위시리스트에서 뺐습니다.');
}

function openDetail(id) {
  current = { product: find(id), color: '', size: '' };
  renderDetail();
  $('#dlg').showModal();
}

function renderDetail() {
  const { product: p, color, size } = current;
  const colorOpts = Object.keys(p.stock).map((c) =>
    `<button type="button" class="opt${c === color ? ' on' : ''}" data-color="${c}" ${hasStock(p, c, size) ? '' : 'disabled'}>${c}</button>`).join('');
  const sizeOpts = SIZES.map((s) =>
    `<button type="button" class="opt${s === size ? ' on' : ''}" data-size="${s}" ${hasStock(p, color, s) ? '' : 'disabled'}>${s}</button>`).join('');
  const ready = Boolean(color && size);
  const inStock = ready && stockOf(p, color, size) > 0;
  const status = !ready ? '색상과 사이즈를 선택해주세요.' : inStock ? '재고 있음' : '품절';

  $('#detail').innerHTML = `
    <h2>${p.name}</h2>
    <p class="price">${won(p.price)}</p>
    <div class="label">색상</div>
    <div class="opts">${colorOpts}</div>
    <div class="label">사이즈</div>
    <div class="opts">${sizeOpts}</div>
    <p class="stock">${status}</p>
    <div class="actions"><button id="addBtn" type="button" ${inStock ? '' : 'disabled'}>장바구니 담기</button></div>`;
}

function addToCart() {
  const { product: p, color, size } = current;
  const item = cart.find((i) => i.id === p.id && i.color === color && i.size === size);
  const inCart = item ? item.qty : 0;
  if (inCart >= stockOf(p, color, size)) {
    toast('재고가 부족합니다.');
    return;
  }
  if (item) item.qty += 1;
  else cart.push({ id: p.id, color, size, qty: 1 });
  updateCartCount();
  toast('장바구니에 담았습니다.');
}

function updateCartCount() {
  $('#cartCount').textContent = cart.reduce((s, i) => s + i.qty, 0);
}

function renderCart() {
  const empty = cart.length === 0;
  $('#checkoutBtn').disabled = empty;
  if (empty) {
    $('#cartList').innerHTML = '<p class="empty">장바구니가 비어 있습니다.</p>';
    $('#sum').textContent = '';
    return;
  }

  $('#cartList').innerHTML = cart.map((item, i) => {
    const p = find(item.id);
    return `
      <div class="row">
        <div><strong>${p.name}</strong><div style="font-size:13px;color:#555">${item.color} / ${item.size}</div></div>
        <div class="qty">
          <button type="button" data-act="dec" data-i="${i}">−</button>
          <span>${item.qty}</span>
          <button type="button" data-act="inc" data-i="${i}">+</button>
        </div>
        <div>${won(p.price * item.qty)}</div>
        <button type="button" class="ghost" data-act="del" data-i="${i}">삭제</button>
      </div>`;
  }).join('');

  const subtotal = cart.reduce((s, i) => s + find(i.id).price * i.qty, 0);
  const shipping = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
  const hint = shipping ? `<br><small>${won(FREE_SHIPPING_MIN - subtotal)} 더 담으면 무료배송</small>` : '';
  $('#sum').innerHTML =
    `상품 금액 ${won(subtotal)} · 배송비 ${shipping ? won(shipping) : '무료'}<br>` +
    `<strong>합계 ${won(subtotal + shipping)}</strong>${hint}`;
}

$('#grid').addEventListener('click', (e) => {
  const heart = e.target.closest('.heart');
  if (heart) {
    toggleWish(heart);
    return;
  }
  const card = e.target.closest('.card');
  if (card) openDetail(Number(card.dataset.id));
});

$('#grid').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.classList.contains('card')) openDetail(Number(e.target.dataset.id));
});

$('#detail').addEventListener('click', (e) => {
  const opt = e.target.closest('.opt');
  if (opt) {
    if (opt.dataset.color) {
      current.color = opt.dataset.color;
      if (current.size && !hasStock(current.product, current.color, current.size)) current.size = '';
    } else {
      current.size = opt.dataset.size;
    }
    renderDetail();
    return;
  }
  if (e.target.closest('#addBtn')) addToCart();
});

$('#cartBtn').addEventListener('click', () => {
  renderCart();
  $('#cartDlg').showModal();
});

$('#cartList').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const i = Number(btn.dataset.i);
  const item = cart[i];
  const act = btn.dataset.act;
  if (act === 'del') {
    cart.splice(i, 1);
  } else if (act === 'dec') {
    item.qty = Math.max(1, item.qty - 1);
  } else if (item.qty < stockOf(find(item.id), item.color, item.size)) {
    item.qty += 1;
  } else {
    toast('재고가 부족합니다.');
    return;
  }
  updateCartCount();
  renderCart();
});

$('#checkoutBtn').addEventListener('click', () => {
  const subtotal = cart.reduce((s, i) => s + find(i.id).price * i.qty, 0);
  const shipping = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
  const first = find(cart[0].id).name;
  const orderName = cart.length > 1 ? `${first} 외 ${cart.length - 1}건` : first;
  sessionStorage.setItem('checkout', JSON.stringify({ orderName, amount: subtotal + shipping }));
  location.href = 'checkout.html';
});

$('#search').addEventListener('input', renderGrid);
document.querySelectorAll('.filters select').forEach((el) => el.addEventListener('change', renderGrid));

const colors = [...new Set(PRODUCTS.flatMap((p) => Object.keys(p.stock)))];
$('[data-key="color"]').insertAdjacentHTML('beforeend', colors.map((c) => `<option>${c}</option>`).join(''));

renderGrid();
