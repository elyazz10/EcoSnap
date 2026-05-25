// =========================================================================
// ECOSNAP - SUPABASE CONFIGURATION
// =========================================================================

// Ganti URL dan ANON_KEY di bawah dengan project Supabase Anda.
const SUPABASE_URL = 'https://fqzwkrhqwmqfwcwynstr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxendrcmhxd21xZndjd3luc3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzcyMTgsImV4cCI6MjA5MDg1MzIxOH0.bmxGz_zJ95KeKoXSjOszmqokPF8DscImIIMOkAyoqs0';

// Inisialisasi Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Data Mockup (Akan digunakan sebagai fallback jika Supabase belum diatur/gagal koneksi)
const MOCK_CATEGORIES = [
  { name: 'Botol Plastik', category: 'Plastik', recycle_method: 'Bilas bersih, remukkan, lalu buang ke tempat sampah anorganik (warna kuning).', fact: 'Plastik butuh 400 tahun untuk terurai.', points: 10 },
  { name: 'Kardus Bekas', category: 'Kardus', recycle_method: 'Lipat kardus menjadi pipih agar hemat tempat. Jauhkan dari air.', fact: 'Mendaur ulang kardus menghemat 24% energi pembuatan baru.', points: 15 },
  { name: 'Sisa Makanan', category: 'Organik', recycle_method: 'Kumpulkan dalam wadah tertutup, bisa dijadikan kompos untuk tanaman.', fact: 'Sampah organik menyumbang gas metana tinggi jika dibiarkan menumpuk.', points: 5 },
  { name: 'Kaleng Minuman', category: 'Kaleng', recycle_method: 'Bilas bersih, buang ke tempat sampah anorganik logam.', fact: 'Aluminium dapat didaur ulang berkali-kali tanpa mengurangi kualitas.', points: 20 },
  { name: 'Kertas Koran', category: 'Kertas', recycle_method: 'Kumpulkan rapi, pastikan tidak basah/terkena minyak.', fact: 'Mendaur ulang 1 ton kertas menyelamatkan 17 pohon.', points: 10 }
];

const MOCK_FACTS = [
  "Bumi kehilangan hutan seluas 27 lapangan bola setiap menitnya.",
  "Hanya 9% dari seluruh plastik yang pernah diproduksi telah didaur ulang.",
  "Mendaur ulang satu botol kaca menghemat cukup energi untuk menyalakan lampu 100 watt selama 4 jam.",
  "Setiap tahun, sekitar 8 juta ton plastik berakhir di lautan."
];

const MOCK_ACHIEVEMENTS = [
  { id: 1, title: "First Scan!", desc: "Melakukan scan sampah pertama", icon: "🌱", locked: false },
  { id: 2, title: "Recycle Hero", desc: "Mencapai 100 Eco Points", icon: "🦸", locked: true },
  { id: 3, title: "Plastic Enemy", desc: "Scan 5 sampah plastik", icon: "🚫", locked: true },
  { id: 4, title: "Compost Master", desc: "Scan 10 sampah organik", icon: "🥬", locked: true }
];

// State User (Mock)
let currentUser = {
  id: 'user-123',
  name: 'Sobat Bumi',
  points: 0,
  scanCount: 0
};

let scanHistory = [];

// Supabase Helper Functions (Jika Anda sudah set tabel di Supabase)
async function getWasteCategoryData(categoryName) {
  try {
    const { data, error } = await supabaseClient
      .from('waste_categories')
      .select('*')
      .ilike('category', `%${categoryName}%`)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn("Menggunakan data mockup karena Supabase tidak terhubung:", error.message);
    return MOCK_CATEGORIES.find(c => c.category.toLowerCase() === categoryName.toLowerCase()) || MOCK_CATEGORIES[0];
  }
}

async function saveScanHistory(scanData) {
  try {
    const { data, error } = await supabaseClient
      .from('scan_history')
      .insert([scanData]);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn("Menyimpan ke history mockup:", error.message);
    const newEntry = {
      id: Date.now(),
      ...scanData,
      date: new Date().toISOString()
    };
    scanHistory.unshift(newEntry);
    currentUser.points += scanData.points;
    currentUser.scanCount += 1;
    return newEntry;
  }
}
