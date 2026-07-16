const PASSWORDS = ['askandyeshallreceive', 'askandyoushallreceive'];
const AUTH_KEY = 'doverow-access';
const SPLASH_INTERVAL_MS = 180;

const SPLASH_IMAGES = [
  'assets/Website-01.png',
  'assets/Website-02.png',
  'assets/Website-03.png',
  'assets/Website-04.png',
  'assets/Website-05.png',
  'assets/Website-06.png',
  'assets/Website-07.png',
];

const CATEGORIES = {
  uppers: 'Uppers',
  lowers: 'Lowers',
  middle: 'Middle',
  halo: 'Halo',
  steppers: 'Steppers',
  anys: 'Anys',
  sides: 'Sides',
};

const PRODUCTS = {
  uppers: [
    { name: 'Cowy Top', variants: 'multicolour' },
    { name: 'Malawi Vest', variants: 'multi colour' },
    { name: 'Dove Shirt', variants: 'white, okra black & grey, okra navy & black' },
    { name: 'Only You Top', variants: 'multicolour' },
    { name: 'Forever Sweater', variants: 'multicolour' },
    { name: 'Wool Sweater Dove Hand Stitched Arm', variants: 'purple, deep blue' },
    { name: 'Shy Tee', variants: 'multiple colours' },
    { name: 'Shy Shirt', variants: 'multiple colours' },
    { name: 'Shy Hoodie', variants: 'multiple colours' },
  ],
  lowers: [
    {
      name: 'Trim Trouser',
      variants: 'cream, deep navy & red',
      details: 'Back heel stitch faded. Red trimmings. Pocket flap detailing. Deep pockets done well. Slightly straight with loose sections. Upside down with cinder flap.',
    },
  ],
  middle: [
    { name: 'To Be Held', variants: 'braided blue leather' },
    { name: 'Underalls', variants: 'pink & seamed gray' },
  ],
  halo: [
    { name: 'Leather Skully', variants: 'black leather, pink leather' },
    { name: 'Global Cap', variants: 'black leather, multicolour' },
  ],
  steppers: [
    { name: 'Dove Socks', variants: 'black & turquoise blue' },
    { name: 'Missed Connecting Socks', variants: 'pink, white & green' },
  ],
  anys: [
    { name: 'Trumpet', variants: 'green' },
    { name: 'Drum', variants: 'blue' },
    { name: 'Triangle', variants: 'silver & pink' },
    { name: 'Instrument Case', variants: 'cigarette or weed holder' },
  ],
  sides: [
    { name: 'Less Go Bag', variants: 'black & turquoise' },
  ],
};

let cart = [];
let supabaseClient = null;
let supabaseLoading = null;
let appInitialized = false;
let splashTimer = null;

function setupEntrySplash() {
  const splash = document.getElementById('entry-splash');
  const splashImage = document.getElementById('entry-splash-image');
  if (!splash || !splashImage) return;

  SPLASH_IMAGES.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  let imageIndex = 0;
  splashTimer = setInterval(() => {
    imageIndex = (imageIndex + 1) % SPLASH_IMAGES.length;
    splashImage.src = SPLASH_IMAGES[imageIndex];
  }, SPLASH_INTERVAL_MS);

  function dismissSplash() {
    if (splashTimer) {
      clearInterval(splashTimer);
      splashTimer = null;
    }
    splash.hidden = true;
  }

  splash.addEventListener('click', dismissSplash);
  splash.focus();
}

function loadSupabaseScript() {
  if (window.supabase?.createClient) {
    return Promise.resolve();
  }

  if (supabaseLoading) return supabaseLoading;

  supabaseLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load newsletter service'));
    document.head.appendChild(script);
  });

  return supabaseLoading;
}

