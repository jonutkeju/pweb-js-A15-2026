const USER_KEY = 'asthmazonUser';
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
    USER_KEY,
    JSON.stringify({
      firstName: matchedUser.firstName,
      username: matchedUser.username,
    })
  );

  window.location.href = 'index.html?v=15';
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorMessage.textContent = '';
    errorMessage.hidden = true;

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
      const message = window.location.protocol === 'file:'
        ? 'Browser membatasi akses login saat halaman dibuka langsung. Jalankan melalui server lokal, misalnya Live Server di VS Code.'
        : error.message === 'Failed to fetch'
          ? 'Tidak dapat terhubung ke DummyJSON. Periksa koneksi internet lalu coba lagi.'
          : error.message || 'Terjadi kesalahan saat login.';
      showError(message);
    } finally {
      setLoadingState(false);
    }
  });
}

if (localStorage.getItem(USER_KEY)) {
  window.location.href = 'Catalogpage.html?v=15';
}
