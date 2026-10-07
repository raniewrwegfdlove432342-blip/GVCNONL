import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint: AI Tự tạo câu hỏi theo chủ đề và nội dung giáo viên đưa (Gemini API SDK)
app.post('/api/gemini/generate-quiz', async (req, res) => {
  try {
    const { 
      topic = 'Kiến thức tổng hợp', 
      content = '', 
      count = 10, 
      difficulty = 'progressive', 
      progressiveDifficulty = true,
      gradeLevel = 'Lớp 12' 
    } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        error: 'Chưa cấu hình GEMINI_API_KEY trên hệ thống.',
        fallbackNeeded: true
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const hasContent = typeof content === 'string' && content.trim().length > 0;
    const isProgressive = progressiveDifficulty || difficulty === 'progressive';

    const promptText = `Bạn là chuyên gia sư phạm và trợ lý giáo viên trung học phổ thông giàu kinh nghiệm.
Nhiệm vụ của bạn là soạn bộ ${count} câu hỏi trắc nghiệm tiếng Việt chất lượng cao.
CHỦ ĐỀ: "${topic}"
ĐỐI TƯỢNG HỌC SINH: ${gradeLevel}.

${hasContent ? `NỘI DUNG / TÀI LIỆU CHI TIẾT DO GIÁO VIÊN CUNG CẤP:
"""
${content.trim().slice(0, 15000)}
"""
YÊU CẦU ĐẶC BIỆT QUAN TRỌNG: Mọi câu hỏi, các phương án lựa chọn và đáp án đúng BẮT BUỘC PHẢI DỰA TRÊN NỘI DUNG TÀI LIỆU TRÊN. Hãy khai thác sâu các chi tiết, sự kiện, khái niệm, số liệu và bài học trong tài liệu.` : 'YÊU CẦU: Soạn câu hỏi bám sát chương trình THPT chuẩn, phong phú, thực tế và hấp dẫn.'}

TIÊU CHUẨN CHẤT LƯỢNG NGHIÊM NGẶT (TUYỆT ĐỐI KHÔNG SOẠN SƠ SÀI HAY SAI HÌNH THỨC):
1. Tự kiểm tra tính chính xác: Đọc lại toàn bộ nội dung và đáp án, bảo đảm đáp án đúng phải 100% chuẩn xác theo kiến thức giáo khoa hoặc tài liệu cung cấp. Không tạo câu hỏi mơ hồ hay tranh cãi.
2. 4 Phương án lựa chọn: 4 phương án A, B, C, D phải rõ ràng, có độ dài tương đương, mang tính học thuật cao. Phương án gây nhiễu phải hợp lý và thuyết phục, không đặt phương án vô lý hay sơ sài.
3. Vị trí đáp án đúng ngẫu nhiên: Trải đều đáp án đúng ngẫu nhiên vào các vị trí 0 (A), 1 (B), 2 (C), 3 (D) (không thiên lệch về một chữ cái nào).
4. Lời giải thích khoa học: Giải thích rõ ràng vì sao đáp án đó đúng, chỉ rõ căn cứ trong bài học để học sinh tâm phục khẩu phục.

${isProgressive ? `QUY TẮC MỨC ĐỘ KHÓ TĂNG DẦN BẮT BUỘC (Mức độ khó tăng dần rõ rệt cho các câu về sau):
Bộ gồm đúng ${count} câu hỏi, được sắp xếp theo thứ tự độ khó TĂNG DẦN:
- CÁC CÂU ĐẦU (khoảng 35% đầu tiên): Mức DỄ ("easy" / Nhận biết) - Câu hỏi hỏi trực tiếp thông tin, sự kiện, định nghĩa rõ ràng. Điểm thưởng: 10 điểm.
- CÁC CÂU GIỮA (khoảng 35% tiếp theo): Mức TRUNG BÌNH ("medium" / Thông hiểu) - Đòi hỏi hiểu bản chất, so sánh, phân tích ngắn hoặc liên hệ. Điểm thưởng: 20 điểm.
- CÁC CÂU TIẾP THEO (khoảng 20% tiếp theo): Mức KHÓ ("hard" / Vận dụng) - Phân tích tình huống, suy luận logic, giải quyết vấn đề. Điểm thưởng: 30 điểm.
- CÂU CUỐI CÙNG (10% cuối cùng): Mức VẬN DỤNG CAO ("expert" / Đỉnh cao tri thức) - Câu hỏi tư duy đỉnh cao, khái quát toàn bộ chủ đề hoặc câu hỏi lừa tinh tế, thú vị. Điểm thưởng: 50 điểm.` : `MỨC ĐỘ YÊU CẦU: ${difficulty}. Điểm thưởng: 10 đến 20 điểm.`}

MỖI CÂU HỎI BẮT BUỘC PHẢI CÓ ĐỦ CÁC TRƯỜNG:
- "id": Số thứ tự từ 1 đến ${count}
- "question": Câu hỏi rõ ràng, sư phạm, chuẩn mực
- "options": Mảng đúng 4 lựa chọn [Phương án A, Phương án B, Phương án C, Phương án D]
- "correctIndex": Chỉ số của đáp án đúng (0 cho A, 1 cho B, 2 cho C, 3 cho D)
- "explanation": Lời giải thích chi tiết, súc tích, mang tính giáo dục sâu sắc
- "difficulty": "easy" | "medium" | "hard" | "expert" (phải phản ánh đúng độ khó tăng dần)
- "points": Số điểm thưởng tương ứng (10 cho easy, 20 cho medium, 30 cho hard, 50 cho expert)

HÃY TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON MẢNG THEO SCHEMA SAU (KHÔNG KÈM THEO BẤT KỲ VĂN BẢN NGOÀI NÀO KHÁC):
[
  {
    "id": 1,
    "question": "Nội dung câu hỏi...",
    "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
    "correctIndex": 0,
    "explanation": "Giải thích chi tiết...",
    "difficulty": "easy",
    "points": 10
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let questions = [];
    const textOutput = response.text || '';
    try {
      questions = JSON.parse(textOutput);
    } catch {
      // In case wrapped in markdown code blocks
      const cleaned = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      questions = JSON.parse(cleaned);
    }

    if (!Array.isArray(questions)) {
      questions = [];
    }

    return res.json({
      success: true,
      topic,
      hasCustomContent: hasContent,
      count: questions.length,
      questions,
    });
  } catch (error: any) {
    console.error('Error generating quiz with Gemini:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Lỗi khi gọi Gemini AI để tạo câu hỏi.',
      fallbackNeeded: true,
    });
  }
});

// Start server
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Classroom Assistant Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
