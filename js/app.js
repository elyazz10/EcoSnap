// =========================================================================
// ECOSNAP - MAIN APPLICATION LOGIC
// =========================================================================

let aiModel = null;

document.addEventListener('DOMContentLoaded', () => {
  // Memuat model AI secara asinkron di latar belakang
  if (typeof mobilenet !== 'undefined') {
    mobilenet.load().then(model => {
      aiModel = model;
      console.log("Model AI Berhasil Dimuat!");
    });
  }

  // === 1. SPLASH SCREEN LOGIC ===
  setTimeout(async () => {
    const splash = document.getElementById('page-splash');
    splash.classList.add('fade-out');
    
    // Cek status login Supabase
    const isLoggedIn = await checkAuthSession();
    
    setTimeout(() => {
      splash.classList.remove('active');
      if (isLoggedIn) {
        navigateTo('home');
      } else {
        navigateTo('login');
      }
    }, 500); // Wait for fade out
  }, 3000); // 3 seconds splash screen
});

// === NAVIGATION ===
function navigateTo(pageId) {
  // Sembunyikan semua page
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Tampilkan page yang dituju
  document.getElementById(`page-${pageId}`).classList.add('active');
  window.scrollTo(0, 0);

  // Update bottom nav state
  if (['home', 'scan', 'riwayat', 'achievement'].includes(pageId)) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.textContent.toLowerCase().includes(pageId) || 
          (pageId === 'achievement' && btn.textContent.toLowerCase().includes('hadiah'))) {
        btn.classList.add('active');
      }
    });
  }

  // Init page data
  if (pageId === 'home') initHomeData();
  if (pageId === 'riwayat') initRiwayatData();
  if (pageId === 'achievement') initAchievementData();
  if (pageId === 'edukasi') initEdukasiData();
  if (pageId === 'scan') resetScanPage();
  if (pageId === 'profile') initProfileData();
}

// === AUTHENTICATION LOGIC ===
async function checkAuthSession() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      currentUser.id = session.user.id;
      currentUser.name = session.user.user_metadata?.full_name || 'Sobat Bumi';
      currentUser.email = session.user.email;
      
      // Sinkronisasi data riwayat
      await syncUserData(session.user.id);
      
      return true;
    }
  } catch(e) { console.error(e); }
  return false;
}

async function syncUserData(userId) {
  try {
    const { data, error } = await supabaseClient
      .from('scan_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      scanHistory = data;
      currentUser.scanCount = data.length;
      currentUser.points = data.reduce((total, item) => total + item.points, 0);
    }
  } catch(e) {
    console.error("Gagal sinkronisasi data:", e);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = e.target.querySelector('button');
  const oriText = btn.textContent;
  btn.textContent = "Memproses...";
  btn.disabled = true;

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await checkAuthSession();
    navigateTo('home');
  } catch (error) {
    alert('Login gagal: ' + error.message);
  } finally {
    btn.textContent = oriText;
    btn.disabled = false;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const btn = e.target.querySelector('button');
  const oriText = btn.textContent;
  btn.textContent = "Memproses...";
  btn.disabled = true;

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) throw error;
    alert('Registrasi berhasil! Silakan login.');
    navigateTo('login');
  } catch (error) {
    alert('Registrasi gagal: ' + error.message);
  } finally {
    btn.textContent = oriText;
    btn.disabled = false;
  }
}

async function handleForgot(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value;
  const btn = e.target.querySelector('button');
  const oriText = btn.textContent;
  btn.textContent = "Memproses...";
  btn.disabled = true;

  try {
    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email);
    if (error) throw error;
    alert('Link reset password telah dikirim ke email Anda.');
    navigateTo('login');
  } catch (error) {
    alert('Gagal: ' + error.message);
  } finally {
    btn.textContent = oriText;
    btn.disabled = false;
  }
}

async function handleLogout() {
  if (confirm("Yakin ingin keluar?")) {
    await supabaseClient.auth.signOut();
    currentUser = { id: 'user-123', name: 'Sobat Bumi', points: 45, scanCount: 3 }; // Reset mock
    navigateTo('login');
  }
}

// === HOME PAGE LOGIC ===
function initHomeData() {
  document.getElementById('user-display-name').textContent = currentUser.name;
  
  // Animate points
  const pointsEl = document.getElementById('home-eco-points');
  animateValue(pointsEl, 0, currentUser.points, 1000);

  // Daily Fact
  const randomFact = MOCK_FACTS[Math.floor(Math.random() * MOCK_FACTS.length)];
  document.getElementById('daily-fact').textContent = randomFact;
}

