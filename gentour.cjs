// 見本（demo/）のボタンを最初から最後まで順に押していく「通し」の動画を撮る。
//   node gentour.cjs   → img/tour.mp4 と img/tour.png（ポスター）
// 画面の下の字幕の帯・カーソル・押した瞬間の光りは、撮るときだけページに足すもの（本番の画面には無い）。
// 見本の受け答えは送っても状態が変わらないので、撮るときだけ
// 「送ったら対応済みになり、相手待ちのやることが1件増える」「対応済みにしたら一覧から外れる」をページの中で足している。
// 見本では中身が返らないボタン（取り込み・巡回・接続確認・AIで整理・催促案・文章を直す・下書きを作る など）は押さない。
const { HELPER, record, srv, puppeteer } = require("./genstepsvid.cjs");

const TOUR = {
  name: "tour", w: 714, h: 529, dsf: 1.4, crf: 27, maxMs: 140000, speed: 1.2, snapPoster: true,
  // 字幕の帯は、下に40px（書き出しで56px）の黒い余白を残して上げる。ページの再生コントロールに隠れないように。
  caption: { font: 14.5, band: 40, lift: 40 },
  setup: `(async function () {
    // 押した瞬間の光り。字幕の帯は CAPTION（genstepsvid.cjs）で入れる。
    var st = document.createElement("style");
    st.textContent = ".kh-hit{outline:3px solid rgba(37,99,235,.85)!important;outline-offset:2px;box-shadow:0 0 0 7px rgba(37,99,235,.18)!important;transition:none}";
    document.head.appendChild(st);
    // 押した瞬間にボタンを光らせる（カーソルの波紋とあわせて）。
    KH.tap = async function (el, ms, fx, fy) {
      if (!el) { console.warn("no element"); return; }
      var r = el.getBoundingClientRect();
      var x = r.left + r.width * (fx == null ? .5 : fx), y = r.top + r.height * (fy == null ? .5 : fy);
      await KH.move(x, y, ms || 420);
      await KH.sleep(220);
      var rp = document.createElement("div"); rp.className = "kh-rip"; rp.style.left = x + "px"; rp.style.top = y + "px";
      document.body.appendChild(rp); setTimeout(function () { rp.remove(); }, 600);
      el.classList.add("kh-hit"); setTimeout(function () { el.classList.remove("kh-hit"); }, 650);
      await KH.sleep(40); el.click();
    };
    // 押して、字幕を出して、少し待つ。
    KH.step = async function (group, name, what, el, wait, ms) {
      KH.say(group, name, what);
      if (el) await KH.tap(el, ms);
      await KH.sleep(Math.round((wait == null ? 800 : wait) * 1.3));
    };
    // 送信・対応済みにしたあとの状態を足す（本番ではサーバーがやること）。
    var D = window.DEMO;
    function th(id) { return D.threads.filter(function (t) { return t.id === id; })[0]; }
    var inner = window.fetch;
    window.fetch = function (input, init) {
      var url = String(input && input.url ? input.url : input);
      if (url.indexOf("/inbox/api/calendar/auto") >= 0 && url.indexOf("/undo") < 0 && !window.__calIsOn) return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ entries: [] }); } });
      var post = init && init.method === "POST";
      if (post && /\\/inbox\\/api\\/send$/.test(url)) {
        var b = JSON.parse(init.body || "{}"), t = th(b.id);
        D.detail[b.id].messages.push({ id: 99, direction: "out", kind: "text", body: b.text, created_at: Date.now() });
        t.status = "done"; t.prep_draft = null; t.last_message_at = Date.now(); t.last_preview = b.text;
        var d3 = new Date(Date.now() + 9 * 3600e3); d3.setUTCDate(d3.getUTCDate() + 3); d3.setUTCHours(9, 0, 0, 0);
        D.tasks.unshift({ id: 201, thread_id: b.id, title: "分納の条件（送料の扱い）を日向さんに確認してもらう",
          due_at: d3.getTime() - 9 * 3600e3, done: 0, created_at: Date.now(), side: "theirs", est_min: null, plan_at: null });
      }
      if (post && /\\/inbox\\/api\\/status$/.test(url)) {
        var s = JSON.parse(init.body || "{}"); if (th(s.id)) th(s.id).status = s.status;
      }
      return inner.apply(window, arguments);
    };
    // カレンダーに入った表示は、送ったあとに出す。
    window.__calIsOn = true; window.__cal = (await api("/calendar/auto")).entries || []; window.__calIsOn = false;
    CAL = [];
    window.__calOn = function () { window.__calIsOn = true; CAL = window.__cal.map(function (e) { return Object.assign({}, e, { at: Date.now() }); }); };
    KH.say("見本", "", "これほしの受信箱（架空のデータ）。ボタンを順に押していきます");
  })()`,
  run: `(async function () {
    var $ = function (s) { return document.querySelector(s); };
    var L = "一覧", C = "会話", R = "返信", T = "やること", H = "右上";
    // 字幕を出さずに押すだけ（閉じる・戻すなど）。
    async function quiet(el) { await KH.tap(el, 300); await KH.sleep(150); }
    await KH.sleep(1400);

    // ── 一覧の絞り込み
    await KH.step(L, "要対応", "まだ返していないもの・催促どきのものだけ", $('#states [data-s="todo"]'), 900);
    await KH.step(L, "タスク", "やることが残っている会話", $('#states [data-s="task"]'), 700);
    await KH.step(L, "他人", "相手にやってもらうことが残っている会話", $('#states [data-ts="theirs"]'), 800);
    await KH.step(L, "アーカイブ", "片付けた会話。念のためここで見直せる", $('#states [data-s="archived"]'), 800);
    await KH.step(L, "すべて", "片付けたものも含めた全件。探すときに", $('#states [data-s="all"]'), 800);
    await quiet($('#states [data-s="todo"]'));
    await KH.step(L, "LINE", "LINEで届いたものだけに絞る", $('#channels [data-c="line"]'), 650);
    await KH.step(L, "チャット", "チャットワークで届いたものだけ", $('#channels [data-c="chatwork"]'), 650);
    await KH.step(L, "メール", "メールで届いたものだけ", $('#channels [data-c="gmail"]'), 650);
    await KH.step(L, "議事録", "会議の議事録から拾ったもの（いまは0件）", $('#channels [data-c="minutes"]'), 650);
    await quiet($('#channels [data-c=""]'));
    var cat = $("#category");
    await KH.step(L, "区分", "問い合わせ・見積・日程調整など、AIが付けた区分で絞る", cat, 200);
    cat.value = "見積・料金"; cat.dispatchEvent(new Event("change", { bubbles: true }));
    await KH.sleep(900);
    cat.value = ""; cat.dispatchEvent(new Event("change", { bubbles: true }));
    await KH.step(L, "検索欄", "本文・相手・メモから探す", $("#q"), 700);
    $("#q").blur();
    await KH.step(L, "本日を閉じる", "返し忘れ・催促どきが残っていないかを点検する", $("#closeDay"), 1300);
    await quiet($(".ask [data-yes]"));
    await KH.step(L, "今日の自動処理", "AIが自動でやったこと（予定に入れた・一覧から外した など）", $("#autoToggle"), 1300);
    await quiet($("#autoToggle"));

    // ── 会話
    await KH.step(C, "会話を開く", "やりとりと添付が、届いた順に並ぶ", $('.thread[data-id="line:Uaoba001"]'), 1000);
    await KH.step(C, "状況", "AIの判定・担当・行き先。開くと理由が出る", $("#sit summary"), 1100);
    await quiet($("#sit summary"));
    await KH.step(C, "設定", "受信箱での別名・主担当を変える（宛先は変わらない）", $("#thSet summary"), 1000);
    await quiet($("#thSet summary"));
    await KH.step(C, "AIの読み", "この件の要点と、やることの候補", $('[data-p="ai"]'), 1400);
    await KH.step(C, "やること", "この会話で、自分がやること", $('[data-p="tasks"]'), 900);
    await KH.step(C, "やってもらうこと", "この会話で、相手に頼んで待っているもの", $('[data-p="waits"]'), 900);
    await KH.step(C, "メモ", "相手ごとの覚え書き。AIは書き換えない", $('[data-p="note"]'), 1000);
    var rd = $("#msgs [data-read]"); if (rd) rd.scrollIntoView({ block: "center" });
    await KH.step(C, "AIに読ませる", "添付のPDFをAIが読み、要点をメモに残す", rd, 1200);
    await KH.step(C, "返信", "AIが用意した下書きが、最初から入っている", $('[data-p="reply"]'), 600);
    KH.snap = true;
    await KH.sleep(600);

    // ── 返信欄
    await KH.step(R, "絵文字", "絵文字を入れる", $("#btnEmoji"), 700);
    await KH.step(R, "AIに下書き", "指示を書いて、下書きを作り直す・3案を出す", $("#btnAi"), 1000);
    await KH.step(R, "添付", "ファイルやスクショを添えて送る", $("#btnFile"), 900);
    await KH.step(R, "AIに指示", "資料を探す・添付を用意するなどを頼む（AIは送信しない）", $("#btnCmd"), 1100);
    await quiet($("#btnCmd"));
    var ta = $("#reply");
    KH.say(R, "下書きの編集", "送る前に、そのまま直せる");
    await KH.tap(ta, 350, .5, .5);
    ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); ta.scrollTop = ta.scrollHeight;
    var add = String.fromCharCode(10) + "引き続きよろしくお願いいたします。";
    for (var i = 1; i <= add.length; i++) { ta.value += add.charAt(i - 1); ta.scrollTop = ta.scrollHeight; await KH.sleep(45); }
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    await KH.sleep(500);
    await KH.step(R, "送信", "送る前に、宛先と本文を確かめる画面が出る", $("#doSend"), 1200);
    await KH.step(R, "送信する", "ここだけは人が押す", $(".ask [data-yes]"), 1500);

    // ── 対応済みにする（返事が要らない件）
    await KH.step(C, "←", "一覧に戻る", $("#back"), 500);
    await KH.step(C, "会話を開く", "山吹物流の請求書。受け取りの一言で済む件", $('.thread[data-id="chatwork:R1001"]'), 900);
    await KH.step(C, "対応済みにする", "返事が要らないものを一覧から片付ける", $("#doArchive"), 1300);

    // ── やることの画面
    await KH.step(T, "やること", "自分がやることの一覧。ここが空なら今日の仕事は終わり", $("#tabTasks"), 1200);
    await KH.step(T, "今日", "今日やると決めたものだけ", $('[data-tv="today"]'), 800);
    await KH.step(T, "見直し", "溜まったものを、週に1回決め直す", $('[data-tv="review"]'), 1100);
    var bt = $("#backToTasks"); if (bt) await quiet(bt);
    await quiet($('[data-tv="all"]'));
    await KH.step(T, "グループ", "相手ごとに絞る", $("#gfBtn"), 1000);
    await quiet($("#gfBtn"));
    await KH.step(T, "やってもらうこと", "相手待ちの一覧。いま送った件が入り、確認日に要対応へ戻る", $("#tabWaits"), 500);
    var wrow = KH.byText("#detail .task", "送料の扱い");
    KH.mark(wrow);
    await KH.sleep(1300);
    window.__calOn();
    await KH.step(T, "会話名", "その会話に戻る", wrow.querySelector("[data-open]"), 0);
    for (var ci = 0; ci < 40 && !$("#calNote .calnote"); ci++) await KH.sleep(50);
    var cn = $("#calNote .calnote"); KH.mark(cn);
    if (cn) { cn.style.background = "#fff4c2"; cn.style.boxShadow = "inset 4px 0 0 #f5b400"; }
    KH.say(C, "カレンダー", "決まった日程は予定に入る。違えば［取り消す］で戻せる");
    var cu = $("#calUndo"); if (cu) { var cr = cu.getBoundingClientRect(); await KH.move(cr.right + 14, cr.bottom + 10, 450); }
    await KH.sleep(2000);

    // ── 右上のアイコン
    await KH.step(H, "ダイジェスト", "未対応・約束・相手待ちを1枚にまとめる", $("#digest"), 1500);
    await KH.step(H, "貼って下書き", "つないでいない窓口の文面を貼り、下書きを作る", $("#paste"), 1300);
    await KH.step(H, "その他", "取り込み・設定・接続確認", $("#moreBtn"), 800);
    await KH.step(H, "きまり", "書き方の作法。下書きはこれに沿う", $("#houseNote"), 1400);
    await quiet($("#moreBtn"));
    await KH.step(H, "事業", "受信箱の仕切りと、それぞれのあいさつ文", $("#accounts"), 1300);
    await quiet($("#moreBtn"));
    await KH.step(H, "機能", "使う機能を選ぶ（保留・まとめ処理など）", $("#featuresBtn"), 1300);
    await quiet($("#moreBtn"));
    await KH.step(H, "文字の大きさ", "やりとりの文字を5段階で切り替える", $("#fontBtn"), 900);
    $("#more").classList.remove("open");
    await KH.step(H, "やりとり", "受信箱に戻る", $("#tabInbox"), 1000);
    KH.say("見本", "", "返す準備はAI。送るのは人。");
    await KH.move(innerWidth * 0.8, innerHeight * 0.7, 500);
    await KH.sleep(1600);
    KH.done = true;
  })()`,
};

(async () => {
  await new Promise(r => srv.listen(8811, "127.0.0.1", r));
  const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
  try { await record(b, TOUR); }
  finally { await b.close(); srv.close(); }
})();
