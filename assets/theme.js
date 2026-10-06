(function () {
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatMoney(cents) {
    const value = Number(cents) || 0;
    if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
      return window.Shopify.formatMoney(value, window.themeMoneyFormat);
    }
    const format = window.themeMoneyFormat || '£{{amount}}';
    const amount = (value / 100).toFixed(2);
    return format
      .replace(/\{\{\s*amount\s*\}\}/g, amount)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, String(Math.round(value / 100)))
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/g, amount.replace('.', ','));
  }

  const cartDrawer = document.querySelector('[data-cart-drawer]');
  const cartCountEls = () => document.querySelectorAll('[data-cart-count]');

  function openCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.add('is-open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-open');
    const panel = cartDrawer.querySelector('[data-cart-panel]');
    panel?.focus();
  }

  function closeCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('is-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-open');
  }

  function updateCartCount(count) {
    cartCountEls().forEach((el) => {
      el.textContent = String(count);
    });
  }

  function renderCart(cart) {
    const itemsRoot = document.querySelector('[data-cart-items]');
    const footer = document.querySelector('[data-cart-footer]');
    const subtotal = document.querySelector('[data-cart-subtotal]');

    if (!itemsRoot) return;

    updateCartCount(cart.item_count);

    if (!cart.items || cart.items.length === 0) {
      itemsRoot.innerHTML = `<p class="cart-empty">Your cart is empty.</p>`;
      if (footer) footer.hidden = true;
      if (subtotal) subtotal.textContent = formatMoney(0);
      return;
    }

    if (footer) footer.hidden = false;
    if (subtotal) subtotal.textContent = formatMoney(cart.total_price);

    itemsRoot.innerHTML = cart.items
      .map((item) => {
        const title = escapeHtml(item.product_title);
        const url = escapeHtml(item.url);
        const key = escapeHtml(item.key);
        const image = item.image
          ? `<img src="${escapeHtml(item.image)}" alt="" width="90" height="90" loading="lazy">`
          : '';
        const variant =
          item.variant_title && item.variant_title !== 'Default Title'
            ? `<p class="cart-item__variant">${escapeHtml(item.variant_title)}</p>`
            : '';

        return `
          <article class="cart-item" data-cart-item data-key="${key}">
            <div class="cart-item__media">${image}</div>
            <div>
              <a class="cart-item__title" href="${url}">${title}</a>
              ${variant}
              <p class="cart-item__price">${formatMoney(item.final_line_price)}</p>
              <div class="cart-item__actions">
                <input class="cart-item__qty" type="number" value="${Number(item.quantity) || 0}" min="0" data-cart-qty data-key="${key}" aria-label="Quantity">
                <button type="button" class="cart-item__remove" data-cart-remove data-key="${key}">Remove</button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  async function fetchCart() {
    const res = await fetch('/cart.js', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Cart fetch failed');
    return res.json();
  }

  async function refreshCart({ open } = {}) {
    const cart = await fetchCart();
    renderCart(cart);
    if (open) openCart();
    return cart;
  }

  async function addToCart(form) {
    const formData = new FormData(form);
    const res = await fetch(window.themeRoutes?.cartAddUrl || '/cart/add.js', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.description || 'Could not add to cart');
    }
    await refreshCart({ open: true });
  }

  async function changeLine(key, quantity) {
    const res = await fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: key, quantity }),
    });
    if (!res.ok) throw new Error('Could not update cart');
    const cart = await res.json();
    renderCart(cart);
  }

  /* Header / menu */
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  menuToggle?.addEventListener('click', () => {
    const open = mobileNav?.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.querySelectorAll('[data-cart-open]').forEach((btn) => {
    btn.addEventListener('click', async (event) => {
      event.preventDefault();
      try {
        await refreshCart({ open: true });
      } catch (e) {
        openCart();
      }
    });
  });

  document.querySelectorAll('[data-cart-close]').forEach((el) => {
    el.addEventListener('click', closeCart);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCart();
  });

  cartDrawer?.addEventListener('change', async (event) => {
    const input = event.target.closest('[data-cart-qty]');
    if (!input) return;
    const key = input.dataset.key;
    const quantity = Number(input.value);
    try {
      await changeLine(key, quantity);
    } catch (e) {
      console.error(e);
    }
  });

  cartDrawer?.addEventListener('click', async (event) => {
    const removeBtn = event.target.closest('[data-cart-remove]');
    if (!removeBtn) return;
    try {
      await changeLine(removeBtn.dataset.key, 0);
    } catch (e) {
      console.error(e);
    }
  });

  /* Product form */
  const productSection = document.querySelector('[data-product-section]');
  const productForm = document.querySelector('[data-product-form]');
  const productJsonEl = document.querySelector('[data-product-json]');

  if (productForm && productJsonEl) {
    const product = JSON.parse(productJsonEl.textContent);
    const variantInput = productForm.querySelector('[data-variant-id]');
    const addBtn = productForm.querySelector('[data-add-to-cart]');
    const priceEl = productSection?.querySelector('[data-price]');
    const compareEl = productSection?.querySelector('[data-compare-price]');
    const compareValueEl = productSection?.querySelector('[data-compare-price-value]');
    const optionSelects = [...productForm.querySelectorAll('[data-option-select]')];

    function getSelectedOptions() {
      return optionSelects.map((select) => select.value);
    }

    function findVariant(options) {
      return product.variants.find((variant) =>
        options.every((option, index) => variant[`option${index + 1}`] === option)
      );
    }

    function updateVariant() {
      if (!optionSelects.length) return;
      const variant = findVariant(getSelectedOptions());
      if (!variant) {
        if (addBtn) {
          addBtn.disabled = true;
          addBtn.textContent = 'Unavailable';
        }
        return;
      }

      variantInput.value = variant.id;
      if (priceEl) priceEl.textContent = formatMoney(variant.price);

      if (compareEl && compareValueEl) {
        if (variant.compare_at_price > variant.price) {
          compareEl.hidden = false;
          compareValueEl.textContent = formatMoney(variant.compare_at_price);
        } else {
          compareEl.hidden = true;
          compareValueEl.textContent = '';
        }
      }

      if (addBtn) {
        addBtn.disabled = !variant.available;
        addBtn.textContent = variant.available ? 'Add to cart' : 'Sold out';
      }

      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
    }

    optionSelects.forEach((select) => {
      select.addEventListener('change', updateVariant);
    });

    productForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!addBtn || addBtn.disabled) return;

      const original = addBtn.textContent;
      addBtn.classList.add('is-loading');
      addBtn.textContent = 'Adding…';

      try {
        await addToCart(productForm);
        addBtn.classList.remove('is-loading');
        addBtn.classList.add('is-success');
        addBtn.textContent = 'Added';
        setTimeout(() => {
          addBtn.classList.remove('is-success');
          addBtn.textContent = original;
        }, 1200);
      } catch (e) {
        addBtn.classList.remove('is-loading');
        addBtn.textContent = original;
        alert(e.message || 'Could not add to cart');
      }
    });
  }

  if (cartDrawer) {
    fetchCart()
      .then((cart) => updateCartCount(cart.item_count))
      .catch(() => {});
  }
})();
