// =============================================
//  SUPABASE RSVP CONFIG
//  Ganti nilai di bawah ini dengan project Anda
// =============================================
const SUPABASE_URL = 'https://mtaydlcfoyzzphepymqm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Gk4yBBG_lbLRv850zQD2Bg_p6SVqDHe';

// Inisialisasi Supabase client
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================================
//  KIRIM RSVP KE SUPABASE
// =============================================
async function kirimRSVP(event) {
    event.preventDefault();

    const btnKirim   = document.getElementById('btnKirimRSVP');
    const formRSVP   = document.getElementById('formRSVPCustom');
    const alertBox   = document.getElementById('rsvpAlert');

    // Ambil nilai form
    const nama        = document.getElementById('rsvpNama').value.trim();
    const noHp        = document.getElementById('rsvpHp').value.trim();
    const kehadiran   = document.querySelector('input[name="kehadiran"]:checked')?.value;
    const jumlahTamu  = parseInt(document.getElementById('rsvpJumlah').value) || 1;
    const ucapan      = document.getElementById('rsvpUcapan').value.trim();

    // Validasi dasar
    if (!nama) {
        tampilAlert('Nama tidak boleh kosong.', 'error');
        return;
    }
    if (!kehadiran) {
        tampilAlert('Pilih konfirmasi kehadiran terlebih dahulu.', 'error');
        return;
    }

    // Loading state
    btnKirim.disabled = true;
    btnKirim.innerHTML = '<span class="rsvp-spinner"></span> Mengirim...';

    try {
        const { error } = await _supabase
            .from('rsvp')
            .insert([{
                nama,
                no_hp       : noHp || null,
                kehadiran,
                jumlah_tamu : kehadiran === 'hadir' ? jumlahTamu : 0,
                ucapan      : ucapan || null
            }]);

        if (error) throw error;

        // Sukses
        tampilAlert('Terima kasih! RSVP Anda berhasil dikirim 🎉', 'success');
        formRSVP.reset();
        toggleJumlahTamu(); // reset tampilan jumlah tamu
        muat_ucapan();      // refresh daftar ucapan

    } catch (err) {
        console.error('Error kirim RSVP:', err);
        tampilAlert('Maaf, terjadi kesalahan. Silakan coba lagi.', 'error');
    } finally {
        btnKirim.disabled = false;
        btnKirim.innerHTML = 'Kirim RSVP 💌';
    }
}

// =============================================
//  TAMPILKAN / SEMBUNYIKAN JUMLAH TAMU
// =============================================
function toggleJumlahTamu() {
    const checked    = document.querySelector('input[name="kehadiran"]:checked');
    const wrapJumlah = document.getElementById('wrapJumlahTamu');
    if (!wrapJumlah) return;
    wrapJumlah.style.display = (checked && checked.value === 'hadir') ? 'block' : 'none';
}

// =============================================
//  ALERT HELPER
// =============================================
function tampilAlert(pesan, tipe) {
    const alertBox = document.getElementById('rsvpAlert');
    if (!alertBox) return;
    alertBox.textContent = pesan;
    alertBox.className   = 'rsvp-alert rsvp-alert-' + tipe;
    alertBox.style.display = 'block';
    setTimeout(() => { alertBox.style.display = 'none'; }, 5000);
}

// =============================================
//  MUAT UCAPAN DARI SUPABASE
// =============================================
async function muat_ucapan() {
    const container = document.getElementById('daftarUcapan');
    if (!container) return;

    container.innerHTML = '<p class="rsvp-loading">Memuat ucapan...</p>';

    try {
        const { data, error } = await _supabase
            .from('rsvp')
            .select('nama, ucapan, kehadiran, created_at')
            .not('ucapan', 'is', null)
            .neq('ucapan', '')
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="rsvp-empty">Belum ada ucapan. Jadilah yang pertama! 🌸</p>';
            return;
        }

        container.innerHTML = data.map(item => `
            <div class="ucapan-item">
                <div class="ucapan-header">
                    <span class="ucapan-nama">${escapeHtml(item.nama)}</span>
                    <span class="ucapan-badge ${item.kehadiran === 'hadir' ? 'badge-hadir' : 'badge-tidak'}">
                        ${item.kehadiran === 'hadir' ? '✓ Hadir' : '✗ Tidak Hadir'}
                    </span>
                </div>
                <p class="ucapan-teks">${escapeHtml(item.ucapan)}</p>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error muat ucapan:', err);
        container.innerHTML = '<p class="rsvp-empty">Gagal memuat ucapan.</p>';
    }
}

// =============================================
//  REALTIME — ucapan baru langsung muncul
// =============================================
function aktifkanRealtime() {
    _supabase
        .channel('rsvp-realtime')
        .on('postgres_changes', {
            event  : 'INSERT',
            schema : 'public',
            table  : 'rsvp'
        }, () => {
            muat_ucapan(); // refresh saat ada data baru
        })
        .subscribe();
}

// =============================================
//  HELPER: escape HTML untuk keamanan XSS
// =============================================
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// =============================================
//  INIT — jalankan saat DOM siap
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    muat_ucapan();
    aktifkanRealtime();

    // Pasang event listener toggle jumlah tamu
    document.querySelectorAll('input[name="kehadiran"]').forEach(el => {
        el.addEventListener('change', toggleJumlahTamu);
    });

    // Pasang submit handler
    const form = document.getElementById('formRSVPCustom');
    if (form) form.addEventListener('submit', kirimRSVP);
});
