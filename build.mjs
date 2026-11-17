// สร้าง index.html (หน้าเว็บจริง) จาก app.html — ไม่มีการล็อกรหัส/เข้ารหัสแล้ว
//
// วิธีใช้:  node quant/bundle.mjs   แล้ว   node build.mjs
import { copyFileSync } from 'node:fs';

copyFileSync('app.html', 'index.html');
console.log('สร้าง index.html (ไม่เข้ารหัส) จาก app.html เรียบร้อย');
