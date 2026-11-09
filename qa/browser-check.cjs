// qa/browser-check.cjs — Playwright trên Chrome thật: khóa viewport (PC 1280×800, phone 390×844), 0 lỗi JS, 0 tràn, #hl-* khớp SVG, bấm thử điều khiển.
// Cài: npm i -D playwright-core · Chạy: node qa/browser-check.cjs [thư-mục-ảnh]   (CHROME=đường dẫn chrome nếu khác mặc định)
const { chromium } = require('playwright-core');
const path = require('path');
const web = path.join(__dirname, '..'), out = process.argv[2] || path.join(require('os').tmpdir(), 'nhi-qa'); require('fs').mkdirSync(out, { recursive: true });
const url = 'file:///' + path.resolve(web, 'index.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const [w, h, tag] of [[1280, 800, 'pc'], [390, 844, 'phone']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }), errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/ERR_FILE_NOT_FOUND/.test(m.text()) && errs.push(m.text()));
    await p.goto(url); await p.waitForTimeout(500);
    const hs = (await p.evaluate(() => ALL_SCREENS())).concat(['#/ca/ca-phan-ve', '#/osce/osce-giat']);
    for (const hsh of hs) {
      await p.goto(url + hsh); await p.waitForTimeout(400);
      const m = await p.evaluate(() => { const d = document.documentElement;
        const miss = [...document.querySelectorAll('[data-hl]')].map(e => e.dataset.hl).filter(id => !document.getElementById('hl-' + id));
        const ids = window.ZS.BY && location.hash.startsWith('#/L/') ? ZS.idsOf(ZS.BY[location.hash.slice(4)]) : [];
        return { page: d.scrollHeight - innerHeight, wide: d.scrollWidth - innerWidth, miss, nan: /NaN|undefined/.test(document.querySelector('#stage svg')?.textContent || ''), ids: ids.length }; });
      console.log(tag, hsh, JSON.stringify(m));
      await p.screenshot({ path: `${out}/${tag}-${hsh.replace(/[#\/]/g, '_')}.png` });
      if (hsh === '#/ca/ca-phan-ve') { for (let k = 0; k < 4; k++) { for (let j = 0; j < 3; j++) { await p.evaluate(j => { const b = document.querySelectorAll('.cur .opt')[j]; if (b) b.click(); }, j); await p.waitForTimeout(60); } await p.waitForTimeout(800); } await p.screenshot({ path: `${out}/${tag}-case-end.png` }); }
      if (hsh === '#/osce/osce-giat') { for (const b of (await p.$$('.it')).slice(0, 4)) await b.click(); await p.click('.grade'); await p.waitForTimeout(300); await p.screenshot({ path: `${out}/${tag}-osce-end.png` }); }
      if (hsh === '#/bay') { for (let k = 0; k < 6; k++) { await p.evaluate(() => { const b = document.querySelector('.tf button'); if (b) b.click(); }); await p.waitForTimeout(50); } await p.screenshot({ path: `${out}/${tag}-bay-end.png` }); }
      if (hsh === '#/q/13') {
        await p.click('.qo'); await p.waitForTimeout(200);
        if (await p.$('.mech')) { await p.click('.mech'); await p.waitForTimeout(500); }
        await p.screenshot({ path: `${out}/${tag}-quiz-drawer.png` }); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
        await p.screenshot({ path: `${out}/${tag}-quiz-after.png` });
      }
      if (hsh.startsWith('#/L/')) {
        // bấm từng bước + trả lời ask, chụp trạng thái cuối
        await p.evaluate(() => { document.querySelector('.opt')?.click(); });
        for (const btn of await p.$$('.steps button, .lay')) { await btn.click(); await p.waitForTimeout(800); }
        await p.evaluate(() => document.querySelectorAll('.sim input[type=range]').forEach(r => { r.value = r.dataset.end || (+r.min + (+r.max - +r.min) * .6); r.dispatchEvent(new Event('input', { bubbles: true })); }));
        await p.waitForTimeout(500);
        const nan2 = await p.evaluate(() => /NaN|undefined/.test(document.querySelector('#stage svg').innerHTML));
        if (nan2) console.log('  !! NaN/undefined trong SVG sau thao tác', hsh);
        await p.screenshot({ path: `${out}/${tag}-${hsh.replace(/[#\/]/g, '_')}-end.png` });
        if (tag === 'phone') { await p.evaluate(() => { document.querySelector('#stage').scrollTop = 400; }); await p.waitForTimeout(200);
          await p.screenshot({ path: `${out}/${tag}-mini.png` }); }
      }
    }
    await p.goto(url + '#/'); await p.click('#fab'); await p.waitForTimeout(200); await p.screenshot({ path: `${out}/${tag}-crash.png` });
    console.log(tag, 'errors:', errs.length ? errs : 'none');
    await p.close();
  }
  await b.close();
})();
