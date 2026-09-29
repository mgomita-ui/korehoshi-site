/**
 * LP用の見本データ（一般的な会社の受信箱。実在の人物・会社は出てこない）。
 * 設定：中小企業「ミナト商事」の代表・湊さんの受信箱。取引先・協力会社・社内の連絡が混ざる。
 */
(function () {
  function at(dayOffset, h, m) {
    var j = new Date(Date.now() + 9 * 3600e3);
    j.setUTCDate(j.getUTCDate() + dayOffset);
    j.setUTCHours(h, m || 0, 0, 0);
    return j.getTime() - 9 * 3600e3;
  }

  var ACCOUNTS = [
    { id: "default", label: "ミナト商事", owner_user_id: null, ack_message: null, welcome_message: null, created_at: at(-200, 9, 0), ready: true },
  ];

  var FEATURES = {
    hold: true, bulk: true, senderRule: false, checkDays: 3, aiPrep: true,
    nextStep: false, today: true, dayMinutes: 240, close: true, weekly: true, weeklyDay: 5,
    morning: true, morningDrink: true,
  };

  // 朝の3問（2026-09-30）。昨夜の最後の予定と、最後に返信を確定した時刻から、答えを先に推測しておく。
  var MORNING = {
    last: { title: "ミナト商事 取引先との懇親会", end: "21:30" },
    lastSent: "23:48",
    guess: { drink: "some", bed: 24.5 },
    events: [
      { start: "09:30", end: "10:00", title: "社内朝礼" },
      { start: "11:00", end: "12:00", title: "【WEB】ひまわり製作所 日向さま 定例" },
      { start: "14:00", end: "15:30", title: "ミナト商事 桜井さま 打ち合わせ", note: "来期の採用方針を決める" },
      { start: "16:00", end: "16:30", title: "山吹物流 山吹さん 月次の確認" },
    ],
    decisions: [
      { id: "k1", label: "来期の採用方針を決める", at: "14:00", from: "予定：桜井さま 打ち合わせ" },
      { id: "k2", label: "支払条件の変更に返事する", at: null, from: "要対応：山吹物流 山吹さん" },
      { id: "k3", label: "展示会の当日スタッフの割り当て", at: null, from: "やること" },
    ],
  };

  var CATEGORIES = ["問い合わせ", "見積・料金", "日程調整", "資料・書類", "手続き依頼",
                    "苦情・トラブル", "営業・勧誘", "あいさつ・雑談", "その他"];
  var TONES = ["短く", "丁寧に", "やわらかく", "かたく", "詳しく", "前向きに"];

  var THREADS = [
    // ① すぐ返せる。下書きあり。→ 画面②
    {
      id: "line:Uaoba001",
      channel: "line",
      external_id: "Uaoba001",
      display_name: "株式会社ひまわり製作所 購買 日向さん",
      status: "open",
      category: "問い合わせ",
      urgency: "normal",
      summary: "10月納品分を2週間前倒しできるか。見積書PDFの条件も確認したい",
      last_message_at: at(0, 10, 18),
      last_preview: "前倒しが難しければ、一部だけ先に納品していただく形でも助かります。",
      route_kind: "question",
      route_weight: "light",
      route_reply: 0.94,
      lead: null,
      lead_confirmed: 1,
      lead_story: "日向さんから代表あてに直接届いている相談。過去も代表が返している。",
      prep_model: "claude-haiku-4-5",
      prep_at: at(0, 10, 21),
      prep_dest: JSON.stringify({
        kind: "reply",
        reason: "前倒しの可否を答えるだけで返せます。分納の提案と、見積書の条件の確認まで下書きに入れてあります。",
      }),
      prep_plan: "聞かれているのは前倒しの可否なので、先に結論（全量は難しいが分納なら可）を返して安心してもらう。"
        + "添付の見積書PDFを読むと、納期は「10月20日」、分納の条項はない。分納する場合は条件を1行で確認する形にする。",
      prep_draft: "日向さん\n\n"
        + "ご相談ありがとうございます。結論から申し上げますと、全量の2週間前倒しは在庫の都合で難しいのですが、"
        + "分納であれば対応できます。\n\n"
        + "・10月6日（月）：全体の6割\n・10月20日（月）：残り\n\n"
        + "いただいた見積書（9/25付）には分納の記載がないので、この形でよければ、送料の扱いだけ確認させてください。"
        + "問題なければ、明日中に改めて見積書をお送りします。",
      prep_questions: "[]",
      prep_tasks: JSON.stringify([
        { title: "分納の条件（送料の扱い）を日向さんに確認してもらう", by: "human", how: "返信のあと、返事が来たら見積書を作り直す" },
        { title: "分納用の見積書（9/25付の改訂版）を作る", by: "ai", how: "元の見積書PDFをもとに、納期と送料の行だけ直した案を出す" },
      ]),
    },

    // ② 判断が要る。下書きなし。問い3つ。→ 画面③
    {
      id: "line:Chikari002",
      channel: "line",
      external_id: "Chikari002",
      display_name: "さくらデザイン × ミナト商事",
      status: "open",
      category: "見積・料金",
      urgency: "high",
      summary: "展示会の販促物。ロゴ案3つのどれにするか、部数と予算の判断が要る",
      last_message_at: at(0, 11, 5),
      last_preview: "あと、パンフレットの部数も決めていただけると、印刷の見積もりを出せます。",
      route_kind: "request",
      route_weight: "heavy",
      route_reply: 0.88,
      lead: null,
      lead_confirmed: 1,
      lead_story: "予算と方針の判断が入るので、代表が持っている案件。",
      prep_model: "claude-opus-5",
      prep_at: at(0, 11, 9),
      prep_dest: JSON.stringify({
        kind: "mine",
        task: "ロゴ案を選び、部数と予算を決めて返す",
        reason: "予算と方針が決まらないと返信が書けません。先に自分で決める側の件です。",
      }),
      prep_plan: "ロゴ案の選定と予算が決まらないと文面が書けないので、下書きは作っていない。"
        + "先に3つの前提（ロゴ案・部数・予算の上限）を決めてから、修正の依頼と印刷の段取りを1通にまとめて返す。",
      prep_draft: null,
      prep_questions: JSON.stringify([
        { ask: "ロゴ案は A・B・C のどれにしますか。", why: "Bは既存の名刺と色が合いません。Cを選ぶなら看板も作り直しになるので、費用が変わります。" },
        { ask: "パンフレットは何部にしますか。", why: "500部と1,000部で単価が大きく違います。展示会の来場見込みが800人なので、ここが決まらないと見積もりが出ません。" },
        { ask: "販促物の予算の上限はいくらですか。", why: "上限が決まれば、ロゴ・パンフ・のぼりの配分をこちらで組めます。決まらないと返信の書き方が変わります。" },
      ]),
      prep_tasks: JSON.stringify([
        { title: "展示会の販促物の予算配分を決める", by: "human", how: "ロゴ・パンフ・のぼりの3つで上限内に収める案を2通り出して比べる" },
      ]),
    },

    // ③ 請求書のPDFが届いた。少し確認。
    {
      id: "chatwork:R1001",
      channel: "chatwork",
      external_id: "R1001",
      display_name: "山吹物流 経理 山吹さん",
      status: "open",
      category: "資料・書類",
      urgency: "normal",
      summary: "8月分の請求書PDFが届いた。金額の確認に使う",
      last_message_at: at(0, 9, 48),
      last_preview: "8月分の請求書をお送りします。ご確認をお願いいたします。",
      route_kind: "document",
      route_weight: "normal",
      route_reply: 0.71,
      lead: null,
      lead_confirmed: 1,
      lead_story: "山吹物流は代表が担当。請求の確認は社内で行っている。",
      prep_model: "claude-sonnet-5",
      prep_at: at(0, 9, 52),
      prep_dest: JSON.stringify({
        kind: "mine",
        task: "請求書の金額を発注書と突き合わせる",
        reason: "受け取りの返事だけで済みます。中身の確認は自分の作業です。",
      }),
      prep_plan: "添付は請求書で、金額と口座がそのまま入っている。中身をAIに読ませる前に、ひと声確認する扱いにしてある。返信そのものは受領の一言でよい。",
      prep_draft: "山吹さん\n\nお送りいただきありがとうございます。8月分、確かに受け取りました。\n"
        + "発注書と突き合わせて、相違があれば今週中にご連絡します。",
      prep_questions: "[]",
      prep_tasks: "[]",
    },

    // ④ メール。すぐ返せる。
    {
      id: "gmail:mail-7001",
      channel: "gmail",
      external_id: "mail-7001",
      display_name: "桜井｜次回の打ち合わせ日程について",
      status: "open",
      category: "日程調整",
      urgency: "normal",
      summary: "来月の打ち合わせの日程を決めたい",
      last_message_at: at(0, 8, 32),
      last_preview: "10月の第2週あたりで、1時間ほどお時間をいただけますでしょうか。",
      route_kind: "schedule",
      route_weight: "light",
      route_reply: 0.9,
      lead: null,
      lead_confirmed: 1,
      lead_story: null,
      prep_model: "claude-opus-5",
      prep_at: at(0, 8, 36),
      prep_dest: JSON.stringify({ kind: "reply", reason: "候補日を3つ出すだけで片付きます。" }),
      prep_plan: "日程だけの話なので、候補を3つ出して相手に選んでもらう形にする。",
      prep_draft: "桜井さま\n\nお世話になっております。ミナト商事の湊です。\n"
        + "10月第2週でしたら、下記の3つが空いております。\n\n"
        + "・10月6日（火）午後\n・10月8日（木）午前\n・10月9日（金）午後\n\n"
        + "ご都合のよいものをお知らせください。前回の資料は当日までに更新してお持ちします。",
      prep_questions: "[]",
      prep_tasks: "[]",
    },

    // ⑤ 相槌だけ。
    {
      id: "line:Utsubame005",
      channel: "line",
      external_id: "Utsubame005",
      display_name: "つばめ運送 燕さん",
      status: "done",
      category: "あいさつ・雑談",
      urgency: "low",
      summary: "お礼のみ。返信は不要",
      last_message_at: at(0, 7, 55),
      last_preview: "ありがとうございます！助かりました😊",
      route_kind: "smalltalk",
      route_weight: "light",
      route_reply: 0.06,
      lead: null,
      lead_confirmed: 1,
      lead_story: null,
      prep_at: at(0, 7, 56),
      prep_model: "claude-sonnet-5",
      prep_plan: "お礼だけなので、返信は要らないと見て要対応から外した。",
    },

    // ⑥ 議事録。対応済み。
    {
      id: "minutes:min-0919",
      channel: "minutes",
      external_id: "min-0919",
      display_name: "9/19 ひまわり製作所 定例打合せ",
      status: "done",
      category: "その他",
      urgency: "low",
      summary: "10月の納品計画を共有。持ち帰りは分納案の作成",
      last_message_at: at(-3, 15, 40),
      last_preview: "10月の納品は、前倒しの相談があれば分納で対応する方向で合意。",
      route_kind: "report",
      route_weight: "light",
      route_reply: 0.12,
      lead: null,
      lead_confirmed: 1,
      lead_story: null,
      prep_at: at(-3, 15, 45),
      prep_model: "claude-sonnet-5",
    },

    // ⑦ 送信セットが届いている会話。→ 画面④
    {
      id: "line:Cifbox007",
      channel: "line",
      external_id: "Cifbox007",
      display_name: "展示会 実行委員",
      status: "open",
      category: "資料・書類",
      urgency: "normal",
      summary: "出展資料を送る。パンフ案3枚の送信セットが届いている",
      last_message_at: at(0, 9, 30),
      last_preview: "今日中にお送りします。パンフの案を3枚付けます。",
      route_kind: "document",
      route_weight: "light",
      route_reply: 0.8,
      lead: null,
      lead_confirmed: 1,
      lead_story: null,
      prep_at: null,
      prep_model: null,
      prep_dest: JSON.stringify({ kind: "reply", reason: "送信セットが届いています。中身を確かめて送れば片付きます。" }),
      prep_plan: "外（AI）から本文とパンフ案3枚の送信セットが届いている。宛先と4通の中身を見てから、まとめて送る。",
      prep_draft: null,
      prep_questions: "[]",
      prep_tasks: "[]",
    },

    // ⑧ やってもらうことの期日が来て「催促どき」。
    {
      id: "chatwork:R1002",
      channel: "chatwork",
      external_id: "R1002",
      display_name: "ミナト商事 社内",
      status: "done",
      category: "手続き依頼",
      urgency: "normal",
      summary: "取引先との契約書の押印済みが戻ってきていない",
      last_message_at: at(-5, 17, 10),
      last_preview: "承知しました。来週中に押印して戻します。",
      route_kind: "request",
      route_weight: "normal",
      route_reply: 0.4,
      lead: "内田 千尋",
      lead_confirmed: 1,
      lead_story: "社内の総務担当に振ってある案件。",
      prep_at: at(-5, 17, 12),
      prep_model: "claude-sonnet-5",
    },
  ];

  function fill(t) {
    var base = {
      lead: null, lead_guess: null, lead_story: null, lead_checked_at: null, lead_confirmed: 0,
      prep_dest: null, hold_reason: null, hold_until: null,
      account_id: "default", category: null, has_task: 0, urgency: "normal", summary: null,
      route_kind: null, route_weight: null, route_reply: null,
      prep_draft: null, prep_plan: null, prep_tasks: "[]", prep_questions: "[]",
      prep_model: null, prep_at: null,
    };
    for (var k in base) if (!(k in t)) t[k] = base[k];
    return t;
  }
  THREADS = THREADS.map(fill);

  var TASKS = [
    { id: 101, thread_id: "line:Uaoba001", title: "分納用の見積書（改訂版）を作って日向さんに返す",
      due_at: at(0, 18, 0), done: 0, created_at: at(0, 10, 25), side: "mine", est_min: 30, plan_at: at(0, 9, 0) },
    { id: 102, thread_id: "chatwork:R1001", title: "8月分の請求書を発注書と突き合わせる",
      due_at: at(0, 18, 0), done: 0, created_at: at(0, 9, 55), side: "mine", est_min: 40, plan_at: at(0, 9, 0) },
    { id: 103, thread_id: "gmail:mail-7001", title: "前回の打ち合わせ資料を更新する",
      due_at: at(3, 18, 0), done: 0, created_at: at(0, 8, 40), side: "mine", est_min: 15, plan_at: null },
    { id: 104, thread_id: null, title: "展示会の当日スタッフの割り当てを決める",
      due_at: null, done: 0, created_at: at(-2, 13, 0), side: "mine", est_min: 30, plan_at: null },
    { id: 105, thread_id: "chatwork:R1002", title: "契約書に押印して戻してもらう（内田 千尋）",
      due_at: at(-1, 9, 0), done: 0, created_at: at(-5, 17, 15), side: "theirs", est_min: null, plan_at: null },
    { id: 106, thread_id: "line:Chikari002", title: "ロゴ案の修正版をもらう（さくらデザイン 桜さん）",
      due_at: at(3, 9, 0), done: 0, created_at: at(-1, 10, 0), side: "theirs", est_min: null, plan_at: null },
  ];

  var QUIETED = [
    { id: "line:Utsubame005", name: "つばめ運送 燕さん", channel: "line",
      preview: "ありがとうございます！助かりました😊", at: at(0, 7, 55), kind: "smalltalk", reply: 0.06 },
    { id: "gmail:mail-7002", name: "商工会議所 事務局｜【ご案内】10月度 セミナーのご案内", channel: "gmail",
      preview: "10月度のセミナーの日程が決まりましたのでご案内いたします。お申し込みは…", at: at(0, 6, 40), kind: "report", reply: 0.04 },
    { id: "line:Uwakaba009", name: "わかば商事 若葉さん", channel: "line",
      preview: "承知しました。よろしくお願いいたします。", at: at(0, 6, 12), kind: "smalltalk", reply: 0.09 },
  ];

  var DETAIL = {
    "line:Uaoba001": {
      speakers: [],
      note: {
        human: "・納期の話は、できる／できないを先に言う。あとから条件を足すと必ず揉める。\n"
          + "・日向さんは購買のご担当。決裁は工場長の手前で止まることが多いので、期日は余裕を持って伝える。",
        ai: "9/19の定例で、10月の納品は前倒しの相談があれば分納で対応する方向で合意している。\n"
          + "見積書（9/25付）は受け取り済み。納期は10月20日、分納の条項はない。",
      },
      messages: [
        { id: 1, direction: "in", kind: "text", created_at: at(0, 9, 12),
          body: "お世話になっております。ひまわり製作所の日向です。\n10月納品分の件で、ひとつご相談があります。" },
        { id: 2, direction: "out", kind: "text", created_at: at(0, 9, 20),
          body: "日向さん、おはようございます。どうぞお願いします。" },
        { id: 3, direction: "in", kind: "text", created_at: at(0, 9, 26),
          body: "納期を2週間ほど前倒しできないでしょうか。展示会の出展が決まり、10月上旬に現物が要ることになりました。" },
        { id: 4, direction: "in", kind: "file", created_at: at(0, 9, 27),
          external_id: "lnfile-9001", file_name: "見積書_20260925.pdf",
          body: "見積書_20260925.pdf を送信しました" },
        { id: 5, direction: "out", kind: "text", created_at: at(0, 9, 41),
          body: "承知しました。在庫と便を確認して、今日中にお返事します。" },
        { id: 6, direction: "in", kind: "text", created_at: at(0, 10, 18),
          body: "ありがとうございます。\n前倒しが難しければ、一部だけ先に納品していただく形でも助かります。" },
      ],
    },

    "line:Chikari002": {
      speakers: [
        { id: "Uhikari01", name: "桜 佳代（さくらデザイン 代表）" },
        { id: "Uhikari02", name: "桃 直樹（さくらデザイン 制作）" },
      ],
      note: {
        human: "・ロゴの可否は断定しない。確認事項を挙げる形で返す。\n・費用は必ず税別と書く。",
        ai: "展示会は11月12日。来場見込みは800人。前回のパンフは500部で足りなかった。",
      },
      messages: [
        { id: 11, direction: "in", kind: "text", created_at: at(-1, 16, 40),
          speaker_id: "Uhikari01", speaker_name: "桜 佳代（さくらデザイン 代表）",
          body: "湊さん、いつもお世話になっております。\n展示会の販促物の件でご相談です。ロゴ案を3つお送りします。" },
        { id: 12, direction: "in", kind: "text", created_at: at(-1, 16, 52),
          speaker_id: "Uhikari02", speaker_name: "桃 直樹（さくらデザイン 制作）",
          body: "Aは今の名刺と同じ系統、Bは色を変えた案、Cは形から変えた案です。Cにする場合は看板も作り直しになります。" },
        { id: 13, direction: "out", kind: "text", created_at: at(0, 8, 30),
          body: "ありがとうございます。3案とも拝見しました。部数と予算をこちらで決めてから、まとめてお返事します。" },
        { id: 14, direction: "in", kind: "text", created_at: at(0, 11, 5),
          speaker_id: "Uhikari01", speaker_name: "桜 佳代（さくらデザイン 代表）",
          body: "ありがとうございます。\nあと、パンフレットの部数も決めていただけると、印刷の見積もりを出せます。" },
      ],
    },

    "chatwork:R1001": {
      speakers: [{ id: "cw-3301", name: "山吹 理恵（山吹物流 経理）" }],
      note: {
        human: "・請求書は金額と口座が入っている。AIに読ませる前に、社内で一声かける。",
        ai: "8月分の請求書が届いた。発注書との突き合わせに使う。",
      },
      messages: [
        { id: 21, direction: "in", kind: "text", created_at: at(0, 9, 44),
          speaker_id: "cw-3301", speaker_name: "山吹 理恵（山吹物流 経理）",
          body: "湊さま\nお世話になっております。8月分の請求書をお送りします。ご確認をお願いいたします。" },
        { id: 22, direction: "in", kind: "file", created_at: at(0, 9, 48),
          speaker_id: "cw-3301", speaker_name: "山吹 理恵（山吹物流 経理）",
          external_id: "cwfile-9001", file_name: "請求書_2026年08月.pdf",
          body: "請求書_2026年08月.pdf を送信しました" },
      ],
    },

    "gmail:mail-7001": {
      speakers: [],
      note: { human: "", ai: "前回の打ち合わせは9月上旬。資料は更新して持っていく約束。" },
      messages: [
        { id: 31, direction: "in", kind: "text", created_at: at(0, 8, 32),
          body: "湊さま\n\nいつもお世話になっております。桜井です。\n"
            + "次回の打ち合わせの日程についてご相談です。\n10月の第2週あたりで、1時間ほどお時間をいただけますでしょうか。\n\n"
            + "ご都合のよい日をいくつかお知らせいただければ、こちらから伺います。" },
      ],
    },

    "line:Cifbox007": {
      speakers: [
        { id: "Uifbox01", name: "堀 健一" },
        { id: "Uifbox02", name: "新谷 美和" },
      ],
      note: { human: "・この場では料金の話をしない。", ai: "展示会は11月12日。出展資料は事前共有の約束。" },
      messages: [
        { id: 41, direction: "in", kind: "text", created_at: at(0, 9, 5),
          speaker_id: "Uifbox01", speaker_name: "堀 健一",
          body: "出展資料、いつ頃もらえそうですか？" },
        { id: 42, direction: "out", kind: "text", created_at: at(0, 9, 30),
          body: "今日中にお送りします。パンフの案を3枚付けます。" },
      ],
    },

    "chatwork:R1002": {
      speakers: [{ id: "cw-1102", name: "内田 千尋" }],
      note: { human: "", ai: "契約書は9/17に渡してある。" },
      messages: [
        { id: 51, direction: "out", kind: "text", created_at: at(-5, 16, 50),
          body: "内田さん\n取引先との契約書を置きました。代表印をもらって戻してください。" },
        { id: 52, direction: "in", kind: "text", created_at: at(-5, 17, 10),
          speaker_id: "cw-1102", speaker_name: "内田 千尋",
          body: "承知しました。来週中に押印して戻します。" },
      ],
    },

    "minutes:min-0919": {
      speakers: [],
      note: { human: "", ai: "" },
      messages: [
        { id: 61, direction: "in", kind: "text", created_at: at(-3, 15, 40),
          body: "【9/19 ひまわり製作所 定例打合せ】\n\n"
            + "出席：日向さん（購買）／湊\n\n"
            + "・10月の納品は、前倒しの相談があれば分納で対応する方向で合意。\n"
            + "・見積書はひまわり製作所側から送付。\n"
            + "・分納案はミナト商事で作成し、相談があり次第戻す。\n"
            + "・次回は10月6日（火）14:00。" },
      ],
    },
  };

  var PREPSET = {
    "line:Cifbox007": {
      setId: "d3f81a2c9b40",
      threadId: "line:Cifbox007",
      text: "出展資料を送ります。パンフの案を3枚付けます。\n\n"
        + "1枚目は、表紙の案です。ロゴはA案で組んでいます。\n"
        + "2枚目は、中面の構成です。製品の写真と、導入事例を2つ入れました。\n"
        + "3枚目は、裏面の問い合わせ先です。\n\n"
        + "当日は2枚目を中心に話すつもりです。先に見ていただいて、違和感があれば来週の朝までに教えてください。\n\n"
        + "よろしくお願いします。",
      textState: "pending",
      items: [
        { fileId: "zukai1.svg", name: "パンフ案1_表紙.png", isImage: true, size: 184320, state: "pending" },
        { fileId: "zukai2.svg", name: "パンフ案2_中面.png", isImage: true, size: 201728, state: "pending" },
        { fileId: "zukai3.svg", name: "パンフ案3_裏面.png", isImage: true, size: 173056, state: "pending" },
      ],
      source: "AI",
      note: "出展資料",
      mentionUserIds: ["Uifbox01"],
      mentionAll: false,
      closes: [{ id: 999, title: "出展資料を事前に送る" }],
      createdAt: at(0, 11, 40),
    },
  };

  window.DEMO = {
    at: at, accounts: ACCOUNTS, features: FEATURES, categories: CATEGORIES, tones: TONES,
    threads: THREADS, tasks: TASKS, quieted: QUIETED, detail: DETAIL, prepset: PREPSET,
    morning: MORNING,
  };
})();
