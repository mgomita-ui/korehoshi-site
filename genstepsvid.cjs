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
    + ".ask .askbox{transform:scale(1.2)}"
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
    var p = center(el, fx, fy); await move(p[0], p[1], ms || 700); await sleep(KH.pre == null ? 140 : KH.pre);
    var r = document.createElement("div"); r.className = "kh-rip"; r.style.left = p[0] + "px"; r.style.top = p[1] + "px";
    document.body.appendChild(r); setTimeout(function () { r.remove(); }, 600);
    await sleep(90); el.click();
  }
  function byText(sel, text) { return Array.prototype.filter.call(document.querySelectorAll(sel), function (e) { return e.textContent.indexOf(text) >= 0; })[0]; }
  function mark(el) { if (!el) return; el.classList.remove("kh-new"); void el.offsetWidth; el.classList.add("kh-new"); }
  return { move: move, tap: tap, sleep: sleep, byText: byText, mark: mark, done: false };
})();
`;

// 動画の中の字幕の帯（黒地に白）。画面の下を空けて、そこに1行出す。
//   font … 文字の大きさ（CSS px）、band … 帯の高さ、lift … 帯の下に残す黒の余白（再生コントロールに隠れないように）。
const CAPTION = ({ font, band, lift = 0 }) => `
(function () {
  var st = document.createElement("style");
  st.textContent = "body{height:calc(100dvh - ${band + lift}px)!important}"
    + ".kh-cap{position:fixed;left:0;right:0;bottom:0;height:${band}px;padding-bottom:${lift}px;box-sizing:content-box;background:#111;color:#fff;z-index:2147483645;"
    + "display:flex;align-items:center;gap:${Math.round(font * .8)}px;padding-left:${Math.round(font)}px;padding-right:${Math.round(font)}px;"
    + "font:500 ${font}px/1.25 'Noto Sans JP','Hiragino Sans','Yu Gothic UI','Meiryo',sans-serif;letter-spacing:.02em;white-space:nowrap;overflow:hidden}"
    + ".kh-cap b{font-weight:700;color:#fff}.kh-cap .g{font-size:${Math.round(font * .72 * 10) / 10}px;color:#9aa4b2;border:1px solid #3a3f47;border-radius:4px;padding:2px 7px;flex:none}"
    + ".kh-cap .n{margin-left:auto;font-size:${Math.round(font * .72 * 10) / 10}px;color:#9aa4b2;flex:none}"
    + "#toast{bottom:${band + lift + 10}px!important}";
  document.head.appendChild(st);
  var cap = document.createElement("div"); cap.className = "kh-cap"; document.body.appendChild(cap);
  var n = 0;
  // 1行の字幕。
  KH.cap = function (text) { cap.textContent = text; };
  // 区分・ボタン名・意味の字幕（通しの動画）。ボタン名があるときは番号を振る。
  KH.say = function (group, name, what) {
    if (name) n++;
    cap.innerHTML = '<span class="g">' + group + "</span>" + (name ? "<b>" + name + "</b>：" : "") + "<span>" + what + "</span>"
      + (name ? '<span class="n">' + n + "</span>" : "");
  };
})();
`;

// ── 3つの場面。setup で前の状態を作り、run を時間どおりに流す。KH.done = true で撮り終わり。
const CLIPS = [
  {
    // 01 入ってくる：受信箱に2件届き、経路の絞り込みを押して戻す。
    name: "step1-in", w: 543, h: 407, dsf: 1.4, cropSel: "#states", pre: 500, caption: { font: 14.3, band: 36 },
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
      KH.cap("受信箱：まだ返していないものだけが並ぶ");
      await KH.sleep(1600);
      KH.cap("LINEで届いた連絡が、受信箱に入る");
      await arrive("line:Uaoba001");
      await KH.sleep(1900);
      KH.cap("チャットワークの請求書PDFも、同じ受信箱に入る");
      await arrive("chatwork:R1001");
      await KH.sleep(1900);
      KH.cap("LINE：LINEで届いたものだけに絞る");
      await KH.tap(document.querySelector('#channels [data-c="line"]'), 700);
      await KH.sleep(1400);
      KH.cap("チャット：チャットワークで届いたものだけ");
      await KH.tap(document.querySelector('#channels [data-c="chatwork"]'), 600);
      await KH.sleep(1400);
      KH.cap("すべて：入口をまたいで、1つの一覧で見る");
      await KH.tap(document.querySelector('#channels [data-c=""]'), 600);
      await KH.move(innerWidth * 0.8, innerHeight * 0.75, 500);
      await KH.sleep(1300);
      KH.done = true;
    })()`,
  },
  {
    // 02 取りに行く：会話を開き、AIが読んだ中身（AIの読み）を見て、下書きが入る。
    name: "step2-draft", w: 320, h: 499, dsf: 1.875, pre: 500, caption: { font: 13.6, band: 34 },
    setup: `(async function () {
      // 開いた時点で本体が入れる先回りの下書きを、いったん空にしておき、あとで同じ文を流し込む。
      window.__draft = "";
      // カレンダーに入った表示は 03（送ったあと）で出すので、ここでは出さない。
      CAL = [];
      var inner = window.fetch;
      window.fetch = function (input, init) {
        var url = String(input && input.url ? input.url : input);
        if (url.indexOf("/inbox/api/calendar/auto") >= 0 && url.indexOf("/undo") < 0) return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ entries: [] }); } });
        return inner.apply(window, arguments);
      };
      new MutationObserver(function () {
        var ta = document.getElementById("reply");
        if (ta && !ta.dataset.kh) { ta.dataset.kh = "1"; window.__draft = ta.value; ta.value = ""; }
      }).observe(document.getElementById("detail"), { childList: true, subtree: true });
    })()`,
    run: `(async function () {
      KH.cap("ひまわり製作所の相談を開く");
      await KH.sleep(700);
      await KH.tap(document.querySelector('.thread[data-id="line:Uaoba001"]'), 700, .45, .3);
      await KH.sleep(300);
      KH.cap("やりとりと見積書PDFが並んでいる");
      var m = document.getElementById("msgs"); var end = m.scrollHeight - m.clientHeight;
      m.scrollTop = 0; await KH.sleep(600);
      var t0 = performance.now();
      await new Promise(function (res) { (function s(now) { var k = Math.min(1, (now - t0) / 1700); m.scrollTop = end * k; if (k < 1) requestAnimationFrame(s); else res(); })(t0); });
      await KH.sleep(900);
      KH.cap("AIの読み：要点とやることの候補");
      await KH.tap(document.querySelector('[data-p="ai"]'), 700);
      await KH.sleep(2400);
      KH.cap("返信に戻ると、下書きが入る");
      await KH.tap(document.querySelector('[data-p="reply"]'), 600);
      await KH.sleep(500);
      KH.cap("AIが会話と見積書を読み、下書きを入れた");
      var ta = document.getElementById("reply"), txt = window.__draft, i = 0;
      KH.move(innerWidth * .85, innerHeight * .97, 400);
      await new Promise(function (res) {
        var iv = setInterval(function () {
          i = Math.min(txt.length, i + 4); ta.value = txt.slice(0, i); ta.scrollTop = ta.scrollHeight;
          if (i >= txt.length) { clearInterval(iv); res(); }
        }, 40);
      });
      await KH.sleep(900);
      KH.cap("確かめて、送るのは人");
      await KH.sleep(1500);
      KH.done = true;
    })()`,
  },
  {
    // 03 返すと残る：送信 → 宛先の確認 → 対応済み → やってもらうことに1件入る。
    name: "step3-sent", w: 543, h: 407, dsf: 1.4, pre: 500, caption: { font: 14.3, band: 36 },
    url: "/?thread=line%3AUaoba001",
    setup: `(async function () {
      var D = window.DEMO, id = "line:Uaoba001";
      var th = D.threads.filter(function (t) { return t.id === id; })[0];
      var inner = window.fetch;
      window.fetch = function (input, init) {
        var url = String(input && input.url ? input.url : input);
        if (url.indexOf("/inbox/api/calendar/auto") >= 0 && url.indexOf("/undo") < 0 && !window.__calIsOn) return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ entries: [] }); } });
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
      // カレンダーに入った表示は、送ったあとに出す（それまでは空にしておく）。
      window.__calIsOn = true; window.__cal = (await api("/calendar/auto")).entries || []; window.__calIsOn = false;
      CAL = []; renderCalNote(th);
      window.__calOn = function () { window.__calIsOn = true; CAL = window.__cal.map(function (e) { return Object.assign({}, e, { at: Date.now() }); }); };
      var ta = document.getElementById("reply"); try { ta.setSelectionRange(0, 0); } catch (e) {} ta.scrollTop = 0; ta.blur();
    })()`,
    run: `(async function () {
      KH.cap("AIの下書きを確かめて、送信を押す");
      await KH.sleep(900);
      await KH.tap(document.getElementById("doSend"), 800);
      await KH.sleep(700);
      KH.cap("送る前に、宛先をもう一度確かめる");
      await KH.sleep(1300);
      KH.cap("送信する：ここだけは人が押す");
      await KH.tap(document.querySelector(".ask [data-yes]"), 700);
      await KH.sleep(700);
      KH.cap("送った。この会話は対応済みになった");
      await KH.sleep(1600);
      KH.cap("やってもらうこと：相手待ちの一覧を開く");
      await KH.tap(document.getElementById("tabWaits"), 800);
      document.getElementById("main").classList.add("viewing");
      await KH.sleep(50);
      var row = KH.byText("#detail .task", "送料の扱い");
      KH.mark(row);
      KH.cap("送料の確認が、相手待ちとして残った");
      await KH.sleep(2200);
      // 送った会話に戻ると、決まった日程がカレンダーに入っている。
      window.__calOn();
      KH.cap("会話に戻る");
      await KH.tap(row.querySelector("[data-open]"), 700);
      for (var i = 0; i < 40 && !document.querySelector("#calNote .calnote"); i++) await KH.sleep(50);
      var cn = document.querySelector("#calNote .calnote");
      KH.mark(cn);
      // 光ったあとも、入った1行は淡く色を残す（最後の場面＝ポスターでも分かるように）。
      if (cn) { cn.style.background = "#fff4c2"; cn.style.boxShadow = "inset 4px 0 0 #f5b400"; }
      KH.cap("決まった打ち合わせが、カレンダーに入った");
      var u = document.getElementById("calUndo");
      if (u) { var r = u.getBoundingClientRect(); await KH.move(r.right + 14, r.bottom + 10, 700); }
      await KH.sleep(2600);
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
  // 上の余白（見出しのアイコンや検索欄など）を切って、要る部分だけを撮る。
  let crop = null;
  if (clip.cropSel) {
    const y = await p.evaluate(s => Math.max(0, Math.round(document.querySelector(s).getBoundingClientRect().top - 6)), clip.cropSel);
    await p.setViewport({ width: clip.w, height: clip.h + y, deviceScaleFactor: clip.dsf });
    crop = { x: 0, y, width: clip.w, height: clip.h };
    await sleep(400);
  }
  const shot = o => p.screenshot(crop ? Object.assign({ clip: crop }, o) : o);
  await p.evaluate(() => { window.__order = window.DEMO.threads.map(t => t.id); });
  await p.evaluate(HELPER);
  if (clip.caption) await p.evaluate(CAPTION(clip.caption));
  if (clip.pre != null) await p.evaluate(v => { KH.pre = v; }, clip.pre);
  await p.evaluate(clip.setup);
  await sleep(400);
  const frames = [];
  const t0 = Date.now();
  p.evaluate(clip.run).catch(e => console.error(clip.name, "run error", e.message));
  while (true) {
    const t = Date.now() - t0;
    const f = path.join(dir, String(frames.length).padStart(4, "0") + ".jpg");
    await shot({ path: f, type: "jpeg", quality: 92, optimizeForSpeed: true });
    frames.push({ f, t });
    const st = await p.evaluate(() => { const s = { done: KH.done, snap: KH.snap }; KH.snap = false; return s; });
    // 途中の場面をポスターにするとき（KH.snap = true）。
    if (st.snap) await shot({ path: path.join(OUT, clip.name + ".png") });
    if (st.done) break;
    const wait = 125 - ((Date.now() - t0) - t);
    if (wait > 0) await sleep(wait);
    if (t > (clip.maxMs || 30000)) { console.error("timeout", clip.name); break; }
  }
  const total = Date.now() - t0;
  // ポスター（動かさない人向けの1枚）は最後の場面。カーソルは消して撮る。
  if (!clip.snapPoster) {
    await p.evaluate(() => document.querySelectorAll(".kh-cur,.kh-rip").forEach(e => e.remove()));
    await shot({ path: path.join(OUT, clip.name + ".png") });
  }
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
    "-vf", `${clip.speed ? "setpts=PTS/" + clip.speed + "," : ""}scale=${outW}:${outH}:flags=lanczos:in_range=full:out_range=tv,fps=15,format=yuv420p`, "-c:v", "libx264", "-preset", "veryslow", "-crf", String(clip.crf || 26),
    "-tune", "stillimage", "-color_range", "tv", "-an", "-movflags", "+faststart", mp4]);
  console.log(clip.name, frames.length + " frames", (total / 1000).toFixed(1) + "s", (fs.statSync(mp4).size / 1024).toFixed(0) + "KB");
}

module.exports = { HELPER, CAPTION, record, srv, puppeteer };
if (require.main === module) (async () => {
  await new Promise(r => srv.listen(8811, "127.0.0.1", r));
  const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
  const only = process.argv[2];
  try { for (const c of CLIPS) if (!only || c.name === only) await record(b, c); }
  finally { await b.close(); srv.close(); }
})();
