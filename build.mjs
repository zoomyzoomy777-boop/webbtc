// สร้าง index.html ที่ล็อกด้วย ID + รหัสผ่าน จาก app.html
// เนื้อหาเว็บถูกเข้ารหัสด้วย AES-256-GCM (คีย์จาก PBKDF2-SHA256) ไฟล์ที่ได้ไม่มีรหัสผ่านอยู่ข้างใน
//
// วิธีใช้:  node build.mjs            (ถาม ID / รหัสผ่าน)
//      หรือ  BTC_ID=... BTC_PASS=... node build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

const ITER = 250000;

async function ask() {
  if (process.env.BTC_ID && process.env.BTC_PASS) return [process.env.BTC_ID, process.env.BTC_PASS];
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const id = await rl.question('ID: '), pass = await rl.question('Password: ');
  rl.close();
  return [id, pass];
}

const [id, pass] = await ask();
if (!id || !pass) { console.error('ต้องมีทั้ง ID และรหัสผ่าน'); process.exit(1); }

const enc = new TextEncoder(), b64 = u => Buffer.from(u).toString('base64');
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', enc.encode(id + '\n' + pass), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(readFileSync('app.html', 'utf8'))));
const payload = JSON.stringify({ s: b64(salt), i: b64(iv), d: b64(data), n: ITER });

writeFileSync('index.html', `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>ACCESS — BTC/USDT</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=IBM+Plex+Sans+Thai:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root { --bg:#141414; --line:#3a3a3a; --text:#e8e8e8; --muted:#8a8a8a; --gold:#ff6a1a; --sell:#ff3b3b; --hazard:#ffd400;
    --stripes: repeating-linear-gradient(-45deg, var(--hazard) 0 6px, #111 6px 12px); }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; background: var(--bg); color: var(--text);
    font-family: "JetBrains Mono", "IBM Plex Sans Thai", Consolas, monospace; }
  form { position: relative; width: 100%; max-width: 360px; border: 1px solid var(--line); background: #161616; padding: 34px 22px 22px; }
  form::before, form::after { content: ""; position: absolute; width: 12px; height: 12px; border: 0 solid var(--gold); }
  form::before { top: -1px; right: -1px; border-top-width: 2px; border-right-width: 2px; }
  form::after { bottom: -1px; left: -1px; border-bottom-width: 2px; border-left-width: 2px; }
  .stripe { position: absolute; top: 0; left: 0; right: 0; height: 6px; background: var(--stripes); }
  h1 { margin: 0 0 4px; font-size: 14px; letter-spacing: .25em; color: var(--gold); }
  .sub { margin: 0 0 22px; font-size: 10px; letter-spacing: .12em; color: var(--muted); }
  label { display: block; font-size: 10px; letter-spacing: .14em; color: var(--muted); margin-bottom: 6px; }
  input { width: 100%; margin-bottom: 16px; background: #0c0c0c; color: var(--gold); border: 1px solid var(--muted); border-radius: 0;
    padding: 10px; font: inherit; font-size: 14px; letter-spacing: .06em; }
  input:focus { outline: 1px solid var(--gold); outline-offset: 1px; border-color: var(--gold); }
  button { width: 100%; padding: 11px; background: var(--gold); color: #111; border: 0; border-radius: 0; font: inherit; font-weight: 800;
    font-size: 12px; letter-spacing: .25em; cursor: pointer; }
  button:disabled { opacity: .6; cursor: wait; }
  .msg { min-height: 18px; margin-top: 14px; font-size: 11px; letter-spacing: .1em; text-align: center; }
  .msg.err { color: #111; background: var(--hazard); padding: 4px; font-weight: 800; }
</style>
</head>
<body>
<form id="f" autocomplete="off">
  <div class="stripe"></div>
  <h1>■ RESTRICTED ACCESS</h1>
  <p class="sub">BTC/USDT LIVE ANALYSIS · AUTH REQUIRED</p>
  <label for="u">ID</label>
  <input id="u" autocomplete="username" autocapitalize="off" spellcheck="false" required autofocus>
  <label for="p">PASSWORD</label>
  <input id="p" type="password" autocomplete="current-password" required>
  <button id="b">ENTER</button>
  <div class="msg" id="m"></div>
</form>
<script>
const P = ${payload};
const ub = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
let fails = 0;
document.getElementById('f').addEventListener('submit', async e => {
  e.preventDefault();
  const b = document.getElementById('b'), m = document.getElementById('m');
  b.disabled = true; m.className = 'msg'; m.textContent = 'VERIFYING…';
  try {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(document.getElementById('u').value.trim() + '\\n' + document.getElementById('p').value), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: ub(P.s), iterations: P.n, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const html = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub(P.i) }, key, ub(P.d)));
    document.open(); document.write(html); document.close();
  } catch (err) {
    fails++;
    m.className = 'msg err'; m.textContent = 'ACCESS DENIED — ID หรือรหัสผ่านไม่ถูกต้อง';
    document.getElementById('p').value = '';
    // หน่วงเวลาเพิ่มขึ้นทุกครั้งที่ใส่ผิด
    setTimeout(() => { b.disabled = false; document.getElementById('p').focus(); }, Math.min(fails, 10) * 1000);
  }
});
</script>
</body>
</html>
`);
console.log('สร้าง index.html (เข้ารหัสแล้ว) เรียบร้อย');
