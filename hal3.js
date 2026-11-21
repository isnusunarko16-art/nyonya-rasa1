(function () {
const NR = window.NR = {};
const FAK = {g: 1, kg: 1000, ml: 1, l: 1000, pcs: 1};
const DAS = {g: 'g', kg: 'g', ml: 'ml', l: 'ml', pcs: 'pcs'};
const SATB = {g: ['g', 'kg'], ml: ['ml', 'l'], pcs: ['pcs']};
const NAT = {g: 'kg', ml: 'l', pcs: 'pcs'};
const z2 = n => String(n).padStart(2, '0');
const fmt = t => t.getFullYear() + '-' + z2(t.getMonth() + 1) + '-' + z2(t.getDate());
const hariIni = NR.hariIni = () => fmt(new Date());
const num = NR.num = n => Number(n || 0).toLocaleString('id-ID', {maximumFractionDigits: 2});
NR.pct = n => n == null || !isFinite(n) ? '-' : (Math.round(n * 10) / 10).toLocaleString('id-ID') + '%';
const tg = NR.tg = s => String(s).slice(8, 10) + '/' + String(s).slice(5, 7) + '/' + String(s).slice(0, 4);
const aktifOk = NR.aktifOk = x => String(x.aktif).toUpperCase() !== 'FALSE';
const br = NR.br = (a, b, k) => '<div class="baris' + (k ? ' tebal' : '') + '"><span>' + a + '</span><span class="kn">' + b + '</span></div>';
const rentang = NR.rentang = (p, dari, sampai) => {
  const t = new Date(), h = fmt(t);
  if (p === 'khusus') return {dari: dari, sampai: sampai};
  if (p === 'hari') return {dari: h, sampai: h};
  if (p === 'minggu') { const s = new Date(t); s.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return {dari: fmt(s), sampai: h}; }
  if (p === 'tahun') return {dari: t.getFullYear() + '-01-01', sampai: h};
  return {dari: h.slice(0, 8) + '01', sampai: h};
};
NR.pesan = e => /Aksi tidak dikenal/.test(String(e.message)) ?
  'Backend belum diperbarui. Pasang Tambahan.gs, tambahkan baris di Api.gs, lalu terapkan versi baru.' : e.message;
NR.chips = (p, L) => '<div class="chip">' + L.map(x => '<button data-p="' + x[0] + '" class="' + (x[0] === p ? 'on' : '') + '">' + x[1] + '</button>').join('') + '</div>';
NR.notif = (j, t) => '<div class="kartu notif"><div class="n1">✓ ' + j + '</div><div class="kecil">' + t + '</div></div>';
NR.rw = (judul, sub, nominal, x, tipe) => {
  const bat = x.status === 'batal';
  return '<div style="padding:10px 0;border-top:1px solid var(--l);' + (bat ? 'opacity:.55' : '') + '"><div style="display:flex;justify-content:space-between;gap:10px">' +
    '<span style="min-width:0"><b>' + judul + '</b><br><span class="kecil">' + sub + '</span></span><span style="text-align:right;flex:0 0 auto">' + nominal +
    (bat ? '<br><span class="tag">dibatalkan</span>' : '<br><button class="btnk" data-batal="' + x.id + '" data-jenis="' + tipe + '">Batalkan</button>') + '</span></div></div>';
};
NR.batal = async (jenis, id, ulang) => {
  const alasan = prompt('Alasan pembatalan:');
  if (!alasan || !alasan.trim()) return;
  try { await api('batalkan', {jenis: jenis, id: id, alasan: alasan.trim()}); toast('Dibatalkan'); ulang(); }
  catch (e) { toast(e.message); }
};
NR.muat = async (kunci, ambil, tampil) => {
  let ada = false;
  try { const s = localStorage.getItem('nr_c_' + kunci); if (s) { tampil(JSON.parse(s), true); ada = true; } } catch (e) {}
  try {
    const d = await ambil();
    try { localStorage.setItem('nr_c_' + kunci, JSON.stringify(d)); } catch (e) {}
    tampil(d, false);
  } catch (e) { if (!ada) throw e; toast('Gagal memperbarui: ' + NR.pesan(e)); }
};

// ================= BAHAN BAKU =================
const stokTeks = (s, d) => { s = Number(s) || 0; return num(s) + ' ' + d + ((d !== 'pcs' && Math.abs(s) >= 1000) ? ' (' + num(s / 1000) + ' ' + NAT[d] + ')' : ''); };
const hargaTeks = (h, d) => 'Rp ' + num(Number(h || 0) * FAK[NAT[d]]) + ' / ' + NAT[d];

function formBahan(box, b, ulang) {
  const baru = !b;
  const d0 = b ? b.satuan_dasar : 'g';
  const opsi = (L, pilih) => L.map(u => '<option' + (u === pilih ? ' selected' : '') + '>' + u + '</option>').join('');
  box.innerHTML = '<div class="kartu" id="fbk"><h2>' + (baru ? 'Bahan baru' : 'Ubah bahan') + '</h2>' +
    '<label>Nama bahan</label><input id="fn" value="' + esc(b ? b.nama : '') + '">' +
    (baru ? '' : '<label>Satuan dasar</label><select id="fd">' + opsi(['g', 'ml', 'pcs'], d0) + '</select>' +
      '<div class="kecil" style="margin-top:4px">Hanya bisa diganti jika bahan belum dipakai di resep atau pembelian.</div>') +
    '<label>Satuan untuk isian di bawah</label><select id="fu">' + opsi(baru ? ['g', 'kg', 'ml', 'l', 'pcs'] : SATB[d0], baru ? 'kg' : NAT[d0]) + '</select>' +
    '<label>' + (baru ? 'Harga beli per satuan (Rp)' : 'Harga per satuan (Rp)') + '</label><input id="fh" type="number" inputmode="decimal">' +
    (baru ? '' : '<div class="kecil" style="margin-top:4px">Mengganti harga ini menggantikan harga rata-rata dan menghitung ulang HPP produk. Pembelian berikutnya dirata-rata lagi.</div>') +
    '<label>Stok minimum</label><input id="fm" type="number" inputmode="decimal">' +
    '<label>' + (baru ? 'Stok awal (boleh kosong)' : 'Koreksi stok: isi stok sebenarnya') + '</label><input id="fk" type="number" inputmode="decimal">' +
    (baru ? '' : '<div class="kecil" style="margin-top:4px">Stok sekarang ' + stokTeks(b.stok, b.satuan_dasar) + '. Kosongkan jika tidak ada koreksi.</div>' +
      '<label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="fa"' + (aktifOk(b) ? ' checked' : '') + '> Bahan aktif</label>') +
    '<button class="tombol" id="fs" type="button">Simpan</button><button class="tautan" id="fx" type="button" style="width:100%">Tutup</button></div>';
  let awalH = '';
  const isi = () => {
    if (baru) return;
    const f = FAK[$('#fu').value] || 1;
    awalH = Number(b.harga_rata2) > 0 ? String(Math.round(Number(b.harga_rata2) * f * 100) / 100) : '';
    $('#fh').value = awalH;
    $('#fm').value = String(Math.round((Number(b.stok_min) || 0) / f * 10000) / 10000);
    $('#fk').value = '';
  };
  isi();
  if (!baru) $('#fd').onchange = e => {
    const d = e.target.value;
    $('#fu').innerHTML = opsi(SATB[d], NAT[d]);
    $('#fh').value = ''; $('#fm').value = ''; $('#fk').value = '';
  };
  if (!baru) $('#fu').onchange = isi;
  $('#fx').onclick = () => { box.innerHTML = ''; };
  $('#fs').onclick = async () => {
    const btn = $('#fs'); btn.disabled = true;
    try {
      const u = $('#fu').value, mn = (Number($('#fm').value) || 0) * FAK[u];
      if (baru) {
        const data = {nama: $('#fn').value, satuan_dasar: DAS[u], satuan_input: u, satuan_harga: u, stok_min: mn};
        if ($('#fk').value !== '') data.stok_awal = $('#fk').value;
        if ($('#fh').value !== '') data.harga_beli = $('#fh').value;
        await api('simpanBahan', data);
      } else {
        const data = {id: b.id, nama: $('#fn').value, satuan_dasar: $('#fd').value, satuan_harga: u, satuan_stok: u, stok_min: mn, aktif: $('#fa').checked};
        const ganti = data.satuan_dasar !== b.satuan_dasar;
        if ($('#fh').value !== '' && (ganti || $('#fh').value !== awalH)) data.harga = $('#fh').value;
        if ($('#fk').value !== '') data.stok_baru = $('#fk').value;
        await api('simpanUbahBahan', data);
      }
      toast('Bahan tersimpan');
      ulang();
      return;
    } catch (e) { toast(NR.pesan(e)); }
    btn.disabled = false;
  };
  box.scrollIntoView({behavior: 'smooth', block: 'start'});
}

HALAMAN.bahan = async function (el) {
  const a = await api('ambilAwal');
  const L = a.bahan.slice().sort((x, y) => String(x.nama).localeCompare(String(y.nama)));
  el.innerHTML = '<input id="bq" type="search" placeholder="Cari bahan…" value="' + esc(window._bq || '') + '">' +
    '<div class="kartu" id="bl" style="margin-top:12px;padding-top:4px;padding-bottom:4px"></div>' +
    '<button class="tombol" id="bn" type="button">+ Bahan baru</button><div id="bf" style="margin-top:14px"></div>';
  const ulang = () => HALAMAN.bahan(el).catch(e => toast(NR.pesan(e)));
  const gambar = () => {
    window._bq = $('#bq').value;
    const t = window._bq.trim().toLowerCase();
    const R = L.filter(b => String(b.nama).toLowerCase().indexOf(t) >= 0);
    $('#bl').innerHTML = R.length ? R.map(b => {
      const st = Number(b.stok) || 0, min = Number(b.stok_min) || 0, rendah = aktifOk(b) && st <= min;
      return '<div class="pg" data-id="' + b.id + '"><div style="flex:1;min-width:0"><div class="n">' + esc(b.nama) +
        (aktifOk(b) ? '' : ' <span class="tag">nonaktif</span>') + (rendah ? ' <span class="lencana">Hampir habis</span>' : '') + '</div>' +
        '<div class="s">' + (Number(b.harga_rata2) > 0 ? hargaTeks(b.harga_rata2, b.satuan_dasar) : 'Harga belum ada') + '</div></div>' +
        '<div style="text-align:right;font-weight:700;color:var(--m)">' + stokTeks(st, b.satuan_dasar) + '</div></div>';
    }).join('') : '<p class="kecil" style="padding:12px 0">' + (L.length ? 'Tidak ada bahan yang cocok.' : 'Belum ada bahan. Ketuk tombol di bawah untuk menambah.') + '</p>';
  };
  gambar();
  $('#bq').oninput = gambar;
  $('#bl').onclick = e => { const r = e.target.closest('.pg'); if (r) formBahan($('#bf'), L.find(x => x.id === r.dataset.id), ulang); };
  $('#bn').onclick = () => formBahan($('#bf'), null, ulang);
};

// ================= TRANSAKSI =================
const TAB = [['kasir', 'Kasir'], ['keluar', 'Pengeluaran'], ['kas', 'Arus kas'], ['riwayat', 'Riwayat']];
const JDL = {kasir: 'Kasir', keluar: 'Pengeluaran', kas: 'Arus Kas', riwayat: 'Riwayat Penjualan'};
JUDUL.aruskas = 'Arus Kas';

async function hub(el, t) {
  window._tt = t;
  $('#judul').textContent = JDL[t];
  el.innerHTML = '<div class="seg" id="seg">' + TAB.map(x => '<button data-t="' + x[0] + '" class="' + (x[0] === t ? 'on' : '') + '">' + x[1] + '</button>').join('') + '</div><div id="tabIsi"></div>';
  $('#seg').onclick = e => { const b = e.target.closest('button'); if (b && b.dataset.t !== t) hub(el, b.dataset.t).catch(x => toast(NR.pesan(x))); };
  await ({kasir: kasir, keluar: keluar, kas: kas, riwayat: riwayat}[t])($('#tabIsi'));
}
HALAMAN.transaksi = el => hub(el, window._tt || 'kasir');
HALAMAN.pengeluaran = el => hub(el, 'keluar');
HALAMAN.aruskas = el => hub(el, 'kas');

// ---- Kasir ----
async function kasir(el, pesan) {
  const a = await api('ambilAwal');
  const P = a.produk.filter(aktifOk).sort((x, y) => String(x.nama).localeCompare(String(y.nama)));
  const cart = window._cart = window._cart || {}, pm = {};
  P.forEach(p => pm[p.id] = p);
  Object.keys(cart).forEach(i => { if (!pm[i]) delete cart[i]; });
  if (!P.length) { el.innerHTML = (pesan || '') + '<div class="kartu">Belum ada produk. Buat produk dan resepnya di tab HPP, lalu catat produksinya.</div>'; return; }
  let mode = window._km || 'tunai';
  el.innerHTML = (pesan || '') + '<input id="kq" type="search" placeholder="Cari produk…">' +
    '<div class="kartu" id="kl" style="margin-top:12px;padding-top:4px;padding-bottom:4px"></div>' +
    '<div class="kartu"><h2>Keranjang</h2><div id="kc"></div>' +
    '<label>Tanggal</label><input id="kt" type="date" value="' + hariIni() + '">' +
    '<label>Diskon</label><div class="gabung"><input id="kd" type="number" inputmode="decimal" placeholder="0"><select id="kdm"><option value="rp">Rp</option><option value="pct">%</option></select></div>' +
    '<label>Metode pembayaran</label><div class="seg" id="km" style="margin-bottom:0">' +
    [['tunai', 'Tunai'], ['transfer', 'Transfer'], ['qris', 'QRIS']].map(x => '<button type="button" data-m="' + x[0] + '" class="' + (x[0] === mode ? 'on' : '') + '">' + x[1] + '</button>').join('') + '</div>' +
    '<div id="ktn"><label>Uang diterima (Rp)</label><input id="kdt" type="number" inputmode="decimal" placeholder="Kosongkan jika uang pas"><div class="chip" id="kqk" style="margin-top:8px"></div></div>' +
    '<div id="kts" style="margin-top:12px"></div><button class="tombol" id="ks" type="button">Simpan transaksi</button></div>';
  const sub = () => Object.keys(cart).reduce((s, i) => s + (Number(pm[i].harga_jual) || 0) * cart[i], 0);
  function gambarList() {
    const t = $('#kq').value.trim().toLowerCase();
    const R = P.filter(p => String(p.nama).toLowerCase().indexOf(t) >= 0);
    $('#kl').innerHTML = R.length ? R.map(p => {
      const hab = Number(p.stok) <= 0;
      return '<div class="pg" data-id="' + p.id + '" style="' + (hab ? 'opacity:.5' : '') + '"><div style="flex:1;min-width:0"><div class="n">' + esc(p.nama) + (cart[p.id] ? ' <span class="lencana" style="background:#E6F0EA;color:var(--ok)">×' + cart[p.id] + '</span>' : '') + '</div>' +
        '<div class="s">' + (hab ? 'Stok habis' : 'Stok ' + num(p.stok)) + '</div></div><div style="font-weight:700;color:var(--m)">' + rp(p.harga_jual) + '</div></div>';
    }).join('') : '<p class="kecil" style="padding:12px 0">Produk tidak ditemukan.</p>';
  }
  function hitung() {
    const s = sub(), v = Number($('#kd').value) || 0;
    const dis = $('#kdm').value === 'pct' ? Math.round(s * v / 100) : v;
    const total = Math.max(0, s - dis), dt = $('#kdt').value, terima = dt === '' ? total : Number(dt);
    let err = '';
    if (!Object.keys(cart).length) err = 'Keranjang masih kosong.';
    else if (dis > s) err = 'Diskon tidak boleh melebihi subtotal.';
    else if (mode === 'tunai' && terima + 1e-9 < total) err = 'Uang diterima kurang dari total.';
    else { const k = Object.keys(cart).find(i => cart[i] > Number(pm[i].stok) + 1e-9); if (k) err = 'Stok ' + pm[k].nama + ' tidak cukup (tersisa ' + num(pm[k].stok) + ').'; }
    $('#kts').innerHTML = br('Subtotal', rp(s)) + br('Diskon', '-' + rp(dis)) + br('Total bayar', rp(total), 1) +
      (mode === 'tunai' ? br('Kembalian', rp(Math.max(0, terima - total))) : '') + (err ? '<div class="galat">' + err + '</div>' : '');
    $('#ktn').hidden = mode !== 'tunai';
    const q = [total].concat([20000, 50000, 100000, 200000].filter(x => x > total)).slice(0, 4);
    $('#kqk').innerHTML = total > 0 ? q.map((x, i) => '<button type="button" data-v="' + x + '">' + (i === 0 ? 'Uang pas' : rp(x)) + '</button>').join('') : '';
    return {dis: dis, err: err};
  }
  function gambarCart() {
    const ids = Object.keys(cart);
    $('#kc').innerHTML = ids.length ? ids.map(i => '<div class="cl" data-id="' + i + '"><div style="min-width:0"><div class="n">' + esc(pm[i].nama) + '</div><div class="kecil">' + rp(pm[i].harga_jual) + ' · stok ' + num(pm[i].stok) + '</div></div>' +
      '<div class="qc"><button type="button" data-a="-">−</button><input type="number" inputmode="decimal" value="' + cart[i] + '"><button type="button" data-a="+">+</button></div></div>').join('') :
      '<p class="kecil">Ketuk produk di atas untuk menambahkan.</p>';
    hitung();
  }
  const segar = () => { gambarList(); gambarCart(); };
  segar();
  $('#kq').oninput = gambarList;
  $('#kl').onclick = e => {
    const r = e.target.closest('[data-id]'); if (!r) return;
    const id = r.dataset.id;
    if (Number(pm[id].stok) <= 0) return toast('Stok ' + pm[id].nama + ' habis. Catat produksi dulu.');
    cart[id] = (cart[id] || 0) + 1; segar();
  };
  $('#kc').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const id = b.closest('[data-id]').dataset.id;
    cart[id] = (cart[id] || 0) + (b.dataset.a === '+' ? 1 : -1);
    if (cart[id] <= 0) delete cart[id];
    segar();
  };
  $('#kc').onchange = e => {
    if (e.target.tagName !== 'INPUT') return;
    const id = e.target.closest('[data-id]').dataset.id, v = Number(e.target.value);
    if (v > 0) cart[id] = v; else delete cart[id];
    segar();
  };
  $('#kd').oninput = hitung; $('#kdm').onchange = hitung; $('#kdt').oninput = hitung;
  $('#kqk').onclick = e => { const b = e.target.closest('button'); if (b) { $('#kdt').value = b.dataset.v; hitung(); } };
  $('#km').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    mode = window._km = b.dataset.m;
    $('#km').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    hitung();
  };
  $('#ks').onclick = async () => {
    const h = hitung(); if (h.err) return toast(h.err);
    const btn = $('#ks'); btn.disabled = true;
    try {
      const data = {tanggal: $('#kt').value, items: Object.keys(cart).map(id => ({produk_id: id, qty: cart[id]})), diskon: h.dis, metode: mode};
      if (mode === 'tunai' && $('#kdt').value !== '') data.diterima = $('#kdt').value;
      const r = await api('simpanPenjualan', data);
      window._cart = {};
      toast('Transaksi tersimpan');
      await kasir(el, NR.notif('Transaksi tersimpan', 'Total ' + rp(r.total) + (mode === 'tunai' ? ' · kembalian ' + rp(r.kembalian) : '') + ' · laba kotor ' + rp(r.laba_kotor) + ' · nomor ' + esc(r.id)));
      window.scrollTo(0, 0);
      return;
    } catch (e) { toast(NR.pesan(e)); }
    btn.disabled = false;
  };
}

