// plan6.json ＋ img6/ ＋ LPの画面写真 → proposal6.html（A4横15ページ）
const fs = require("fs"), path = require("path");
const plan = JSON.parse(fs.readFileSync(path.join(__dirname, "plan6.json"), "utf8"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
// ページごとの画面写真（右下に小さく添える）
const SHOT = { 8: "img/hero-card.jpg", 10: "img/act01.jpg", 11: "img/act03.jpg", 12: "img/rule.jpg", 13: "img/act05.jpg", 14: "img/act04.jpg" };
const CH = { "①時代背景": "①", "②時代の解決策としてのIFBOX、ドリフターズ": "②", "③ユニコーン企業を100社にする、自らも宣言ユニコーンとなる": "③", "④第一弾として生まれたのがこれほし": "④", "⑤忙しい社長のあったらいいなを体現": "⑤", "⑥AX化の入り口になる": "⑥", "次の一手": "→" };
let pages = "";
// 表紙
pages += `<section class="page cover"><div class="pad">
  <div>
    <span class="k">IFBOX ／ ドリフターズ ／ これほし</span><span class="pat">特許出願中</span>
    <h1>もしを、<br>揃う前から始める。</h1>
    <p class="sub">時代背景から、これほしまで。</p>
    <ol class="toc"><li><b>①</b>時代背景</li><li><b>②</b>時代の解決策としての IFBOX、ドリフターズ</li><li><b>③</b>ユニコーン企業を100社に。自らも宣言ユニコーンに</li><li><b>④</b>第一弾として生まれた、これほし</li><li><b>⑤</b>忙しい社長の「あったらいいな」を体現</li><li><b>⑥</b>AX化の入り口になる</li></ol>
    <div class="who"><b>ご提案書</b>　レリック社会保険労務士法人　五味田匡功</div>
  </div>
  <img class="hero" src="img6/p01.jpg" alt="">
  <div class="foot"><span>IFBOX ／ これほし　ご提案書</span><span>2026年9月</span></div>
</div></section>
`;
for (const p of plan.pages) {
  const img = p.image.startsWith("screenshot") ? null : `img6/p${String(p.no).padStart(2, "0")}.jpg`;
  const shot = SHOT[p.no];
  const last = p.no === 15;
  pages += `<section class="page${last ? " last" : ""}"><div class="pad">
  <div class="chap"><span class="cn">${CH[p.chapter] || ""}</span><span class="ct">${esc(p.chapter)}</span><span class="pn">${p.no} / ${plan.pages.length}</span></div>
  <div class="grid${shot ? " has-shot" : ""}">
    <div class="txt">
      <h2>${esc(p.title)}</h2>
      <p class="lead">${esc(p.lead)}</p>
      <ul class="pts">${p.body.map((b, i) => `<li class="${i === 0 ? "q" : ""}">${esc(b)}</li>`).join("")}</ul>
    </div>
    <div class="vis">
      ${img ? `<img class="ill" src="${img}" alt="">` : ""}
      ${shot ? `<img class="shot" src="${shot}" alt=""><div class="cap">これほしの画面（架空データ）</div>` : ""}
    </div>
  </div>
  <div class="foot"><span>IFBOX ／ これほし　ご提案書</span><span>${last ? "公式LINE：https://line.me/R/ti/p/@232zafzm　Web：https://mgomita-ui.github.io/korehoshi-site/" : ""}</span></div>
</div></section>
`;
}
const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>IFBOX／これほし ご提案書</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
:root{--blue:#0B3FA8;--blue2:#062B78;--blue-soft:#EEF3FC;--ink:#111827;--ink2:#4b5563;--ink3:#8b93a1;--line:#e3e7ee;--accent:#E85B52;--lime:#DFF25A}
*{box-sizing:border-box}html,body{margin:0;background:#fff;color:var(--ink);font-family:"Noto Sans JP",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
@page{size:A4 landscape;margin:0}
.page{width:297mm;height:210mm;position:relative;overflow:hidden;page-break-after:always;background:#fff}.page:last-child{page-break-after:auto}
.pad{position:absolute;inset:0;padding:12mm 16mm 12mm}
.foot{position:absolute;left:16mm;right:16mm;bottom:7mm;display:flex;justify-content:space-between;font-size:9.5px;color:var(--ink3)}
.chap{display:flex;align-items:center;gap:10px;margin-bottom:6mm}
.cn{width:30px;height:30px;border-radius:50%;background:var(--blue);color:#fff;font-weight:900;font-size:15px;display:flex;align-items:center;justify-content:center}
.ct{font-size:12.5px;font-weight:900;color:var(--blue);letter-spacing:.04em}
.pn{margin-left:auto;font-size:11px;color:var(--ink3)}
.grid{display:grid;grid-template-columns:1.05fr .95fr;gap:10mm;align-items:center;height:158mm}
.txt h2{font-size:34px;line-height:1.3;margin:0 0 8px;font-weight:900;letter-spacing:-.01em}
.txt .lead{font-size:14.5px;color:var(--ink2);line-height:1.8;margin:0 0 12px}
.pts{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:7px}
.pts li{position:relative;padding:8px 12px 8px 30px;background:var(--blue-soft);border-radius:10px;font-size:13.5px;line-height:1.65;color:var(--ink)}
.pts li:before{content:"";position:absolute;left:12px;top:15px;width:9px;height:9px;border-radius:50%;background:var(--blue)}
.pts li.q{background:#fff;border:1.5px solid var(--line);font-weight:700}
.pts li.q:before{background:var(--accent)}
.vis{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;height:100%}
.ill{width:100%;max-height:100mm;object-fit:contain}
.has-shot .ill{max-height:78mm}
.shot{width:100%;max-height:62mm;object-fit:contain;border:1px solid var(--line);border-radius:10px;box-shadow:0 10px 24px rgba(11,63,168,.10)}
.cap{font-size:10.5px;color:var(--ink3)}
/* 表紙 */
.cover{background:linear-gradient(135deg,#0A3EA6 0%,#0B2F80 60%,#071F57 100%);color:#fff}
.cover .pad{display:grid;grid-template-columns:1.1fr .9fr;gap:10mm;align-items:center}
.cover .k{display:inline-block;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:4px 14px;font-size:12.5px;font-weight:700;margin-bottom:14px}
.pat{display:inline-block;font-size:11px;font-weight:900;color:#fff;border:1.5px solid rgba(255,255,255,.85);border-radius:4px;padding:1px 8px;letter-spacing:.06em;margin-left:10px;vertical-align:2px}
.cover h1{font-size:52px;line-height:1.25;margin:0;font-weight:900;color:#fff;letter-spacing:-.01em}
.cover .sub{margin:12px 0 0;font-size:20px;font-weight:700}
.toc{list-style:none;padding:0;margin:16px 0 0;display:flex;flex-direction:column;gap:5px}
.toc li{font-size:14px;color:#dfe6f8}.toc li b{display:inline-block;width:24px;height:24px;border-radius:50%;background:#fff;color:var(--blue);text-align:center;line-height:24px;font-size:13px;margin-right:10px}
.cover .who{margin-top:18px;font-size:12.5px;color:#c5d0ee}.cover .who b{color:#fff}
.cover .hero{width:100%;background:#fff;border-radius:14px;box-shadow:0 30px 60px rgba(0,0,0,.35)}
.cover .foot{color:#9db4e8}
.last .txt h2{color:var(--blue)}
</style></head><body>${pages}</body></html>`;
fs.writeFileSync(path.join(__dirname, "proposal6.html"), html, "utf8");
console.log("html ok, pages", plan.pages.length + 1);
