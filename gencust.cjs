// カスタマイズ節の図（GPT画像版・比較用）
const fs = require("fs"), path = require("path");
const lb = "C:/Users/mgomi/dev/lovebu-manga-builder/lovebu-manga-builder";
if (!process.env.OPENAI_API_KEY) { try { require(path.join(lb,"node_modules","dotenv")).config({path:path.join(lb,".env")}); } catch(e){} }
const OpenAI = require(path.join(lb,"node_modules","openai"));
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 600000 });
const prompt = `Clean flat infographic for a Japanese SaaS landing page, white background, 3:2 landscape. Typography: Japanese sans-serif (Noto Sans JP style), royal blue #0B3FA8 for headings and accents, dark grey #111827 text, light grey #e3e7ee dividers. No gradients, no 3D, no shadows, no people, no mascots, no real product logos.
Layout: In the center, one rounded white card with a thin blue outline titled "受信箱の骨組み（共通）", containing a tiny abstract inbox: a list of 4 grey rows with colored status dots and a small chat column on the left.
Around the center card, seven smaller rounded cards connected to the center by thin grey lines, like swappable modules. Each has a small blue icon and a short label, with tiny grey example words under it:
1 "つなぐ入口" — LINE公式・チャットワーク・Slack・メール・議事録
2 "振り分けの基準" — 急ぎ／判断が要る／返信不要
3 "返事の書き方" — 自分の文体・決まり文句・敬称
4 "資料の置き場" — Googleドライブ・Notion・社内マニュアル
5 "催促のタイミング" — 3営業日・1週間・月末
6 "使うAIの組み合わせ" — 判定・下書き・読み取り・批評
7 "見せない情報" — 個人情報は先に読まない
Each module card has a tiny blue tag "差し替え可". At the bottom, one thin row of six small grey chips: 士業事務所・製造業・卸・建設・不動産・医療・介護・営業チーム・経営者個人.
All Japanese text must be spelled exactly as given, crisp and legible. Generous white space. Looks like part of a premium corporate website, not a slide.`;
(async () => {
  const f = path.join(__dirname, "hero", "cust-diagram.png");
  for (const m of ["gpt-image-2.5-sunburst","gpt-image-2"]) { try {
    const r = await client.images.generate({ model: m, prompt, size: "1536x1024", quality: "high" });
    fs.writeFileSync(f, Buffer.from(r.data[0].b64_json,"base64")); console.log("ok", m, f); return;
  } catch(e){ console.error("model",m,"failed:",e.status||"",String(e.message).slice(0,200)); } }
  console.log("FAIL");
})();
