// これほし LP そのもののデザイン案 3枚（縦長のページ全体のモック。gpt-image-2.5）
const fs = require("fs"), path = require("path");
const lb = "C:/Users/mgomi/dev/lovebu-manga-builder/lovebu-manga-builder";
if (!process.env.OPENAI_API_KEY) { try { require(path.join(lb,"node_modules","dotenv")).config({path:path.join(lb,".env")}); } catch(e){} }
const OpenAI = require(path.join(lb,"node_modules","openai"));
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 600000 });
const MODELS = ["gpt-image-2.5-sunburst", "gpt-image-2.5-flare", "gpt-image-2"];
const CONTENT =
"Render a complete, tall landing page mockup (2:3 portrait, like a full-page screenshot of a modern website, desktop width) for a Japanese product called これほし. The page has these sections top to bottom, with EXACTLY these Japanese texts (render every Japanese label legibly, do not invent other text):\n" +
"1) Top bar: logo text これほし, small text これが欲しかった, a green pill button 公式LINEで話を聞く.\n" +
"2) Hero: big headline 連絡大爆発から、脱出。 ; sub line 導入した人は、みんな口を揃えて言う。「これが欲しかった」。 ; small line だから、これほし。 ; below it a smaller line 返信の準備はAI。送るのは、私。 ; a green button 公式LINEで話を聞く. The hero visual: a person walking through a glowing doorway out of a storm of speech bubbles and envelopes (no logos, no readable UI text).\n" +
"3) Section 連絡は、爆発している。 with three cards titled 量 / 質 / 入口 and a row of pills: LINE, チャットワーク, Slack, メール, フォーム.\n" +
"4) Section だから、届いた時点でAIが読んでおく。 with a 5-step flow: 届く → AIが振り分け → AIが準備 → 人が確かめる → 人が送る (last step green).\n" +
"5) Section 実際の画面。左にAI、右に受信箱。 with a laptop/app window mock: left pane a chat, right pane an inbox list (abstract blocks, no readable text).\n" +
"6) Section 送るのは、人。ここだけは変えません。 with a red-outlined statement 送る前に、必ず全文を見て、了承を得てから送る。 and a few check items.\n" +
"7) Section 価格 with two cards: 中身 無料 (フリー素材) and 設置と伴走 ご相談のうえ、お見積り.\n" +
"8) Footer CTA on navy: 自社ならどう使えるか。気になったら、いつもの連絡のついでにどうぞ。 with green button 公式LINEで「話を聞きたい」と送る.\n" +
"No company logos (no LINE/Chatwork/Slack/Claude logos), no characters, no mascots. Fonts: bold Japanese gothic for headlines. Crisp, premium, real-website quality. ";
const STYLES = [
 ["lp-1-dark", "STYLE 1 — dark cinematic: deep navy/near-black background for the hero with warm light from the doorway, then alternating cream and white sections, coral accent, generous whitespace, large typography, subtle glassy cards. Feels like a premium AI product launch."],
 ["lp-2-clean", "STYLE 2 — clean editorial: warm off-white paper background throughout, navy headlines, coral highlights, thin outlines, a lot of air, hero visual placed in a soft rounded frame on the right of the headline. Feels calm, trustworthy, like a Japanese professional-services brand."],
 ["lp-3-bold", "STYLE 3 — bold graphic: huge headline typography, cream and coral color blocks, black-and-white photographic hero cropped tight, numbered sections with big numerals, strong grid, playful but sharp. Feels like a startup that wants attention."],
];
async function gen(prompt){ let last; for(const m of MODELS){ try{
  const r = await client.images.generate({ model: m, prompt, size: "1024x1536", quality: "high" }); return [m, r.data[0].b64_json];
 }catch(e){ last=e; console.error("model",m,"failed:",e.status||"",String(e.message).slice(0,160)); } } throw last; }
(async () => {
  for (const [name, style] of STYLES) { const f = path.join(__dirname, "hero", name + ".png"); if (fs.existsSync(f)) { console.log("skip", name); continue; }
    try { const [m,b64]=await gen(CONTENT + "\n" + style); fs.writeFileSync(f, Buffer.from(b64,"base64")); console.log("ok", name, m); } catch (e) { console.error("fail", name, e.message); } }
  console.log("DONE");
})();
