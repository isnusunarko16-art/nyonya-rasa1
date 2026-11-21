(function () {
const css = `
:root{--m:#6B1E2E;--m2:#4F1521;--c:#F6F2EA;--p:#FFFFFF;--g:#A98544;--t:#231719;--s:#7B6F71;--l:#E8E0D3;--er:#B3261E;--ok:#2E6B4E;
--sh:0 1px 2px rgba(60,20,30,.05),0 6px 22px rgba(60,20,30,.06)}
html,body{background:var(--c);-webkit-text-size-adjust:100%;font-variant-numeric:tabular-nums}
body{font-size:15px;color:var(--t)}
h2{font-family:inherit;font-size:17px;font-weight:650;color:var(--t);margin:0 0 10px;letter-spacing:.005em}
.merek h1{font-family:Georgia,'Times New Roman',serif}
.atas{background:linear-gradient(180deg,#7A2236,#5C1828);border-bottom:0;box-shadow:0 2px 12px rgba(60,20,30,.2);position:sticky}
.atas::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,transparent,var(--g),transparent);opacity:.8}
.atas h1{font-family:inherit;font-weight:600;font-size:17px;letter-spacing:.02em}
.ikon{font-size:22px;opacity:.95}
.kartu{border:0;box-shadow:var(--sh);border-radius:18px;padding:16px;margin-bottom:14px;background:var(--p)}
.kartu>b:first-child{display:block;font-size:15px;font-weight:650;margin-bottom:6px;color:var(--t)}
.kecil{color:var(--s);font-size:13px;line-height:1.4}
label{font-size:13px;font-weight:600;color:var(--s);margin:14px 0 5px}
input,select,textarea{min-height:46px;border:1px solid #DDD3C4;border-radius:12px;padding:11px 13px;background:#fff;font-size:16px}
input:focus,select:focus,textarea:focus{outline:0;border-color:var(--m);box-shadow:0 0 0 3px rgba(107,30,46,.13)}
input[type=checkbox]{min-height:0;width:20px;height:20px;accent-color:var(--m);padding:0}
input[type=search]{background:#fff;border-radius:14px;box-shadow:var(--sh);border-color:transparent}
.tombol{min-height:50px;border-radius:14px;background:var(--m);box-shadow:0 4px 14px rgba(107,30,46,.22);letter-spacing:.01em;margin-top:18px}
.tombol.sek{background:#fff;color:var(--m);border:1.5px solid var(--m);box-shadow:none}
.tombol.bhy{background:var(--er);box-shadow:none}
.tombol:disabled{opacity:.55;box-shadow:none}
.tautan{color:var(--m);text-decoration:none;font-weight:600;padding:10px 0}
.galat{border-radius:12px;background:#FBEAE8;color:var(--er);padding:10px 12px;font-size:14px;margin-top:10px}
.notif{border-left:4px solid var(--ok)}
.notif .n1{font-weight:700;color:var(--ok);margin-bottom:2px}
.seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:4px;background:#EADFD1;border-radius:14px;padding:4px;margin-bottom:14px}
.seg button{border:0;background:none;border-radius:11px;padding:10px 4px;font-size:13px;font-weight:600;color:var(--s)}
.seg button.on{background:#fff;color:var(--m);box-shadow:0 1px 5px rgba(60,20,30,.14)}
.chip{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.chip::-webkit-scrollbar{display:none}
.chip button{flex:0 0 auto;padding:8px 16px;border:0;background:#EADFD1;color:var(--s);border-radius:20px;font-size:14px;font-weight:600}
.chip button.on{background:var(--m);color:#fff}
.gabung{display:flex;gap:8px}.gabung input{flex:1;min-width:0}.gabung select{width:88px}
.baris{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid var(--l);font-size:14.5px}
.baris:first-of-type{border-top:0}
.baris.tebal{font-weight:700}
.baris .kn{text-align:right}
.mat{gap:10px}
.ubin{border:0;box-shadow:var(--sh);border-radius:16px;padding:13px 14px}
.ubin .k{font-size:12.5px;color:var(--s)}
.ubin .v{font-size:18px;font-weight:700;color:var(--m);letter-spacing:-.01em}
.ubin.lebar{background:linear-gradient(135deg,#7A2236,#5C1828)}
.ubin.lebar .v{font-size:26px}
.pos{color:var(--ok)}.neg{color:var(--er)}
.pg{padding:13px 0;border-top:1px solid var(--l)}
.pg:first-child{border-top:0}
.ava{border-radius:14px;background:linear-gradient(135deg,#7A2236,#5C1828);font-family:Georgia,serif}
.tag{background:#EFE7DA;color:var(--s);border-radius:8px;font-size:11px;padding:2px 8px}
.lencana{border-radius:8px}
.btnk{border-radius:10px;padding:6px 12px;font-size:12px;font-weight:600;background:#fff}
.cl{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:11px 0;border-top:1px solid var(--l)}
.cl .n{font-weight:600}
.qc{display:flex;align-items:center;gap:6px;flex:0 0 auto}
.qc button{width:36px;height:36px;border-radius:11px;border:1px solid var(--l);background:#fff;font-size:19px;color:var(--m);padding:0}
.qc input{width:58px;min-height:36px;text-align:center;padding:4px}
.bawah{background:rgba(255,255,255,.93);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-top:1px solid var(--l)}
.bawah a{font-size:10.5px;font-weight:500;position:relative}
.bawah a.aktif{font-weight:700}
.bawah a.aktif::before{content:"";position:absolute;top:0;left:32%;right:32%;height:3px;border-radius:0 0 3px 3px;background:var(--m)}
.lembar{border-radius:22px 22px 0 0}
.lembar button{border:0;box-shadow:var(--sh);border-radius:14px;font-weight:600}
.toast{background:#2B1B1E;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.25)}
details.acc{padding:0}
details.acc>summary{list-style:none;cursor:pointer;padding:16px;font-weight:650;font-size:16px;display:flex;justify-content:space-between;align-items:center}
details.acc>summary::-webkit-details-marker{display:none}
details.acc>summary::after{content:"+";font-size:22px;color:var(--g);font-weight:400}
details.acc[open]>summary::after{content:"–"}
details.acc>.isi{padding:0 16px 16px}
.cetak-only{display:none}
@media print{
.atas,.bawah,.toast,.sheet,.no-print,.chip,.seg{display:none!important}
html,body{background:#fff}#isi{padding:0!important}
.kartu{box-shadow:none!important;border:1px solid #ccc!important;break-inside:avoid;border-radius:6px}
.ubin{box-shadow:none!important;border:1px solid #ccc!important}
.ubin.lebar{background:#fff!important}.ubin.lebar .v,.ubin.lebar .k{color:#000!important}
.cetak-only{display:block!important;margin-bottom:12px}
}`;
const st = document.createElement('style');
st.textContent = css;
document.head.appendChild(st);
window.addEventListener('beforeprint', () => document.querySelectorAll('details').forEach(d => d.open = true));
try {
  const c = document.createElement('canvas');
  c.width = c.height = 180;
  const x = c.getContext('2d');
  x.fillStyle = '#6B1E2E'; x.fillRect(0, 0, 180, 180);
  x.strokeStyle = '#A98544'; x.lineWidth = 3; x.strokeRect(14, 14, 152, 152);
  x.fillStyle = '#F6F2EA'; x.font = 'bold 82px Georgia,serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('NR', 90, 96);
  let l = document.querySelector('link[rel="apple-touch-icon"]');
  if (!l) { l = document.createElement('link'); l.rel = 'apple-touch-icon'; document.head.appendChild(l); }
  l.href = c.toDataURL('image/png');
} catch (e) {}
})();
// AKHIR FILE tema.js
