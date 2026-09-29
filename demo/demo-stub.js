/**
 * 見本（デモ）用の受け答え。window.fetch を差し替えて、
 * /inbox/api/… へのリクエストに作り物のJSONを返す。
 *
 * サーバーには一切つながらない。本番（Workers）も、D1も、KVも触らない。
 * 知らないパスは { ok:true } を返す。画面が例外で止まらないようにするため。
 */
(function () {
  var D = window.DEMO;

  function thread(id) {
    for (var i = 0; i < D.threads.length; i++) if (D.threads[i].id === id) return D.threads[i];
    return null;
  }

  function threadPayload(id) {
    var t = thread(id);
    if (!t) return { error: "見つかりません" };
    var d = D.detail[id] || { speakers: [], note: { human: "", ai: "" }, messages: [] };
    // 画面は Message の欄が全部あるつもりで読む。抜けを埋めておく。
    var messages = d.messages.map(function (m) {
      return {
        id: m.id, thread_id: id, direction: m.direction, kind: m.kind,
        body: m.body == null ? null : m.body,
        external_id: m.external_id == null ? null : m.external_id,
        file_name: m.file_name == null ? null : m.file_name,
        created_at: m.created_at,
        speaker_id: m.speaker_id == null ? null : m.speaker_id,
        speaker_name: m.speaker_name == null ? null : m.speaker_name,
      };
    });
    var tasks = D.tasks.filter(function (k) { return k.thread_id === id; });
    return { thread: t, messages: messages, note: d.note, tasks: tasks, speakers: d.speakers };
  }

  // 見本の日付（今日から数えた日の、決まった時刻）。
  function DEMO_NEXT(time, days) {
    var d = new Date(Date.now() + 9 * 3600e3 + (days || 14) * 86400e3);
    return d.toISOString().slice(0, 10) + time;
  }

  function param(query, name) {
    var m = new RegExp("[?&]" + name + "=([^&]*)").exec(query || "");
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
  }

  function route(path, query, method, body) {
    // 朝の3問。答えはこの画面を開いているあいだだけ覚えておく（見本なので保存しない）。
    if (path === "/morning") {
      if (method === "GET") {
        var M = D.morning;
        return { answer: D.morningAnswer || null, last: M.last, lastSent: M.lastSent, guess: M.guess,
                 events: M.events, decisions: M.decisions };
      }
      try { D.morningAnswer = JSON.parse(body || "{}"); } catch (e) {}
      return { ok: true };
    }
    if (path === "/calendar/add") return { ok: true };
    if (path === "/threads") {
      return {
        threads: D.threads, tasks: D.tasks, categories: D.categories,
        tones: D.tones, accounts: D.accounts, features: D.features,
      };
    }
    if (path === "/thread") return threadPayload(param(query, "id"));
    if (path === "/quieted") return { threads: D.quieted };
    if (path === "/prep-set") {
      if (method !== "GET") return { ok: true };
      return { set: D.prepset[param(query, "id")] || null };
    }
    if (path === "/features") {
      return method === "GET"
        ? { features: D.features, senders: ["no-reply@example-mail.invalid"] }
        : { ok: true, features: D.features };
    }
    if (path === "/accounts") {
      return {
        accounts: D.accounts,
        origin: "https://example.invalid",
        defaults: { welcome: "友だち追加ありがとうございます😊", ack: "ご連絡承りました。後ほど返信させていただきます。" },
      };
    }
    if (path === "/close-check") {
      return {
        open: ["株式会社ひまわり製作所 購買 日向さん", "さくらデザイン × ミナト商事",
               "山吹物流 経理 山吹さん", "桜井", "展示会 実行委員"],
        overdueMine: [],
        dueWaits: ["契約書に押印して戻してもらう（内田 千尋）"],
        unsent: ["展示会 実行委員（本文とパンフ案3枚）"],
      };
    }
    if (path === "/weekly") {
      return {
        overdueMine: [],
        longWaits: [{ id: 105, title: "契約書に押印して戻してもらう（内田 千尋）",
                      thread: "chatwork:R1002", threadName: "ミナト商事 社内" }],
        holds: [],
        staleMine: [{ id: 104, title: "展示会の当日スタッフの割り当てを決める", thread: null, threadName: null }],
        staleOpen: [],
        unknownLead: [],
      };
    }
    if (path === "/digest") {
      return {
        headline: "今日は要対応が6件。うち2件は今日中に返したいものです。",
        promises: [
          { due: "本日 18:00", overdue: false, who: "株式会社ひまわり製作所 日向さん", what: "分納用の見積書を返す" },
          { due: "9月25日", overdue: false, who: "桜井さま", what: "前回の打ち合わせ資料を更新する" },
        ],
        waiting: [
          { who: "内田 千尋", what: "契約書の押印（催促どき）" },
          { who: "さくらデザイン 桜さん", what: "ロゴ案の修正版" },
        ],
        notes: ["請求書はAIに読ませる前に、社内でひと声かける決まりです。"],
        open: D.threads.filter(function (t) { return t.status === "open"; }).map(function (t) {
          return { id: t.id, name: t.display_name, summary: t.summary, kind: t.route_kind, weight: t.route_weight };
        }),
      };
    }
    if (path === "/search") return { hits: [] };
    if (path === "/house-note") {
      return {
        account: param(query, "account") || "common",
        body: "・文の途中で改行しない\n・Markdownの記号は使わない\n"
          + "・急ぎと言われたら、いつまでに返すかを必ず書く\n・納期や金額の可否は断定せず、確認事項を挙げる",
      };
    }
    if (path === "/rules/pending") return { rules: [] };
    if (path === "/viewing") return method === "GET" ? { viewing: null } : { ok: true };
    // ── 2026-09-23 に足した窓口（見本用の作り物） ──
    if (path === "/health") return { warn: [] };
    if (path === "/people") return { people: ["内田 千尋", "日向 由紀", "桜 佳代", "山吹 理恵", "堀 健一", "新谷 美和"] };
    if (path === "/auto-dest") {
      return { ops: [
        { id: "d1", at: Date.now() - 3600e3, threadId: "chatwork:R1002", thread: "ミナト商事 社内", kind: "wait",
          who: "内田 千尋", task: "契約書に押印して戻してもらう", reason: "こちらは返し終えていて、押印待ち" },
        { id: "d2", at: Date.now() - 7200e3, threadId: "line:Utsubame005", thread: "つばめ運送 燕さん", kind: "noreply",
          who: "", task: "", reason: "お礼で話が閉じている" },
      ] };
    }
    if (path === "/task-ops") {
      return { ops: [
        { id: "o1", at: Date.now() - 5400e3, kind: "close", threadId: "line:Uaoba001", thread: "株式会社ひまわり製作所 購買 日向さん",
          taskId: 901, title: "見積書を受け取る", why: "日向さんから見積書のPDFが届いた" },
        { id: "o2", at: Date.now() - 9000e3, kind: "revise", threadId: "line:Chikari002", thread: "さくらデザイン × ミナト商事",
          taskId: 902, title: "ロゴ案を確認する", newTitle: "部数と予算を決める", why: "ロゴ案が届いたので次の作業に書き直し" },
      ] };
    }
    var ASK = { threadId: "gmail:mail-7001", name: "桜井", title: "【打ち合わせ】桜井さま 次回の打ち合わせ",
                start: DEMO_NEXT("T14:00"), end: DEMO_NEXT("T16:00"), location: "ミナト商事 会議室",
                missing: "", basis: "桜井さま「10月8日（木）14時からでお願いします」に、こちらが了承", at: Date.now() - 600e3 };
    if (path === "/calendar/asks") return { asks: [ASK] };
    if (path === "/calendar/ask") return method === "GET" ? { ask: param(query, "id") === ASK.threadId ? ASK : null } : { ok: true };
    if (path === "/calendar/auto") {
      return { entries: [{ threadId: "line:Uaoba001", name: "株式会社ひまわり製作所 総務 日向さん", title: "【WEB】ひまわり製作所 日向さま 定例打合せ",
                           start: DEMO_NEXT("T10:00", 7), end: DEMO_NEXT("T11:00", 7), location: "Zoom", eventId: "ev1", moved: false, at: Date.now() - 86400e3 }] };
    }
    return { ok: true };
  }

  var realFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = String(input && input.url ? input.url : input);
    var method = (init && init.method) || "GET";
    var cut = url.indexOf("/inbox/api");
    if (cut < 0) return realFetch ? realFetch.apply(window, arguments) : Promise.reject(new Error("no fetch"));
    var rest = url.slice(cut + "/inbox/api".length);
    var q = rest.indexOf("?");
    var path = q < 0 ? rest : rest.slice(0, q);
    var query = q < 0 ? "" : rest.slice(q);
    var data;
    try {
      data = route(path, query, method, init && init.body);
    } catch (e) {
      data = { error: "見本のデータを組み立てられませんでした" };
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: function () { return Promise.resolve(data); },
      text: function () { return Promise.resolve(JSON.stringify(data)); },
    });
  };
})();