// ---- Pengeluaran ----
async function keluar(el, pesan) {
  const a = await api('ambilAwal');
  const K = a.kategori.filter(k => k.jenis === 'pengeluaran' && aktifOk(k)), nk = {};
  a.kategori.forEach(k => nk[k.id] = k.nama);
  el.innerHTML = (pesan || '') + '<div class="kartu"><h2>Catat pengeluaran</h2>' +
    '<label>Tanggal</label><input id="et" type="date" value="' + hariIni() + '">' +
    '<label>Kategori</label><select id="ek">' + K.map(k => '<option value="' + k.id + '">' + esc(k.nama) + '</option>').join('') +
    '<option value="_baru"' + (K.length ? '' : ' selected') + '>+ Kategori baru…</option></select>' +
    '<input id="ekn" placeholder="Nama kategori baru" style="margin-top:8px"' + (K.length ? ' hidden' : '') + '>' +
    '<label>Jumlah (Rp)</label><input id="ej" type="number" inputmode="decimal">' +
    '<label>Catatan (boleh kosong)</label><input id="ec">' +
    '<div class="kecil" style="margin-top:12px">Pembelian bahan baku dicatat di menu Pembelian Bahan, bukan di sini. Biaya yang sudah Anda masukkan ke HPP, seperti kemasan, tenaga, dan gas produksi, jangan dicatat lagi supaya tidak terhitung dua kali.</div>' +
    '<button class="tombol" id="es" type="button">Simpan pengeluaran</button></div>' +
    '<div class="kartu"><b>Pengeluaran terakhir</b><div id="er"><p class="kecil">Memuat…</p></div></div>';
  const ulang = () => keluar(el).catch(e => toast(NR.pesan(e)));
  $('#ek').onchange = e => { $('#ekn').hidden = e.target.value !== '_baru'; };
  $('#es').onclick = async () => {
    const btn = $('#es'); btn.disabled = true;
    try {
      let kat = $('#ek').value;
      if (kat === '_baru') {
        const nm = $('#ekn').value.trim();
        if (!nm) throw new Error('Isi nama kategori baru.');
        kat = (await api('simpanKategori', {jenis: 'pengeluaran', nama: nm})).id;
      }
      const jml = $('#ej').value;
      await api('simpanPengeluaran', {tanggal: $('#et').value, kategori_id: kat, jumlah: jml, catatan: $('#ec').value});
      toast('Pengeluaran tersimpan');
      await keluar(el, NR.notif('Pengeluaran tersimpan', rp(jml) + ' sudah masuk ke arus kas dan laporan.'));
      window.scrollTo(0, 0);
      return;
    } catch (e) { toast(NR.pesan(e)); }
    btn.disabled = false;
  };
  api('daftarTransaksi', {jenis: 'pengeluaran', limit: 25}).then(L => {
    const k = $('#er'); if (!k) return;
    k.innerHTML = L.length ? L.map(x => NR.rw(esc(nk[x.kategori_id] || 'Pengeluaran'), tg(x.tanggal) + (x.catatan ? ' · ' + esc(x.catatan) : ''), rp(x.jumlah), x, 'pengeluaran')).join('') : '<p class="kecil">Belum ada pengeluaran.</p>';
    k.onclick = e => { const b = e.target.closest('[data-batal]'); if (b) NR.batal(b.dataset.jenis, b.dataset.batal, ulang); };
  }).catch(e => { const k = $('#er'); if (k) k.innerHTML = '<p class="kecil">' + esc(e.message) + '</p>'; });
}

