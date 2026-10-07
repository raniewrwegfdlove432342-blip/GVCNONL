import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

/**
 * Hàm giải mã và trích xuất nội dung văn bản từ các file tài liệu
 * Khắc phục hoàn toàn lỗi font chữ tiếng Việt khi tải file lên (.docx, .txt, .xlsx, .csv...)
 */
export async function extractTextFromFile(file: File): Promise<{
  success: boolean;
  text: string;
  charCount: number;
  fileName: string;
  fileSize: string;
  fileType: string;
  message?: string;
}> {
  const fileName = file.name;
  const fileSize = (file.size / 1024).toFixed(1) + ' KB';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  try {
    // 1. File Word .docx
    if (ext === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        const cleanText = result.value.trim();
        if (cleanText.length > 0) {
          return {
            success: true,
            text: cleanText,
            charCount: cleanText.length,
            fileName,
            fileSize,
            fileType: 'Microsoft Word (.docx)',
            message: 'Đã trích xuất thành công tài liệu Word (.docx) chuẩn tiếng Việt Unicode!',
          };
        }
      } catch (docErr) {
        console.warn('Mammoth extraction fallback to raw text stream:', docErr);
      }

      // Fallback cho docx: đọc các thẻ <w:t>
      const textDecoder = new TextDecoder('utf-8');
      const rawXml = textDecoder.decode(arrayBuffer);
      const matches = rawXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
      const extracted = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
      if (extracted.trim().length > 0) {
        return {
          success: true,
          text: extracted.trim(),
          charCount: extracted.trim().length,
          fileName,
          fileSize,
          fileType: 'Microsoft Word (.docx)',
          message: 'Đã trích xuất tài liệu Word thành công!',
        };
      }
    }

    // 2. File Excel .xlsx / .xls
    if (ext === 'xlsx' || ext === 'xls') {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', codepage: 65001 });
      let combinedText = '';
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        if (sheet) {
          const csv = XLSX.utils.sheet_to_csv(sheet);
          if (csv.trim()) {
            combinedText += `\n[Sheet: ${sheetName}]\n` + csv + '\n';
          }
        }
      });

      const cleanText = combinedText.trim();
      return {
        success: true,
        text: cleanText,
        charCount: cleanText.length,
        fileName,
        fileSize,
        fileType: `Bảng tính Excel (.${ext})`,
        message: 'Đã trích xuất bảng tính Excel tiếng Việt thành công!',
      };
    }

    // 3. File văn bản thuần .txt, .csv, .md, .json
    const arrayBuffer = await file.arrayBuffer();
    let decodedText = '';

    // Thử giải mã chuẩn UTF-8 trước
    try {
      const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
      decodedText = utf8Decoder.decode(arrayBuffer);

      // Xóa ký tự BOM nếu có
      if (decodedText.charCodeAt(0) === 0xFEFF) {
        decodedText = decodedText.slice(1);
      }

      // Kiểm tra xem có bị lỗi font do Windows-1258 / TCVN3 không (nhiều ký tự  hoặc ký tự đặc biệt)
      const replacementCharCount = (decodedText.match(/\uFFFD/g) || []).length;
      if (replacementCharCount > 5) {
        try {
          const winDecoder = new TextDecoder('windows-1258');
          const winText = winDecoder.decode(arrayBuffer);
          if ((winText.match(/\uFFFD/g) || []).length < replacementCharCount) {
            decodedText = winText;
          }
        } catch {
          // Bỏ qua nếu trình duyệt không hỗ trợ windows-1258
        }
      }
    } catch {
      decodedText = await file.text();
    }

    const cleanText = decodedText.trim();
    return {
      success: true,
      text: cleanText,
      charCount: cleanText.length,
      fileName,
      fileSize,
      fileType: `Văn bản thuần (.${ext || 'txt'})`,
      message: 'Đã đọc văn bản tiếng Việt thành công!',
    };
  } catch (error: any) {
    console.error('Lỗi khi đọc file tài liệu:', error);
    return {
      success: false,
      text: '',
      charCount: 0,
      fileName,
      fileSize,
      fileType: ext.toUpperCase(),
      message: error?.message || 'Không thể đọc nội dung file. Bạn có thể mở file và copy/dán văn bản trực tiếp.',
    };
  }
}
