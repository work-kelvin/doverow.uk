const PASSWORD = 'askandyoushallreceive';
const AUTH_KEY = 'doverow-access';

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
let supabaseClient = null;
let appInitialized = false;
let keyBuffer = '';
let keyBufferTimer = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;

  if (!window.supabase?.createClient || !window.SUPABASE_CONFIG?.url || !window.SUPABASE_CONFIG?.anonKey) {
    return null;
  }

  supabaseClient = window.supabase.createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.anonKey
  );

  return supabaseClient;
}

function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

function isWelcomeVisible() {
  const gate = document.getElementById('welcome-gate');
  return gate && !gate.hidden;
}

async function saveNewsletterEmail(email) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false };

  const client = getSupabase();
  if (!client) {
    return { ok: false, error: new Error('Newsletter service unavailable') };
  }

  const { error } = await client
    .from('newsletter_subscribers')
    .insert({ email: trimmed });

  if (error) {
    const message = (error.message || '').toLowerCase();
    const isDuplicate =
      error.code === '23505' ||
      message.includes('duplicate') ||
      message.includes('unique');

    if (isDuplicate) {
      return { ok: true, alreadySubscribed: true };
    }

    console.error('Newsletter signup failed:', error);
    return { ok: false, error };
  }

  return { ok: true };
}

function unlockSite() {
  document.getElementById('welcome-gate').hidden = true;
  document.getElementById('site-content').hidden = false;
  initApp();
}

function resetKeyBuffer() {
  keyBuffer = '';
  if (keyBufferTimer) {
    clearTimeout(keyBufferTimer);
    keyBufferTimer = null;
  }
}

function handleSecretKey(e) {
  if (!isWelcomeVisible() || isAuthenticated()) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1) return;

  keyBuffer += e.key.toLowerCase();

  if (!PASSWORD.startsWith(keyBuffer)) {
    keyBuffer = e.key.toLowerCase();
    if (!PASSWORD.startsWith(keyBuffer)) keyBuffer = '';
  }

  clearTimeout(keyBufferTimer);
  keyBufferTimer = setTimeout(resetKeyBuffer, 3000);

  if (keyBuffer === PASSWORD) {
    resetKeyBuffer();
    sessionStorage.setItem(AUTH_KEY, 'true');
    unlockSite();
  }
}

function setupWelcomeGate() {
  const form = document.getElementById('welcome-form');
  const successEl = document.getElementById('welcome-success');
  const errorEl = document.getElementById('welcome-error');
  const submitBtn = document.getElementById('welcome-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successEl.hidden = true;
    errorEl.hidden = true;

    const email = document.getElementById('welcome-email').value;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Joining…';

    try {
      const result = await saveNewsletterEmail(email);

      if (!result.ok) {
        errorEl.hidden = false;
        return;
      }

      form.reset();
      successEl.textContent = result.alreadySubscribed
        ? "You're already on the list."
        : "You're on the list.";
      successEl.hidden = false;
    } catch (err) {
      console.error('Newsletter signup failed:', err);
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Join';
    }
  });

  document.addEventListener('keydown', handleSecretKey);
}

function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  const menuItems = document.querySelectorAll('[data-page]');

  pages.forEach((p) => p.classList.remove('page--active'));
  menuItems.forEach((m) => m.classList.remove('menu-item--active'));

  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('page--active');

  const menuItem = document.querySelector(`[data-page="${pageId}"]`);
  if (menuItem) menuItem.classList.add('menu-item--active');
}

function goHome() {
  closeCart();
  if (window.location.hash !== '#about' && window.location.hash !== '') {
    window.location.hash = 'about';
  } else {
    showPage('about');
  }
}

function bindShopItems() {
  const shopGrid = document.getElementById('shop-grid');
  shopGrid.querySelectorAll('.shop-item').forEach((el) => {
    el.addEventListener('click', () => {
      addToCart(el.dataset.item, el.dataset.category);
      openCart();
    });
  });
}

