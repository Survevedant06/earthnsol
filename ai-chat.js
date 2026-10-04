// ══════════════════════════════════════════════════════
// EarthNsol — Mitti AI Chat (Backend Proxied)
// ══════════════════════════════════════════════════════
(function () {

  const SUGGESTIONS = [
    { icon: '🌾', text: 'गव्हाच्या शेतीसाठी कोणते उत्पादन सर्वोत्तम आहे?' },
    { icon: '🪱', text: 'गांडूळ खत माझ्या मातीला कशी मदत करते?' },
    { icon: '🌿', text: 'माझी माती आम्लधर्मी (acidic) आहे, काय वापरावे?' },
    { icon: '💧', text: 'वर्मीवॉश (vermiwash) कसे वापरावे?' },
    { icon: '🐛', text: 'नैसर्गिक कीड नियंत्रण टिप्स' },
    { icon: '📦', text: 'माझ्या शेतासाठी उत्पादनांची शिफारस करा' },
  ];

  let chatHistory  = [];
  let liveProducts = [];
  let isOpen  = false;
  let isBusy  = false;
  let isListening = false;
  let baseText = '';
  
  // Web Speech API instances
  let recognition = null;
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'mr-IN';

    recognition.onresult = (event) => {
      let speech = '';
      for (let i = 0; i < event.results.length; ++i) {
        speech += event.results[i][0].transcript;
      }
      
      const inp = document.getElementById('es-input');
      if (inp) {
        const prefix = baseText ? baseText + ' ' : '';
        inp.value = prefix + speech;
        inp.style.height = 'auto';
        inp.style.height = Math.min(inp.scrollHeight, 100) + 'px';
      }
    };
    recognition.onerror = (event) => { 
      console.error('Speech error:', event.error);
      const inp = document.getElementById('es-input');
      if (inp) {
        inp.value = "⚠️ Mic Error: " + event.error;
      }
      stopMic(); 
    };
    recognition.onend = () => {
      stopMic();
    };
  }

  function stopMic() {
    isListening = false;
    const btn = document.getElementById('es-mic-btn');
    if (btn) btn.classList.remove('active');
    if (recognition) recognition.stop();
  }

  // Expose to window for inline onclick handlers
  window.speakText = function(text) {
    if (!('speechSynthesis' in window)) {
      console.warn("Speech Synthesis not supported in this browser.");
      return;
    }
    
    // Clear any stuck audio queue
    window.speechSynthesis.cancel();
    
    // Tiny delay prevents Chrome bugs where cancel() swallows the immediate next speak()
    setTimeout(() => {
      // Heavily clean the text to prevent parser crashes
      const cleanText = text.replace(/[*#"'_]/g, '')
                            .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
                            .trim();
      if (!cleanText) return;
      
      const msg = new SpeechSynthesisUtterance(cleanText);
      const isMarathi = /[\u0900-\u097F]/.test(cleanText);
      
      if (isMarathi) {
        msg.lang = 'mr-IN';
      } else {
        msg.lang = 'en-IN';
      }
      
      // Attempt to bind voice explicitly if available
      if (window.speechSynthesis.getVoices) {
        const voices = window.speechSynthesis.getVoices();
        const targetLang = isMarathi ? 'mr' : 'en';
        let matchedVoice = voices.find(v => v.lang.toLowerCase() === (isMarathi ? 'mr-in' : 'en-in'));
        if (!matchedVoice) {
          matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLang));
        }
        if (!matchedVoice && isMarathi) {
          // fallback to Hindi if no Marathi voice is installed
          matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith('hi'));
        }
        if (matchedVoice) {
          msg.voice = matchedVoice;
        }
      }
      
      msg.volume = 1;
      msg.rate = 1;
      msg.pitch = 1;
      
      try {
        window.speechSynthesis.speak(msg);
      } catch (err) {
        console.error("Audio playback failed:", err);
      }
    }, 50);
  }

  async function fetchProducts() {
    try {
      const res = await window.apiFetch('/api/products?limit=20');
      if (res.data && res.data.length) liveProducts = res.data;
    } catch (e) {}
  }

  function buildSystemPrompt() {
    const catalog = liveProducts.length
      ? liveProducts.map(p =>
          `- ${p.name} (${p.category || 'Natural'}) — ₹${Number(p.price).toLocaleString('en-IN')}: ${p.description || ''}`
        ).join('\n')
      : `- Vermicompost: Premium worm castings, ₹899/bag
- Vermiwash: Liquid fertilizer, ₹499/bottle
- Activated Charcoal (Biochar): Soil conditioner, ₹1299/bag
- Natural Fertilizer: Balanced NPK, ₹699/bag
- Compost: Rich natural matter, ₹599/bag`;

    return `You are Mitti, EarthNsol's expert AI farming assistant. Speak warmly like a knowledgeable friend.

Your roles:
1. FARMING ASSISTANT: Answer questions about natural farming, soil health, crop diseases, etc.
2. PRODUCT RECOMMENDER: Recommend EarthNsol products from the catalog below.

PRODUCT CATALOG:
${catalog}

CRITICAL RULES FOR SPOKEN AUDIO:
1. Keep answers EXTREMELY short (maximum 1 or 2 sentences total). Your response is read aloud by a Text-to-Speech engine.
2. NEVER use bullet points, markdown, or multiple paragraphs. Just speak naturally.
3. Warm, encouraging tone always.
4. Respond in Marathi (मराठी) by default, or match the user's language (Marathi/Hindi/English).
5. When recommending a product, state the specific product and price quickly.`;
  }

  async function callGroq(userMessage) {
    const messages = [
      { role: 'system', content: buildSystemPrompt() },
      ...chatHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      const res = await window.apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages })
      });
      const reply = res.message || 'Could not respond right now.';
      chatHistory.push({ role: 'user', content: userMessage });
      chatHistory.push({ role: 'assistant', content: reply });
      return reply;
    } catch (err) {
      throw new Error('API_ERROR: ' + err.message);
    }
  }

  function getProductCards(text) {
    const map = [
      { keys: ['vermicompost', 'worm cast', 'earthworm'], icon: '🪱', name: 'Premium Vermicompost', sub: 'Improves soil & yield' },
      { keys: ['vermiwash', 'liquid fertilizer', 'foliar'], icon: '💧', name: 'Vermiwash', sub: 'Foliar spray & soil drench' },
      { keys: ['charcoal', 'biochar', 'activated'], icon: '🪨', name: 'Activated Charcoal', sub: 'Improves soil porosity' },
      { keys: ['natural fertilizer', 'npk', 'balanced'], icon: '🌿', name: 'Natural Fertilizer', sub: 'Balanced nutrition for all crops' },
      { keys: ['compost', 'natural matter'], icon: '♻️', name: 'Compost', sub: 'Rich natural matter' },
      { keys: ['soil', 'ph', 'acidic', 'alkaline'], icon: '🔬', name: 'Soil Amendments', sub: 'pH correction & micronutrients' },
    ];
    const lower = text.toLowerCase();
    return map.filter(p => p.keys.some(k => lower.includes(k))).slice(0, 2);
  }

  // ── Styles ────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #es-ai-trigger{position:fixed;bottom:28px;right:28px;z-index:10000;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#2e6b3e,#4caf6a);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(58,125,68,.45);transition:transform .3s cubic-bezier(.34,1.56,.64,1);animation:es-pulse 2.5s ease-in-out infinite}
    @keyframes es-pulse{0%,100%{box-shadow:0 4px 24px rgba(58,125,68,.45),0 0 0 0 rgba(58,125,68,.25)}50%{box-shadow:0 4px 24px rgba(58,125,68,.45),0 0 0 13px rgba(58,125,68,0)}}
    #es-ai-trigger:hover{transform:scale(1.1);animation:none}
    #es-ai-trigger.open{transform:scale(.9) rotate(15deg);animation:none}
    #es-ai-trigger svg{width:32px;height:32px;fill:white}
    #es-ai-trigger .es-close-icon{display:none}
    #es-ai-trigger.open .es-chat-icon{display:none}
    #es-ai-trigger.open .es-close-icon{display:block}
    .es-trigger-label{position:fixed;bottom:100px;right:28px;z-index:10000;background:#1a2e1d;color:white;padding:6px 14px;border-radius:20px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.75rem;font-weight:600;white-space:nowrap;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.2);opacity:0;animation:es-label-in .4s 1.5s ease both}
    @keyframes es-label-in{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
    #es-ai-panel{position:fixed;bottom:106px;right:28px;z-index:9999;width:380px;height:565px;background:#fff;border-radius:24px;box-shadow:0 24px 80px rgba(26,46,29,.22);display:flex;flex-direction:column;overflow:hidden;transform:scale(.85) translateY(20px);opacity:0;transform-origin:bottom right;transition:transform .35s cubic-bezier(.34,1.56,.64,1),opacity .25s ease;pointer-events:none;font-family:'Plus Jakarta Sans',sans-serif}
    #es-ai-panel.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}
    .es-header{background:linear-gradient(135deg,#2d5a35,#3a7d44 60%,#52b788);padding:18px 20px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0}
    .es-avatar{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;border:2px solid rgba(255,255,255,.3)}
    .es-header-name{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:white;line-height:1.2}
    .es-header-status{font-size:.72rem;color:rgba(255,255,255,.8);display:flex;align-items:center;gap:5px;margin-top:2px}
    .es-status-dot{width:7px;height:7px;border-radius:50%;background:#4ade80;animation:es-blink 2s ease-in-out infinite}
    @keyframes es-blink{0%,100%{opacity:1}50%{opacity:.4}}
    .es-header-tags{display:flex;gap:5px;margin-top:3px}
    .es-tag{font-size:.62rem;font-weight:700;padding:2px 7px;border-radius:10px;background:rgba(255,255,255,.2);color:rgba(255,255,255,.9)}
    .es-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px}
    .es-messages::-webkit-scrollbar{width:4px}
    .es-messages::-webkit-scrollbar-thumb{background:#ddd8ce;border-radius:2px}
    .es-msg{display:flex;gap:8px;align-items:flex-end}
    .es-msg.user{flex-direction:row-reverse}
    .es-msg-avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#3a7d44,#52b788);display:flex;align-items:center;justify-content:center;font-size:.8rem}
    .es-bubble{position:relative;max-width:82%;padding:10px 14px;border-radius:18px;font-size:.84rem;line-height:1.6;animation:es-pop .3s ease both}
    @keyframes es-pop{from{opacity:0;transform:translateY(6px) scale(.96)}to{opacity:1;transform:none}}
    .es-msg.bot .es-bubble{background:#f0ede6;color:#1a2e1d;border-bottom-left-radius:4px;padding-right:32px;}
    .es-speaker-btn{position:absolute;top:6px;right:6px;background:none;border:none;cursor:pointer;font-size:1rem;color:#6b8f71;transition:transform .2s, color .2s;}
    .es-speaker-btn:hover{transform:scale(1.1);color:#3a7d44;}
    .es-msg.user .es-bubble{background:linear-gradient(135deg,#3a7d44,#4a9955);color:white;border-bottom-right-radius:4px}
    .es-product-card{background:white;border:1.5px solid #ddd8ce;border-radius:12px;padding:10px 12px;margin-top:6px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:border-color .2s,box-shadow .2s}
    .es-product-card:hover{border-color:#3a7d44;box-shadow:0 2px 12px rgba(58,125,68,.12)}
    .es-pcard-icon{font-size:1.5rem;flex-shrink:0}
    .es-pcard-name{font-size:.8rem;font-weight:700;color:#1a2e1d}
    .es-pcard-sub{font-size:.72rem;color:#6b8f71;margin-top:1px}
    .es-pcard-arrow{color:#3a7d44;font-size:1rem;margin-left:auto;flex-shrink:0}
    .es-typing .es-bubble{background:#f0ede6;padding:12px 16px;display:flex;gap:4px;align-items:center}
    .es-dot{width:7px;height:7px;border-radius:50%;background:#6b8f71;animation:es-tdot 1.2s ease-in-out infinite}
    .es-dot:nth-child(2){animation-delay:.2s}.es-dot:nth-child(3){animation-delay:.4s}
    @keyframes es-tdot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}
    .es-suggestions{padding:0 16px 12px;display:flex;gap:7px;flex-wrap:wrap;flex-shrink:0}
    .es-chip{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:20px;background:#f0ede6;border:1.5px solid #ddd8ce;font-size:.75rem;font-weight:600;color:#3d5c42;cursor:pointer;transition:all .18s;white-space:nowrap;font-family:'Plus Jakarta Sans',sans-serif}
    .es-chip:hover{background:#d8f3dc;border-color:#3a7d44;color:#3a7d44;transform:translateY(-1px)}
    .es-input-row{padding:12px 16px 14px;border-top:1px solid #f0ede6;display:flex;gap:8px;align-items:flex-end;flex-shrink:0;background:white}
    .es-textarea{flex:1;resize:none;border:1.5px solid #ddd8ce;border-radius:14px;padding:10px 14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.85rem;color:#1a2e1d;background:#f0ede6;outline:none;max-height:100px;transition:border-color .2s,background .2s;line-height:1.5}
    .es-textarea:focus{border-color:#3a7d44;background:white;box-shadow:0 0 0 3px rgba(58,125,68,.1)}
    .es-textarea::placeholder{color:#6b8f71}
    .es-send-btn{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#3a7d44,#52b788);border:none;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:transform .2s,opacity .2s}
    .es-send-btn:hover{transform:scale(1.08)}
    .es-send-btn:disabled{opacity:.5;transform:none;cursor:not-allowed}
    .es-send-btn svg{width:18px;height:18px;fill:white}
    .es-mic-btn{width:40px;height:40px;border-radius:50%;background:#f0ede6;border:1.5px solid #ddd8ce;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .2s;font-size:1.1rem;color:#1a2e1d;}
    .es-mic-btn:hover{background:#e1dcd0;}
    .es-mic-btn.active{background:#e74c3c;color:white;border-color:#c0392b;animation:mic-pulse 1.5s infinite;}
    @keyframes mic-pulse{0%{box-shadow:0 0 0 0 rgba(231,76,60,.4)}70%{box-shadow:0 0 0 10px rgba(231,76,60,0)}100%{box-shadow:0 0 0 0 rgba(231,76,60,0)}}
    .es-powered{text-align:center;font-size:.65rem;color:#6b8f71;padding:0 16px 10px;flex-shrink:0}
    @media(max-width:480px){
      #es-ai-panel{width:calc(100vw - 24px);right:12px;bottom:90px;height:70vh}
      #es-ai-trigger{right:16px;bottom:16px}
      .es-trigger-label{right:16px}
    }
  `;
  document.head.appendChild(style);

  // ── Widget HTML ───────────────────────────────────────
  function buildWidget() {
    if (document.getElementById('es-ai-widget')) return;
    const widget = document.createElement('div');
    widget.id = 'es-ai-widget';
    widget.innerHTML = `
      <div class="es-trigger-label">Ask Mitti 🌱</div>
      <button id="es-ai-trigger" title="Chat with Mitti" onclick="ESChat.toggle()">
        <svg class="es-chat-icon" viewBox="0 0 48 48" fill="none">
          <path d="M24 42 Q24 30 24 18" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M24 32 Q16 28 13 18" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <ellipse cx="11" cy="16" rx="7" ry="4.5" transform="rotate(-25 11 16)" fill="white" opacity="0.92"/>
          <path d="M24 26 Q32 22 35 12" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <ellipse cx="36" cy="10" rx="7" ry="4.5" transform="rotate(25 36 10)" fill="white" opacity="0.92"/>
          <ellipse cx="24" cy="11" rx="5" ry="7.5" fill="white"/>
          <path d="M16 44 Q24 40 32 44" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
        <svg class="es-close-icon" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
      <div id="es-ai-panel">
        <div class="es-header">
          <div class="es-avatar">🌱</div>
          <div>
            <div class="es-header-name">Mitti — AI Farm Guide</div>
            <div class="es-header-status">
              <div class="es-status-dot"></div>नेहमी मदतीसाठी तयार (Always here to help)
            </div>
            <div class="es-header-tags">
              <span class="es-tag">🌾 Farming Expert</span>
              <span class="es-tag">🔍 Product Guide</span>
            </div>
          </div>
        </div>
        <div class="es-messages" id="es-messages"></div>
        <div class="es-suggestions" id="es-suggestions">
          ${SUGGESTIONS.map(s =>
            `<button class="es-chip" onclick="ESChat.sendChip('${s.text.replace(/'/g, "\\'")}')">${s.icon} ${s.text}</button>`
          ).join('')}
        </div>
        <div class="es-input-row">
          <textarea class="es-textarea" id="es-input" rows="1"
            placeholder="शेती, माती किंवा उत्पादनांबद्दल विचारा (Ask in Marathi/English)..."
            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();ESChat.send()}"
            oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px'">
          </textarea>
          <button class="es-mic-btn" id="es-mic-btn" onclick="ESChat.toggleMic()" title="Voice Input">🎤</button>
          <button class="es-send-btn" id="es-send-btn" onclick="ESChat.send()">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
        <div class="es-powered">Powered by Groq AI · EarthNsol</div>
      </div>`;
    document.body.appendChild(widget);
  }

  // ── Message helpers ───────────────────────────────────
  function addBotMsg(text, cards = []) {
    const c = document.getElementById('es-messages');
    if (!c) return;
    const d = document.createElement('div');
    d.className = 'es-msg bot';
    const cardsHTML = cards.map(p => `
      <div class="es-product-card" onclick="window.location.href='shop.html'">
        <div class="es-pcard-icon">${p.icon}</div>
        <div>
          <div class="es-pcard-name">${p.name}</div>
          <div class="es-pcard-sub">${p.sub}</div>
        </div>
        <div class="es-pcard-arrow">→</div>
      </div>`).join('');
    const speakerHtml = `<button class="es-speaker-btn" onclick="window.speakText(this.parentElement.textContent.replace('🔊', '').trim())">🔊</button>`;
    d.innerHTML = `
      <div class="es-msg-avatar">🌱</div>
      <div>
        <div class="es-bubble">
          ${fmt(text)}
          ${speakerHtml}
        </div>
        ${cardsHTML}
      </div>`;
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
  }

  function addUserMsg(text) {
    const c = document.getElementById('es-messages');
    if (!c) return;
    const d = document.createElement('div');
    d.className = 'es-msg user';
    d.innerHTML = `<div class="es-bubble">${esc(text)}</div>`;
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
  }

  function showTyping() {
    const c = document.getElementById('es-messages');
    if (!c) return;
    const d = document.createElement('div');
    d.className = 'es-msg bot es-typing';
    d.id = 'es-typing-ind';
    d.innerHTML = `
      <div class="es-msg-avatar">🌱</div>
      <div class="es-bubble">
        <div class="es-dot"></div>
        <div class="es-dot"></div>
        <div class="es-dot"></div>
      </div>`;
    c.appendChild(d);
    c.scrollTop = c.scrollHeight;
  }

  function hideTyping() {
    document.getElementById('es-typing-ind')?.remove();
  }

  function fmt(t) {
    return t
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  function esc(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Public API ────────────────────────────────────────
  window.ESChat = {

    toggle() {
      isOpen = !isOpen;
      document.getElementById('es-ai-trigger').classList.toggle('open', isOpen);
      document.getElementById('es-ai-panel').classList.toggle('open', isOpen);
      if (isOpen && chatHistory.length === 0) {
        fetchProducts();
        const wmsg = `🙏 **नमस्कार!** मी **मित्ती** (Mitti) आहे, तुमची EarthNsol AI शेती मार्गदर्शक.\n\nमी तुम्हाला खालील गोष्टींमध्ये मदत करू शकते:\n• मातीचे आरोग्य आणि पिकांविषयी सल्ला\n• सेंद्रिय/नैसर्गिक शेतीचे तंत्र\n• योग्य EarthNsol उत्पादने निवडणे\n\nआज तुमच्या शेतात काय चालले आहे?`;
        addBotMsg(wmsg);
        window.speakText("नमस्कार! मी मित्ती आहे, तुमची शेती मार्गदर्शक. आज तुमच्या शेतात काय चालले आहे?");
      }
      if (!isOpen && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        stopMic();
      }
      if (isOpen) setTimeout(() => document.getElementById('es-input')?.focus(), 350);
    },

    toggleMic() {
      if (!recognition) {
        addUserMsg("🎙️ Audio not supported in this browser.");
        return;
      }
      if (isListening) {
        stopMic();
      } else {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        try {
          const inp = document.getElementById('es-input');
          baseText = inp ? inp.value.trim() : '';

          recognition.start();
          isListening = true;
          document.getElementById('es-mic-btn').classList.add('active');
        } catch (e) { console.error('Mic start error', e) }
      }
    },

    sendChip(text) {
      document.getElementById('es-suggestions').style.display = 'none';
      this.process(text);
    },

    send() {
      const inp  = document.getElementById('es-input');
      const text = inp?.value.trim();
      if (!text || isBusy) return;
      inp.value = '';
      inp.style.height = 'auto';
      document.getElementById('es-suggestions').style.display = 'none';
      this.process(text);
    },

    async process(text) {
      if (isBusy) return;
      isBusy = true;
      document.getElementById('es-send-btn').disabled = true;
      addUserMsg(text);
      showTyping();

      try {
        await fetchProducts();
        const reply = await callGroq(text);
        hideTyping();
        addBotMsg(reply, getProductCards(reply));
        window.speakText(reply);
      } catch (err) {
        hideTyping();
        console.error('Mitti error:', err.message);
        const m = err.message || '';

        if (m.includes('401') || m.includes('invalid_api_key') || m.includes('Unauthorized')) {
          addBotMsg(`⚠️ **API key rejected.**\n\nPlease get a new key at **console.groq.com** and update **ai-chat.js** line 7.`);
        } else if (m.includes('NETWORK_ERROR') || m.includes('Failed to fetch') || m.includes('NetworkError')) {
          addBotMsg(`⚠️ **Connection blocked (CORS).**\n\nTo fix on localhost:\n1. Install Chrome extension **"Allow CORS"** and turn it ON\n2. Refresh the page\n\nThis works automatically on your live domain. 🌱`);
        } else if (m.includes('429') || m.includes('rate_limit')) {
          addBotMsg(`⏳ **Too many requests.** Please wait a moment and try again.`);
        } else if (m.includes('model') || m.includes('decommissioned')) {
          addBotMsg(`⚠️ **Model unavailable.** Please refresh the page and try again.`);
        } else {
          addBotMsg(`⚠️ **Error:** ${m}\n\nPlease try again or call **+91 9067555693** 🙏`);
        }
      }

      isBusy = false;
      document.getElementById('es-send-btn').disabled = false;
      document.getElementById('es-input')?.focus();
    },
  };

  // ── Init ──────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }

})();
