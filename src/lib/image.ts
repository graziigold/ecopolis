/** Recorta a imagem em quadrado e reduz para `size` px, gerando um JPEG leve (data URL). */
export async function toSquareJpeg(file: File, size = 320): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('imagem inválida'));
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas indisponível');
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Valida o arquivo escolhido; devolve a mensagem de erro ou null. */
export function imageFileError(file: File, maxMb = 8) {
  if (!file.type.startsWith('image/')) return 'Escolha um arquivo de imagem (JPG, PNG ou WebP).';
  if (file.size > maxMb * 1024 * 1024) return `A imagem deve ter no máximo ${maxMb} MB.`;
  return null;
}