// === SCAN PAGE LOGIC ===
let selectedCategory = null;
let uploadedImageSrc = null;

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedImageSrc = e.target.result;
      const preview = document.getElementById('image-preview');
      preview.src = uploadedImageSrc;
      preview.classList.remove('hidden');
      document.getElementById('upload-placeholder').classList.add('hidden');
    }
    reader.readAsDataURL(file);
    
    // Auto guess category (mock simple logic)
    setTimeout(() => {
      const cats = ['Plastik', 'Kardus', 'Organik', 'Kaleng', 'Kertas'];
      const randomCat = cats[Math.floor(Math.random() * cats.length)];
      selectCategoryByString(randomCat);
    }, 1000);
  }
}

function selectCategory(btn) {
  const cat = btn.getAttribute('data-cat');
  selectCategoryByString(cat);
}

function selectCategoryByString(catStr) {
  selectedCategory = catStr;
  
  // Update UI
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
  const targetChip = document.querySelector(`.chip[data-cat="${catStr}"]`);
  if (targetChip) targetChip.classList.add('selected');
}

function resetScanPage() {
  selectedCategory = null;
  uploadedImageSrc = null;
  document.getElementById('image-preview').classList.add('hidden');
  document.getElementById('upload-placeholder').classList.remove('hidden');
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
  document.getElementById('file-input').value = '';
}

async function startScan() {
  if (!selectedCategory && !uploadedImageSrc) {
    alert("Silakan upload foto atau pilih kategori sampah terlebih dahulu!");
    return;
  }

  // Tampilkan loading
  document.getElementById('scan-loading').classList.remove('hidden');
  const loadText = document.querySelector('.loading-text');

  let finalCategory = selectedCategory;

  // Jika tidak ada kategori yang dipilih, tapi ada foto, gunakan AI!
  if (!selectedCategory && uploadedImageSrc) {
    if (aiModel) {
      loadText.textContent = "AI Sedang Memeriksa...";
      try {
        const imgEl = document.getElementById('image-preview');
        const predictions = await aiModel.classify(imgEl);
        console.log("Hasil AI:", predictions);
        
        // Menerjemahkan hasil objek AI ke kategori kita
        const labels = predictions.map(p => p.className.toLowerCase()).join(' ');
        if (labels.includes('bottle') || labels.includes('plastic')) finalCategory = 'Plastik';
        else if (labels.includes('box') || labels.includes('carton') || labels.includes('cardboard')) finalCategory = 'Kardus';
        else if (labels.includes('can') || labels.includes('tin') || labels.includes('metal')) finalCategory = 'Kaleng';
        else if (labels.includes('paper') || labels.includes('book') || labels.includes('newspaper')) finalCategory = 'Kertas';
        else finalCategory = 'Organik'; // Fallback
      } catch(err) {
        console.error("AI Error:", err);
        finalCategory = 'Plastik'; 
      }
    } else {
      finalCategory = 'Plastik'; // Fallback jika AI belum dimuat
    }
  }

  loadText.textContent = "Menyimpan Hasil...";

  // Proses simpan
  setTimeout(async () => {
    try {
      const resultData = await getWasteCategoryData(finalCategory);
      
      // Sembunyikan loading
      document.getElementById('scan-loading').classList.add('hidden');
      loadText.textContent = "Scanning Waste..."; // Reset text
      
      // Simpan ke history
      const historyEntry = {
        user_id: currentUser.id,
        name: resultData.name,
        category: resultData.category,
        points: resultData.points,
        img: uploadedImageSrc || 'https://via.placeholder.com/300/00ff66/000000?text=' + resultData.category
      };
      await saveScanHistory(historyEntry);

      // Tampilkan hasil
      showResultPage(resultData, historyEntry.img);

    } catch (err) {
      document.getElementById('scan-loading').classList.add('hidden');
      alert("Terjadi kesalahan saat memproses data.");
    }
  }, 1000); 
}

function showResultPage(data, imgSrc) {
  document.getElementById('result-image').src = imgSrc;
  document.getElementById('result-cat-overlay').textContent = data.category;
  
  document.getElementById('res-name').textContent = data.name;
  document.getElementById('res-category').textContent = data.category;
  document.getElementById('res-recycle').textContent = data.recycle_method;
  document.getElementById('res-fact').textContent = data.fact;
  
  const pointsEl = document.getElementById('res-points');
  pointsEl.textContent = `+${data.points}`;
  pointsEl.classList.add('pulse-anim');

  navigateTo('result');
}

