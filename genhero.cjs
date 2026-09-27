// これほし LP ヒーロー画像 3案（gpt-image-2.5-sunburst、横長、参照画像なし）
const fs = require("fs"), path = require("path");
const lb = "C:/Users/mgomi/dev/lovebu-manga-builder/lovebu-manga-builder";
if (!process.env.OPENAI_API_KEY) { try { require(path.join(lb,"node_modules","dotenv")).config({path:path.join(lb,".env")}); } catch(e){} }
const OpenAI = require(path.join(lb,"node_modules","openai"));
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 600000 });
const MODELS = ["gpt-image-2.5-sunburst", "gpt-image-2.5-flare", "gpt-image-2"];
const COMMON = " Ultra high-end cinematic editorial illustration, premium tech-brand key visual, dramatic lighting, rich depth, 3:2 landscape. Palette: deep navy, warm cream/off-white paper, one coral accent, a little LINE-like green only as small dots (no logos). No company logos, no app icons that resemble real products, no recognizable characters, no readable UI text, no words at all in the image. Faces small or turned away. Photoreal-illustration hybrid, not cartoon.";
const PAGES = [
 ["hero-a-escape",
  "Concept: ESCAPE from the communication explosion. A calm businessperson in a dark suit walks out through a tall glowing rectangular doorway of warm light, seen from behind. Behind and above them, a towering chaotic storm of thousands of speech bubbles, envelopes, chat notification pills and paper documents swirls like a typhoon in the dark, pressing toward the door but stopping at its threshold. In front, beyond the door: quiet, clean cream space with a single slim screen on a desk showing a short calm list (abstract blocks, no text). Mood: relief, control, silence after noise." + COMMON],
 ["hero-b-converge",
  "Concept: CONVERGENCE. An overhead, slightly isometric view of a wide desk. From all four edges of the frame, hundreds of glowing message bubbles, envelopes and chat pills stream in from different directions (many entrances), and they funnel into ONE elegant glowing inbox tray at the center of the desk, where they line up neatly as a short orderly stack. A person's hands rest calmly beside a coffee cup; morning light through a window. The chaos is at the edges, the order is at the center." + COMMON],
 ["hero-c-split",
  "Concept: BEFORE / AFTER split by a door. Left half of the frame: a dim, cramped wall of stacked phones and screens, every one buzzing with notification bubbles, overflowing paper and tangled cables, a tired figure buried in it. A vertical door frame of warm light divides the image. Right half: a bright, airy cream room, one slim screen with a short calm list (abstract blocks, no text), a relaxed figure leaning back, a small plant, sunlight. The same person, stepping from left to right through the door." + COMMON],
];
async function gen(prompt){ let last; for(const m of MODELS){ try{
  const r = await client.images.generate({ model: m, prompt, size: "1536x1024", quality: "high" }); return [m, r.data[0].b64_json];
 }catch(e){ last=e; console.error("model",m,"failed:",e.status||"",String(e.message).slice(0,160)); } } throw last; }
(async () => {
  for (const [name, spec] of PAGES) { const f = path.join(__dirname, "hero", name + ".png"); if (fs.existsSync(f)) { console.log("skip", name); continue; }
    try { const [m,b64]=await gen(spec); fs.writeFileSync(f, Buffer.from(b64,"base64")); console.log("ok", name, m); } catch (e) { console.error("fail", name, e.message); } }
  console.log("DONE");
})();
