// 全ページを gpt-image-2.5 で「1枚物のスライド画像」として生成する試み。IFBOX のLPの見た目に寄せる。
// 1枚目を IFBOX サイトの画面を参照に作り、2枚目以降は1枚目を参照にして絵柄をそろえる。
const fs = require("fs"), path = require("path");
const lb = "C:/Users/mgomi/dev/lovebu-manga-builder/lovebu-manga-builder";
if (!process.env.OPENAI_API_KEY) { try { require(path.join(lb,"node_modules","dotenv")).config({path:path.join(lb,".env")}); } catch(e){} }
const OpenAI = require(path.join(lb,"node_modules","openai")); const { toFile } = OpenAI;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 600000 });
const out = path.join(__dirname, "pages25"); fs.mkdirSync(out, { recursive: true });
const STYLE = `Design language (match the reference image exactly): a Japanese startup landing page. Warm cream paper background #FFFDF7, navy #0E2A5B for headlines and dark blocks, coral #E85B52 for accents, pills and numbered circles, gold #F6A623 for small highlights, thin beige lines #e8e2d3, white rounded cards (radius 16px) with soft shadows. Headline font: a rounded bold Japanese gothic (like M PLUS Rounded 1c); body: Noto Sans JP. Top-left a small coral pill tag, then a big navy headline; content in 2-4 white cards; bottom a full-width navy rounded band with a one-line white conclusion. Small text "IFBOX" top-right. Photos, if any, are realistic Japanese office scenes, never illustrations or robots. All Japanese text must be spelled EXACTLY as given, crisp and legible; do not add any other text. 16:9 landscape slide, generous margins, nothing cut off.`;
const P = [
 {n:1, t:`COVER slide. Left: coral pill "もしを、揃う前から始める", huge navy headline "「もし」を、みんなで形に。" (the character 形 in coral), sub headline "IFBOX ／ ドリフターズ ／ これほし　ご提案書", small text "レリック社会保険労務士法人　五味田匡功　2026年9月" and a small outlined tag "特許出願中". Right: a realistic photo of a Japanese woman in a home kitchen looking at her phone, inside a rounded frame. Navy band at the very bottom (no text).`},
 {n:2, t:`Pill "はじめに". Headline "今日お伝えしたいのは、6つです". Six white cards in a 3x2 grid, each with a coral numbered circle (1-6), a bold navy title and one grey line:
1 "時代背景" / "作る原価がゼロに近づき、価値は「余り」の側に移った"
2 "時代の解決策としてのIFBOX、ドリフターズ" / "消費者の「もし」と、経営者のつぶやきに、行き先を"
3 "ユニコーン企業を100社に" / "自らも宣言ユニコーンに。根拠と中身を必ず並べる"
4 "第一弾として生まれた、これほし" / "AIが先に読み、人が確かめて送る受信箱"
5 "忙しい社長の「あったらいいな」を体現" / "読む前に分かる。返事とその先まで残る"
6 "AX化の入り口になる" / "使う側か、設定と相談を担う側か"
Bottom navy band: "市場を作るのが目的で、これほしは、その最初の実物です。"`},
 {n:3, t:`Pill "時代背景 ①". Headline "作るコストが消え、価値は「余り」の側に移った". Three white cards with coral circles 1-3:
1 "誰もがAIで、できることが桁で増えた" / "ただし当人はやり方を知らない。「こうなったらいい」を言える場が要る"
2 "払い済みで余る資源が、手元にある" / "消費者の余暇時間。経営者のAIサブスクの余りトークン"
3 "参入障壁が消え、乱立が始まる" / "利用料は取れない。基本無償か、成功報酬へ"
Below: a small navy table with 3 rows: "消費者の余暇時間 → もし → IFBOX", "経営者の余りトークン → つぶやき → ドリフターズ", "増える情報量 → 連絡 → これほし".
Bottom navy band: "「これが、市場を作る」余りに、値段ではなく行き先を与える。"`},
 {n:4, t:`Pill "時代背景 ②". Headline "作業より、判断が仕事になる". Left: a quote block with gold left bar "飛脚の仕事は、走ることではなかった" and grey line "走る役はAIに任せ、人は行き先を決める". A small table with 2 columns "これまで / これから" and 3 rows: "定型処理｜人が手を動かす｜AIと余りトークン", "作業代行｜人が代わる｜AIが処理し、人が品質を守る", "人に残るもの｜作業＋判断｜判断と責任". Right: realistic photo of a Japanese manager pointing at a laptop with a colleague, in a rounded frame.
Bottom navy band: "自らドリフターになるか、ドリフターを味方につけるか。"`},
 {n:5, t:`Pill "解決策 ①". Headline "IFBOX は、消費者が「もし」を言う市場". Left card: title "入口の原則" and text "「こんなものがあったらいい」。その一言だけを入口にする。仕様は書かせない。発案者として残し、成功したら還元". A horizontal flow of 5 coral-outlined pills: "もしを一言 › 同じ願いの人が集まる › 試して意見を出す › 形になり広まる › 発案者に還元" (last pill filled coral). Three small stat cards: "0円 基本無償", "1行 必須は一言", "4歩 集める→つくる→確かめる→届ける". Right: realistic photo of 4 Japanese people around a table with a tablet.
Bottom navy band: "IFBOX ＝ 言う場。発言者が参加者に変わり、みんなで形にする。"`},
 {n:6, t:`Pill "解決策 ②". Headline "困りごとは、ドリフターが叶えます". Left card: "ドリフターとは：経営能力のあるバイブコーダー＆クリエイター" with line "現場の実績がある＋AIで自分の領域の外を作って動かしている". Three small cards: "越境", "腕試し", "雪辱". Right: a navy-header table titled "流れ（例：AI BPO の立ち上げ）" with rows: "会社のつぶやき｜請求書の発行と入金確認を、人を増やさずに回したい", "提案｜AIが下処理し、担当は確認だけにする仕組み　49.5万円", "採用→案件｜依頼受付→作成中→確認中→納品済→検収済→請求済→入金済", "契約・お金｜会社とドリフターの直接契約。運営はお金を預からない".
Bottom navy band: "ドリフターズ ＝ 叶える側。「頼むならドリフター」という目印を立てる。"`},
 {n:7, t:`Pill "解決策 ③". Headline "強みは一つ。早く集まり、みんなで作りこむ". Left: a comparison table, header "IFBOX（ToC）｜ドリフターズ（ToB）", rows: "差し出す余り｜余暇時間｜余りトークン", "決める人｜消費者｜経営者はつぶやくだけ", "お金と契約｜意向表明｜直接契約・7段階", "信用｜参加の量｜選考の質", "価格｜基本無償・成功報酬（共通）". Right: two cards "車輪 1 インフラ化 ― 置き換わるものは1回作って共通の土台に" and "車輪 2 インキュベーション ― 乱立を母数として育て、株式価値を収益に", and a coral-tinted note "必ず起きる副作用：乱立と車輪の再発明。止めずに受け止める。だから急ぐ".
Bottom navy band: "人が集まっていること以外に、堀はない。"`},
 {n:8, t:`Pill "狙い ①". Headline "ユニコーン企業を100社に。狙いは三段". Three cards with coral circles: "1 ミニマム ― 面白いからで人が集まり、本業の受託に", "2 ミドル ― 自サービスの拡張（これほし・ゆとる・ダッシュボード）", "3 ビッグ ― プラットフォームとして大きな利益。人が集まった後にだけ生まれる". Below a gold-tinted card "ビッグの中身＝インキュベーション：コンサル料30万円を出資に回して株式で持つ／支援会員 一口50万円・エンジェル税制A／収益は株式価値とコンサル". Right side: a realistic photo of a small unicorn figurine on a desk beside a calculator (tasteful, not cartoon).
Bottom navy band: "宣言ユニコーンを量産する市場。まず、自分たちから旗を立てる。"`},
 {n:9, t:`Pill "狙い ②". Headline "まず僕たちが宣言する。ただし、根拠と中身を必ず並べる". Left: quote "宣言だけでユニコーンなのか" with grey line "時価総額とは何かを問う実演", and a card "宣言に必ず並べるもの：評価額の根拠（一口50万円×口数）／中身はこれ（事業・実績・画面）／保証としては扱わない". Right: a table titled "線を引く" with rows "金商法｜私募 49人以下・6か月通算｜弁護士", "景表法｜根拠と中身を並べる｜弁護士", "資金決済｜お金を預からない｜弁護士", "契約・下請｜直接契約・7段階｜弁護士", "個人情報｜鍵は本人の画面｜弁護士", "商標｜これほし／どこでも扉｜弁理士", "税｜エンジェル税制A｜税理士".
Bottom navy band: "線を引かないと成立しないものばかり。だから、線を引くことが面白い。"`},
 {n:10, t:`Pill "第一弾". Headline "第一弾が、これほしです。連絡をAIが先に読み、人が確かめて送る受信箱". Left: quote "まず、何が使えるのか" and a flow of 5 pills "① 右に届く › ② 左で頼む › ③ AIが右を読む › ④ 右に下書き › ⑤ 人が送る" (last coral). A small table "3点セット": "IFBOX｜消費者の市場", "ドリフターズ｜経営者の市場", "これほし｜情報量をさばく経営者の受信箱". Right: a realistic photo of a Japanese business owner at a desk looking relieved at a laptop, rounded frame.
Bottom navy band: "置き換わるものは、1回作って土台にする。その第1号がこれほし。"`},
 {n:11, t:`Pill "第一弾 ②". Headline "売り切らず、みんなの土台に". Four cards with coral circles: "1 配る ― 中身は無償・改変配布自由のフリー素材。名前だけ商標で守る", "2 仕事にする ― 導入支援・業種調整・追加機能は、ドリフターの直接契約で", "3 還流 ― 改良の声は IFBOX の「もし」に集め、本体に取り込む", "4 条件 ― 安全な初期設定のまま配る。AIに送信の道具を渡さない". Right: realistic photo of two Japanese colleagues handing over a document at a desk.
Bottom navy band: "これほしは IFBOX の象徴。ドリフターズが育てて広げる、フリー素材。"`},
 {n:12, t:`Pill "あったらいいな ①". Headline "こんなこと、ありませんか？". Six cream cards in 3x2, each a bold navy line and a coral "これほしなら" line:
"「後でやろう」が、そのまま消える" / "返した瞬間に、やることと期日が残る"
"軽いのから片づけて、重いのがたまる" / "朝いちばんに、今日返すものだけが並ぶ"
"経緯を調べてから返す。だから遅い" / "AIが先に過去の会話と資料を読む"
"AIが作った文章が、読めない" / "要点3行にしてから見せる"
"AIにコピペする係になっている" / "入口ごとに直接つなぐ"
"分からなくなって、えいや" / "履歴に残る。送るボタンは人だけ"
Bottom navy band: "「メールもチャットも、開くだけで一日が終わる」。まず、この負担を減らしたい。"`},
 {n:13, t:`Pill "あったらいいな ②". Headline "読む前に、見るべきものが分かる。返事と、その先まで用意する". Three columns with navy pill labels "01 入ってくる", "02 取りに行く", "03 返すと、残る", each with a rounded white card showing an abstract inbox app mock (grey bars, colored dots, a green send button; NO readable text inside the mock) and one grey line below: "判定専用のAI Jev が振り分け、まだ返していないものだけ並ぶ" / "どのAIからでも開けて、経緯と資料を踏まえた下書きが出る" / "やること・催促どき・日程が会話に残り、カレンダーへ".
Bottom navy band: "「返事はしたけれど、頼まれたことが抜ける」。そこまで含めて減らします。"`},
 {n:14, t:`Pill "あったらいいな ③". Headline "AIは送らない。人が押す。ここだけは変えません". Left: a big diagram: a navy-outlined box "AI：読む・下書き・要点・催促文" on the left, a vertical coral dashed line labeled "AIはここを越えられない", and on the right a cream box with a coral button "確認して送信" and text "人が宛先と全文を見て押す". Right: a small table "決まり": "送信の口は1つ｜人が押すボタンだけ", "鍵とデータは本人のもの｜本人の画面で入力", "AIも間違える前提｜送る前に人が確認".
Bottom navy band: "送るのは、人。"`},
 {n:15, t:`Pill "AX化の入り口 ①". Headline "受信箱から、会社のAXへ". Left: quote "AIは入れたいけれど、何から始めればいいのか" and a flow of pills "受信箱 › 論点整理・引き継ぎ › ソフトの操作 › 複数AIの分担 › 人が決める場所" (last coral). A table "見るもの／変化": "読む時間｜要点と件数で見る", "返事までの時間｜下書きが先に入っている", "対応漏れ｜やることが会話に残る". Right: realistic photo of a Japanese office team looking at one monitor together.
Bottom navy band: "走るのはAI。行き先を決めるのは人。その入り口が、受信箱。"`},
 {n:16, t:`Pill "AX化の入り口 ②". Headline "設定と相談を、次の仕事に。使う側か、支える側か". Left: two cards "使う側 ― 自社の連絡で試す" and "支える側 ― 導入支援・業種調整を担う（直接契約）". Right: a cream card with a huge coral number "50,000円" and small "設定（テスト期間）・月額なし", and a second card "ゼロからでも3時間" with a 4-row timeline "0:00 流れを伺う / 0:30 入口をつなぐ / 1:30 受信箱を開く / 3:00 最初の返事を一緒に送る".
Bottom navy band: "まず、どちらから関わるのがよいか相談させてください。"`},
 {n:17, t:`CLOSING slide with a navy background instead of cream. Left: small gold letters "NEXT STEP", huge white rounded headline "まず一つ、困りごとをください。", white text "作り方は分からなくて大丈夫。最初に必要なのは「こうなったらいい」の一言だけ。". Right: a white rounded card with coral title "詳しくは、公式LINEで", a QR-code placeholder square, and small grey lines "公式LINE" and "Web". No other text.`},
];
async function gen(p, refPath) {
  const f = path.join(out, `p${String(p.n).padStart(2,"0")}.png`); if (fs.existsSync(f)) return "skip";
  const ref = await toFile(fs.readFileSync(refPath), "ref.png", { type: "image/png" });
  const r = await client.images.edit({ model: "gpt-image-2.5-sunburst", image: ref, prompt: "Create a NEW slide (do not copy the reference's content). " + p.t + "\n" + STYLE, size: "1536x1024", quality: "high" });
  fs.writeFileSync(f, Buffer.from(r.data[0].b64_json, "base64")); return "ok";
}
(async () => {
  const site = path.join(__dirname, "ref", "ifbox-site-top.png");
  console.log("p1", await gen(P[0], site));
  const ref1 = path.join(out, "p01.png");
  const q = P.slice(1); const N = 4; let running = 0;
  await new Promise(done => { const next = () => { if (!q.length && !running) return done(); while (running < N && q.length) { const p = q.shift(); running++; gen(p, ref1).then(s => console.log("p" + p.n, s)).catch(e => console.error("p" + p.n, "FAIL", String(e.message).slice(0, 200))).finally(() => { running--; next(); }); } }; next(); });
  console.log("DONE");
})();