// === RIWAYAT PAGE LOGIC ===
function initRiwayatData() {
  document.getElementById('total-scans').textContent = currentUser.scanCount;
  document.getElementById('total-points-riwayat').textContent = currentUser.points;
  
  // Hitung unique categories (mock)
  const uniqueCats = new Set(scanHistory.map(h => h.category));
  document.getElementById('total-categories').textContent = uniqueCats.size;

  const listContainer = document.getElementById('history-list');
  
  if (scanHistory.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>Belum ada riwayat scan.<br/>Yuk scan sampah pertamamu!</p>
        <button class="btn-empty" onclick="navigateTo('scan')">Scan Sekarang</button>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = '';
  scanHistory.forEach(item => {
    const d = new Date(item.date);
    const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
    
    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <div class="history-img-wrapper">
        <img src="${item.img}" alt="${item.name}" class="history-img" />
      </div>
      <div class="history-info">
        <h4 class="history-title">${item.name}</h4>
        <p class="history-date">${dateStr}</p>
        <span class="history-cat">${item.category}</span>
      </div>
      <div class="history-points">+${item.points}</div>
    `;
    listContainer.appendChild(card);
  });
}

// === ACHIEVEMENT PAGE LOGIC ===
function initAchievementData() {
  const maxPoints = 500;
  const progressPercent = Math.min((currentUser.points / maxPoints) * 100, 100);
  
  document.getElementById('achieve-points-text').textContent = `${currentUser.points} / ${maxPoints} Points`;
  
  setTimeout(() => {
    document.getElementById('level-progress-fill').style.width = `${progressPercent}%`;
  }, 100);

  const grid = document.getElementById('badges-grid');
  grid.innerHTML = '';
  
  // Simple mock logic for unlocking badges
  if (currentUser.scanCount >= 1) MOCK_ACHIEVEMENTS[0].locked = false;
  if (currentUser.points >= 100) MOCK_ACHIEVEMENTS[1].locked = false;
  
  const plasticCount = scanHistory.filter(h => h.category === 'Plastik').length;
  if (plasticCount >= 5) MOCK_ACHIEVEMENTS[2].locked = false;
  
  const organicCount = scanHistory.filter(h => h.category === 'Organik').length;
  if (organicCount >= 10) MOCK_ACHIEVEMENTS[3].locked = false;

  MOCK_ACHIEVEMENTS.forEach(badge => {
    const card = document.createElement('div');
    card.className = `badge-card ${badge.locked ? 'locked' : ''}`;
    card.innerHTML = `
      <div class="badge-icon">${badge.locked ? '🔒' : badge.icon}</div>
      <h4 class="badge-title">${badge.title}</h4>
      <p class="badge-desc">${badge.desc}</p>
    `;
    grid.appendChild(card);
  });
}

// === EDUKASI PAGE LOGIC ===
function initEdukasiData() {
  // Tips List
  const tipsContainer = document.getElementById('edu-tips-list');
  tipsContainer.innerHTML = `
    <div class="tip-card">
      <div class="tip-icon">🚰</div>
      <div class="tip-content">
        <h4>Bilas Sebelum Buang</h4>
        <p>Pastikan botol atau kaleng dibilas agar tidak mengotori sampah lain dan mudah didaur ulang.</p>
      </div>
    </div>
    <div class="tip-card">
      <div class="tip-icon">🛍️</div>
      <div class="tip-content">
        <h4>Bawa Tas Belanja</h4>
        <p>Kurangi penggunaan kantong plastik sekali pakai dengan membawa tas belanja kain sendiri.</p>
      </div>
    </div>
  `;

  // Facts List
  const factsContainer = document.getElementById('eco-facts-list');
  factsContainer.innerHTML = `
    <div class="eco-fact-card" style="margin-bottom:0">
      <div class="fact-header"><span class="fact-tag">Tahukah Kamu?</span></div>
      <p class="fact-text">${MOCK_FACTS[1]}</p>
      <div class="fact-deco">🌊</div>
    </div>
  `;

  // Category Guide
  const guideContainer = document.getElementById('category-guide');
  const catColors = {
    'Plastik': 'var(--primary)',
    'Kardus': 'var(--secondary)',
    'Organik': '#ff99cc',
    'Kaleng': 'var(--accent)',
    'Kertas': '#cc99ff'
  };

  guideContainer.innerHTML = '';
  MOCK_CATEGORIES.forEach(cat => {
    const color = catColors[cat.category] || 'var(--white)';
    guideContainer.innerHTML += `
      <div class="cat-guide-card">
        <div class="cat-guide-header">
          <div class="cat-guide-color" style="background-color: ${color}"></div>
          <h4 class="cat-guide-title">${cat.category}</h4>
        </div>
        <p class="cat-guide-desc">${cat.recycle_method}</p>
      </div>
    `;
  });
}

// === PROFILE PAGE LOGIC ===
function initProfileData() {
  document.getElementById('profile-name-display').textContent = currentUser.name || 'Sobat Bumi';
  document.getElementById('profile-email-display').textContent = currentUser.email || 'email@belum-diatur.com';
}

// === UTILS ===
function toggleTheme() {
  const body = document.documentElement;
  const currentTheme = body.getAttribute('data-theme');
  const toggleBtn = document.getElementById('theme-toggle');
  
  if (currentTheme === 'dark') {
    body.removeAttribute('data-theme');
    toggleBtn.textContent = '🌙';
  } else {
    body.setAttribute('data-theme', 'dark');
    toggleBtn.textContent = '☀️';
  }
}

function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}
