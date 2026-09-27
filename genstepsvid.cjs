// 「これほしが、やること」の3つの動画を、見本（demo/）を実際に動かして撮る。
//   node genstepsvid.cjs [step1-in|step2-draft|step3-sent]
//   → img/step1-in.mp4 / step2-draft.mp4 / step3-sent.mp4 と、それぞれの .png（ポスター＝最後の場面）
// 見本の受け答え（demo-stub.js）は送信しても状態が変わらないので、撮るときだけ
// 「送ったら対応済みになり、相手待ちのやることが1件増える」をページの中で足している（本番ではサーバーがやること）。
// 画面に出る文は、すべて demo-data.js のもの（送料の扱いの件は prep_tasks の候補の文）。
const puppeteer = require("C:/Users/mgomi/dev/ifbox-proto/internal/docs/dashboard_demo/node_modules/puppeteer-core");
const http = require("http"), fs = require("fs"), path = require("path"), cp = require("child_process");
const ROOT = path.join(__dirname, "demo"), OUT = path.join(__dirname, "img");
const TMP = path.join(require("os").tmpdir(), "korehoshi-steps");
const FFMPEG = "ffmpeg";
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".css": "text/css" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ページの中に入れる道具：見せるためのカーソル、押す、待つ、届いた行を光らせる。
const HELPER = `
window.KH = (function () {
  var st = document.createElement("style");
  st.textContent = ".kh-cur{position:fixed;left:0;top:0;width:22px;height:22px;z-index:2147483647;pointer-events:none}"
    + ".kh-rip{position:fixed;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:3px solid rgba(37,99,235,.75);z-index:2147483646;pointer-events:none;animation:khRip .5s ease-out forwards}"
    + "@keyframes khRip{from{transform:scale(.3);opacity:1}to{transform:scale(1.4);opacity:0}}"
    + ".kh-new{animation:khNew 2s ease-out}"
    + "@keyframes khNew{0%{background:#fff1b8;transform:translateY(-12px);opacity:.1}20%{background:#fff1b8;transform:none;opacity:1}60%{background:#fff6d6}100%{background:transparent}}";
  document.head.appendChild(st);
  var c = document.createElement("div"); c.className = "kh-cur";
  c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2l15 11-6.5 1.2L16.5 21l-3 1.4-3.6-6.8L4 20z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.body.appendChild(c);
  var x = innerWidth * 0.8, y = innerHeight * 0.8;
  function put() { c.style.transform = "translate(" + x + "px," + y + "px)"; }
  put();
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function move(tx, ty, ms) {
    var sx = x, sy = y, t0 = performance.now();
    return new Promise(function (res) {
      (function step(now) {
        var k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        x = sx + (tx - sx) * e; y = sy + (ty - sy) * e; put();
        if (k < 1) requestAnimationFrame(step); else res();
      })(t0);
    });
  }
  function center(el, fx, fy) { var r = el.getBoundingClientRect(); return [r.left + r.width * (fx == null ? .5 : fx), r.top + r.height * (fy == null ? .5 : fy)]; }
  async function tap(el, ms, fx, fy) {
    var p = center(el, fx, fy); await move(p[0], p[1], ms || 700); await sleep(140);
    var r = document.createElement("div"); r.className = "kh-rip"; r.style.left = p[0] + "px"; r.style.top = p[1] + "px";
    document.body.appendChild(r); setTimeout(function () { r.remove(); }, 600);
    await sleep(90); el.click();
  }
  function byText(sel, text) { return Array.prototype.filter.call(document.querySelectorAll(sel), function (e) { return e.textContent.indexOf(text) >= 0; })[0]; }
  function mark(el) { if (!el) return; el.classList.remove("kh-new"); void el.offsetWidth; el.classList.add("kh-new"); }
  return { move: move, tap: tap, sleep: sleep, byText: byText, mark: mark, done: false };
})();
`;

