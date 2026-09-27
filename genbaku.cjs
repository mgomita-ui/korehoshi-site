// バクラク風のヒーロー画像（濃い青のグラデーション、中央に光るカード、周りに浮かぶ書類と吹き出し）3案
const fs = require("fs"), path = require("path");
const lb = "C:/Users/mgomi/dev/lovebu-manga-builder/lovebu-manga-builder";
if (!process.env.OPENAI_API_KEY) { try { require(path.join(lb,"node_modules","dotenv")).config({path:path.join(lb,".env")}); } catch(e){} }
const OpenAI = require(path.join(lb,"node_modules","openai"));
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 600000 });
const MODELS = ["gpt-image-2.5-sunburst", "gpt-image-2.5-flare", "gpt-image-2"];
const COMMON = " Style: Japanese enterprise SaaS key visual, clean corporate 3D render, deep royal-blue to navy gradient background with soft light rays, glossy glass and white surfaces, subtle depth of field, crisp edges, premium and trustworthy. 3:2 landscape. No logos of any real product, no readable text anywhere, no characters, no people's faces. UI elements are abstract (grey bars, colored dots), never legible words.";
const PAGES = [
 ["baku-a-card", "Center: a single glowing white rounded card (like an inbox tray) floating in space, with a soft blue halo. Around it, dozens of semi-transparent floating objects stream toward the card from all directions: chat speech bubbles, envelopes, PDF-like documents, calendar sheets, small screenshots of chat windows (abstract). Near the card they line up into a neat orderly stack. Foreground objects large and blurred, background objects small and sharp." + COMMON],
 ["baku-b-device", "Center-right: a floating laptop-like glass screen showing two abstract panes (left: a chat column, right: an inbox list with colored status dots). From the left edge, a river of floating envelopes, speech bubbles and documents flows into the screen and becomes the orderly list. Empty space on the left third of the image for a headline." + COMMON],
 ["baku-c-doors", "Center: a glowing white inbox card. Around it, five small floating glass 'doorways' (thin rounded rectangles of light) at different angles, each emitting a stream of speech bubbles or envelopes that all converge into the central card. Suggests many entrances, one inbox. Slightly low camera angle, dramatic but clean." + COMMON],
];
async function gen(prompt){ let last; for(const m of MODELS){ try{
  const r = await client.images.generate({ model: m, prompt, size: "1536x1024", quality: "high" }); return [m, r.data[0].b64_json];
 }catch(e){ last=e; console.error("model",m,"failed:",e.status||"",String(e.message).slice(0,160)); } } throw last; }
(async () => {
  for (const [name, spec] of PAGES) { const f = path.join(__dirname, "hero", name + ".png"); if (fs.existsSync(f)) { console.log("skip", name); continue; }
    try { const [m,b64]=await gen(spec); fs.writeFileSync(f, Buffer.from(b64,"base64")); console.log("ok", name, m); } catch (e) { console.error("fail", name, e.message); } }
  console.log("DONE");
})();
