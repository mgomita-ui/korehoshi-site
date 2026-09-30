/**
 * 朝の3問と、今日の段取り（［機能］の「morning」）。
 *
 * 朝いちばんに、昨夜のお酒・寝た時間・いまの頭の状態を、ボタンだけで聞く（文字は打たせない）。
 * 答えと今日の予定の空きから、大事な判断・瞑想・仮眠の時間を提案する。
 *   - お酒と寝た時間は、昨夜の最後の予定と、最後に返信を確定した時刻から推測して先に選んでおく。
 *     当たっている日は、頭の状態を1回押すだけで終わる。
 *   - 予定に入れるのは、人が［予定に入れる］を押したときだけ。相手は招待しない。
 *   - 答えは本人だけに残す。会社側の画面には出さない。
 *
 * 画面本体のダイジェストが morningMount(#msgs) を呼ぶ。api / esc / toast / state は本体のもの。
 * 窓口：GET /morning → { answer, last, lastSent, guess, events, decisions }、POST /morning（答え）、
 *       POST /calendar/add（{ title, start, end }）
 */
(function () {
  var DRINK = [["none", "なし"], ["some", "少し（1〜2杯）"], ["much", "多め（3杯以上）"]];
  var BED = [["-23", "〜23時", 22.75, -99, 23], ["23-24", "23〜24時", 23.5, 23, 24],
             ["0-1", "0〜1時", 24.5, 24, 25], ["1-", "1時以降", 25.5, 25, 99]];
  var HEAD = [["good", "すっきり"], ["normal", "ふつう"], ["heavy", "重い"]];

  var css = document.createElement("style");
  css.textContent = [
    ".mq { border:1px solid var(--line); border-radius:12px; background:var(--card); padding:14px 14px 12px; margin:0 0 16px; }",
    ".mq-h { display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; }",
    ".mq-h b { font-size:15px; }",
    ".mq-h .hint { flex:1; min-width:12em; }",
    ".mq-skip { border:0; background:transparent; color:var(--muted); font-size:12px; cursor:pointer; text-decoration:underline; padding:0; }",
    ".mq-guess { font-size:12px; color:var(--muted); background:var(--bg); border-radius:8px; padding:8px 10px; margin:10px 0 4px; line-height:1.6; }",
    ".mq-q { display:grid; grid-template-columns:7.5em minmax(0,1fr); gap:6px 10px; align-items:start; padding:9px 0; border-bottom:1px solid var(--line); }",
    ".mq-q:last-of-type { border-bottom:0; }",
    ".mq-l { font-size:13px; font-weight:600; padding-top:5px; }",
    ".mq-l small { display:block; font-weight:400; color:var(--muted); font-size:11px; }",
    ".mq-c { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }",
    ".mq-chip { border:1px solid var(--line); background:var(--card); color:var(--fg); border-radius:999px; padding:6px 13px; font-size:13px; cursor:pointer; line-height:1.3; }",
    ".mq-chip[aria-pressed=true] { background:var(--accent); border-color:var(--accent); color:#fff; font-weight:600; }",
    ".mq-chip .g { font-size:10px; margin-left:5px; padding:0 5px; border-radius:6px; background:rgba(255,255,255,.3); }",
    ".mq-chip[aria-pressed=false] .g { background:var(--bg); color:var(--muted); }",
    ".mq select { font-size:13px; padding:5px 8px; border:1px solid var(--line); border-radius:8px; background:var(--card); color:var(--fg); }",
    ".mq-sum { display:flex; flex-wrap:wrap; gap:6px 10px; align-items:center; font-size:13px; color:var(--muted); margin:8px 0 2px; }",
    ".mq-sum b { color:var(--fg); font-weight:600; }",
    ".mq-plan { margin-top:10px; }",
    ".mq-plan .lead { font-size:14px; }",
    ".mq-row { display:grid; grid-template-columns:4.2em minmax(0,1fr) auto; gap:10px; align-items:start; padding:10px 0; border-bottom:1px solid var(--line); }",
    ".mq-row:last-child { border-bottom:0; }",
    ".mq-t { font-variant-numeric:tabular-nums; font-weight:700; font-size:14px; padding-top:1px; }",
    ".mq-row .what { font-weight:600; font-size:14px; }",
    ".mq-row .sub { color:var(--muted); font-size:12.5px; line-height:1.6; margin-top:2px; }",
    ".mq-add { border:1px solid var(--accent); color:var(--accent); background:transparent; border-radius:8px; padding:5px 10px; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap; }",
    ".mq-add.done { border-color:var(--line); color:var(--muted); cursor:default; }",
    ".mq-foot { font-size:11.5px; color:var(--muted); line-height:1.6; margin:8px 0 0; }",
    "@media (max-width:520px) { .mq-q { grid-template-columns:1fr; } .mq-l { padding-top:0; }",
    "  .mq-row { grid-template-columns:3.6em minmax(0,1fr); } .mq-add { grid-column:2; justify-self:start; } }",
  ].join("\n");
  document.head.appendChild(css);

  var m = { data: null, ans: null, edit: false, touched: {} };

  function hm(h) {
    var H = Math.floor(h + 1e-6), M = Math.round((h - H) * 60);
    if (M === 60) { H++; M = 0; }
    return (H % 24) + ":" + ("0" + M).slice(-2);
  }
  function hr(s) { var p = String(s).split(":"); return +p[0] + (+p[1] || 0) / 60; }
  function ceil5(h) { return Math.ceil(h * 12 - 1e-6) / 12; }
  function nowH() { var d = new Date(); return d.getHours() + d.getMinutes() / 60; }
  function drinkOn() { return (state.features || {}).morningDrink !== false; }
  function bedChip(b) { for (var i = 0; i < BED.length; i++) if (b >= BED[i][3] && b < BED[i][4]) return BED[i]; return BED[1]; }
  function label(list, v) { for (var i = 0; i < list.length; i++) if (list[i][0] === v) return list[i][1]; return ""; }

  // 予定の空きのうち、from〜to のあいだで len 時間とれる最初の時刻。
  function free(evs, from, to, len) {
    var t = ceil5(from);
    for (var i = 0; i < evs.length; i++) {
      var e = evs[i];
      if (e.e <= t) continue;
      if (e.s >= to) break;
      if (e.s - t >= len) return t;
      t = Math.max(t, ceil5(e.e));
    }
    return to - t >= len ? t : null;
  }

  // 答えと予定から、今日の段取りを組む。医療の判断はしない。一般的な目安だけを置く。
  function plan(a, d) {
    var n = nowH(), morning = n >= 4 && n < 11;
    var wake = morning ? n : 7.5, base = morning ? ceil5(n) : 8;
    var sleep = wake + 24 - a.bed;
    var s = 0;
    if (sleep < 6) s += 2; else if (sleep < 7) s += 1;
    if (a.head === "heavy") s += 2; else if (a.head === "normal") s += 1;
    if (drinkOn()) { if (a.drink === "much") s += 2; else if (a.drink === "some") s += 1; }
    var level = s <= 1 ? "good" : s <= 3 ? "mid" : "low";
    var evs = d.events.map(function (e) { return { s: hr(e.start), e: hr(e.end), title: e.title }; })
      .sort(function (x, y) { return x.s - y.s; });
    var first = evs.filter(function (e) { return e.s >= base; })[0];
    var rows = [], t;

    t = free(evs, base, base + 3, 5 / 60);
    if (t != null) rows.push({ t: t, what: "朝の5分（ひといき）",
      sub: (first ? "最初の予定（" + hm(first.s) + " " + first.title + "）の前に、" : "") + "姿勢と呼吸を整えて、今日の一つを決める。",
      add: { title: "朝の5分（ひといき）", start: t, end: t + 5 / 60 } });

    var key = null;
    (d.decisions || []).forEach(function (k) { if (k.id === a.key) key = k; });
    if (key && key.at) {
      t = hr(key.at) - 10 / 60;
      rows.push({ t: t, what: "決める前の1分",
        sub: key.at + "「" + key.label + "」の前に。いちばん大事にする基準を一つだけ決めてから臨む。"
          + (level === "low" ? "決めきれなければ、持ち帰る選択肢も残しておく。" : ""),
        add: { title: "決める前の1分（" + key.label + "）", start: t, end: t + 5 / 60 } });
    } else {
      var from = level === "good" ? base + 0.25 : Math.max(base, 10);
      t = free(evs, from, 12.5, 0.75);
      if (t == null) t = free(evs, 15, 18, 0.75);
      if (t != null) {
        var what = key ? "「" + key.label + "」を考える（45分）" : "判断の要る仕事をまとめて片付ける（45分）";
        rows.push({ t: t, what: what,
          sub: level === "good" ? "頭が冴えている午前のうちに。" : "起きてすぐより、頭が温まってからのほうが決めやすい時間です。",
          add: { title: key ? key.label : "判断の要る仕事", start: t, end: t + 0.75 } });
      }
    }

    if (level === "low" || a.head === "heavy" || sleep < 6.5) {
      t = free(evs, 13, 15, 25 / 60); // 昼食のあと、15時まで
      if (t != null) rows.push({ t: t, what: "仮眠 15分",
        sub: "15時までに、20分を超えないように。座ったまま目を閉じるだけでも十分です。",
        add: { title: "仮眠（15分）", start: t, end: t + 0.25 } });
      else {
        t = free(evs, 12, 17, 5 / 60);
        if (t != null) rows.push({ t: t, what: "目を閉じて3分",
          sub: "仮眠をとれる空きがありません。予定の合間に3分だけ、手と目を休める。",
          add: { title: "目を閉じて3分", start: t, end: t + 5 / 60 } });
      }
    } else {
      t = free(evs, 15, 17.5, 5 / 60);
      if (t != null) rows.push({ t: t, what: "集中の3分",
        sub: "午後のひと区切りに、3分だけ手を止める。",
        add: { title: "集中の3分（ひといき）", start: t, end: t + 5 / 60 } });
    }

    rows.sort(function (x, y) { return x.t - y.t; });
    if (a.bed >= 24 || (drinkOn() && a.drink === "much")) {
      rows.push({ t: null, what: "今夜は23時台に休む",
        sub: "昨夜は" + bedChip(a.bed)[1] + "の就寝でした。22時以降に届いた連絡は、下書きだけ作って明朝に送るのがおすすめです。", add: null });
    }
    var lead = level === "good" ? "よく眠れて頭もすっきりとの答えなので、大事な判断は午前に入れる案にしました。"
      : level === "mid" ? "ふつうの朝との答えなので、大事な判断の前に1分の瞑想を入れる案にしました。"
      : "寝不足や頭の重さの答えから、大事な判断は10時以降にし、昼過ぎに15分の仮眠を入れる案にしました。";
    if (level === "mid" && a.head === "heavy") lead = "頭が重いとの答えだったので、昼過ぎに15分の仮眠を提案します。";
    return { lead: lead, sleep: sleep, wake: wake, morning: morning, rows: rows };
  }

  function chips(name, list, cur, guess) {
    return list.map(function (o) {
      var on = o[0] === cur;
      return '<button type="button" class="mq-chip" data-q="' + name + '" data-v="' + esc(o[0]) + '" aria-pressed="' + on + '">'
        + esc(o[1]) + (guess != null && o[0] === guess && !m.touched[name] ? '<span class="g">推定</span>' : "") + "</button>";
    }).join("");
  }

  function save() { api("/morning", { method: "POST", body: JSON.stringify(m.ans) }); }

  function render() {
    var box = document.getElementById("mq");
    if (!box) return;
    var d = m.data, a = m.ans;
    var h = '<div class="mq-h"><b>朝の3問</b><span class="hint">ボタンだけで答えられます。答えはご本人だけに残ります。</span>';
    if (a.skip) {
      box.innerHTML = h + "</div>" + '<p class="mq-foot">今日の3問はお休みにしました。 <button class="mq-skip" data-act="unskip">やっぱり答える</button></p>';
      return;
    }
    h += '<button class="mq-skip" data-act="skip">今日はお休み</button></div>';
    var done = !!a.head;
    if (!done || m.edit) {
      h += '<p class="mq-guess">昨夜は「' + esc(d.last.title) + "」が" + esc(d.last.end) + "まで、最後に返信を確定したのは"
        + esc(d.lastSent) + "でした。「推定」の印は、そこから先に選んでおいた答えです。違えば押し直してください。</p>";
      if (drinkOn()) h += '<div class="mq-q"><span class="mq-l">昨夜のお酒</span><div class="mq-c">'
        + chips("drink", DRINK, a.drink, d.guess.drink) + "</div></div>";
      var bc = bedChip(a.bed), opts = "";
      for (var x = 21; x <= 27.01; x += 0.5) opts += '<option value="' + x + '"' + (Math.abs(x - a.bed) < 0.01 ? " selected" : "") + ">" + hm(x) + "</option>";
      h += '<div class="mq-q"><span class="mq-l">寝た時間</span><div class="mq-c">'
        + chips("bed", BED, bc[0], bedChip(d.guess.bed)[0])
        + '<select data-q="bedExact" aria-label="寝た時刻を細かく選ぶ"><option value="">時刻で選ぶ</option>' + opts + "</select></div></div>";
      h += '<div class="mq-q"><span class="mq-l">いまの頭</span><div class="mq-c">' + chips("head", HEAD, a.head, null) + "</div></div>";
      h += '<div class="mq-q"><span class="mq-l">今日いちばん大事な判断<small>任意</small></span><div class="mq-c">'
        + chips("key", (d.decisions || []).map(function (k) { return [k.id, k.label]; }).concat([["none", "特になし"]]), a.key, null)
        + "</div></div>";
    } else {
      var kl = "";
      (d.decisions || []).forEach(function (k) { if (k.id === a.key) kl = k.label; });
      h += '<div class="mq-sum">'
        + (drinkOn() ? "<span>お酒 <b>" + esc(label(DRINK, a.drink)) + "</b></span>" : "")
        + "<span>寝た時間 <b>" + hm(a.bed) + "ごろ</b></span>"
        + "<span>頭 <b>" + esc(label(HEAD, a.head)) + "</b></span>"
        + (kl ? "<span>大事な判断 <b>" + esc(kl) + "</b></span>" : "")
        + '<button class="mq-skip" data-act="edit">直す</button></div>';
    }
    if (done) {
      var p = plan(a, d);
      h += '<div class="mq-plan dg"><div class="lead">' + esc(p.lead)
        + '<br><span class="hint">眠れた時間は約' + (Math.round(p.sleep * 2) / 2) + "時間（" + hm(a.bed) + "〜"
        + hm(p.wake) + (p.morning ? "。起きた時刻は、答えた時刻からの推定" : "。起きた時刻は7:30として計算") + "）</span></div>";
      h += "<h3>今日の段取り（提案）</h3>";
      h += p.rows.map(function (r, i) {
        var added = r.add && (a.added || []).indexOf(r.add.title) >= 0;
        return '<div class="mq-row"><span class="mq-t">' + (r.t == null ? "夜" : hm(r.t)) + "</span>"
          + '<div><div class="what">' + esc(r.what) + '</div><div class="sub">' + esc(r.sub) + "</div></div>"
          + (r.add ? '<button type="button" class="mq-add' + (added ? " done" : "") + '" data-add="' + i + '"' + (added ? " disabled" : "") + ">"
            + (added ? "入れました ✓" : "予定に入れる") + "</button>" : "<span></span>") + "</div>";
      }).join("");
      h += '<p class="mq-foot">予定の空きからの提案です。カレンダーに入れるのは［予定に入れる］を押したときだけで、相手は招待しません。'
        + "体調がすぐれないときは、無理をせず休むことを優先してください。</p></div>";
      m.rows = p.rows;
    }
    box.innerHTML = h;
  }

  function onClick(ev) {
    var c = ev.target.closest(".mq-chip");
    if (c) {
      var q = c.dataset.q, v = c.dataset.v;
      m.touched[q] = true;
      if (q === "bed") { BED.forEach(function (b) { if (b[0] === v) m.ans.bed = b[2]; }); }
      else if (q === "key") m.ans.key = m.ans.key === v ? null : v;
      else m.ans[q] = v;
      if (q === "head") m.edit = false;
      save(); render(); return;
    }
    var b = ev.target.closest("[data-act]");
    if (b) {
      var act = b.dataset.act;
      if (act === "skip") m.ans.skip = true;
      if (act === "unskip") m.ans.skip = false;
      if (act === "edit") m.edit = true;
      if (act !== "edit") save();
      render(); return;
    }
    var add = ev.target.closest("[data-add]");
    if (add && !add.disabled && m.rows) {
      var r = m.rows[+add.dataset.add];
      add.disabled = true; add.textContent = "入れています…";
      api("/calendar/add", { method: "POST", body: JSON.stringify({ title: r.add.title, start: hm(r.add.start), end: hm(r.add.end) }) })
        .then(function (res) {
          if (res && res.error) { toast(res.error); render(); return; }
          m.ans.added = (m.ans.added || []).concat([r.add.title]);
          save(); render();
          toast("カレンダーに入れました（" + hm(r.add.start) + "〜" + hm(r.add.end) + "。相手は招待しません）");
        });
    }
  }
  function onChange(ev) {
    var s = ev.target.closest('[data-q="bedExact"]');
    if (!s || !s.value) return;
    m.touched.bed = true; m.ans.bed = +s.value; save(); render();
  }

  window.morningMount = function (el) {
    if (!(state.features || {}).morning) return;
    var box = document.createElement("div");
    box.className = "mq"; box.id = "mq";
    box.innerHTML = '<p class="hint">朝の3問を用意しています…</p>';
    el.insertBefore(box, el.firstChild);
    box.addEventListener("click", onClick);
    box.addEventListener("change", onChange);
    api("/morning").then(function (d) {
      if (!d || d.error) { box.remove(); return; }
      m.data = d;
      m.ans = d.answer || { drink: d.guess.drink, bed: d.guess.bed, head: null, key: null, added: [] };
      if (!m.ans.bed) m.ans.bed = d.guess.bed;
      render();
    });
  };

  // 朝いちばん（11時まで）、まだ答えていなければダイジェストを開いて3問を出す。
  // 会話やタブを指定して開いたときは邪魔をしない。見本では ?morning=1 で時刻に関係なく出す。
  var qs = new URLSearchParams(location.search), force = qs.get("morning") === "1";
  var tries = 0;
  (function wait() {
    if (!state.features || !Object.keys(state.features).length) { if (++tries < 30) setTimeout(wait, 200); return; }
    if (!state.features.morning) return;
    if (!force && (location.search.replace(/^\?/, "") !== "" || nowH() >= 11 || nowH() < 4)) return;
    api("/morning").then(function (d) {
      if (d && !d.error && (force || !d.answer)) document.getElementById("digest").click();
    });
  })();
})();
