/**
 * 下载图片
 * @param imageUrl 图片 URL 或 base64
 * @param filename 文件名
 */
export const downloadImage = (imageUrl: string, filename: string = 'generated-image.png'): void => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 将 base64 转换为 Blob
 */
export const base64ToBlob = (base64: string, mimeType: string = 'image/png'): Blob => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
};

/**
 * 创建图片 URL
 */
export const createImageUrl = (imageData: string): string => {
  if (imageData.startsWith('data:')) {
    return imageData;
  }
  // 如果是纯 base64，添加前缀
  return `data:image/png;base64,${imageData}`;
};
