"use client";
/**
 * T21: make a shareable PNG in the browser (certificates, the tree). Nothing is uploaded anywhere;
 * the learner gets a file to save or share.
 */

function cssVar(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function download(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

function base(w = 1200, h = 630) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = cssVar("--bg", "#eef6ff");
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = cssVar("--surface", "#ffffff");
  ctx.strokeStyle = cssVar("--brand", "#1f6fd8");
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(40, 40, w - 80, h - 80, 48);
  ctx.fill();
  ctx.stroke();
  return { c, ctx, w, h };
}

const FONT = "ui-sans-serif, system-ui, sans-serif";

/** «Ready for warehouse work» certificate. */
export function downloadCertificate(o: { nickname: string; title: string; emoji: string; score: number; total: number; day: string }) {
  const { c, ctx, w } = base();
  ctx.textAlign = "center";
  ctx.fillStyle = cssVar("--brand", "#1f6fd8");
  ctx.font = `800 44px ${FONT}`;
  ctx.fillText("snakk.  ·  Certificate", w / 2, 130);
  ctx.font = `120px ${FONT}`;
  ctx.fillText(o.emoji, w / 2, 270);
  ctx.fillStyle = cssVar("--ink", "#101828");
  ctx.font = `900 60px ${FONT}`;
  ctx.fillText(`Ready for ${o.title.toLowerCase()}`, w / 2, 370);
  ctx.font = `600 36px ${FONT}`;
  ctx.fillText(`${o.nickname || "A Snakk learner"} passed the Norwegian level-up test`, w / 2, 440);
  ctx.fillStyle = cssVar("--muted", "#5b6475");
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText(`${o.score} of ${o.total} right · ${o.day}`, w / 2, 500);
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText("Snakk practice certificate · not an official exam", w / 2, 548);
  download(c, `snakk-certificate-${o.title.toLowerCase().replace(/[^a-z]+/g, "-")}.png`);
}

/** The learner's tree, from the tree's own SVG on the page. */
export function downloadTree(svg: SVGSVGElement, o: { nickname: string; stage: string; words: number; scenarios: number; streak: number }) {
  const { c, ctx, w } = base();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  // Inline the theme colours the tree uses via CSS classes, so the image looks the same outside the page.
  clone.querySelectorAll<SVGElement>("*").forEach((el, i) => {
    const src = svg.querySelectorAll<SVGElement>("*")[i];
    const cs = getComputedStyle(src);
    el.setAttribute("fill", cs.fill);
    el.setAttribute("stroke", cs.stroke);
    el.setAttribute("opacity", cs.opacity);
  });
  clone.setAttribute("width", "420");
  clone.setAttribute("height", "420");
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 90, 105, 420, 420);
    ctx.textAlign = "left";
    ctx.fillStyle = cssVar("--brand", "#1f6fd8");
    ctx.font = `800 40px ${FONT}`;
    ctx.fillText("snakk.", 560, 160);
    ctx.fillStyle = cssVar("--ink", "#101828");
    ctx.font = `900 56px ${FONT}`;
    ctx.fillText(`My Norwegian tree`, 560, 250);
    ctx.font = `600 34px ${FONT}`;
    ctx.fillText(`${o.stage}`, 560, 310);
    ctx.fillStyle = cssVar("--muted", "#5b6475");
    ctx.font = `500 30px ${FONT}`;
    ctx.fillText(`🧠 ${o.words} words   🎙️ ${o.scenarios} conversations`, 560, 380);
    ctx.fillText(`🔥 ${o.streak}-day streak${o.nickname ? `   ·   ${o.nickname}` : ""}`, 560, 430);
    download(c, "snakk-my-tree.png");
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  void w;
}
