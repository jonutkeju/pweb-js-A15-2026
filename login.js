const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const errorMessage = document.getElementById('errorMessage');

function setLoadingState(isLoading) {
  loginButton.disabled = isLoading;
  loginButton.classList.toggle('is-loading', isLoading);
  const buttonText = loginButton.querySelector('.btn-text');
  if (buttonText) {
    buttonText.textContent = isLoading ? 'Memeriksa...' : 'Masuk';
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.textContent = '';
  errorMessage.hidden = true;
}

async function loginUser(username, password) {
  const response = await fetch('https://dummyjson.com/users');

  if (!response.ok) {
    throw new Error('Tidak dapat terhubung ke server autentikasi. Coba lagi nanti.');
  }

  const data = await response.json();
  const users = Array.isArray(data?.users) ? data.users : [];
  const matchedUser = users.find(
    (user) => user.username === username && user.password === password
  );

  if (!matchedUser) {
    throw new Error('Username atau password salah. Silakan periksa kembali data akun Anda.');
  }

  localStorage.setItem(
    'miniShopeeUser',
    JSON.stringify({
      firstName: matchedUser.firstName,
      username: matchedUser.username,
    })
  );

  window.location.href = 'index.html?v=5';
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showError('Username dan password wajib diisi.');
      return;
    }

    setLoadingState(true);

    try {
      await loginUser(username, password);
    } catch (error) {
      showError(error.message || 'Terjadi kesalahan saat login.');
    } finally {
      setLoadingState(false);
    }
  });
}

if (localStorage.getItem('miniShopeeUser')) {
  window.location.href = 'Catalogpage.html?v=5';
}