// ── 3つの場面。setup で前の状態を作り、run を時間どおりに流す。KH.done = true で撮り終わり。
const CLIPS = [
  {
    // 01 入ってくる：受信箱に2件届き、経路の絞り込みを押して戻す。
    name: "step1-in", w: 760, h: 570, dsf: 1,
    setup: `(async function () {
      var D = window.DEMO;
      window.__hold = D.threads.filter(function (t) { return t.id === "line:Uaoba001" || t.id === "chatwork:R1001"; });
      D.threads = D.threads.filter(function (t) { return window.__hold.indexOf(t) < 0; });
      await loadList();
    })()`,
    run: `(async function () {
      var D = window.DEMO;
      function arrive(id) {
        D.threads.push(window.__hold.filter(function (x) { return x.id === id; })[0]);
        D.threads.sort(function (a, b) { return window.__order.indexOf(a.id) - window.__order.indexOf(b.id); });
        return loadList().then(function () { KH.mark(document.querySelector('.thread[data-id="' + id + '"]')); });
      }
      await KH.sleep(500);
      await arrive("line:Uaoba001");
      await KH.sleep(1000);
      await arrive("chatwork:R1001");
      await KH.sleep(1200);
      await KH.tap(document.querySelector('#channels [data-c="line"]'), 700);
      await KH.sleep(850);
      await KH.tap(document.querySelector('#channels [data-c="chatwork"]'), 500);
      await KH.sleep(850);
      await KH.tap(document.querySelector('#channels [data-c=""]'), 600);
      await KH.move(innerWidth * 0.8, innerHeight * 0.8, 500);
      await KH.sleep(400);
      KH.done = true;
    })()`,
  },
  {
    // 02 取りに行く：会話を開き、AIが読んだ中身（AIの読み）を見て、下書きが入る。
    name: "step2-draft", w: 400, h: 624, dsf: 1.5,
    setup: `(async function () {
      // 開いた時点で本体が入れる先回りの下書きを、いったん空にしておき、あとで同じ文を流し込む。
      window.__draft = "";
      new MutationObserver(function () {
        var ta = document.getElementById("reply");
        if (ta && !ta.dataset.kh) { ta.dataset.kh = "1"; window.__draft = ta.value; ta.value = ""; }
      }).observe(document.getElementById("detail"), { childList: true, subtree: true });
    })()`,
    run: `(async function () {
      await KH.sleep(400);
      await KH.tap(document.querySelector('.thread[data-id="line:Uaoba001"]'), 700, .45, .3);
      await KH.sleep(250);
      var m = document.getElementById("msgs"); var end = m.scrollHeight - m.clientHeight;
      m.scrollTop = 0; await KH.sleep(250);
      var t0 = performance.now();
      await new Promise(function (res) { (function s(now) { var k = Math.min(1, (now - t0) / 900); m.scrollTop = end * k; if (k < 1) requestAnimationFrame(s); else res(); })(t0); });
      await KH.sleep(150);
      await KH.tap(document.querySelector('[data-p="ai"]'), 600);
      await KH.sleep(1200);
      await KH.tap(document.querySelector('[data-p="reply"]'), 500);
      await KH.sleep(150);
      var ta = document.getElementById("reply"), txt = window.__draft, i = 0;
      KH.move(innerWidth * .85, innerHeight * .97, 400);
      await new Promise(function (res) {
        var iv = setInterval(function () {
          i = Math.min(txt.length, i + 6); ta.value = txt.slice(0, i); ta.scrollTop = ta.scrollHeight;
          if (i >= txt.length) { clearInterval(iv); res(); }
        }, 40);
      });
      await KH.sleep(700);
      KH.done = true;
    })()`,
  },
  {
    // 03 返すと残る：送信 → 宛先の確認 → 対応済み → やってもらうことに1件入る。
    name: "step3-sent", w: 760, h: 570, dsf: 1,
    url: "/?thread=line%3AUaoba001",
    setup: `(async function () {
      var D = window.DEMO, id = "line:Uaoba001";
      var th = D.threads.filter(function (t) { return t.id === id; })[0];
      var inner = window.fetch;
      window.fetch = function (input, init) {
        var url = String(input && input.url ? input.url : input);
        if (/\\/inbox\\/api\\/send$/.test(url) && init && init.method === "POST") {
          var b = JSON.parse(init.body || "{}");
          D.detail[id].messages.push({ id: 99, direction: "out", kind: "text", body: b.text, created_at: Date.now() });
          th.status = "done"; th.prep_draft = null; th.last_message_at = Date.now(); th.last_preview = b.text;
          var d3 = new Date(Date.now() + 9 * 3600e3); d3.setUTCDate(d3.getUTCDate() + 3); d3.setUTCHours(9, 0, 0, 0);
          D.tasks.unshift({ id: 201, thread_id: id, title: "分納の条件（送料の扱い）を日向さんに確認してもらう",
            due_at: d3.getTime() - 9 * 3600e3, done: 0, created_at: Date.now(), side: "theirs", est_min: null, plan_at: null });
        }
        return inner.apply(window, arguments);
      };
      var ta = document.getElementById("reply"); try { ta.setSelectionRange(0, 0); } catch (e) {} ta.scrollTop = 0; ta.blur();
    })()`,
    run: `(async function () {
      await KH.sleep(500);
      await KH.tap(document.getElementById("doSend"), 800);
      await KH.sleep(850);
      await KH.tap(document.querySelector(".ask [data-yes]"), 600);
      await KH.sleep(1400);
      await KH.tap(document.getElementById("tabWaits"), 800);
      document.getElementById("main").classList.add("viewing");
      await KH.sleep(50);
      KH.mark(KH.byText("#detail .task", "送料の扱い"));
      await KH.move(innerWidth * 0.8, innerHeight * 0.8, 700);
      await KH.sleep(1000);
      KH.done = true;
    })()`,
  },
];

