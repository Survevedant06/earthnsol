// ── Chat FAB ─────────────────────────────────────────
function injectChatFAB() {
  if (window.location.pathname.includes('store-manager.html') || document.getElementById('admin-wrap')) return;

  const fab = document.createElement('div');
  fab.className = 'chat-fab';
  fab.id = 'chat-fab';
  fab.innerHTML = `
    <div class="chat-fab-options" id="chat-options">
      <a href="https://wa.me/919067555693?text=Hello%2C%20I%27m%20interested%20in%20your%20organic%20products!" target="_blank" class="chat-option whatsapp" style="animation-delay:.05s">
        <div class="chat-option-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.523 5.847L.057 23.882a.5.5 0 00.612.612l6.083-1.462A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-5.003-1.37l-.36-.213-3.713.892.908-3.62-.234-.372A9.818 9.818 0 1112 21.818z"/></svg>
        </div>
        WhatsApp Chat
      </a>
      <a href="https://instagram.com/earthNsol" target="_blank" class="chat-option instagram" style="animation-delay:.1s">
        <div class="chat-option-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </div>
        Instagram DM
      </a>
      <a href="https://www.facebook.com/share/1EJi8jieNZ/" target="_blank" class="chat-option facebook" style="animation-delay:.15s">
        <div class="chat-option-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </div>
        Facebook DM
      </a>
      <a href="mailto:earthnsol@gmail.com" class="chat-option email" style="animation-delay:.2s">
        <div class="chat-option-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        </div>
        Email Us
      </a>
    </div>
    <button class="chat-fab-btn" id="chat-fab-btn" title="Chat with us" onclick="toggleChat()">
      <span class="chat-pulse"></span>
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6v-2h12v2zm0-3H6V7h12v2z"/></svg>
    </button>
  `;
  document.body.appendChild(fab);
}

function toggleChat() {
  const opts = document.getElementById('chat-options');
  opts.classList.toggle('open');
}

// Close chat when clicking outside
document.addEventListener('click', e => {
  const fab = document.getElementById('chat-fab');
  if (fab && !fab.contains(e.target)) {
    document.getElementById('chat-options')?.classList.remove('open');
  }
});

// ── Back To Top ───────────────────────────────────────
function injectBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.id = 'backToTopBtn';
  btn.innerHTML = '↑';
  btn.title = 'Back to top';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── Promo Marquee ─────────────────────────────────────
async function injectPromoMarquee() {
  if (window.location.pathname.includes('store-manager.html') || window.location.pathname.includes('admin') || document.getElementById('admin-wrap')) return;

  try {
    const res = await fetch('/api/announcement').then(r => r.json());
    const text = res.text || '';
    if (!text.trim()) return; // Hide banner if empty
    
    // Repeat text to make it continuous
    const repeatedText = `<span>${text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${text}</span>`;
    
    const marquee = document.createElement('div');
    marquee.className = 'promo-marquee';
    marquee.innerHTML = repeatedText;
    
    const header = document.querySelector('header');
    if (header) {
      header.parentNode.insertBefore(marquee, header);
    } else {
      document.body.insertBefore(marquee, document.body.firstChild);
    }
  } catch(e) {
    console.error('Failed to load promo marquee:', e);
  }
}

