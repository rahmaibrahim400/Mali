// Profile photos are stored on the user/admin record and sent with every login and page load,
// so they are shrunk before upload: at most 256×256, re-encoded as JPEG (≈ 15–40 KB instead of
// hundreds of KB). The aspect ratio is kept; nothing is cropped.
const MAX_SIDE = 256;
const QUALITY = 0.85;

export function avatarDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Unreadable image"));
      image.onload = () => {
        const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        // JPEG has no transparency: paint white first so transparent PNGs don't turn black.
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", QUALITY));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
