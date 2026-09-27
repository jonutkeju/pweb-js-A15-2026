const USER_KEY = 'miniShopeeUser';
const CART_KEY = 'miniShopeeCart';

const state = {
  products: [],
  filteredProducts: [],
  visibleCount: 8,
  category: 'all',
  sort: 'default',
  search: '',
};

const currentPage = window.location.pathname.split('/').pop() || 'Catalogpage.html';

const user = (() => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    localStorage.removeItem(USER_KEY);
    return null;
  }
})();

if (!user && currentPage !== 'login.html') {
  window.location.href = 'login.html';
}

if (user && currentPage === 'login.html') {
  window.location.href = 'Catalogpage.html';
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function getCartItems() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    localStorage.removeItem(CART_KEY);
    return [];
  }
}

function updateCartUI() {
  const cartItems = getCartItems();
  const totalQuantity = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);

  const cartBadge = document.getElementById('cartBadge');
  const cartTotal = document.getElementById('cartTotal');

  if (cartBadge) cartBadge.textContent = String(totalQuantity);
  if (cartTotal) cartTotal.textContent = formatCurrency(totalPrice);
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
          <article class="product-card" data-product-id="${product.id}" tabindex="0">
            <span class="product-card__badge">-${Math.round(product.discountPercentage)}%</span>
            <img class="product-card__image" src="${product.thumbnail}" alt="${product.title}" />
            <div class="product-card__body">
              <p class="product-card__category">${product.category}</p>
              <h3 class="product-card__name">${product.title}</h3>
              <div class="product-card__meta">
                <span class="product-card__price">${formatCurrency(product.price)}</span>
                <span class="product-card__rating">★ ${product.rating}</span>
              </div>
              <button type="button" class="btn btn--add-cart" data-add-cart="${product.id}">
                Tambah ke Keranjang
              </button>
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

  switch (state.sort) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'rating-desc':
      result.sort((a, b) => b.rating - a.rating);
      break;
    case 'rating-asc':
      result.sort((a, b) => a.rating - b.rating);
      break;
    default:
      break;
  }

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
      errorElement.textContent = error.message || 'Terjadi masalah saat memuat produk.';
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

  localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  updateCartUI();
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

  if (searchInput) {
    let timeoutId = null;
    searchInput.addEventListener('input', (event) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        state.search = event.target.value.trim();
        applyFiltersAndRender();
      }, 350);
    });
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
      state.visibleCount += 8;
      renderProducts();
    });
  }

  if (retryButton) {
    retryButton.addEventListener('click', fetchProducts);
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
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
