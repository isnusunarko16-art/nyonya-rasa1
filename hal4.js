(function () {
const NR = window.NR, num = NR.num, pct = NR.pct, tg = NR.tg, br = NR.br, aktifOk = NR.aktifOk;
const SUM = {resep: 'Resep diubah', harga_jual: 'Harga jual diubah', pembelian: 'Harga bahan (pembelian)', pembalikan: 'Pembatalan',
  produksi: 'Produksi', harga_bahan: 'Harga bahan diubah'};
const ub = (k, v, c) => '<div class="ubin"><div class="k">' + k + '</div><div class="v ' + (c || '') + '">' + v + '</div></div>';
const kosong = '<p class="kecil">Belum ada data pada periode ini.</p>';

// ================= LAPORAN =================
function gerakTeks(x, nm) {
  const v = Object.keys(x).map(k => [k, x[k]]);
  const it = v.find(a => nm[a[1]]), q = v.find(a => /qty|jumlah|perubahan|delta/i.test(a[0]) && !isNaN(Number(a[1])) && a[1] !== '');
  const s = v.find(a => /sumber|jenis|tipe/i.test(a[0]) && a[1] && !nm[a[1]]);
  const n = q ? Number(q[1]) : 0;
  return br(esc(it ? nm[it[1]] : '-') + '<br><span class="kecil">' + tg(x.waktu) + (s ? ' · ' + esc(s[1]) : '') + '</span>',
    '<span class="' + (n < 0 ? 'neg' : 'pos') + '">' + (n > 0 ? '+' : '') + num(n) + '</span>');
}
function tampilLaporan(d, lama, usaha, nm) {
  const box = $('#lap'); if (!box) return;
  const P = d.penjualan, L = d.laba, H = d.hpp, X = d.pengeluaran, S = d.persediaan, R = d.produksi;
  const sec = (j, isi, buka) => '<details class="kartu acc"' + (buka ? ' open' : '') + '><summary>' + j + '</summary><div class="isi">' + isi + '</div></details>';
  const mat = a => '<div class="mat">' + a.join('') + '</div>';
  let h = (lama ? '<div class="kecil no-print" style="margin-bottom:8px">Memperbarui data…</div>' : '') +
    '<div class="cetak-only"><h2>' + esc(usaha) + '</h2><div>Laporan periode ' + tg(d.dari) + ' sampai ' + tg(d.sampai) + '</div></div>';
  h += sec('Ringkasan laba', mat([ub('Penjualan bersih', rp(L.penjualan_bersih)), ub('HPP penjualan', rp(L.hpp)), ub('Laba kotor', rp(L.laba_kotor), L.laba_kotor < 0 ? 'neg' : ''),
    ub('Pengeluaran operasional', rp(L.pengeluaran)), ub('Laba bersih operasional', rp(L.laba_bersih), L.laba_bersih < 0 ? 'neg' : ''),
    ub('Margin laba kotor', P.penjualan_bersih > 0 ? pct(L.margin_kotor) : '-'), ub('Margin laba bersih', P.penjualan_bersih > 0 ? pct(L.margin_bersih) : '-')]), true);
  h += sec('Penjualan', mat([ub('Jumlah transaksi', num(P.transaksi)), ub('Produk terjual', num(P.qty)), ub('Omzet kotor', rp(P.omzet_kotor)),
    ub('Total diskon', rp(P.diskon)), ub('Penjualan bersih', rp(P.penjualan_bersih))]) +
    '<b style="display:block;margin:6px 0 2px">Per produk</b>' + (P.per_produk.length ? P.per_produk.map(x => br(esc(x.nama) + '<br><span class="kecil">' + num(x.qty) + ' terjual · omzet ' + rp(x.omzet) + '</span>',
      rp(x.laba) + '<br><span class="kecil">margin ' + pct(x.margin) + '</span>')).join('') : kosong) +
    '<b style="display:block;margin:14px 0 2px">Per tanggal</b>' + (P.per_tanggal.length ? P.per_tanggal.map(x => br(tg(x.tanggal), rp(x.omzet))).join('') : kosong));
  h += sec('HPP', br('Total HPP barang terjual', rp(H.total), 1) +
    '<b style="display:block;margin:10px 0 2px">HPP per produk terjual</b>' + (H.per_produk.length ? H.per_produk.map(x => br(esc(x.nama) + '<br><span class="kecil">' + num(x.qty) + ' × ' + rp(x.hpp_per_unit) + '</span>', rp(x.hpp))).join('') : kosong) +
    '<b style="display:block;margin:14px 0 2px">HPP dan harga jual saat ini</b>' + (H.per_produk_master.length ? H.per_produk_master.map(x => br(esc(x.nama), 'HPP ' + rp(x.hpp_terbaru) + '<br><span class="kecil">jual ' + rp(x.harga_jual) + '</span>')).join('') : kosong) +
    '<b style="display:block;margin:14px 0 2px">Perubahan HPP pada periode</b>' + (H.perubahan.length ? H.perubahan.slice(-30).reverse().map(x => br(tg(x.waktu) + ' · ' + esc(x.produk) + '<br><span class="kecil">' + esc(SUM[x.sumber] || x.sumber) + '</span>', rp(x.hpp_unit))).join('') : kosong));
  h += sec('Pengeluaran', br('Total pengeluaran', rp(X.total), 1) +
    '<b style="display:block;margin:10px 0 2px">Per kategori</b>' + (X.per_kategori.length ? X.per_kategori.map(x => '<div style="padding:8px 0;border-top:1px solid var(--l)"><div style="display:flex;justify-content:space-between;font-size:14.5px"><span>' + esc(x.kategori) + '</span><span>' + rp(x.jumlah) + '</span></div><div class="bar"><b style="width:' + Math.max(2, x.jumlah / X.total * 100).toFixed(0) + '%"></b></div></div>').join('') : kosong) +
    '<b style="display:block;margin:14px 0 2px">Pengeluaran terbesar</b>' + (X.terbesar.length ? X.terbesar.map(x => br(esc(x.kategori) + '<br><span class="kecil">' + tg(x.tanggal) + (x.catatan ? ' · ' + esc(x.catatan) : '') + '</span>', rp(x.jumlah))).join('') : kosong) +
    '<b style="display:block;margin:14px 0 2px">Per tanggal</b>' + (X.per_tanggal.length ? X.per_tanggal.map(x => br(tg(x.tanggal), rp(x.jumlah))).join('') : kosong));
  const aktif = S.bahan.filter(b => b.aktif);
  h += sec('Persediaan', mat([ub('Nilai bahan baku', rp(S.nilai_bahan)), ub('Nilai produk jadi', rp(S.nilai_produk))]) +
    (S.hampir_habis.length ? '<div class="galat">' + S.hampir_habis.length + ' bahan hampir habis: ' + S.hampir_habis.map(b => esc(b.nama)).join(', ') + '</div>' : '') +
    '<b style="display:block;margin:12px 0 2px">Stok bahan baku</b>' + (aktif.length ? aktif.map(b => br(esc(b.nama) + (b.hampir_habis ? ' <span class="lencana">Hampir habis</span>' : '') + '<br><span class="kecil">nilai ' + rp(b.nilai) + '</span>', num(b.stok) + ' ' + esc(b.satuan))).join('') : kosong) +
    '<b style="display:block;margin:14px 0 2px">Stok produk jadi</b>' + (S.produk.length ? S.produk.map(x => br(esc(x.nama) + '<br><span class="kecil">nilai ' + rp(x.nilai) + '</span>', num(x.stok))).join('') : kosong) +
    '<b style="display:block;margin:14px 0 2px">Pergerakan stok pada periode</b>' + (S.gerak.length ? S.gerak.slice(0, 60).map(x => gerakTeks(x, nm)).join('') : kosong));
  h += sec('Produksi', mat([ub('Jumlah batch', num(R.jumlah_batch)), ub('Hasil produksi', num(R.jumlah_jadi)), ub('Total biaya produksi', rp(R.total_biaya)), ub('HPP aktual rata-rata', rp(R.hpp_rata2))]) +
    '<b style="display:block;margin:12px 0 2px">Komponen biaya</b>' + br('Bahan', rp(R.komponen.bahan)) + br('Kemasan', rp(R.komponen.kemasan)) + br('Tenaga kerja', rp(R.komponen.tenaga)) + br('Overhead', rp(R.komponen.overhead)) +
    '<b style="display:block;margin:14px 0 2px">Riwayat produksi</b>' + (R.riwayat.length ? R.riwayat.slice().reverse().map(x => br(esc(x.produk) + '<br><span class="kecil">' + tg(x.tanggal) + ' · ' + num(x.jumlah_jadi) + ' jadi · HPP ' + rp(x.hpp_unit) + '</span>', rp(x.total_biaya))).join('') : kosong));
  box.innerHTML = h;
}

async function unduh(nama, isi) {
  const blob = new Blob([isi], {type: 'text/csv;charset=utf-8'});
  try {
    const f = new File([blob], nama, {type: 'text/csv'});
    if (navigator.canShare && navigator.canShare({files: [f]})) { await navigator.share({files: [f], title: nama}); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const u = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = u; a.download = nama; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 5000);
}

HALAMAN.laporan = async function (el) {
  const p = window._lp || 'bulan';
  if (p === 'khusus') { window._ld = window._ld || NR.rentang('bulan').dari; window._ls = window._ls || NR.hariIni(); }
  const r = p === 'khusus' ? {dari: window._ld, sampai: window._ls} : NR.rentang(p);
  const a = await api('ambilAwal');
  const usaha = (a.pengaturan || {}).nama_usaha || 'NYONYA RASA', nm = {};
  a.bahan.forEach(b => nm[b.id] = b.nama); a.produk.forEach(x => nm[x.id] = x.nama);
  el.innerHTML = '<div class="no-print">' + NR.chips(p, [['hari', 'Hari'], ['minggu', 'Minggu'], ['bulan', 'Bulan'], ['tahun', 'Tahun'], ['khusus', 'Khusus']]) + '</div>' +
    (p === 'khusus' ? '<div class="kartu no-print" style="margin-top:10px"><div class="gabung"><div style="flex:1"><label style="margin-top:0">Dari</label><input type="date" id="ldr" value="' + window._ld + '"></div>' +
      '<div style="flex:1"><label style="margin-top:0">Sampai</label><input type="date" id="lsp" value="' + window._ls + '"></div></div><button class="tombol" id="ltr" type="button">Terapkan</button></div>' : '') +
    '<div class="kecil" style="margin:10px 2px">Periode ' + tg(r.dari) + ' – ' + tg(r.sampai) + '</div>' +
    '<div class="kartu no-print"><b>Unduh dan cetak</b><label style="margin-top:6px">Data yang diunduh</label><select id="ej">' +
    [['penjualan', 'Penjualan'], ['pembelian', 'Pembelian bahan'], ['produksi', 'Produksi'], ['pengeluaran', 'Pengeluaran'], ['stok', 'Pergerakan stok'], ['hpp', 'Riwayat HPP'], ['bahan', 'Daftar bahan baku'], ['produk', 'Daftar produk']].map(x => '<option value="' + x[0] + '">' + x[1] + '</option>').join('') + '</select>' +
    '<label>Pemisah kolom</label><select id="ep"><option value=";">Titik koma (Excel Indonesia)</option><option value=",">Koma (Google Sheets)</option></select>' +
    '<div class="gabung" style="margin-top:14px"><button class="tombol" id="eu" type="button" style="margin:0">Unduh CSV</button><button class="tombol sek" id="ec" type="button" style="margin:0">Cetak laporan</button></div></div>' +
    '<div id="lap"><div class="kartu kecil">Memuat laporan…</div></div>';
  el.querySelectorAll('.chip button').forEach(b => b.onclick = () => { window._lp = b.dataset.p; HALAMAN.laporan(el).catch(e => toast(e.message)); });
  const tr = $('#ltr');
  if (tr) tr.onclick = () => {
    const x = $('#ldr').value, y = $('#lsp').value;
    if (!x || !y) return toast('Isi tanggal awal dan akhir.');
    if (x > y) return toast('Tanggal awal tidak boleh setelah tanggal akhir.');
    window._ld = x; window._ls = y; HALAMAN.laporan(el).catch(e => toast(e.message));
  };
  $('#ec').onclick = () => window.print();
  $('#eu').onclick = async () => {
    const btn = $('#eu'); btn.disabled = true;
    try {
      const f = await api('ekspor', {jenis: $('#ej').value, dari: r.dari, sampai: r.sampai, pemisah: $('#ep').value});
      await unduh(f.nama_file, f.isi);
      toast('File ' + f.nama_file + ' siap');
    } catch (e) { toast(e.message); }
    btn.disabled = false;
  };
  await NR.muat('lap_' + p + r.dari + r.sampai, () => api('laporan', {periode: p, dari: r.dari, sampai: r.sampai}), (d, lama) => tampilLaporan(d, lama, usaha, nm));
};

// ================= SUPPLIER & KATEGORI =================
HALAMAN.supplier = async function (el) {
  const a = await api('ambilAwal');
  const kp = a.kategori.filter(k => k.jenis === 'produk'), kx = a.kategori.filter(k => k.jenis === 'pengeluaran');
  const blok = (judul, tipe, L) => '<div class="kartu" data-tipe="' + tipe + '"><h2>' + judul + '</h2>' +
    (L.length ? L.map(x => '<div class="item" data-id="' + x.id + '"><div class="pg" style="cursor:pointer"><div style="flex:1;min-width:0"><div class="n">' + esc(x.nama) + (aktifOk(x) ? '' : ' <span class="tag">nonaktif</span>') + '</div>' +
      (tipe === 'sup' && x.kontak ? '<div class="s">' + esc(x.kontak) + '</div>' : '') + '</div><span class="kecil">Ubah</span></div>' +
      '<div class="ed" hidden style="padding-bottom:12px"><label style="margin-top:0">Nama</label><input class="en" value="' + esc(x.nama) + '">' +
      (tipe === 'sup' ? '<label>Kontak</label><input class="ek" value="' + esc(x.kontak || '') + '"><label>Catatan</label><input class="ec" value="' + esc(x.catatan || '') + '">' : '') +
      '<label style="display:flex;gap:10px;align-items:center"><input type="checkbox" class="ea"' + (aktifOk(x) ? ' checked' : '') + '> Aktif</label>' +
      '<button class="tombol" data-a="simpan" type="button" style="margin-top:12px">Simpan perubahan</button></div></div>').join('') : '<p class="kecil">Belum ada data.</p>') +
    '<div style="border-top:1px solid var(--l);margin-top:8px"><label>Tambah baru</label><div class="gabung"><input class="nb" placeholder="Nama"><button class="tombol" data-a="tambah" type="button" style="width:auto;margin:0;padding:0 20px">Tambah</button></div></div></div>';
  el.innerHTML = '<div id="msup">' + blok('Supplier', 'sup', a.supplier) + blok('Kategori produk', 'kp', kp) + blok('Kategori pengeluaran', 'kx', kx) + '</div>';
  const simpan = (tipe, d) => tipe === 'sup' ? api('simpanSupplier', d) : api('simpanKategori', Object.assign({jenis: tipe === 'kp' ? 'produk' : 'pengeluaran'}, d));
  $('#msup').onclick = async e => {
    const b = e.target.closest('button[data-a]'), pg = e.target.closest('.pg');
    if (pg && !b) { const ed = pg.parentNode.querySelector('.ed'); ed.hidden = !ed.hidden; return; }
    if (!b) return;
    const bl = b.closest('[data-tipe]'), tipe = bl.dataset.tipe;
    b.disabled = true;
    try {
      if (b.dataset.a === 'tambah') await simpan(tipe, {nama: bl.querySelector('.nb').value});
      else {
        const it = b.closest('.item'), d = {id: it.dataset.id, nama: it.querySelector('.en').value, aktif: it.querySelector('.ea').checked};
        if (tipe === 'sup') { d.kontak = it.querySelector('.ek').value; d.catatan = it.querySelector('.ec').value; }
        await simpan(tipe, d);
      }
      toast('Tersimpan');
      HALAMAN.supplier(el).catch(x => toast(x.message));
    } catch (x) { toast(x.message); b.disabled = false; }
  };
};

// ================= PENGATURAN & BACKUP =================
HALAMAN.pengaturan = async function (el) {
  const a = await api('ambilAwal'), p = a.pengaturan || {};
  el.innerHTML = '<div class="kartu"><h2>Usaha</h2><label style="margin-top:0">Nama usaha</label><input id="pu" value="' + esc(p.nama_usaha || '') + '">' +
    '<label>Biaya transaksi awal (%)</label><input id="pb" type="number" inputmode="decimal" value="' + esc(p.biaya_transaksi_persen || '') + '">' +
    '<div class="kecil" style="margin-top:4px">Terisi otomatis di kalkulator harga jual. Contoh QRIS 0,7.</div>' +
    '<button class="tombol" id="ps" type="button">Simpan</button></div>' +
    '<div class="kartu"><h2>Ganti PIN</h2><label style="margin-top:0">PIN lama</label><input id="p1" type="password" inputmode="numeric">' +
    '<label>PIN baru (6 sampai 10 angka)</label><input id="p2" type="password" inputmode="numeric"><label>Ulangi PIN baru</label><input id="p3" type="password" inputmode="numeric">' +
    '<button class="tombol sek" id="pg" type="button">Ganti PIN</button></div>' +
    '<div class="kartu"><h2>Backup data</h2><p class="kecil" style="margin:0">Backup menyalin seluruh spreadsheet ke folder “NYONYA RASA - Backup” di Google Drive Anda. Salinan lama otomatis dirapikan, 30 yang terbaru disimpan.</p>' +
    '<button class="tombol" id="bk" type="button">Buat backup sekarang</button><div id="bko" style="margin-top:12px"></div></div>' +
    '<div class="kartu"><h2>Data Anda</h2><p class="kecil" style="margin:0">Semua data tersimpan di Google Sheets milik akun Google Anda dan bisa dibuka kapan saja lewat Google Drive. Untuk unduhan Excel atau CSV, buka halaman Laporan.</p>' +
    '<button class="tombol sek" id="kl" type="button">Buka Laporan</button></div>' +
    '<div class="kartu"><h2>Akun</h2><div class="baris" style="border-top:0"><span>Masuk sebagai</span><b>' + esc(localStorage.getItem(K.usr) || '') + '</b></div>' +
    '<button class="tombol sek" id="cc" type="button">Segarkan data aplikasi</button><button class="tombol bhy" id="kx" type="button">Keluar</button></div>';
  $('#ps').onclick = async () => {
    try {
      await api('simpanPengaturan', {kunci: 'nama_usaha', nilai: $('#pu').value});
      if ($('#pb').value !== '') await api('simpanPengaturan', {kunci: 'biaya_transaksi_persen', nilai: $('#pb').value});
      toast('Pengaturan tersimpan');
    } catch (e) { toast(e.message); }
  };
  $('#pg').onclick = async () => {
    try {
      if (!$('#p1').value || !$('#p2').value) throw new Error('Isi PIN lama dan PIN baru.');
      if ($('#p2').value !== $('#p3').value) throw new Error('PIN baru dan ulangannya tidak sama.');
      await api('gantiPin', {pin_lama: $('#p1').value, pin_baru: $('#p2').value});
      ['p1', 'p2', 'p3'].forEach(i => $('#' + i).value = '');
      toast('PIN berhasil diganti');
    } catch (e) { toast(e.message); }
  };
  $('#bk').onclick = async () => {
    const b = $('#bk'); b.disabled = true; b.textContent = 'Membuat backup…';
    try {
      const r = await api('backup');
      $('#bko').innerHTML = NR.notif('Backup selesai', esc(r.nama) + '<br><a href="' + esc(r.url) + '" target="_blank" rel="noopener" style="color:var(--m);font-weight:600">Buka salinan di Drive</a>');
    } catch (e) { toast(e.message); }
    b.disabled = false; b.textContent = 'Buat backup sekarang';
  };
  $('#kl').onclick = () => buka('laporan');
  $('#cc').onclick = () => {
    Object.keys(localStorage).filter(k => k.indexOf('nr_c_') === 0).forEach(k => localStorage.removeItem(k));
    location.reload();
  };
  $('#kx').onclick = () => keluar(false);
};

// ================= MENU, DEFAULT BIAYA TRANSAKSI, START =================
const MENU6 = [['bahan', 'Bahan Baku'], ['pembelian', 'Pembelian Bahan'], ['produksi', 'Produksi'], ['pengeluaran', 'Pengeluaran'],
  ['aruskas', 'Arus Kas'], ['supplier', 'Supplier & Kategori'], ['pengaturan', 'Pengaturan & Backup']];
$('#daftarMenu').innerHTML = MENU6.map(m => '<button data-h="' + m[0] + '">' + m[1] + '</button>').join('') + '<button class="keluar" id="btnKeluar">Keluar</button>';

const hppAsli = HALAMAN.hpp;
if (hppAsli) HALAMAN.hpp = async function (el) {
  await hppAsli(el);
  try {
    const a = await api('ambilAwal'), v = (a.pengaturan || {}).biaya_transaksi_persen, f = $('#bt');
    if (v && f && !f.value) f.value = v;
  } catch (e) {}
};

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
if (!$('#aplikasi').hidden) buka(location.hash.slice(1) || 'dashboard');
})();
// AKHIR FILE hal4.js
