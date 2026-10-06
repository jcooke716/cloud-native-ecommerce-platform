/* ===============================
   E-Com Shop - main.js (2026)
   MIT Licensed. © Thomas Davis
================================ */

const $ = (sel, root = document) => root.querySelector(sel);

function getBase() {
  // Add <meta name="asset-base" content="."> on index
  // Add <meta name="asset-base" content=".."> on /pages/*
  const meta = document.querySelector('meta[name="asset-base"]');
  return meta?.content?.trim() || (location.pathname.includes('/pages/') ? '..' : '.');
}

function money(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(num);
}

/* ===============================
   CART (quantity-based)
================================ */
function getCart() {
  return JSON.parse(localStorage.getItem('cart_v2')) || []; // [{id, qty}]
}

function saveCart(cart) {
  localStorage.setItem('cart_v2', JSON.stringify(cart));
}

function setCartQty(itemId, delta) {
  const cart = getCart();
  const idx = cart.findIndex(x => x.id === itemId);

  if (idx === -1 && delta > 0) {
    cart.push({ id: itemId, qty: delta });
  } else if (idx !== -1) {
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
  }

  saveCart(cart);
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, x) => sum + (x.qty || 0), 0);
  const el = $('#cart-count');
  if (el) el.textContent = String(count);
}

/* ===============================
   Toast
================================ */
function ensureToastWrap() {
  let wrap = document.querySelector('.toast-wrap');
  if (wrap) return wrap;

  wrap = document.createElement('div');
  wrap.className = 'toast-wrap';
  wrap.setAttribute('aria-live', 'polite');
  wrap.setAttribute('aria-atomic', 'true');
  document.body.appendChild(wrap);
  return wrap;
}

function showToast({ title = 'Added to cart', sub = '', actionText = 'View Cart', actionHref = '' } = {}) {
  const wrap = ensureToastWrap();

  const toast = document.createElement('div');
  toast.className = 'toast';

  const hasAction = Boolean(actionHref);

  toast.innerHTML = `
    <div class="toast-icon">✅</div>
    <div class="toast-text">
      <div>${title}</div>
      ${sub ? `<div class="toast-sub">${sub}</div>` : ``}
    </div>
    ${hasAction ? `
      <div class="toast-actions">
        <button class="toast-link" type="button" data-toast-action>${actionText}</button>
      </div>
    ` : ``}
  `;

  wrap.appendChild(toast);

  // Action click (go to cart)
  if (hasAction) {
    toast.querySelector('[data-toast-action]')?.addEventListener('click', () => {
      window.location.href = actionHref;
    });
  }

  // Auto-dismiss
  const ttl = 2200;
  const timer = setTimeout(() => dismissToast(toast), ttl);

  // If user clicks the toast itself, dismiss it
  toast.addEventListener('click', () => {
    clearTimeout(timer);
    dismissToast(toast);
  });
}

