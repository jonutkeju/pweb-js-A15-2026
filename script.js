const USER_KEY = 'asthmazonUser';
const CART_KEY = 'asthmazonCart';
const TRENDING_RATING = 4.5;

const state = {
  products: [],
  filteredProducts: [],
  visibleCount: 8,
  category: 'all',
  sort: 'default',
  search: '',
};

const user = (() => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    localStorage.removeItem(USER_KEY);
    return null;
  }
})();

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function getCartItems() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items)
      ? items.filter((item) =>
          item && Number.isInteger(item.id) && Number.isInteger(item.quantity) &&
          item.quantity > 0 && Number.isFinite(item.price)
        )
      : [];
  } catch (error) {
    localStorage.removeItem(CART_KEY);
    return [];
  }
}

function saveCartItems(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartUI();
  renderCart();
}

function updateCartUI() {
  const cartItems = getCartItems();
  const totalQuantity = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const cartBadge = document.getElementById('cartBadge');

  if (cartBadge) cartBadge.textContent = String(totalQuantity);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function renderCart() {
  const cartItemsElement = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const clearCartButton = document.getElementById('clearCartButton');
  if (!cartItemsElement || !cartTotal) return;

  const cartItems = getCartItems();
  cartItemsElement.innerHTML = cartItems.length
    ? cartItems.map((item) => `
        <article class="cart-item">
          <img class="cart-item__image" src="${escapeHtml(item.thumbnail)}" alt="" />
          <div class="cart-item__details">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${formatCurrency(item.price)}</p>
            <div class="cart-item__actions">
              <button type="button" class="cart-quantity-button" data-cart-decrease="${item.id}" aria-label="Kurangi jumlah ${escapeHtml(item.title)}">−</button>
              <span>${item.quantity}</span>
              <button type="button" class="cart-quantity-button" data-cart-increase="${item.id}" aria-label="Tambah jumlah ${escapeHtml(item.title)}">+</button>
              <button type="button" class="cart-remove-button" data-cart-remove="${item.id}">Hapus</button>
            </div>
          </div>
          <strong class="cart-item__subtotal">${formatCurrency(item.price * item.quantity)}</strong>
        </article>
      `).join('')
    : '<p class="cart-empty">Keranjang masih kosong.</p>';

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = formatCurrency(total);
  if (clearCartButton) clearCartButton.disabled = cartItems.length === 0;
}

function setCartOpen(isOpen) {
  const cartModal = document.getElementById('cartModal');
  const cartButton = document.getElementById('cartButton');
  if (!cartModal) return;

  if (isOpen) renderCart();
  cartModal.hidden = !isOpen;
  cartModal.setAttribute('aria-hidden', String(!isOpen));
  if (cartButton) cartButton.setAttribute('aria-expanded', String(isOpen));
}

function updateCartQuantity(productId, change) {
  const cartItems = getCartItems();
  const item = cartItems.find((cartItem) => cartItem.id === productId);
  if (!item) return;

  item.quantity += change;
  saveCartItems(cartItems.filter((cartItem) => cartItem.quantity > 0));
}

function removeFromCart(productId) {
  saveCartItems(getCartItems().filter((item) => item.id !== productId));
}

function clearCart() {
  saveCartItems([]);
}

function setWelcomeUser() {
  const welcomeMessage = document.getElementById('userFirstName');
  if (!welcomeMessage) return;

  const name = user && (user.firstName || user.username) ? user.firstName || user.username : 'Guest';
  welcomeMessage.textContent = name;
}

function renderProducts() {
  const productGrid = document.getElementById('productGrid');
  const resultCount = document.getElementById('resultCount');
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const emptyState = document.getElementById('emptyState');
  const loadMoreButton = document.getElementById('loadMoreButton');

  if (!productGrid || !resultCount) return;

  const visibleProducts = state.filteredProducts.slice(0, state.visibleCount);

  if (!visibleProducts.length) {
    productGrid.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    if (loadingState) loadingState.hidden = true;
    if (errorState) errorState.hidden = true;
    resultCount.textContent = '0 produk ditemukan';
  } else {
    if (loadingState) loadingState.hidden = true;
    if (emptyState) emptyState.hidden = true;
    productGrid.innerHTML = visibleProducts
      .map(
        (product) => `
          <article class="product-card${product.rating >= TRENDING_RATING ? ' product-card--trending' : ''}" data-product-id="${product.id}" tabindex="0">
            <span class="product-card__badge">-${Math.round(product.discountPercentage)}%</span>
            <img class="product-card__image" src="${product.thumbnail}" alt="${product.title}" />
            <div class="product-card__body">
              <h3 class="product-card__name">${product.title}</h3>
              <div class="product-card__labels">
                <p class="product-card__category">${product.category}</p>
                ${product.rating >= TRENDING_RATING ? '<span class="product-card__trending">TRENDING!</span>' : ''}
              </div>
              <div class="product-card__meta">
                <span class="product-card__price">${formatCurrency(product.price)}</span>
                <button type="button" class="btn btn--add-cart" data-add-cart="${product.id}" aria-label="Tambah ${product.title} ke keranjang">+</button>
                <span class="product-card__rating">★ ${product.rating}</span>
              </div>
            </div>
          </article>
        `
      )
      .join('');

    resultCount.textContent = `${state.filteredProducts.length} produk ditampilkan`;
  }

  if (loadMoreButton) {
    loadMoreButton.hidden = state.filteredProducts.length <= state.visibleCount;
  }
}

function debounce(callback, delay = 350) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  };
}

