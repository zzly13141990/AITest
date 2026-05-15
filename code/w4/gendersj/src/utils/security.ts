// HTML转义工具函数，防止XSS攻击
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 安全地将内容渲染为HTML（保留换行符，处理多余的&lt;br&gt;标签）
export function renderSafeHtml(content: string): string {
  if (!content) return '';
  let processed = content;
  processed = processed.replace(/<br\s*\/?>/gi, '\n');
  return escapeHtml(processed).replace(/\n/g, '<br>');
}
