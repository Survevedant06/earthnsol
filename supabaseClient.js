// ── API Client (Direct Supabase API Mock) ──────────────────────
if (typeof CONFIG === 'undefined') {
  console.error('❌ config.js not loaded before API client!');
}

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

window.apiFetch = async (endpoint, options = {}) => {
  const method = options.method || 'GET';
  const url = `${CONFIG.BACKEND_URL}${endpoint}`;
  
  const getHeaders = () => {
    const headers = { ...options.headers };
    if (!headers['Content-Type'] && options.body) {
      headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('es-session-token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };
  
  const response = await fetch(url, {
    ...options,
    method,
    headers: getHeaders()
  });
  
  let data;
  try {
    data = await response.json();
  } catch (e) {
    if (response.ok) {
      return { success: true };
    }
    throw new Error('Server returned an invalid response format.');
  }
  
  if (response.status === 401 && data.error && (data.error.includes('expired') || data.error.includes('Invalid')) && endpoint !== '/api/auth/refresh') {
    const refreshToken = localStorage.getItem('es-refresh-token');
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${CONFIG.BACKEND_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          
          if (!refreshRes.ok) {
            throw new Error('Refresh request failed');
          }
          
          const refreshData = await refreshRes.json();
          if (refreshData.data && refreshData.data.session) {
            const newAccessToken = refreshData.data.session.access_token;
            const newRefreshToken = refreshData.data.session.refresh_token;
            localStorage.setItem('es-session-token', newAccessToken);
            localStorage.setItem('es-refresh-token', newRefreshToken);
            onRefreshed(newAccessToken);
            isRefreshing = false;
          } else {
            throw new Error('Refresh failed to return session data');
          }
        } catch (err) {
          isRefreshing = false;
          localStorage.removeItem('es-session-token');
          localStorage.removeItem('es-refresh-token');
          if (window.location.pathname.indexOf('login.html') === -1) {
            window.location.href = 'login.html';
          }
          throw new Error('Session expired. Please log in again.');
        }
      }
      
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (newToken) => {
          try {
            const retryHeaders = getHeaders();
            const retryRes = await fetch(url, {
              ...options,
              method,
              headers: retryHeaders
            });
            let retryData;
            try {
              retryData = await retryRes.json();
            } catch (e) {
              if (retryRes.ok) {
                resolve({ success: true });
                return;
              }
              reject(new Error('Server returned an invalid response format on retry.'));
              return;
            }
            if (!retryRes.ok) {
              reject(new Error(retryData.error || 'Request failed on retry'));
            } else {
              resolve(retryData);
            }
          } catch (retryErr) {
            reject(retryErr);
          }
        });
      });
    }
  }
  
  if (!response.ok) {
    const err = new Error(data.error || 'Request failed');
    err.data = data;
    throw err;
  }
  
  return data;
};

// ── Shared Session ────────────────────────────────────
let cachedSessionPromise = null;
window.getSession = () => {
  if (!localStorage.getItem('es-session-token')) {
    cachedSessionPromise = null;
    return Promise.resolve(null);
  }
  if (cachedSessionPromise) return cachedSessionPromise;
  cachedSessionPromise = (async () => {
    try {
      const res = await window.apiFetch('/api/auth/session');
      return res.user;
    } catch {
      cachedSessionPromise = null;
      return null;
    }
  })();
  return cachedSessionPromise;
};

// ── Cart badge update ─────────────────────────────────
async function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  try {
    const user = await window.getSession();
    if (!user) { badge.textContent = '0'; badge.style.display = 'flex'; return; }
    
    const { data } = await window.apiFetch('/api/cart');
    const total = (data || []).reduce((s, i) => s + i.quantity, 0);
    badge.textContent = total;
    badge.style.display = 'flex';
  } catch { badge.textContent = '0'; badge.style.display = 'flex'; }
}

// ── Cart popup notification ───────────────────────────
function showCartPopup(productName) {
  let popup = document.getElementById('cart-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'cart-popup';
    popup.className = 'cart-popup';
    popup.innerHTML = `
      <div class="popup-icon">🛒</div>
      <div class="popup-text">
        <h4>Added to Cart!</h4>
        <p id="popup-product-name"></p>
      </div>
      <button class="popup-close" onclick="document.getElementById('cart-popup').classList.remove('show')">✕</button>`;
    document.body.appendChild(popup);
  }
  document.getElementById('popup-product-name').textContent = productName;
  popup.classList.add('show');
  clearTimeout(window._popupTimer);
  window._popupTimer = setTimeout(() => popup.classList.remove('show'), 3000);
}