function applyFiltersAndRender() {
  let result = [...state.products];

  if (state.category !== 'all') {
    result = result.filter((product) => product.category === state.category);
  }

  if (state.search) {
    const searchTerm = state.search.toLowerCase();
    result = result.filter(
      (product) =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
  }

  const sortProducts = {
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    'rating-desc': (a, b) => b.rating - a.rating,
    'rating-asc': (a, b) => a.rating - b.rating,
  }[state.sort];

  result.sort((a, b) => {
    const trendingOrder = Number(b.rating >= TRENDING_RATING) - Number(a.rating >= TRENDING_RATING);
    return trendingOrder || (sortProducts ? sortProducts(a, b) : 0);
  });

  state.filteredProducts = result;
  state.visibleCount = 8;
  renderProducts();
}

async function fetchProducts() {
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const emptyState = document.getElementById('emptyState');
  const categoryFilter = document.getElementById('categoryFilter');

  try {
    if (loadingState) loadingState.hidden = false;
    if (errorState) errorState.hidden = true;
    if (emptyState) emptyState.hidden = true;

    const response = await fetch('https://dummyjson.com/products');
    if (!response.ok) {
      throw new Error('Gagal mengambil data produk.');
    }

    const data = await response.json();
    state.products = Array.isArray(data?.products) ? data.products : [];

    if (categoryFilter) {
      const categories = [...new Set(state.products.map((product) => product.category))];
      categoryFilter.innerHTML =
        '<option value="all">Semua kategori</option>' +
        categories.map((category) => `<option value="${category}">${category}</option>`).join('');
    }

    applyFiltersAndRender();
  } catch (error) {
    if (loadingState) loadingState.hidden = true;

    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
      errorElement.textContent = window.location.protocol === 'file:'
        ? 'Browser membatasi akses API saat halaman dibuka langsung. Jalankan melalui server lokal, misalnya Live Server di VS Code.'
        : error.message === 'Failed to fetch'
          ? 'Tidak dapat terhubung ke DummyJSON. Periksa koneksi internet lalu coba lagi.'
          : error.message || 'Terjadi masalah saat memuat produk.';
    }

    if (errorState) {
      errorState.hidden = false;
    }
  }
}

function handleLogout() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(CART_KEY);
  window.location.href = 'login.html';
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  const cartItems = getCartItems();
  const existing = cartItems.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cartItems.push({
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
      thumbnail: product.thumbnail,
    });
  }

  saveCartItems(cartItems);
}