async function getSupabase() {
  if (supabaseClient) return supabaseClient;

  if (!window.SUPABASE_CONFIG?.url || !window.SUPABASE_CONFIG?.anonKey) {
    return null;
  }

  await loadSupabaseScript();

  if (!window.supabase?.createClient) {
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

function openPasswordDialog() {
  const dialog = document.getElementById('password-dialog');
  const input = document.getElementById('password-input');
  const errorEl = document.getElementById('password-error');

  errorEl.hidden = true;
  input.value = '';
  dialog.hidden = false;
  input.focus();
}

function closePasswordDialog() {
  const dialog = document.getElementById('password-dialog');
  const errorEl = document.getElementById('password-error');

  dialog.hidden = true;
  errorEl.hidden = true;
  document.getElementById('password-input').value = '';
}

function tryUnlockSite(password) {
  const normalized = password.trim().toLowerCase();
  if (!PASSWORDS.includes(normalized)) {
    return false;
  }

  sessionStorage.setItem(AUTH_KEY, 'true');
  closePasswordDialog();
  unlockSite();
  return true;
}

async function saveNewsletterEmail(email) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { ok: false };

  const client = await getSupabase();
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
  const gate = document.getElementById('welcome-gate');
  const site = document.getElementById('site-content');

  gate.hidden = true;
  site.hidden = false;
  gate.setAttribute('aria-hidden', 'true');
  site.removeAttribute('aria-hidden');
  initApp();
}

function setupWelcomeGate() {
  const form = document.getElementById('welcome-form');
  const successEl = document.getElementById('welcome-success');
  const errorEl = document.getElementById('welcome-error');
  const submitBtn = document.getElementById('welcome-submit');
  const emailInput = document.getElementById('welcome-email');
  const passwordToggle = document.getElementById('password-toggle');
  const passwordDialog = document.getElementById('password-dialog');
  const passwordForm = document.getElementById('password-form');
  const passwordInput = document.getElementById('password-input');
  const passwordError = document.getElementById('password-error');
  const passwordSubmit = document.getElementById('password-submit');
  const passwordCancel = document.getElementById('password-cancel');
  const passwordClose = document.getElementById('password-close');

  async function handleJoin() {
    successEl.hidden = true;
    errorEl.hidden = true;

    if (!emailInput.value.trim()) {
      emailInput.reportValidity();
      return;
    }

    const email = emailInput.value;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Joining...';

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
  }

  submitBtn.addEventListener('click', handleJoin);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleJoin();
  });

  passwordToggle.addEventListener('click', openPasswordDialog);
  passwordCancel.addEventListener('click', closePasswordDialog);
  passwordClose.addEventListener('click', closePasswordDialog);

  function handlePasswordSubmit() {
    passwordError.hidden = true;

    if (!passwordInput.value) {
      passwordInput.reportValidity();
      return;
    }

    if (!tryUnlockSite(passwordInput.value)) {
      passwordError.hidden = false;
      passwordInput.select();
    }
  }

  passwordSubmit.addEventListener('click', handlePasswordSubmit);

  passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handlePasswordSubmit();
  });

  passwordDialog.addEventListener('click', (e) => {
    if (e.target === passwordDialog) {
      closePasswordDialog();
    }
  });

  const params = new URLSearchParams(window.location.search);
  const emailFromUrl = params.get('email');
  if (emailFromUrl) {
    emailInput.value = emailFromUrl;
    window.history.replaceState({}, '', window.location.pathname);
    handleJoin();
  }
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
      addToCart(el.dataset.item, el.dataset.category, el.dataset.variants);
      openCart();
    });
  });
}

function shopItemHtml(product, category) {
  const variantsHtml = product.variants
    ? `<span class="shop-item__variants">${product.variants}</span>`
    : '';
  const detailsHtml = product.details
    ? `<span class="shop-item__details">${product.details}</span>`
    : '';

  return `
    <div class="shop-item" data-item="${product.name}" data-category="${category}" data-variants="${product.variants || ''}">
      <div class="shop-item__icon"></div>
      <span class="shop-item__name">${product.name}</span>
      ${variantsHtml}
      ${detailsHtml}
    </div>
  `;
}

function renderShop(category) {
  const shopGrid = document.getElementById('shop-grid');
  const shopTitle = document.getElementById('shop-title');
  const shopItemCount = document.getElementById('shop-item-count');
  const items = PRODUCTS[category] || [];
  const label = CATEGORIES[category] || 'Shop';

  shopTitle.textContent = label;
  shopItemCount.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;

  if (items.length === 0) {
    shopGrid.innerHTML = '<p class="shop-empty">No items in this category yet.</p>';
    return;
  }

  shopGrid.innerHTML = `<div class="shop-grid">${items.map((product) => shopItemHtml(product, label)).join('')}</div>`;
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
      const items = PRODUCTS[key] || [];
      if (items.length === 0) return '';

      total += items.length;
      const itemsHtml = items.map((product) => shopItemHtml(product, label)).join('');
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

function addToCart(name, category, variants) {
  cart.push({ name, category, variants: variants || '', id: Date.now() });
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
      <span>${item.name}${item.variants ? ` <small>(${item.variants})</small>` : ''} <small>[${item.category}]</small></span>
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

setupEntrySplash();

if (isAuthenticated()) {
  const gate = document.getElementById('welcome-gate');
  const site = document.getElementById('site-content');
  gate.hidden = true;
  site.hidden = false;
  initApp();
} else {
  setupWelcomeGate();
}
