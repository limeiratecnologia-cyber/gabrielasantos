/**
 * Utility to convert images (like JPEG) to high-quality crisp PNG format at runtime
 */
export function convertToPng(imageSrc: string, removeWhiteBackground: boolean = true): Promise<string> {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve("");
      return;
    }
    // If it's already a transparent PNG data URL, return it directly
    if (imageSrc.startsWith("data:image/png") && !removeWhiteBackground) {
      resolve(imageSrc);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        // Super-sample by 2x for retina-like sharpness and subpixel rendering
        const scale = 2;
        canvas.width = (img.naturalWidth || img.width) * scale;
        canvas.height = (img.naturalHeight || img.height) * scale;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          if (removeWhiteBackground) {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            const threshold = 230; // Anything whiter than 230 becomes transparent
            
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i+1];
              const b = data[i+2];
              
              if (r > threshold && g > threshold && b > threshold) {
                const minChannel = Math.min(r, g, b);
                const alpha = 1.0 - (minChannel - threshold) / (255 - threshold);
                data[i+3] = Math.max(0, Math.min(255, Math.floor(alpha * 255)));
              }
            }
            ctx.putImageData(imgData, 0, 0);
          }
          
          // Export as high-quality PNG
          const pngDataUrl = canvas.toDataURL("image/png", 1.0);
          resolve(pngDataUrl);
        } else {
          resolve(imageSrc);
        }
      } catch (err) {
        console.error("Error drawing image to canvas:", err);
        resolve(imageSrc);
      }
    };
    img.onerror = () => {
      resolve(imageSrc);
    };
    img.src = imageSrc;
  });
}
