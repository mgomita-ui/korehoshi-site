// 最後のCTAの絵：あるあると同じ絵柄・同じ人物で、濃紺の背景に「入口がひとつの受信箱に集まり、人は落ち着いて確かめる」場面
const fs = require("fs"), path = require("path");
const lb = "C:/Users/mgomi/dev/lovebu-manga-builder/lovebu-manga-builder";
if (!process.env.OPENAI_API_KEY) { try { require(path.join(lb,"node_modules","dotenv")).config({path:path.join(lb,".env")}); } catch(e){} }
const OpenAI = require(path.join(lb,"node_modules","openai")); const { toFile } = OpenAI;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 600000 });
const spec = `Draw a NEW scene in exactly the same flat illustration style and the same character design as the reference (do not copy the reference scene). Scene: the same office worker sits relaxed at a tidy desk holding a mug, looking calmly at ONE glowing white inbox card floating above the desk. From the left and top, several thin light streams (speech bubbles, envelopes, document icons, a calendar icon) flow from small floating device icons (phone, laptop, tablet) and merge into that single inbox card. On the card: four neat grey rows with small colored status dots and one coral dot. The worker's hand rests near a single big coral button on the desk. Background: solid deep navy #0B2F80 (NOT white); all shapes in white, pale blue #EEF3FC, light blue #9DB4E8 and one coral accent #E85B52. Flat vector, no gradients, no text, no letters, no logos, no faces beyond two dot eyes. Landscape 3:2 with the main subject centered-right and empty navy space on the left third.`;
(async () => {
  const ref = await toFile(fs.readFileSync(path.join(__dirname,"img","aru","aru1.png")), "ref.png", {type:"image/png"});
  const r = await client.images.edit({ model: "gpt-image-2.5-sunburst", image: ref, prompt: spec, size: "1536x1024", quality: "high" });
  fs.writeFileSync(path.join(__dirname,"img","cta.png"), Buffer.from(r.data[0].b64_json,"base64")); console.log("ok cta");
})().catch(e=>{console.error("fail",String(e.message).slice(0,300));process.exit(1)});
