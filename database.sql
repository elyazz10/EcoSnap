-- ==========================================
-- ECOSNAP SUPABASE DATABASE SCHEMA
-- Copy dan Paste seluruh kode ini ke menu "SQL Editor" di Supabase Anda, lalu klik "Run"
-- ==========================================

-- Hapus tabel lama jika sudah ada (Reset)
DROP TABLE IF EXISTS public.scan_history CASCADE;
DROP TABLE IF EXISTS public.waste_categories CASCADE;
DROP TABLE IF EXISTS public.eco_badges CASCADE;

-- 1. Tabel Kategori Sampah
CREATE TABLE public.waste_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    recycle_method TEXT NOT NULL,
    fact TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 10
);

-- Masukkan Data Awal Kategori
INSERT INTO public.waste_categories (name, category, recycle_method, fact, points) VALUES
('Botol Plastik', 'Plastik', 'Bilas bersih, remukkan, lalu buang ke tempat sampah anorganik.', 'Plastik butuh 400 tahun untuk terurai.', 10),
('Kardus Bekas', 'Kardus', 'Lipat kardus menjadi pipih agar hemat tempat. Jauhkan dari air.', 'Mendaur ulang kardus menghemat 24% energi pembuatan baru.', 15),
('Sisa Makanan', 'Organik', 'Kumpulkan dalam wadah tertutup, bisa dijadikan kompos untuk tanaman.', 'Sampah organik menyumbang gas metana tinggi jika dibiarkan menumpuk.', 5),
('Kaleng Minuman', 'Kaleng', 'Bilas bersih, buang ke tempat sampah anorganik logam.', 'Aluminium dapat didaur ulang berkali-kali tanpa mengurangi kualitas.', 20),
('Kertas Koran', 'Kertas', 'Kumpulkan rapi, pastikan tidak basah/terkena minyak.', 'Mendaur ulang 1 ton kertas menyelamatkan 17 pohon.', 10);


-- 2. Tabel Riwayat Scan
CREATE TABLE public.scan_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    points INTEGER NOT NULL,
    img TEXT, -- Untuk link gambar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atur Keamanan RLS untuk Scan History (Agar user hanya bisa melihat riwayatnya sendiri)
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User dapat melihat riwayatnya sendiri" 
ON public.scan_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "User dapat menambah riwayatnya sendiri" 
ON public.scan_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);


-- 3. Tabel Achievement / Badges
CREATE TABLE public.eco_badges (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    req_points INTEGER DEFAULT 0,
    req_scans INTEGER DEFAULT 0
);

-- Masukkan Data Badges
INSERT INTO public.eco_badges (title, description, icon, req_points, req_scans) VALUES
('First Scan!', 'Melakukan scan sampah pertama', '🌱', 0, 1),
('Recycle Hero', 'Mencapai 100 Eco Points', '🦸', 100, 0),
('Active Saver', 'Melakukan 10 kali scan', '🔥', 0, 10),
('Eco Master', 'Mencapai 500 Eco Points', '🌍', 500, 0);
