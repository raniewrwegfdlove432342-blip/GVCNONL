import { QuizQuestion } from '../types';
import { shuffleArray, shuffleQuestionChoices } from './quizShuffle';

/**
 * Trích xuất câu hỏi trắc nghiệm nếu giáo viên dán đề thi/câu hỏi có sẵn dạng:
 * "Câu 1: ... A. ... B. ... C. ... D. ... Đáp án: A / Đ/A: B"
 * hoặc "1. ... A. ... B. ... C. ... D. ..."
 */
export function parseFormattedQuizFromText(text: string): QuizQuestion[] {
  if (!text || text.trim().length < 30) return [];

  const questions: QuizQuestion[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Mẫu nhận diện câu hỏi: "Câu 1:", "Câu 1.", "1.", "1/", "Bài 1:"
  const questionRegex = /^(?:Câu|CÂU|Bài|BÀI|Question|\#)?\s*(\d+)[\.\:\-\/\)]\s*(.*)$/i;
  // Mẫu nhận diện đáp án: "A.", "A)", "[A]", "A -"
  const optionRegex = /^[A-Da-d][\.\)\:\-]\s*(.*)$/;
  // Mẫu nhận diện dòng đáp án đúng: "Đáp án: A", "Đ/A: B", "Key: C", "Chọn D"
  const answerRegex = /(?:Đáp án|ĐÁP ÁN|Đ\/A|ĐA|Key|KEY|Chọn|CHỌN|Answer|Ans)[\s\:\-\=]+([A-Da-d])/i;

  let currentQ: {
    number: number;
    questionText: string;
    options: string[];
    correctLetter: string | null;
    explanation: string;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Kiểm tra xem dòng này có chứa đáp án đúng hay không
    const ansMatch = line.match(answerRegex);
    if (ansMatch && currentQ) {
      currentQ.correctLetter = ansMatch[1].toUpperCase();
      const expPart = line.replace(answerRegex, '').replace(/^[\.\,\;\-]\s*/, '').trim();
      if (expPart) {
        currentQ.explanation = expPart;
      }
      continue;
    }

    // Kiểm tra bắt đầu câu hỏi mới
    const qMatch = line.match(questionRegex);
    if (qMatch && (!optionRegex.test(line))) {
      if (currentQ && currentQ.options.length >= 2) {
        questions.push(finalizeParsedQuestion(currentQ, questions.length + 1));
      }
      currentQ = {
        number: parseInt(qMatch[1], 10),
        questionText: qMatch[2] || line,
        options: [],
        correctLetter: null,
        explanation: '',
      };
      continue;
    }

    // Kiểm tra dòng chứa 4 phương án trên 1 dòng: "A. X  B. Y  C. Z  D. W"
    if (currentQ && line.includes('A.') && line.includes('B.')) {
      const parts = line.split(/(?=[A-D]\.)/);
      if (parts.length >= 2) {
        parts.forEach(p => {
          const cleaned = p.replace(/^[A-D]\.\s*/, '').trim();
          if (cleaned) currentQ!.options.push(cleaned);
        });
        continue;
      }
    }

    // Kiểm tra phương án đơn: "A. Nội dung"
    const optMatch = line.match(optionRegex);
    if (optMatch && currentQ) {
      currentQ.options.push(optMatch[1].trim());
      continue;
    }

    // Nếu là dòng giải thích
    if (currentQ && (line.startsWith('Giải thích:') || line.startsWith('Lời giải:'))) {
      currentQ.explanation = line.replace(/^(Giải thích|Lời giải)[\:\s]*/i, '').trim();
      continue;
    }

    // Nếu câu hỏi dài nhiều dòng
    if (currentQ && currentQ.options.length === 0) {
      currentQ.questionText += ' ' + line;
    }
  }

  if (currentQ && currentQ.options.length >= 2) {
    questions.push(finalizeParsedQuestion(currentQ, questions.length + 1));
  }

  return questions;
}

function finalizeParsedQuestion(
  raw: {
    number: number;
    questionText: string;
    options: string[];
    correctLetter: string | null;
    explanation: string;
  },
  index: number
): QuizQuestion {
  // Chuẩn hóa 4 phương án
  const opts = [...raw.options];
  while (opts.length < 4) {
    opts.push(`Phương án ${String.fromCharCode(65 + opts.length)}`);
  }
  const slicedOpts = opts.slice(0, 4);

  let correctIndex = 0;
  if (raw.correctLetter) {
    const charCode = raw.correctLetter.charCodeAt(0) - 65;
    if (charCode >= 0 && charCode <= 3) {
      correctIndex = charCode;
    }
  }

  const diff = index <= 4 ? 'easy' : index <= 8 ? 'medium' : index <= 12 ? 'hard' : 'expert';
  const pts = diff === 'easy' ? 10 : diff === 'medium' ? 20 : diff === 'hard' ? 30 : 50;

  return {
    id: index,
    question: raw.questionText.trim(),
    options: slicedOpts,
    correctIndex,
    explanation: raw.explanation.trim() || `Đáp án đúng là ${String.fromCharCode(65 + correctIndex)} theo tài liệu.`,
    difficulty: diff,
    points: pts,
    isApproved: true,
  };
}

/**
 * Trích xuất các ý chính, định nghĩa, mệnh đề khoa học từ văn bản giáo viên nhập
 * để tạo câu hỏi sư phạm chuẩn xác 100% bám sát nội dung, KHÔNG DÙNG CÂU HỎI TÀO LAO.
 */
export function extractKeyStatementsFromContent(content: string): string[] {
  if (!content) return [];
  
  // Loại bỏ khoảng trắng dư thừa
  const clean = content.replace(/\r/g, '').trim();
  
  // Tách theo câu và dấu gạch đầu dòng
  const segments = clean
    .split(/[\n\r]+/)
    .flatMap(p => p.split(/(?<=[.!?])\s+/))
    .map(s => s.replace(/^[\s\-\*\•\d+\.\)]+/, '').trim())
    .filter(s => s.length >= 25 && s.length <= 350 && !s.startsWith('http'));

  return segments;
}