function shopItemHtml(name, category) {
  return `
    <div class="shop-item" data-item="${name}" data-category="${category}">
      <div class="shop-item__icon"></div>
      <span class="shop-item__name">${name}</span>
    </div>
  `;
}

function renderShop(category) {
  const shopGrid = document.getElementById('shop-grid');
  const shopTitle = document.getElementById('shop-title');
  const shopItemCount = document.getElementById('shop-item-count');
  const items = PLACEHOLDER_ITEMS[category] || [];
  const label = CATEGORIES[category] || 'Shop';

  shopTitle.textContent = label;
  shopItemCount.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;

  if (items.length === 0) {
    shopGrid.innerHTML = '<p class="shop-empty">No items in this category yet.</p>';
    return;
  }

  shopGrid.innerHTML = `<div class="shop-grid">${items.map((name) => shopItemHtml(name, label)).join('')}</div>`;
  bindShopItems();
}

function renderShopAll() {
  const shopGrid = document.getElementById('shop-grid');
  const shopTitle = document.getElementById('shop-title');
  const shopItemCount = document.getElementById('shop-item-count');

  shopTitle.textContent = 'Shop';

  let total = 0;
  const sections = Object.keys(CATEGORIES)
    .map((key) => {
      const label = CATEGORIES[key];
      const items = PLACEHOLDER_ITEMS[key] || [];
      if (items.length === 0) return '';

      total += items.length;
      const itemsHtml = items.map((name) => shopItemHtml(name, label)).join('');
      return `
        <div class="shop-section">
          <h3 class="shop-section__title">${label}</h3>
          <div class="shop-section__grid">${itemsHtml}</div>
        </div>
      `;
    })
    .join('');

  shopItemCount.textContent = `${total} item${total !== 1 ? 's' : ''}`;
  shopGrid.innerHTML = sections || '<p class="shop-empty">No items yet.</p>';
  bindShopItems();
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
  const cartList = document.getElementById('cart-list');
  const cartCount = document.getElementById('cart-count');
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
  const cartPanel = document.getElementById('cart-panel');
  const cartBackdrop = document.getElementById('cart-backdrop');
  const cartToggle = document.getElementById('cart-toggle');

  cartPanel.classList.add('cart-panel--open');
  cartPanel.setAttribute('aria-hidden', 'false');
  cartBackdrop.hidden = false;
  cartToggle.classList.add('menu-item--active');
}

function closeCart() {
  const cartPanel = document.getElementById('cart-panel');
  const cartBackdrop = document.getElementById('cart-backdrop');
  const cartToggle = document.getElementById('cart-toggle');

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
      renderShopAll();
    }
  } else if (page === 'contact') {
    showPage('contact');
  } else {
    showPage('about');
  }
}

function bindSiteEvents() {
  document.querySelectorAll('[data-page]').forEach((item) => {
    item.addEventListener('click', () => closeCart());
  });

  document.querySelectorAll('.dropdown a').forEach((link) => {
    link.addEventListener('click', () => closeCart());
  });

  document.getElementById('shop-link')?.addEventListener('click', () => {
    closeCart();
    requestAnimationFrame(() => {
      document.getElementById('shop-link')?.blur();
    });
  });

  document.querySelector('.menu-bar__home')?.addEventListener('click', (e) => {
    e.preventDefault();
    goHome();
  });

  document.getElementById('cart-toggle')?.addEventListener('click', () => {
    const cartPanel = document.getElementById('cart-panel');
    if (cartPanel.classList.contains('cart-panel--open')) {
      closeCart();
    } else {
      openCart();
    }
  });

  document.getElementById('cart-close')?.addEventListener('click', closeCart);
  document.getElementById('cart-backdrop')?.addEventListener('click', closeCart);
}

function initApp() {
  if (appInitialized) return;
  appInitialized = true;

  bindSiteEvents();
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
  renderCart();
}

if (isAuthenticated()) {
  document.getElementById('welcome-gate').hidden = true;
  document.getElementById('site-content').hidden = false;
  initApp();
} else {
  setupWelcomeGate();
}