// ---- Arus kas ----
async function kas(el) {
  const p = window._kp || 'bulan';
  if (p === 'khusus') { window._kd = window._kd || rentang('bulan').dari; window._ks = window._ks || hariIni(); }
  const r = p === 'khusus' ? {dari: window._kd, sampai: window._ks} : rentang(p);
  el.innerHTML = NR.chips(p, [['hari', 'Hari'], ['minggu', 'Minggu'], ['bulan', 'Bulan'], ['tahun', 'Tahun'], ['khusus', 'Khusus']]) +
    (p === 'khusus' ? '<div class="kartu" style="margin-top:10px"><div class="gabung"><div style="flex:1"><label style="margin-top:0">Dari</label><input type="date" id="kdr" value="' + window._kd + '"></div>' +
      '<div style="flex:1"><label style="margin-top:0">Sampai</label><input type="date" id="ksp" value="' + window._ks + '"></div></div><button class="tombol" id="ktr" type="button">Terapkan</button></div>' : '') +
    '<div id="kk" style="margin-top:12px"></div>';
  el.querySelectorAll('.chip button').forEach(b => b.onclick = () => { window._kp = b.dataset.p; kas(el).catch(e => toast(NR.pesan(e))); });
  const trp = $('#ktr');
  if (trp) trp.onclick = () => {
    const x = $('#kdr').value, y = $('#ksp').value;
    if (!x || !y) return toast('Isi tanggal awal dan akhir.');
    if (x > y) return toast('Tanggal awal tidak boleh setelah tanggal akhir.');
    window._kd = x; window._ks = y; kas(el).catch(e => toast(NR.pesan(e)));
  };
  await NR.muat('kas_' + p + r.dari + r.sampai, () => api('arusKas', r), (d, lama) => {
    const box = $('#kk'); if (!box) return;
    const ub = (k, v, c) => '<div class="ubin"><div class="k">' + k + '</div><div class="v ' + (c || '') + '">' + v + '</div></div>';
    let h = (lama ? '<div class="kecil" style="margin-bottom:8px">Memperbarui data…</div>' : '') +
      '<div class="mat"><div class="ubin lebar"><div class="k">Saldo kas saat ini</div><div class="v">' + rp(d.saldo_sekarang) + '</div></div>' +
      ub('Uang masuk', rp(d.masuk), 'pos') + ub('Uang keluar', rp(d.keluar), 'neg') +
      ub('Saldo awal periode', rp(d.pembuka)) + ub('Saldo akhir periode', rp(d.saldo_akhir), d.saldo_akhir < 0 ? 'neg' : '') + '</div>';
    h += '<div class="kartu"><b>Rincian periode ' + tg(d.dari) + ' – ' + tg(d.sampai) + '</b>' +
      br('Penjualan tunai', rp(d.per_metode.tunai)) + br('Penjualan transfer', rp(d.per_metode.transfer)) + br('Penjualan QRIS', rp(d.per_metode.qris)) +
      br('Pembelian bahan', '-' + rp(d.per_jenis.pembelian)) + br('Pengeluaran operasional', '-' + rp(d.per_jenis.pengeluaran)) + '</div>';
    const grup = {};
    d.daftar.forEach(x => (grup[x.tanggal] = grup[x.tanggal] || []).push(x));
    const tgls = Object.keys(grup).sort().reverse();
    h += '<div class="kartu"><b>Buku kas</b>' + (tgls.length ? tgls.map(t => '<div style="margin-top:12px;font-weight:650;color:var(--g)">' + tg(t) + '</div>' +
      grup[t].map(x => '<div class="baris"><span style="min-width:0">' + esc(x.judul) + '<br><span class="kecil">' + esc(x.rincian || x.metode || '') + (x.rincian && x.metode ? ' · ' + esc(x.metode) : '') + '</span></span>' +
        '<span class="kn ' + (x.tipe === 'masuk' ? 'pos' : 'neg') + '" style="font-weight:600">' + (x.tipe === 'masuk' ? '+' : '-') + rp(x.jumlah) + '</span></div>').join('')).join('') :
      '<p class="kecil">Belum ada uang masuk atau keluar pada periode ini.</p>') + (d.terpotong ? '<p class="kecil">Menampilkan 400 catatan terbaru.</p>' : '') + '</div>';
    h += '<div class="kartu"><b>Saldo awal kas</b><p class="kecil" style="margin:0 0 4px">Isi uang yang sudah ada di kas atau modal awal saat Anda mulai memakai aplikasi. Saat ini ' + rp(d.saldo_awal) + '.</p>' +
      '<div class="gabung"><input id="sa" type="number" inputmode="decimal" placeholder="Contoh 1000000"><button class="tombol" id="sas" type="button" style="width:auto;margin:0;padding:0 18px">Simpan</button></div></div>';
    box.innerHTML = h;
    $('#sas').onclick = async () => {
      try {
        if ($('#sa').value === '') throw new Error('Isi jumlah saldo awal.');
        await api('simpanSaldoAwal', {nilai: $('#sa').value});
        toast('Saldo awal tersimpan'); kas(el).catch(e => toast(NR.pesan(e)));
      } catch (e) { toast(NR.pesan(e)); }
    };
  });
}

// ---- Riwayat penjualan ----
async function riwayat(el) {
  el.innerHTML = '<div class="kartu"><b>Penjualan terakhir</b><div id="rv"><p class="kecil">Memuat…</p></div></div>';
  const L = await api('daftarTransaksi', {jenis: 'penjualan', limit: 40});
  const k = $('#rv'); if (!k) return;
  const ulang = () => riwayat(el).catch(e => toast(NR.pesan(e)));
  k.innerHTML = L.length ? L.map(x => {
    let it = []; try { it = JSON.parse(x.item_json || '[]'); } catch (e) {}
    return NR.rw(esc(it.map(i => i.nama + ' ×' + i.qty).join(', ') || x.id), tg(x.tanggal) + ' · ' + esc(x.metode) + ' · laba ' + rp(x.laba_kotor), rp(x.total), x, 'penjualan');
  }).join('') : '<p class="kecil">Belum ada penjualan.</p>';
  k.onclick = e => { const b = e.target.closest('[data-batal]'); if (b) NR.batal(b.dataset.jenis, b.dataset.batal, ulang); };
}
})();
// AKHIR FILE hal3.js