async function record(b, clip) {
  const dir = path.join(TMP, clip.name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", e => errs.push(e.message));
  await p.setViewport({ width: clip.w, height: clip.h, deviceScaleFactor: clip.dsf });
  await p.goto("http://127.0.0.1:8811" + (clip.url || "/"), { waitUntil: "networkidle0" });
  await sleep(1500);
  await p.evaluate(() => { window.__order = window.DEMO.threads.map(t => t.id); });
  await p.evaluate(HELPER);
  await p.evaluate(clip.setup);
  await sleep(400);
  const frames = [];
  const t0 = Date.now();
  p.evaluate(clip.run).catch(e => console.error(clip.name, "run error", e.message));
  while (true) {
    const t = Date.now() - t0;
    const f = path.join(dir, String(frames.length).padStart(4, "0") + ".jpg");
    await p.screenshot({ path: f, type: "jpeg", quality: 92, optimizeForSpeed: true });
    frames.push({ f, t });
    if (await p.evaluate(() => KH.done)) break;
    const wait = 125 - ((Date.now() - t0) - t);
    if (wait > 0) await sleep(wait);
    if (t > 20000) { console.error("timeout", clip.name); break; }
  }
  const total = Date.now() - t0;
  // ポスター（動かさない人向けの1枚）は最後の場面。カーソルは消して撮る。
  await p.evaluate(() => document.querySelectorAll(".kh-cur,.kh-rip").forEach(e => e.remove()));
  await p.screenshot({ path: path.join(OUT, clip.name + ".png") });
  await ctx.close();
  if (errs.length) console.error(clip.name, "page errors:", errs);
  // 撮った時刻どおりの長さで並べる（concat の duration）。
  let list = "";
  frames.forEach((fr, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].t : total;
    list += `file '${fr.f.replace(/\\/g, "/")}'\nduration ${((next - fr.t) / 1000).toFixed(3)}\n`;
  });
  list += `file '${frames[frames.length - 1].f.replace(/\\/g, "/")}'\n`;
  fs.writeFileSync(path.join(dir, "list.txt"), list);
  const outW = Math.round(clip.w * clip.dsf / 2) * 2, outH = Math.round(clip.h * clip.dsf / 2) * 2;
  const mp4 = path.join(OUT, clip.name + ".mp4");
  cp.execFileSync(FFMPEG, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"),
    "-vf", `scale=${outW}:${outH}:flags=lanczos,fps=15,format=yuv420p`, "-c:v", "libx264", "-preset", "veryslow", "-crf", String(clip.crf || 26),
    "-tune", "stillimage", "-an", "-movflags", "+faststart", mp4]);
  console.log(clip.name, frames.length + " frames", (total / 1000).toFixed(1) + "s", (fs.statSync(mp4).size / 1024).toFixed(0) + "KB");
}

(async () => {
  await new Promise(r => srv.listen(8811, "127.0.0.1", r));
  const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
  const only = process.argv[2];
  try { for (const c of CLIPS) if (!only || c.name === only) await record(b, c); }
  finally { await b.close(); srv.close(); }
})();
