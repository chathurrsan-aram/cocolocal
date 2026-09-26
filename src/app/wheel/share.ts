// Prize card image for "Save image" / "Send to WhatsApp". Drawn on a canvas in the browser;
// nothing is uploaded anywhere.

export type PrizeCard = { label: string; code: string; expiresText: string; firstName: string };

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function prizeImage(card: PrizeCard): Promise<Blob> {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0d0d43"; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,223,119,.55)"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.roundRect(60, 60, W - 120, H - 120, 36); ctx.stroke();
  try {
    const logo = await loadImage("/wheel/logo-640.png");
    const lw = 420, lh = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, (W - lw) / 2, 150, lw, lh);
  } catch { /* the card still works without the logo */ }
  ctx.textAlign = "center";
  ctx.fillStyle = "#c0c0db"; ctx.font = "600 44px Arial, Helvetica, sans-serif";
  ctx.fillText(`Coco Wheel prize for ${card.firstName}`, W / 2, 400);
  ctx.fillStyle = "#ffdf77"; ctx.font = "800 104px Arial, Helvetica, sans-serif";
  ctx.fillText(card.label, W / 2, 540, W - 200);
  ctx.fillStyle = "rgba(255,223,119,.12)";
  ctx.beginPath(); ctx.roundRect(170, 630, W - 340, 190, 28); ctx.fill();
  ctx.strokeStyle = "#ffdf77"; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = "#ffffff"; ctx.font = "800 110px 'Courier New', monospace";
  ctx.fillText(card.code, W / 2, 762);
  ctx.fillStyle = "#ffffff"; ctx.font = "600 46px Arial, Helvetica, sans-serif";
  ctx.fillText("Show this code at the till", W / 2, 920);
  ctx.fillStyle = "#c0c0db"; ctx.font = "400 40px Arial, Helvetica, sans-serif";
  ctx.fillText(`Use by ${card.expiresText}. One use only.`, W / 2, 985, W - 200);
  ctx.font = "400 36px Arial, Helvetica, sans-serif";
  ctx.fillText("Coco Local · 210 High Road, South Benfleet", W / 2, H - 150);
  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}

export function prizeText(card: PrizeCard) {
  return `My Coco Wheel prize: ${card.label}. Code ${card.code}. Show it at the till at Coco Local, 210 High Road, South Benfleet by ${card.expiresText}.`;
}

export async function savePrizeImage(card: PrizeCard) {
  const blob = await prizeImage(card);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `coco-wheel-${card.code}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Opens the phone's share sheet with the image (pick WhatsApp); otherwise opens WhatsApp with the text. */
export async function sendToWhatsApp(card: PrizeCard) {
  try {
    const file = new File([await prizeImage(card)], `coco-wheel-${card.code}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: prizeText(card) });
      return;
    }
  } catch (error) {
    if ((error as Error)?.name === "AbortError") return; // they closed the share sheet
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(prizeText(card))}`, "_blank", "noopener");
}
