/* ===============================
   E-Com Shop - cart.js (2026)
   MIT Licensed. © Thomas Davis
================================ */

function getBase() {
  const meta = document.querySelector('meta[name="asset-base"]');
  return meta?.content?.trim() || (location.pathname.includes('/pages/') ? '..' : '.');
}

function money(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(num);
}

function getCart() {
  return JSON.parse(localStorage.getItem('cart_v2')) || []; // [{id, qty}]
}

function saveCart(cart) {
  localStorage.setItem('cart_v2', JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, x) => sum + (x.qty || 0), 0);
  const el = $('#cart-count');
  if (el) el.textContent = String(count);
}

async function fetchItems() {
  const base = getBase();
  const res = await fetch(`${base}/data/items.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load items.json');
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

function setQty(itemId, newQty) {
  const cart = getCart();
  const idx = cart.findIndex(x => x.id === itemId);

  if (newQty <= 0) {
    if (idx !== -1) cart.splice(idx, 1);
  } else {
    if (idx === -1) cart.push({ id: itemId, qty: newQty });
    else cart[idx].qty = newQty;
  }

  saveCart(cart);
  updateCartCount();
}

function clearCart() {
  localStorage.removeItem('cart_v2');
  updateCartCount();
}

async function loadCart() {
  const cartContainer = $('#cart-items');
  const totalContainer = $('#cart-total');
  const checkoutButton = $('#checkout-button');

  if (!cartContainer || !totalContainer || !checkoutButton) return;

  const base = getBase();
  const items = await fetchItems();
  const cart = getCart();

  cartContainer.innerHTML = '';

  if (!cart.length) {
    cartContainer.innerHTML = `<div class="empty-state">
      <h3>Your cart is empty</h3>
      <p class="muted">Find something you like and add it to your cart.</p>
      <a class="btn" href="${base}/index.html">Shop Now</a>
    </div>`;
    totalContainer.textContent = `Total: ${money(0)}`;
    checkoutButton.disabled = true;
    return;
  }

  checkoutButton.disabled = false;

  let total = 0;

  cart.forEach(({ id, qty }) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const line = (Number(item.price) || 0) * (Number(qty) || 0);
    total += line;

    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div class="cart-thumb">
        <img src="${base}/images/${item.image}" alt="${item.name}">
      </div>
      <div class="cart-meta">
        <div class="cart-name">${item.name}</div>
        <div class="cart-price muted">${money(item.price)}</div>
        <div class="cart-qty">
          <button class="qty-btn" data-dec="${id}" aria-label="Decrease quantity">−</button>
          <span class="qty-num" aria-label="Quantity">${qty}</span>
          <button class="qty-btn" data-inc="${id}" aria-label="Increase quantity">+</button>
          <button class="link-danger" data-remove="${id}">Remove</button>
        </div>
      </div>
      <div class="cart-line">${money(line)}</div>
    `;
    cartContainer.appendChild(row);
  });

  totalContainer.textContent = `Total: ${money(total)}`;

  cartContainer.addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    const rem = e.target.closest('[data-remove]');

    if (inc) {
      const id = Number(inc.getAttribute('data-inc'));
      const current = getCart().find(x => x.id === id)?.qty || 0;
      setQty(id, current + 1);
      loadCart();
    }

    if (dec) {
      const id = Number(dec.getAttribute('data-dec'));
      const current = getCart().find(x => x.id === id)?.qty || 0;
      setQty(id, current - 1);
      loadCart();
    }

    if (rem) {
      const id = Number(rem.getAttribute('data-remove'));
      setQty(id, 0);
      loadCart();
    }
  }, { once: true });

  checkoutButton.onclick = () => {
    alert('✅ Checkout complete! (Demo mode)\n\nThank you for testing the template.');
    clearCart();
    loadCart();
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  updateCartCount();
  try {
    await loadCart();
  } catch (e) {
    console.error(e);
  }
});