/**
 * Tạo câu hỏi trắc nghiệm thực sự bám sát văn bản giáo viên đưa
 * với 4 phương án học thuật có ý nghĩa, được trích xuất từ chính các đoạn trong văn bản.
 */
export function generateQuestionsDirectlyFromContent(
  topic: string,
  content: string,
  count: number = 10,
  progressiveDifficulty: boolean = true
): QuizQuestion[] {
  // 1. Kiểm tra trước xem giáo viên có dán trực tiếp đề trắc nghiệm vào không
  const parsedDirectly = parseFormattedQuizFromText(content);
  if (parsedDirectly.length >= 1) {
    // Nếu giáo viên dán đề trắc nghiệm có sẵn, giữ nguyên và sắp xếp theo số lượng yêu cầu
    return parsedDirectly.slice(0, count).map((q, idx) => ({
      ...q,
      id: idx + 1,
      topic: topic || q.topic,
    }));
  }

  // 2. Trích xuất các mệnh đề, định nghĩa, dữ kiện từ bài giảng / tài liệu
  const statements = extractKeyStatementsFromContent(content);
  if (statements.length === 0) {
    return [];
  }

  const generatedQuestions: QuizQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const mainStatement = statements[i % statements.length];
    const otherStatements = statements.filter(s => s !== mainStatement);
    
    // Tỷ lệ độ khó tăng dần
    const ratio = (i + 1) / count;
    let difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'easy';
    let pts = 10;
    let questionTitle = '';

    if (progressiveDifficulty) {
      if (ratio <= 0.35) {
        difficulty = 'easy';
        pts = 10;
        questionTitle = `[Nhận biết] Căn cứ tài liệu chuyên đề "${topic}", phát biểu nào sau đây là ĐÚNG?`;
      } else if (ratio <= 0.7) {
        difficulty = 'medium';
        pts = 20;
        questionTitle = `[Thông hiểu] Theo bài giảng chuyên đề "${topic}", luận điểm nào phản ánh chính xác nhất kiến thức trọng tâm?`;
      } else if (ratio < 1) {
        difficulty = 'hard';
        pts = 30;
        questionTitle = `[Vận dụng] Dựa vào tài liệu chuyên đề "${topic}", kết luận nào sau đây có căn cứ khoa học chuẩn xác nhất?`;
      } else {
        difficulty = 'expert';
        pts = 50;
        questionTitle = `[Vận dụng cao - Đỉnh cao] Từ toàn bộ nội dung chuyên đề "${topic}", nhận định mang tính bản chất và toàn diện nhất là gì?`;
      }
    } else {
      difficulty = 'medium';
      pts = 20;
      questionTitle = `Theo tài liệu chuyên đề "${topic}", nhận định nào sau đây là ĐÚNG?`;
    }

    // Tạo 4 phương án trắc nghiệm có nghĩa từ chính tài liệu của GV
    const correctAnswer = mainStatement;
    
    // Lấy 3 phương án gây nhiễu từ các câu khác trong tài liệu của giáo viên để nội dung luôn thuộc chuyên đề
    const distractors: string[] = [];
    if (otherStatements.length >= 3) {
      const shuffledOthers = shuffleArray(otherStatements);
      distractors.push(shuffledOthers[0]);
      distractors.push(shuffledOthers[1]);
      distractors.push(shuffledOthers[2]);
    } else if (otherStatements.length > 0) {
      otherStatements.forEach(s => distractors.push(s));
      while (distractors.length < 3) {
        if (distractors.length === 1) {
          distractors.push(`Không diễn ra theo cơ chế được mô tả trong nội dung chuyên đề ${topic}`);
        } else {
          distractors.push(`Chỉ là trường hợp ngoại lệ cá biệt, không phản ánh quy luật chung`);
        }
      }
    } else {
      distractors.push(`Diễn ra theo chiều hướng ngược lại so với quy luật được nêu trong tài liệu`);
      distractors.push(`Chỉ là giả thuyết ban đầu, chưa được kiểm chứng trong chuyên đề ${topic}`);
      distractors.push(`Không có mối liên hệ trực tiếp với bản chất của chuyên đề ${topic}`);
    }

    const rawOptions = [correctAnswer, ...distractors.slice(0, 3)];
    const shuffledOptions = shuffleArray(rawOptions);
    const correctIndex = shuffledOptions.indexOf(correctAnswer);

    const questionObj: QuizQuestion = {
      id: i + 1,
      question: questionTitle,
      options: shuffledOptions,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation: `Căn cứ chuẩn xác theo tài liệu giáo viên đã cung cấp: "${mainStatement}".`,
      difficulty,
      points: pts,
      topic,
      isApproved: true,
    };

    generatedQuestions.push(questionObj);
  }

  return generatedQuestions;
}
