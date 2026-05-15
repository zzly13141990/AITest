import html2pdf from 'html2pdf.js';
import type { QuestionConfig } from '../types';

export class PDFService {
  // 生成 PDF
  static async generatePDF(
    content: string,
    config: QuestionConfig,
    elementId: string = 'pdf-content'
  ): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) return;

    const opt = {
      margin: [20, 20, 20, 20], // 上下左右边距
      filename: `${config.subject}_${config.grade}_题目.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    };

    await html2pdf().set(opt).from(element).save();
  }

  // 打印功能
  static print(): void {
    window.print();
  }
}