function openProductModal(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  const modal = document.getElementById('productModal');
  const modalImage = document.getElementById('modalProductImage');
  const modalCategory = document.getElementById('modalProductCategory');
  const modalName = document.getElementById('modalProductName');
  const modalBrand = document.getElementById('modalProductBrand');
  const modalPrice = document.getElementById('modalProductPrice');
  const modalRating = document.getElementById('modalProductRating');
  const modalStock = document.getElementById('modalProductStock');
  const modalDescription = document.getElementById('modalProductDescription');
  const modalAddCartButton = document.getElementById('modalAddCartButton');

  if (modalImage) modalImage.src = product.thumbnail;
  if (modalCategory) modalCategory.textContent = product.category;
  if (modalName) modalName.textContent = product.title;
  if (modalBrand) modalBrand.textContent = product.brand;
  if (modalPrice) modalPrice.textContent = formatCurrency(product.price);
  if (modalRating) modalRating.textContent = `★ ${product.rating}`;
  if (modalStock) modalStock.textContent = String(product.stock);
  if (modalDescription) modalDescription.textContent = product.description;
  if (modalAddCartButton) modalAddCartButton.dataset.id = String(product.id);

  if (modal) {
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }
}

function bindCatalogEvents() {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const sortSelect = document.getElementById('sortSelect');
  const loadMoreButton = document.getElementById('loadMoreButton');
  const retryButton = document.getElementById('retryButton');
  const logoutButton = document.getElementById('logoutButton');
  const productGrid = document.getElementById('productGrid');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalCloseButton = document.getElementById('modalCloseButton');
  const modalAddCartButton = document.getElementById('modalAddCartButton');
  const cartButton = document.getElementById('cartButton');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartCloseButton = document.getElementById('cartCloseButton');
  const cartItemsElement = document.getElementById('cartItems');
  const clearCartButton = document.getElementById('clearCartButton');

  if (searchInput) {
    const handleSearch = debounce((event) => {
      state.search = event.target.value.trim();
      applyFiltersAndRender();
    }, 350);

    searchInput.addEventListener('input', handleSearch);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', (event) => {
      state.category = event.target.value;
      applyFiltersAndRender();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (event) => {
      state.sort = event.target.value;
      applyFiltersAndRender();
    });
  }

  if (loadMoreButton) {
    loadMoreButton.addEventListener('click', () => {
      state.visibleCount += 5;
      renderProducts();
    });
  }

  if (retryButton) {
    retryButton.addEventListener('click', fetchProducts);
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }

  if (cartButton) {
    cartButton.addEventListener('click', () => setCartOpen(true));
  }

  if (cartOverlay) {
    cartOverlay.addEventListener('click', () => setCartOpen(false));
  }

  if (cartCloseButton) {
    cartCloseButton.addEventListener('click', () => setCartOpen(false));
  }

  if (cartItemsElement) {
    cartItemsElement.addEventListener('click', (event) => {
      const decreaseButton = event.target.closest('[data-cart-decrease]');
      const increaseButton = event.target.closest('[data-cart-increase]');
      const removeButton = event.target.closest('[data-cart-remove]');

      if (decreaseButton) updateCartQuantity(Number(decreaseButton.dataset.cartDecrease), -1);
      if (increaseButton) updateCartQuantity(Number(increaseButton.dataset.cartIncrease), 1);
      if (removeButton) removeFromCart(Number(removeButton.dataset.cartRemove));
    });
  }

  if (clearCartButton) {
    clearCartButton.addEventListener('click', clearCart);
  }

  if (productGrid) {
    productGrid.addEventListener('click', (event) => {
      const addButton = event.target.closest('[data-add-cart]');
      if (addButton) {
        addToCart(Number(addButton.dataset.addCart));
        return;
      }

      const card = event.target.closest('.product-card');
      if (card) {
        openProductModal(Number(card.dataset.productId));
      }
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeProductModal);
  }

  if (modalCloseButton) {
    modalCloseButton.addEventListener('click', closeProductModal);
  }

  if (modalAddCartButton) {
    modalAddCartButton.addEventListener('click', () => {
      const productId = Number(modalAddCartButton.dataset.id);
      if (productId) {
        addToCart(productId);
        closeProductModal();
      }
    });
  }
}

function initCatalog() {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  setWelcomeUser();
  updateCartUI();
  bindCatalogEvents();
  fetchProducts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCatalog);
} else {
  initCatalog();
}
