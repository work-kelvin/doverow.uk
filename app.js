const CATEGORIES = {
  uppers: 'Uppers',
  lowers: 'Lowers',
  middle: 'Middle',
  halo: 'Halo',
  steppers: 'Steppers',
  anys: 'Anys',
  sides: 'Sides',
};

const PLACEHOLDER_ITEMS = {
  uppers: ['Jacket I', 'Coat II', 'Vest III'],
  lowers: ['Trouser I', 'Short II', 'Skirt III'],
  middle: ['Layer I', 'Wrap II'],
  halo: ['Crown I', 'Halo II'],
  steppers: ['Stepper I', 'Stepper II', 'Stepper III'],
  anys: ['Object I', 'Object II'],
  sides: ['Side I', 'Side II', 'Side III'],
};

let cart = [];

const pages = document.querySelectorAll('.page');
const menuItems = document.querySelectorAll('[data-page]');
const cartPanel = document.getElementById('cart-panel');
const cartBackdrop = document.getElementById('cart-backdrop');
const cartToggle = document.getElementById('cart-toggle');
const cartClose = document.getElementById('cart-close');
const shopGrid = document.getElementById('shop-grid');
const shopTitle = document.getElementById('shop-title');
const shopItemCount = document.getElementById('shop-item-count');
const cartList = document.getElementById('cart-list');
const cartCount = document.getElementById('cart-count');

function showPage(pageId) {
  pages.forEach((p) => p.classList.remove('page--active'));
  menuItems.forEach((m) => m.classList.remove('menu-item--active'));

  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('page--active');

  const menuItem = document.querySelector(`[data-page="${pageId}"]`);
  if (menuItem) menuItem.classList.add('menu-item--active');
}

function renderShop(category) {
  const items = PLACEHOLDER_ITEMS[category] || [];
  const label = CATEGORIES[category] || 'Shop';

  shopTitle.textContent = label;
  shopItemCount.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;

  if (items.length === 0) {
    shopGrid.innerHTML = '<p class="shop-empty">No items in this category yet.</p>';
    return;
  }

  shopGrid.innerHTML = items
    .map(
      (name) => `
    <div class="shop-item" data-item="${name}" data-category="${label}">
      <div class="shop-item__icon"></div>
      <span class="shop-item__name">${name}</span>
    </div>
  `
    )
    .join('');

  shopGrid.querySelectorAll('.shop-item').forEach((el) => {
    el.addEventListener('click', () => {
      addToCart(el.dataset.item, el.dataset.category);
      openCart();
    });
  });
}

function addToCart(name, category) {
  cart.push({ name, category, id: Date.now() });
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  renderCart();
}

function renderCart() {
  const count = cart.length;
  cartCount.textContent = `${count} item${count !== 1 ? 's' : ''}`;

  if (count === 0) {
    cartList.innerHTML = '<li class="cart-empty">Your cart is empty.</li>';
    return;
  }

  cartList.innerHTML = cart
    .map(
      (item) => `
    <li class="cart-item">
      <span>${item.name} <small>(${item.category})</small></span>
      <button class="cart-item__remove" data-id="${item.id}">Remove</button>
    </li>
  `
    )
    .join('');

  cartList.querySelectorAll('.cart-item__remove').forEach((btn) => {
    btn.addEventListener('click', () => removeFromCart(Number(btn.dataset.id)));
  });
}

function openCart() {
  cartPanel.classList.add('cart-panel--open');
  cartPanel.setAttribute('aria-hidden', 'false');
  cartBackdrop.hidden = false;
  cartToggle.classList.add('menu-item--active');
}

function closeCart() {
  cartPanel.classList.remove('cart-panel--open');
  cartPanel.setAttribute('aria-hidden', 'true');
  cartBackdrop.hidden = true;
  cartToggle.classList.remove('menu-item--active');
}

function handleRoute() {
  const hash = window.location.hash.slice(1) || 'about';
  const [page, category] = hash.split('/');

  if (page === 'shop') {
    showPage('shop');
    if (category && CATEGORIES[category]) {
      renderShop(category);
    } else {
      shopTitle.textContent = 'Shop';
      shopItemCount.textContent = '0 items';
      shopGrid.innerHTML = '<p class="shop-empty">Select a category from the Shop menu.</p>';
    }
  } else if (page === 'contact') {
    showPage('contact');
  } else {
    showPage('about');
  }
}

menuItems.forEach((item) => {
  item.addEventListener('click', (e) => {
    if (item.dataset.page) {
      closeCart();
    }
  });
});

document.querySelectorAll('.dropdown a').forEach((link) => {
  link.addEventListener('click', () => closeCart());
});

cartToggle.addEventListener('click', () => {
  if (cartPanel.classList.contains('cart-panel--open')) {
    closeCart();
  } else {
    openCart();
  }
});

cartClose.addEventListener('click', closeCart);
cartBackdrop.addEventListener('click', closeCart);

window.addEventListener('hashchange', handleRoute);
handleRoute();
renderCart();
