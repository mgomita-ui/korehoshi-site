// 残りの平面イラスト2枚（04 役目で分担／最後の節）を、あるあると同じ紺の線画にそろえる
const fs = require("fs"), path = require("path");
const lb = "C:/Users/mgomi/dev/lovebu-manga-builder/lovebu-manga-builder";
if (!process.env.OPENAI_API_KEY) { try { require(path.join(lb,"node_modules","dotenv")).config({path:path.join(lb,".env")}); } catch(e){} }
const OpenAI = require(path.join(lb,"node_modules","openai")); const { toFile } = OpenAI;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 600000 });
const out = path.join(__dirname, "img", "line");
const STYLE = " Style: exactly the same refined Japanese business line illustration as the reference: thin navy (#0B2A5B) ink outlines, soft pale-blue (#DCE8F8) and light grey fills, a little navy solid on hair and jacket, pure white background, no gradients, no shadows, realistic proportions, simple calm face. No robots, no mascots. No text, no letters, no numbers, no logos. Landscape 3:2, subject centered with white margin.";
const S = [
 ["b1", "A businesswoman seated at a desk with a laptop, relaxed, holding a cup. Above the laptop, four small round outlined badges in a row connected by a thin line, each holding a simple icon (a check mark, a document, a pencil, a magnifying glass), passing one small document card from left to right; the last badge connects to a small round button on the desk near her hand. Meaning: several AI helpers each do their own part in turn, and the person presses the final button."],
 ["b2", "A businessman seated at a tidy desk with a laptop, calm and smiling slightly, one hand near a single round button on the desk. From the upper left, thin flowing lines carry small icons (a speech bubble, an envelope, a document, a calendar) from a phone, a tablet and a laptop into ONE neat inbox tray card floating above the desk with four tidy rows. Meaning: every channel gathers into one inbox and the person decides calmly."],
];
(async () => {
  const ref = await toFile(fs.readFileSync(path.join(out, "a2.png")), "ref.png", { type: "image/png" });
  await Promise.all(S.map(async ([n, t]) => { const f = path.join(out, n + ".png"); if (fs.existsSync(f)) return console.log(n, "skip");
    const r = await client.images.edit({ model: "gpt-image-2.5-sunburst", image: await toFile(fs.readFileSync(path.join(out, "a2.png")), "ref.png", { type: "image/png" }), prompt: "Draw a NEW scene (do not copy the reference scene). Scene: " + t + STYLE, size: "1536x1024", quality: "high" });
    fs.writeFileSync(f, Buffer.from(r.data[0].b64_json, "base64")); console.log(n, "ok"); }));
  console.log("DONE");
})().catch(e => { console.error("FAIL", String(e.message).slice(0, 200)); process.exit(1); });