// ── Add to cart (shared) ─────────────────────────────
async function addToCartShared(productId, productName, btn, qty = 1) {
  const user = await window.getSession();
  if (!user) { window.location.href = 'login.html'; return; }
  
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  try {
    await window.apiFetch('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity: qty })
    });
    
    await updateCartBadge();
    showCartPopup(productName);
    
    if (btn) { btn.textContent = '✓ Added'; btn.style.background = 'var(--green)'; }
    setTimeout(() => { if (btn) { btn.textContent = 'Add to Cart'; btn.style.background = ''; btn.disabled = false; } }, 2000);
  } catch (err) {
    if (btn) { btn.textContent = 'Add to Cart'; btn.disabled = false; }
    alert('Error: ' + err.message);
  }
}

// ── Logout ────────────────────────────────────────────
async function handleLogout() {
  cachedSessionPromise = null;
  await window.apiFetch('/api/auth/logout', { method: 'POST' }).catch(e => {});
  localStorage.removeItem('es-session-token');
  localStorage.removeItem('es-refresh-token');
  window.location.href = 'login.html';
}

// ── Set active nav ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
});

// ── Buy Now (shared) ─────────────────────────────────
async function buyNowShared(productId, productName, price, btn) {
  const user = await window.getSession();
  if (!user) { window.location.href = 'login.html'; return; }
  
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  const p = Number(price) || 0;
  const sub = p, ship = 0;
  const order = {
    fullName: user.user_metadata?.full_name || user.email.split('@')[0],
    phone: '', address: '', subtotal: sub, shipping: ship, grand: sub + ship,
    items: [{ product_id: productId, name: productName, price: p, quantity: 1, image: '' }]
  };
  sessionStorage.setItem('pending_order', JSON.stringify(order));
  if (btn) { btn.disabled = false; btn.textContent = '⚡ Buy Now'; }
  window.location.href = 'payment.html';
}

// ── User Dropdown ─────────────────────────────────────
function buildUserDropdown(user) {
  const existing   = document.getElementById('user-dropdown-wrap');
  const welcomeEl  = document.getElementById('welcome-text');
  const accountBtn = document.querySelector('.icon-btn[title="Account"]');
  if (user) {
    const email    = user.email;
    const name     = user.user_metadata?.full_name || email.split('@')[0];
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    if (welcomeEl)  welcomeEl.style.display  = 'none';
    if (accountBtn) accountBtn.style.display = 'none';
    if (!existing) {
      const wrap = document.createElement('div');
      wrap.id = 'user-dropdown-wrap'; wrap.className = 'user-dropdown-wrap';
      wrap.innerHTML = `
        <button class="user-chip" onclick="toggleUserMenu(event)" title="Account menu">
          <div class="user-avatar">${initials}</div>
          <div class="user-chip-info">
            <span class="user-chip-name">${name}</span>
            <span class="user-chip-email">${email}</span>
          </div>
          <svg class="user-chip-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="user-menu" id="user-menu">
          <div class="user-menu-header">
            <div class="user-menu-avatar">${initials}</div>
            <div><div class="user-menu-name">${name}</div><div class="user-menu-email">${email}</div></div>
          </div>
          <div class="user-menu-divider"></div>
          <a href="index.html" class="user-menu-item">🏠 Home</a>
          <a href="profile.html" class="user-menu-item">👤 My Profile</a>
          <a href="cart.html" class="user-menu-item">🛒 My Cart</a>
          <a href="orders.html" class="user-menu-item">📦 My Orders</a>
          <div class="user-menu-divider"></div>
          <button class="user-menu-item user-menu-logout" onclick="handleLogout()">🚪 Sign Out</button>
        </div>`;
      const hr = document.querySelector('.header-right');
      if (hr) { if (accountBtn) hr.insertBefore(wrap, accountBtn); else hr.prepend(wrap); }
    }
  } else {
    if (welcomeEl)  { welcomeEl.style.display = ''; welcomeEl.textContent = 'Welcome, Guest'; }
    if (accountBtn) accountBtn.style.display = '';
    if (existing)   existing.remove();
  }
}

function toggleUserMenu(e) { e.stopPropagation(); document.getElementById('user-menu')?.classList.toggle('open'); }
document.addEventListener('click', () => document.getElementById('user-menu')?.classList.remove('open'));

document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.getSession();
  buildUserDropdown(user);
});

// ── Session Inactivity Auto-Logout (30 Minutes) ───────
let inactivityTimer = null;
function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(async () => {
    const user = await window.getSession();
    if (user) {
      console.warn('Session expired due to inactivity. Logging out...');
      if (typeof handleLogout === 'function') {
        await handleLogout();
      } else {
        localStorage.removeItem('es-session-token');
        localStorage.removeItem('es-refresh-token');
        window.location.href = 'login.html';
      }
    }
  }, 30 * 60 * 1000); // 30 minutes in milliseconds
}

if (typeof window !== 'undefined') {
  ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer, { passive: true });
  });
  resetInactivityTimer();
}