// ── Header Back Button ────────────────────────────────
function injectHeaderBackButton() {
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('store-manager.html')) return;

  const headerInner = document.querySelector('.header-inner');
  const logo = document.querySelector('.header-inner .logo');
  
  if (headerInner && logo) {
    const btn = document.createElement('a');
    btn.href = 'index.html';
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    `;
    btn.title = 'Back to Home';
    
    Object.assign(btn.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--ink)',
      textDecoration: 'none',
      marginRight: '14px',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'var(--bg)',
      border: '1.5px solid var(--border)',
      transition: 'all 0.2s ease',
      flexShrink: '0'
    });
    
    btn.onmouseenter = () => { 
      btn.style.background = 'var(--green-pale)'; 
      btn.style.borderColor = 'var(--green-lite)';
      btn.style.color = 'var(--green)'; 
      btn.style.transform = 'translateX(-2px)';
    };
    btn.onmouseleave = () => { 
      btn.style.background = 'var(--bg)'; 
      btn.style.borderColor = 'var(--border)';
      btn.style.color = 'var(--ink)'; 
      btn.style.transform = 'none';
    };

    headerInner.insertBefore(btn, logo);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  injectChatFAB();
  injectBackToTop();
  injectPromoMarquee();
  injectHeaderBackButton();

  // Detect referral code / coupon link
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref') || urlParams.get('coupon');
  if (ref) {
    localStorage.setItem('es-applied-coupon', ref.trim().toUpperCase());
  }
});
// ── Product Image Gallery ─────────────────────────────
// Usage: initGallery(container, imagesArray)
function initGallery(container, images) {
  let current = 0;
  let zoomed = false;

  const galleryImgs = images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80'
  ];

  function render() {
    container.innerHTML = `
      <div class="gallery-wrap">
        <div class="gallery-badge">100% Natural</div>
        <div class="gallery-main" id="gmain">
          ${galleryImgs.length > 1 ? `
            <button class="gallery-arrow prev" onclick="galPrev()">‹</button>
            <button class="gallery-arrow next" onclick="galNext()">›</button>` : ''}
          <img id="gimg" src="${galleryImgs[0]}" alt="Product"
            onerror="this.src='https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80'"
            onclick="toggleZoom(event)">
          ${galleryImgs.length > 1 ? `
            <div class="gallery-dots">${galleryImgs.map((_,i) => `<button class="gallery-dot ${i===0?'active':''}" onclick="galGoto(${i})"></button>`).join('')}</div>` : ''}
        </div>
        ${galleryImgs.length > 1 ? `
        <div class="gallery-thumbs">
          ${galleryImgs.map((src,i) => `
            <div class="gallery-thumb ${i===0?'active':''}" onclick="galGoto(${i})">
              <img src="${src}" alt="" onerror="this.src='https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&q=80'">
            </div>`).join('')}
        </div>` : ''}
      </div>`;
  }

  render();

  window.galGoto = function(idx) {
    current = (idx + galleryImgs.length) % galleryImgs.length;
    const img = document.getElementById('gimg');
    if (img) {
      img.style.transition = 'opacity .2s';
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = galleryImgs[current];
        img.style.opacity = '1';
      }, 180);
    }
    document.querySelectorAll('.gallery-dot').forEach((d,i) => d.classList.toggle('active', i===current));
    document.querySelectorAll('.gallery-thumb').forEach((t,i) => t.classList.toggle('active', i===current));
    // reset zoom
    zoomed = false;
    document.getElementById('gmain')?.classList.remove('zoomed');
  };
  window.galPrev = () => window.galGoto(current - 1);
  window.galNext = () => window.galGoto(current + 1);
  window.toggleZoom = function(e) {
    const main = document.getElementById('gmain');
    if (!main) return;
    zoomed = !zoomed;
    main.classList.toggle('zoomed', zoomed);
    if (zoomed) {
      const rect = main.getBoundingClientRect();
      const ox = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
      const oy = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
      main.style.setProperty('--ox', ox);
      main.style.setProperty('--oy', oy);
    }
  };

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') window.galPrev();
    if (e.key === 'ArrowRight') window.galNext();
  });
}

// ── Shared Card Variant Logic ─────────────────────────
window.cardVariantsData = {};

window.updateCardVariant = function(btn, pId, vName, vPrice) {
  const container = btn.closest('.card-variants');
  container.querySelectorAll('button').forEach(b => {
    b.style.borderColor = 'var(--border)';
    b.style.background = 'var(--surface)';
    b.style.color = 'var(--ink)';
  });
  btn.style.borderColor = 'var(--green)';
  btn.style.background = 'var(--green-pale)';
  btn.style.color = 'var(--green)';
  
  const priceEl = document.getElementById('card-price-' + pId);
  if(priceEl) priceEl.textContent = '₹' + Number(vPrice).toLocaleString('en-IN');
  
  const priceTopEl = document.getElementById('card-price-top-' + pId);
  if(priceTopEl) priceTopEl.textContent = '₹' + Number(vPrice).toLocaleString('en-IN');
  
  window.cardVariantsData[pId] = { name: vName, price: vPrice };
};

window.doCardAddToCart = function(pId, safeName, btn) {
  const v = window.cardVariantsData[pId];
  if (v) {
    localStorage.setItem('cart_var_' + pId, JSON.stringify(v));
    addToCartShared(pId, safeName + ' - ' + v.name, btn, 1);
  } else {
    addToCartShared(pId, safeName, btn, 1);
  }
};

window.doCardBuyNow = function(pId, safeName, basePrice, btn) {
  const v = window.cardVariantsData[pId];
  const pName = v ? safeName + ' - ' + v.name : safeName;
  const price = v ? v.price : basePrice;
  buyNowShared(pId, pName, price, btn);
};