function dismissToast(toast) {
  if (!toast || toast.classList.contains('out')) return;
  toast.classList.add('out');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

/* ===============================
   DATA + RENDERING
================================ */
async function fetchItems() {
  const base = getBase();
  const res = await fetch(`${base}/data/items.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load items.json');
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

function productCard(item, base) {
  const div = document.createElement('div');
  div.className = 'product card reveal';
  div.innerHTML = `
    <div class="product-media">
      <img loading="lazy" src="${base}/images/${item.image}" alt="${item.name}">
    </div>
    <div class="product-body">
      <h3 class="product-title">${item.name}</h3>
      <p class="product-price">${money(item.price)}</p>
      <button class="btn" type="button" data-add="${item.id}">Add to Cart</button>
    </div>
  `;
  return div;
}

function miniCard(item, base) {
  const div = document.createElement('div');
  div.className = 'mini-card';
  div.innerHTML = `
    <img loading="lazy" src="${base}/images/${item.image}" alt="${item.name}">
    <div class="mini-body">
      <p class="mini-name">${item.name}</p>
      <p class="mini-price">${money(item.price)}</p>
      <div class="mini-actions">
        <button class="btn" type="button" data-add="${item.id}">Add</button>
      </div>
    </div>
  `;
  return div;
}

async function renderProducts() {
  const productList = $('#product-list');
  if (!productList) return;

  const base = getBase();
  const items = await fetchItems();

  // Category page support:
  // <main data-category="men"> or "women" or "electronics"
  const category = $('main')?.dataset?.category || '';

  const filtered = category ? items.filter(i => i.category === category) : items;

  productList.innerHTML = '';
  filtered.forEach(item => productList.appendChild(productCard(item, base)));

  // Click handler (no inline onclick)
  productList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const id = Number(btn.getAttribute('data-add'));
    setCartQty(id, 1);
    pulseCart();

    const cartHref = getBase() === '.' ? 'pages/cart.html' : 'cart.html';
    showToast({
      title: 'Added to cart',
      sub: 'Tap to view your cart',
      actionText: 'View Cart',
      actionHref: cartHref
    });
  });

  // Optional anime.js (only if present)
  if (window.anime) {
    window.anime({
      targets: '.product.reveal',
      translateY: [14, 0],
      opacity: [0, 1],
      delay: window.anime.stagger(70),
      easing: 'easeOutQuad'
    });
  }
}

async function renderMiniCarousel() {
  const wrap = document.getElementById('mini-carousel');
  if (!wrap) return;

  const base = getBase();
  const items = await fetchItems();

  // Pick a handful (first 10). You can customize this logic.
  const featured = items.filter(i => i.featured).slice(0, 12);

  wrap.innerHTML = '';
  featured.forEach(item => wrap.appendChild(miniCard(item, base)));

  // Add-to-cart click (reuse existing cart logic)
  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;

    const id = Number(btn.getAttribute('data-add'));
    setCartQty(id, 1);
    pulseCart();

    // if you added the toast earlier, this will work too:
    if (typeof showToast === 'function') {
      const cartHref = getBase() === '.' ? 'pages/cart.html' : 'cart.html';
      showToast({
        title: 'Added to cart',
        sub: 'Tap to view your cart',
        actionText: 'View Cart',
        actionHref: cartHref
      });
    }
  });

  // Buttons
  const prev = document.getElementById('mini-prev');
  const next = document.getElementById('mini-next');

const step = 250 + 14;          // card width + gap
const page = step * 4;          // 4 cards per click

prev?.addEventListener('click', () => wrap.scrollBy({ left: -page, behavior: 'smooth' }));
next?.addEventListener('click', () => wrap.scrollBy({ left: page, behavior: 'smooth' }));
}


/* ===============================
   UX polish
================================ */
function pulseCart() {
  const el = $('#cart-count');
  if (!el) return;
  el.classList.remove('pulse');
  // force reflow
  void el.offsetWidth;
  el.classList.add('pulse');
}

function initHeroCarouselButtons() {
  // index.html hero buttons (optional)
  const slides = document.querySelectorAll('.carousel-slide .btn');
  slides.forEach((btn) => {
    const text = btn.textContent.toLowerCase();
    btn.addEventListener('click', () => {
      if (text.includes('men')) location.href = 'pages/men.html';
      else if (text.includes('women')) location.href = 'pages/women.html';
      else location.href = 'pages/electronic.html';
    });
  });
}

function initMobileNav() {
  const toggle = $('#nav-toggle');
  const nav = $('nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Close after clicking a link on mobile
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a') && nav.classList.contains('open')) {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ===============================
   INIT
================================ */
document.addEventListener('DOMContentLoaded', async () => {
  updateCartCount();
  initMobileNav();
  initHeroCarouselButtons();

  try {
    await renderMiniCarousel();
    await renderProducts();
  } catch (err) {
    console.error(err);
    const productList = $('#product-list');
    if (productList) productList.innerHTML = `<p class="muted">Unable to load products right now.</p>`;
  }
});

// HERO CAROUSEL AUTO-ROTATION (kept)
let carouselIndex = 0;
setInterval(() => {
  const slides = document.querySelectorAll('.carousel-slide');
  if (!slides.length) return;
  slides.forEach(s => s.classList.remove('active'));
  carouselIndex = (carouselIndex + 1) % slides.length;
  slides[carouselIndex].classList.add('active');
}, 5000);
