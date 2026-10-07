import { QuizQuestion } from '../types';

/**
 * Trộn ngẫu nhiên mảng theo thuật toán Fisher-Yates
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Xáo trộn ngẫu nhiên 4 đáp án A, B, C, D của câu hỏi
 * Đảm bảo đáp án đúng luôn trỏ tới chỉ số mới chính xác 100%
 */
export function shuffleQuestionChoices(question: QuizQuestion): QuizQuestion {
  const originalCorrectAnswer = question.options[question.correctIndex];
  const shuffledOptions = shuffleArray(question.options);
  const newCorrectIndex = shuffledOptions.indexOf(originalCorrectAnswer);

  return {
    ...question,
    options: shuffledOptions,
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
  };
}

/**
 * Chuẩn bị bộ câu hỏi:
 * 1. Câu hỏi ngẫu nhiên được chọn từ ngân hàng
 * 2. Sắp xếp theo thứ tự mức độ khó TĂNG DẦN: Dễ -> Trung bình -> Khó -> Vận dụng cao
 * 3. Đáp án của từng câu hỏi được xáo trộn ngẫu nhiên (A, B, C, D ngẫu nhiên)
 */
export function buildProgressiveQuiz(
  bank: QuizQuestion[],
  desiredCount: number = 15
): QuizQuestion[] {
  if (!bank || bank.length === 0) return [];

  // Phân loại câu hỏi theo các mức độ khó
  const easyPool: QuizQuestion[] = [];
  const mediumPool: QuizQuestion[] = [];
  const hardPool: QuizQuestion[] = [];
  const expertPool: QuizQuestion[] = [];

  bank.forEach(q => {
    const diff = q.difficulty || 'medium';
    if (diff === 'easy') easyPool.push(q);
    else if (diff === 'medium') mediumPool.push(q);
    else if (diff === 'hard') hardPool.push(q);
    else expertPool.push(q);
  });

  const allPool = shuffleArray(bank);
  while (easyPool.length < 3 && allPool.length > 0) {
    easyPool.push({ ...allPool[easyPool.length % allPool.length], difficulty: 'easy', points: 10 });
  }
  while (mediumPool.length < 4 && allPool.length > 0) {
    mediumPool.push({ ...allPool[(easyPool.length + mediumPool.length) % allPool.length], difficulty: 'medium', points: 20 });
  }
  while (hardPool.length < 4 && allPool.length > 0) {
    hardPool.push({ ...allPool[(easyPool.length + mediumPool.length + hardPool.length) % allPool.length], difficulty: 'hard', points: 30 });
  }
  while (expertPool.length < 3 && allPool.length > 0) {
    expertPool.push({ ...allPool[(easyPool.length + mediumPool.length + hardPool.length + expertPool.length) % allPool.length], difficulty: 'expert', points: 50 });
  }

  const shuffledEasy = shuffleArray(easyPool);
  const shuffledMedium = shuffleArray(mediumPool);
  const shuffledHard = shuffleArray(hardPool);
  const shuffledExpert = shuffleArray(expertPool);

  const easyCount = Math.max(1, Math.round(desiredCount * 0.3));
  const mediumCount = Math.max(1, Math.round(desiredCount * 0.35));
  const hardCount = Math.max(1, Math.round(desiredCount * 0.25));
  const expertCount = Math.max(1, desiredCount - easyCount - mediumCount - hardCount);

  const selectedQuestions: QuizQuestion[] = [];

  for (let i = 0; i < easyCount; i++) {
    const q = shuffledEasy[i % shuffledEasy.length];
    selectedQuestions.push({
      ...q,
      difficulty: 'easy',
      points: 10,
    });
  }

  for (let i = 0; i < mediumCount; i++) {
    const q = shuffledMedium[i % shuffledMedium.length];
    selectedQuestions.push({
      ...q,
      difficulty: 'medium',
      points: 20,
    });
  }

  for (let i = 0; i < hardCount; i++) {
    const q = shuffledHard[i % shuffledHard.length];
    selectedQuestions.push({
      ...q,
      difficulty: 'hard',
      points: 30,
    });
  }

  for (let i = 0; i < expertCount; i++) {
    const q = shuffledExpert[i % shuffledExpert.length];
    selectedQuestions.push({
      ...q,
      difficulty: 'expert',
      points: 50,
    });
  }

  return selectedQuestions.slice(0, desiredCount).map((q, idx) => {
    const randomized = shuffleQuestionChoices(q);
    return {
      ...randomized,
      id: idx + 1,
    };
  });
}

export interface TopicBankPreset {
  id: string;
  name: string;
  category: string;
  shortTag: string;
  description: string;
  secretWord: string;
  secretHint: string;
  questions: QuizQuestion[];
}

export const PRESET_TOPIC_BANKS: TopicBankPreset[] = [
  // 1. LỊCH SỬ 12
  {
    id: 'history_12',
    name: 'Lịch sử 12: Điện Biên Phủ & Mùa Xuân 1975',
    category: 'Lịch Sử',
    shortTag: 'Lịch Sử',
    description: 'Chuyên đề các mốc son chói lọi trong lịch sử đấu tranh giải phóng dân tộc của nhân dân Việt Nam.',
    secretWord: 'DIENBIENPHU',
    secretHint: 'Chiến thắng lừng lẫy năm châu, chấn động địa cầu kết thúc 56 ngày đêm năm 1954.',
    questions: [
      {
        id: 1,
        question: 'Chiến thắng Điện Biên Phủ lừng lẫy năm châu, chấn động địa cầu diễn ra vào năm nào?',
        options: ['Năm 1954', 'Năm 1945', 'Năm 1975', 'Năm 1930'],
        correctIndex: 0,
        explanation: 'Ngày 7/5/1954, tập đoàn cứ điểm Điện Biên Phủ hoàn toàn bị tiêu diệt.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 2,
        question: 'Bản Tuyên ngôn Độc lập khai sinh nước Việt Nam Dân chủ Cộng hòa được Bác Hồ đọc vào ngày nào?',
        options: ['2/9/1945', '19/8/1945', '30/4/1975', '27/7/1947'],
        correctIndex: 0,
        explanation: 'Ngày 2/9/1945 tại Quảng trường Ba Đình lịch sử, Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 3,
        question: 'Ai là Tổng Tư lệnh tối cao của Quân đội Nhân dân Việt Nam trong chiến dịch Điện Biên Phủ?',
        options: ['Đại tướng Võ Nguyên Giáp', 'Đại tướng Văn Tiến Dũng', 'Đại tướng Nguyễn Chí Thanh', 'Đại tướng Chu Huy Mân'],
        correctIndex: 0,
        explanation: 'Đại tướng Võ Nguyên Giáp là Bí thư Đảng ủy kiêm Chỉ huy trưởng chiến dịch Điện Biên Phủ.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 4,
        question: 'Hiệp định Genève về chấm dứt chiến tranh ở Đông Dương được ký kết vào năm nào?',
        options: ['Năm 1954', 'Năm 1946', 'Năm 1973', 'Năm 1968'],
        correctIndex: 0,
        explanation: 'Hiệp định Genève được ký kết tháng 7/1954 sau thắng lợi lịch sử tại Điện Biên Phủ.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 5,
        question: 'Đại tướng Võ Nguyên Giáp đã quyết định chuyển phương châm tác chiến tại Điện Biên Phủ từ gì sang gì?',
        options: ['"Đánh nhanh thắng nhanh" sang "Đánh chắc tiến chắc"', '"Đánh chắc tiến chắc" sang "Đánh nhanh thắng nhanh"', '"Phòng ngự phản công" sang "Tổng tiến công"', '"Vừa đánh vừa đàm" sang "Bao vây đánh lấn"'],
        correctIndex: 0,
        explanation: 'Quyết định chuyển sang "Đánh chắc tiến chắc" được xem là quyết định sáng suốt nhất trong sự nghiệp cầm quân của Đại tướng.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 6,
        question: 'Chiến dịch Hồ Chí Minh lịch sử giải phóng hoàn toàn miền Nam kết thúc thắng lợi vào ngày nào?',
        options: ['30/4/1975', '26/3/1975', '21/4/1975', '1/5/1975'],
        correctIndex: 0,
        explanation: 'Trưa 30/4/1975, xe tăng quân giải phóng húc đổ cổng Dinh Độc Lập, non sông thu về một mối.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 7,
        question: 'Thắng lợi quân sự nào của ta trong năm 1972 đã buộc Mỹ phải ký Hiệp định Paris rút quân về nước?',
        options: ['Chiến thắng "Điện Biên Phủ trên không" 12 ngày đêm', 'Chiến dịch Tây Nguyên', 'Chiến dịch Khe Sanh', 'Chiến dịch Đường 9 - Nam Lào'],
        correctIndex: 0,
        explanation: 'Chiến thắng đập tan cuộc tập kích B-52 của Mỹ vào Hà Nội tháng 12/1972 đã quyết định việc ký Hiệp định Paris 1973.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 8,
        question: 'Địa đạo Củ Chi nổi tiếng với hệ thống đường ngầm kiên cố thuộc địa phận tỉnh/thành phố nào?',
        options: ['Thành phố Hồ Chí Minh', 'Bình Dương', 'Tây Ninh', 'Đồng Nai'],
        correctIndex: 0,
        explanation: 'Địa đạo Củ Chi nằm ở huyện Củ Chi, TP. Hồ Chí Minh, là "vùng đất thép" anh hùng.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 9,
        question: 'Ý nghĩa quốc tế to lớn nhất của thắng lợi Điện Biên Phủ năm 1954 là gì?',
        options: ['Cổ vũ mạnh mẽ phong trào giải phóng dân tộc của các nước thuộc địa trên toàn thế giới', 'Mở rộng thị trường xuất khẩu', 'Lập tức chấm dứt Chiến tranh Lạnh', 'Thành lập Liên Hợp Quốc'],
        correctIndex: 0,
        explanation: 'Chiến thắng Điện Biên Phủ đã làm sụp đổ chủ nghĩa thực dân cũ, mở đầu cho sự giải phóng thuộc địa tại châu Á, châu Phi.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 10,
        question: 'Trong chiến dịch Tây Nguyên tháng 3/1975, trận đánh nào mở màn có ý nghĩa đòn điểm huyệt chiến lược?',
        options: ['Trận Buôn Ma Thuột', 'Trận Pleiku', 'Trận Kon Tum', 'Trận Đà Lạt'],
        correctIndex: 0,
        explanation: 'Đòn điểm huyệt Buôn Ma Thuột ngày 10/3/1975 khiến quân địch tan rã và tháo chạy tán loạn.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 11,
        question: 'Bài học kinh nghiệm quân sự sâu sắc nhất về nghệ thuật tạo thời cơ trong Tổng tiến công mùa Xuân 1975 là gì?',
        options: ['"Thần tốc, thần tốc hơn nữa; táo bạo, táo bạo hơn nữa, tranh thủ từng giờ từng phút xốc tới mặt trận"', '"Chờ đợi đối phương suy yếu hoàn toàn"', '"Tập trung lực lượng ở một hướng duy nhất"', '"Dựa hoàn toàn vào vũ khí hiện đại"'],
        correctIndex: 0,
        explanation: 'Mệnh lệnh lịch sử của Đại tướng Võ Nguyên Giáp nêu bật nghệ thuật nắm bắt thời cơ ngàn năm có một.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 12,
        question: 'Nhân tố quyết định hàng đầu tạo nên mọi thắng lợi vẻ vang của cách mạng Việt Nam là gì?',
        options: ['Sự lãnh đạo đúng đắn, sáng tạo của Đảng Cộng sản Việt Nam và Chủ tịch Hồ Chí Minh', 'Sự viện trợ quốc tế', 'Địa hình hiểm trở', 'Thời tiết thuận lợi'],
        correctIndex: 0,
        explanation: 'Đường lối lãnh đạo đúng đắn, khoa học của Đảng và Bác Hồ là ngọn cờ tập hợp sức mạnh toàn dân tộc.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 13,
        question: 'Từ bài học lịch sử của kháng chiến chống ngoại xâm, bài học cốt lõi nào có giá trị sống còn trong bảo vệ chủ quyền biên giới, biển đảo hôm nay?',
        options: ['Sức mạnh khối đại đoàn kết toàn dân tộc kết hợp với chính sách đối ngoại hòa bình, độc lập, tự chủ', 'Chỉ dựa vào sức mạnh quân sự đơn thuần', 'Liên minh quân sự chống nước khác', 'Bế quan tỏa cảng'],
        correctIndex: 0,
        explanation: 'Đại đoàn kết toàn dân và giữ vững độc lập, tự chủ, tự cường là chân lý bảo vệ giang sơn gấm vóc.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 14,
        question: 'Đại hội Đảng toàn quốc lần thứ VI (tháng 12/1986) đã đề ra đường lối mang tính bước ngoặt lịch sử nào?',
        options: ['Đường lối Đổi mới toàn diện đất nước, trọng tâm là đổi mới kinh tế', 'Hoàn thành công cuộc hợp tác hóa', 'Thực hiện kế hoạch 5 năm đầu tiên', 'Công nghiệp hóa tập trung vào công nghiệp nặng'],
        correctIndex: 0,
        explanation: 'Đại hội VI khởi xướng công cuộc Đổi mới, đưa đất nước vượt qua khủng hoảng kinh tế - xã hội.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 15,
        question: 'Trong Di chúc thiêng liêng, Chủ tịch Hồ Chí Minh đã căn dặn điều đầu tiên cần phải giữ gìn trong Đảng như giữ gìn con ngươi của mắt mình là gì?',
        options: ['Sự đoàn kết nhất trí', 'Kỷ luật tài chính', 'Mở rộng quy mô', 'Tuyên truyền đối ngoại'],
        correctIndex: 0,
        explanation: 'Bác dặn: "Đoàn kết là một truyền thống cực kỳ quý báu của Đảng và của dân ta. Các đồng chí từ Trung ương đến các chi bộ cần phải giữ gìn sự đoàn kết nhất trí của Đảng như giữ gìn con ngươi của mắt mình."',
        difficulty: 'expert',
        points: 50
      }
    ]
  },

  // 2. SINH HỌC 12
  {
    id: 'biology_12',
    name: 'Sinh học 12: Di Truyền Học, Menđen & Đột Biến Gen',
    category: 'Sinh Học',
    shortTag: 'Sinh Học',
    description: 'Chuyên đề cơ chế di truyền ở cấp độ phân tử và tế bào, các quy luật di truyền Menđen và đột biến.',
    secretWord: 'DITRUYEN',
    secretHint: 'Hiện tượng truyền đạt các tính trạng từ thế hệ trước sang thế hệ sau qua vật chất di truyền ADN.',
    questions: [
      {
        id: 1,
        question: 'Đơn phân cấu tạo nên phân tử ADN là gì?',
        options: ['Nuclêôtit (A, T, G, X)', 'Axit amin', 'Axit béo', 'Glucozơ'],
        correctIndex: 0,
        explanation: 'ADN cấu tạo từ 4 loại đơn phân nuclêôtit: Ađênin (A), Timin (T), Guanin (G) và Xitôzin (X).',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 2,
        question: 'Ai được mệnh danh là "Người cha đẻ của ngành di truyền học hiện đại"?',
        options: ['G.J. Men-đen (Gregor Mendel)', 'C. Đác-uyn (Charles Darwin)', 'Mooc-gan (Thomas Hunt Morgan)', 'J. Oát-xơn (James Watson)'],
        correctIndex: 0,
        explanation: 'G. Men-đen đã phát hiện ra các quy luật di truyền cơ bản qua thực nghiệm lai đậu Hà Lan năm 1865.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 3,
        question: 'Quá trình nhân đôi ADN diễn ra theo những nguyên tắc cốt lõi nào?',
        options: ['Nguyên tắc bổ sung và nguyên tắc bán bảo toàn (bán bảo tồn)', 'Nguyên tắc bảo tồn hoàn toàn', 'Nguyên tắc ngẫu nhiên không chọn lọc', 'Nguyên tắc một chiều duy nhất'],
        correctIndex: 0,
        explanation: 'Nhân đôi ADN tuân thủ nguyên tắc bổ sung (A-T, G-X) và bán bảo toàn (mỗi ADN con chứa 1 mạch cũ, 1 mạch mới).',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 4,
        question: 'Dạng đột biến gen nào sau đây thường gây hậu quả nghiêm trọng nhất đối với chuỗi pôlipeptit?',
        options: ['Đột biến thêm hoặc mất 1 cặp nuclêôtit ở đầu gen (đột biến dịch khung)', 'Đột biến thay thế 1 cặp nuclêôtit cùng nghĩa', 'Đột biến đảo vị trí nuclêôtit nội bộ', 'Đột biến thay thế ở bộ ba kết thúc'],
        correctIndex: 0,
        explanation: 'Thêm hoặc mất nuclêôtit làm dịch khung đọc từ vị trí đột biến về sau, thay đổi toàn bộ trình tự axit amin.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 5,
        question: 'Theo quy luật phân ly của Menđen, khi lai hai cơ thể bố mẹ thuần chủng khác nhau về một cặp tính trạng tương phản, tỉ lệ kiểu hình ở F2 là bao nhiêu?',
        options: ['3 trội : 1 lặn', '1 trội : 1 lặn', '9 : 3 : 3 : 1', '100% kiểu hình trội'],
        correctIndex: 0,
        explanation: 'F2 cho tỉ lệ kiểu hình xấp xỉ 3 tính trạng trội : 1 tính trạng lặn (với tương quan trội hoàn toàn).',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 6,
        question: 'Mã di truyền có tính thoái hóa (dư thừa) mang ý nghĩa sinh học quan trọng nào?',
        options: ['Nhiều bộ ba khác nhau cùng mã hóa cho một loại axit amin, giúp bảo vệ tế bào trước đột biến thay thế', 'Mỗi bộ ba mã hóa cho nhiều loại axit amin', 'Tất cả các loài đều dùng chung một bộ mã', 'Mã di truyền đọc gối lên nhau'],
        correctIndex: 0,
        explanation: 'Tính thoái hóa giúp hạn chế tác động tiêu cực của các đột biến thay thế nuclêôtit lên cấu trúc prôtêin.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 7,
        question: 'Enzim chính chịu trách nhiệm tháo xoắn và tổng hợp mạch pôlinuclêôtit mới trong nhân đôi ADN là gì?',
        options: ['ADN pôlimeraza', 'ARN pôlimeraza', 'Enzim ligaza (nối)', 'Enzim amilaza'],
        correctIndex: 0,
        explanation: 'ADN pôlimeraza có chức năng gắn các nuclêôtit tự do vào mạch khuôn theo nguyên tắc bổ sung theo chiều 5’ -> 3’.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 8,
        question: 'Mooc-gan phát hiện ra quy luật liên kết gen và hoán vị gen nhờ đối tượng thí nghiệm xuất sắc nào?',
        options: ['Ruồi giấm (Drosophila melanogaster)', 'Đậu Hà Lan', 'Chuột bạch', 'Vi khuẩn E. coli'],
        correctIndex: 0,
        explanation: 'Ruồi giấm có vòng đời ngắn, dễ nuôi, số lượng NST ít (2n=8) và nhiều biến dị rõ rệt.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 9,
        question: 'Một gen có 3000 nuclêôtit, trong đó số nuclêôtit loại A chiếm 20%. Số nuclêôtit loại G của gen này là bao nhiêu?',
        options: ['900 nuclêôtit', '600 nuclêôtit', '1200 nuclêôtit', '300 nuclêôtit'],
        correctIndex: 0,
        explanation: 'Ta có %A + %G = 50% => %G = 30%. Số nuclêôtit loại G = 30% x 3000 = 900 nuclêôtit.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 10,
        question: 'Định luật Hacđi - Vanbec chỉ nghiệm đúng đối với một quần thể sinh vật thỏa mãn điều kiện nào sau đây?',
        options: ['Quần thể có kích thước lớn, ngẫu phối, không có đột biến, không di - nhập gen và không có chọn lọc tự nhiên', 'Quần thể tự phối nghiêm ngặt', 'Quần thể chịu tác động chọn lọc mạnh', 'Quần thể có kích thước nhỏ chịu biến động di truyền'],
        correctIndex: 0,
        explanation: 'Trạng thái cân bằng di truyền yêu cầu quần thể ngẫu phối vô hạn, cách ly di truyền và không có tác nhân tiến hóa.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 11,
        question: 'Cơ chế điều hòa hoạt động của opêron Lac ở vi khuẩn E. coli khi môi trường CÓ lactôzơ diễn ra như thế nào?',
        options: ['Lactôzơ gắn vào prôtêin ức chế làm biến đổi cấu hình, prôtêin ức chế không gắn được vào vùng vận hành O, các gen cấu trúc được phiên mã', 'Lactôzơ gắn vào vùng khởi động P', 'Lactôzơ phân hủy hoàn toàn enzim ARN pôlimeraza', 'Prôtêin ức chế bám chặt vào vùng O ngăn cản phiên mã'],
        correctIndex: 0,
        explanation: 'Lactôzơ đóng vai trò chất cảm ứng, vô hiệu hóa prôtêin ức chế giúp ARN pôlimeraza trượt qua phiên mã nhóm gen Z, Y, A.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 12,
        question: 'Ý nghĩa tiến hóa to lớn nhất của hiện tượng hoán vị gen (trao đổi chéo giữa các crômatit) trong giảm phân là gì?',
        options: ['Tạo ra vô số biến dị tổ hợp phong phú, cung cấp nguyên liệu thứ cấp cho chọn giống và tiến hóa', 'Làm thay đổi cấu trúc của gen', 'Tăng số lượng nhiễm sắc thể của loài', 'Ngăn chặn hiện tượng thoái hóa giống'],
        correctIndex: 0,
        explanation: 'Hoán vị gen tái tổ hợp các alen có lợi, tạo tính đa dạng di truyền vượt trội thích nghi với môi trường sống thay đổi.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 13,
        question: 'Tại sao liệu pháp gen (Gene Therapy) được coi là đỉnh cao của công nghệ sinh học y dược hiện đại?',
        options: ['Có khả năng chữa trị tận gốc các bệnh di truyền hiểm nghèo bằng cách thay thế hoặc sửa chữa gen bị lỗi', 'Chỉ dùng để giảm triệu chứng tạm thời', 'Hoàn toàn không có tác dụng phụ', 'Chỉ áp dụng trên thực vật'],
        correctIndex: 0,
        explanation: 'Liệu pháp gen đưa gen lành vào cơ thể thay thế gen đột biến, giải quyết căn nguyên bệnh di truyền và ung thư.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 14,
        question: 'Thuyết tiến hóa tổng hợp hiện đại khẳng định nhân tố nào là nhân tố tiến hóa CÓ HƯỚNG duy nhất?',
        options: ['Chọn lọc tự nhiên', 'Đột biến gen', 'Dòng gen (di - nhập gen)', 'Các yếu tố ngẫu nhiên (phiêu bạt di truyền)'],
        correctIndex: 0,
        explanation: 'Chọn lọc tự nhiên là nhân tố duy nhất quy định chiều hướng và nhịp điệu của quá trình tiến hóa bằng cách giữ lại alen thích nghi.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 15,
        question: 'Từ góc độ bảo tồn đa dạng sinh học và phát triển bền vững, giá trị cốt lõi của đa dạng di truyền trong loài là gì?',
        options: ['Là bảo hiểm sinh học giúp loài có tiềm năng thích ứng trước các biến đổi khí hậu và dịch bệnh toàn cầu', 'Chỉ phục vụ lợi ích thương mại trước mắt', 'Làm cho việc phân loại sinh học trở nên phức tạp', 'Tăng sự cạnh tranh khốc liệt làm suy yếu quần thể'],
        correctIndex: 0,
        explanation: 'Đa dạng vốn gen là chìa khóa sống còn giúp quần thể có cá thể sống sót khi môi trường biến đổi khắc nghiệt.',
        difficulty: 'expert',
        points: 50
      }
    ]
  },

  // 3. TOÁN HỌC 12
  {
    id: 'math_12',
    name: 'Toán học 12: Đạo Hàm, Khảo Sát Hàm Số & Tọa Độ Oxyz',
    category: 'Toán Học',
    shortTag: 'Toán Học',
    description: 'Chuyên đề giải tích hàm số, đạo hàm, tiệm cận, cực trị và hình học không gian tọa độ Oxyz.',
    secretWord: 'DAOHAM',
    secretHint: 'Khái niệm toán học biểu diễn tốc độ thay đổi tức thời của hàm số tại một điểm.',
    questions: [
      {
        id: 1,
        question: 'Đạo hàm của hàm số y = x³ - 3x + 1 là gì?',
        options: ['y\' = 3x² - 3', 'y\' = 3x² + 3', 'y\' = 2x - 3', 'y\' = x² - 3'],
        correctIndex: 0,
        explanation: 'Áp dụng công thức (xⁿ)\' = n.xⁿ⁻¹ và hằng số đạo hàm bằng 0, ta có (x³ - 3x + 1)\' = 3x² - 3.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 2,
        question: 'Trong không gian Oxyz, tọa độ của gốc tọa độ O là gì?',
        options: ['O(0; 0; 0)', 'O(1; 1; 1)', 'O(0; 1; 0)', 'O(1; 0; 0)'],
        correctIndex: 0,
        explanation: 'Gốc tọa độ O trong không gian ba chiều có cả 3 tọa độ x, y, z đều bằng 0.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 3,
        question: 'Đường tiệm cận đứng của đồ thị hàm số y = (2x + 1) / (x - 1) là đường thẳng nào?',
        options: ['x = 1', 'y = 2', 'x = -1', 'y = 1'],
        correctIndex: 0,
        explanation: 'Nghiệm của mẫu số x - 1 = 0 là x = 1, do đó đường tiệm cận đứng là x = 1.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 4,
        question: 'Nguyên hàm của hàm số f(x) = eˣ là gì?',
        options: ['∫ eˣ dx = eˣ + C', '∫ eˣ dx = x.eˣ + C', '∫ eˣ dx = eˣ⁻¹ + C', '∫ eˣ dx = ln|x| + C'],
        correctIndex: 0,
        explanation: 'Hàm số eˣ có đạo hàm và nguyên hàm chính là chính nó: ∫ eˣ dx = eˣ + C.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 5,
        question: 'Cho hàm số y = f(x) có đạo hàm f\'(x) = x(x - 2)². Số điểm cực trị của hàm số là bao nhiêu?',
        options: ['1 điểm cực trị', '2 điểm cực trị', '3 điểm cực trị', 'Không có cực trị'],
        correctIndex: 0,
        explanation: 'f\'(x) chỉ đổi dấu khi qua nghiệm đơn x = 0. Tại nghiệm bội chẵn x = 2 đạo hàm không đổi dấu nên hàm số chỉ có 1 cực trị.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 6,
        question: 'Đường tiệm cận ngang của đồ thị hàm số y = (3x - 5) / (x + 2) là đường thẳng nào?',
        options: ['y = 3', 'x = -2', 'y = -5/2', 'y = 1'],
        correctIndex: 0,
        explanation: 'Bậc tử bằng bậc mẫu, giới hạn khi x tiến tới vô cực là 3/1 = 3, vậy tiệm cận ngang là y = 3.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 7,
        question: 'Trong không gian Oxyz, phương trình mặt cầu tâm I(1; -2; 3) bán kính R = 4 là gì?',
        options: ['(x - 1)² + (y + 2)² + (z - 3)² = 16', '(x + 1)² + (y - 2)² + (z + 3)² = 16', '(x - 1)² + (y + 2)² + (z - 3)² = 4', '(x - 1)² + (y - 2)² + (z - 3)² = 16'],
        correctIndex: 0,
        explanation: 'Mặt cầu tâm I(a; b; c) bán kính R có phương trình (x - a)² + (y - b)² + (z - c)² = R² = 4² = 16.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 8,
        question: 'Tập xác định của hàm số y = log₂(2x - 4) là khoảng nào?',
        options: ['(2; +∞)', '[2; +∞)', '(-∞; 2)', '(0; +∞)'],
        correctIndex: 0,
        explanation: 'Điều kiện xác định của logarit cơ số 2 là biểu thức trong ngoặc dương: 2x - 4 > 0 <=> x > 2.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 9,
        question: 'Tích phân I = ∫₀¹ (2x + 1) dx có giá trị bằng bao nhiêu?',
        options: ['2', '1', '3', '0.5'],
        correctIndex: 0,
        explanation: 'Nguyên hàm F(x) = x² + x. Tính F(1) - F(0) = (1² + 1) - (0) = 2.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 10,
        question: 'Trong không gian Oxyz, vectơ nào sau đây là một vectơ pháp tuyến của mặt phẳng (P): 2x - 3y + z - 7 = 0?',
        options: ['n = (2; -3; 1)', 'n = (2; 3; 1)', 'n = (2; -3; -7)', 'n = (-2; -3; 1)'],
        correctIndex: 0,
        explanation: 'Các hệ số trước x, y, z trong phương trình mặt phẳng Ax + By + Cz + D = 0 chính là tọa độ vectơ pháp tuyến n = (A; B; C).',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 11,
        question: 'Giá trị lớn nhất của hàm số f(x) = -x⁴ + 2x² + 3 trên đoạn [0; 2] bằng bao nhiêu?',
        options: ['4', '3', '-5', '2'],
        correctIndex: 0,
        explanation: 'f\'(x) = -4x³ + 4x = -4x(x² - 1) = 0 => x = 0, x = 1, x = -1. Ta xét f(0)=3, f(1)=4, f(2)=-5. Vậy GTLN là 4 tại x=1.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 12,
        question: 'Số lượng khối đa diện đều trong không gian 3 chiều là bao nhiêu loại?',
        options: ['Đúng 5 loại (Tứ diện đều, Lập phương, Bát diện đều, 12 mặt đều, 20 mặt đều)', '4 loại', '6 loại', 'Vô số loại'],
        correctIndex: 0,
        explanation: 'Định lý hình học chứng minh chỉ có duy nhất 5 khối đa diện đều lồi: loại {3;3}, {4;3}, {3;4}, {5;3}, {3;5}.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 13,
        question: 'Tìm tất cả các giá trị của tham số m để hàm số y = x³ - 3mx² + 3(2m - 1)x + 1 đồng biến trên R?',
        options: ['m = 1', 'm > 1', 'm < 1', 'Mọi m ∈ R'],
        correctIndex: 0,
        explanation: 'y\' = 3x² - 6mx + 3(2m - 1) ≥ 0 ∀x <=> Δ\' = 9m² - 9(2m - 1) = 9(m - 1)² ≤ 0 <=> m = 1.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 14,
        question: 'Thể tích của khối tròn xoay tạo thành khi quay hình phẳng giới hạn bởi đồ thị y = √x, trục hoành và hai đường thẳng x = 0, x = 4 quanh trục Ox là gì?',
        options: ['V = 8π', 'V = 4π', 'V = 16π', 'V = 8'],
        correctIndex: 0,
        explanation: 'V = π ∫₀⁴ (√x)² dx = π ∫₀⁴ x dx = π [x²/2]₀⁴ = π (16/2) = 8π.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 15,
        question: 'Trong lý thuyết xác suất, định lý giới hạn trung tâm (Central Limit Theorem) khẳng định điều gì?',
        options: ['Phân phối của tổng (hoặc trung bình) các biến ngẫu nhiên độc lập sẽ tiệm cận phân phối chuẩn Gauss khi cỡ mẫu đủ lớn', 'Mọi biến ngẫu nhiên đều có phân phối đều', 'Xác suất của một biến cố luôn tiến về 1', 'Không thể ước lượng kỳ vọng mẫu'],
        correctIndex: 0,
        explanation: 'Định lý giới hạn trung tâm là hòn đá tảng của thống kê toán học, bảo đảm tính quy luật của các hiện tượng ngẫu nhiên lớn.',
        difficulty: 'expert',
        points: 50
      }
    ]
  },

  // 4. HÓA HỌC 12
  {
    id: 'chemistry_12',
    name: 'Hóa học 12: Este, Lipit, Cacbohiđrat & Kim Loại',
    category: 'Hóa Học',
    shortTag: 'Hóa Học',
    description: 'Chuyên đề este no đơn chức, xà phòng hóa, polime, dãy điện hóa và tính chất kim loại.',
    secretWord: 'ESTELIPIT',
    secretHint: 'Hợp chất hữu cơ có mùi thơm dễ chịu của hoa quả, được điều chế bằng phản ứng este hóa.',
    questions: [
      {
        id: 1,
        question: 'Este etyl axetat có công thức cấu tạo thu gọn là gì?',
        options: ['CH₃COOC₂H₅', 'HCOOCH₃', 'CH₃COOCH₃', 'C₂H₅COOCH₃'],
        correctIndex: 0,
        explanation: 'Etyl axetat được tạo từ axit axetic CH₃COOH và ancol etylic C₂H₅OH, có công thức CH₃COOC₂H₅.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 2,
        question: 'Kim loại nào sau đây có tính dẫn điện tốt nhất trong tất cả các kim loại?',
        options: ['Bạc (Ag)', 'Đồng (Cu)', 'Vàng (Au)', 'Nhôm (Al)'],
        correctIndex: 0,
        explanation: 'Thứ tự dẫn điện giảm dần của kim loại là: Ag > Cu > Au > Al > Fe.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 3,
        question: 'Chất nào sau đây thuộc loại monosaccarit, có nhiều trong quả nho chín và máu người?',
        options: ['Glucozơ', 'Saccarozơ', 'Tinh bột', 'Xenlulozơ'],
        correctIndex: 0,
        explanation: 'Glucozơ là monosaccarit có công thức C₆H₁₂O₆, nồng độ trong máu người ổn định ở mức khoảng 0,1%.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 4,
        question: 'Chất béo là trieste của axit béo với chất nào sau đây?',
        options: ['Glixerol (glixerin)', 'Etylen glicol', 'Ancol etylic', 'Metanol'],
        correctIndex: 0,
        explanation: 'Chất béo (triglixerit) là trieste của glixerol C₃H₅(OH)₃ với các axit béo.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 5,
        question: 'Phản ứng thủy phân este trong môi trường kiềm (đun nóng) còn được gọi là phản ứng gì?',
        options: ['Phản ứng xà phòng hóa', 'Phản ứng este hóa', 'Phản ứng trùng hợp', 'Phản ứng tráng bạc'],
        correctIndex: 0,
        explanation: 'Thủy phân chất béo hoặc este trong kiềm tạo muối của axit cacboxylic và ancol, dùng để sản xuất xà phòng.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 6,
        question: 'Để tráng gương ruột phích, người ta thực hiện phản ứng tráng bạc với chất nào an toàn và kinh tế nhất?',
        options: ['Glucozơ', 'Andehit fomic', 'Axit fomic', 'Saccarozơ'],
        correctIndex: 0,
        explanation: 'Glucozơ có nhóm -CHO, phản ứng tráng bạc tạo lớp bạc sáng bóng, không độc hại như fomanđehit.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 7,
        question: 'Kim loại nào sau đây là kim loại nhẹ nhất (có khối lượng riêng nhỏ nhất)?',
        options: ['Liti (Li)', 'Natri (Na)', 'Kali (K)', 'Nhôm (Al)'],
        correctIndex: 0,
        explanation: 'Liti (Li) có khối lượng riêng nhỏ nhất trong các kim loại (D ≈ 0,53 g/cm³), nổi trên mặt dầu hỏa.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 8,
        question: 'Dung dịch chất nào sau đây làm quỳ tím chuyển sang màu xanh?',
        options: ['Metylamin (CH₃NH₂)', 'Anilin (C₆H₅NH₂)', 'Axit axetic', 'Glucozơ'],
        correctIndex: 0,
        explanation: 'Metylamin có tính bazơ mạnh hơn amoniac nên làm quỳ tím hóa xanh. Anilin có tính bazơ rất yếu không đổi màu quỳ.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 9,
        question: 'Cho mẩu kim loại Na vào dung dịch CuSO₄, hiện tượng quan sát được đầy đủ nhất là gì?',
        options: ['Sủi bọt khí không màu và xuất hiện kết tủa màu xanh lam', 'Chỉ xuất hiện kết tủa xanh', 'Chỉ có bọt khí bay ra', 'Kim loại Cu màu đỏ bám trên Na'],
        correctIndex: 0,
        explanation: 'Na phản ứng trước với nước tạo NaOH và khí H₂ (sủi bọt). Sau đó NaOH phản ứng với CuSO₄ tạo kết tủa Cu(OH)₂ màu xanh lam.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 10,
        question: 'Polime nào sau đây được điều chế bằng phản ứng trùng ngưng?',
        options: ['Nilon-6,6', 'Poli(vinyl clorua) (PVC)', 'Poliêtylen (PE)', 'Cao su buna'],
        correctIndex: 0,
        explanation: 'Nilon-6,6 được điều chế bằng phản ứng trùng ngưng giữa axit ađipic và hexametylendiamin, giải phóng H₂O.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 11,
        question: 'Để bảo vệ vỏ tàu thủy bằng thép (chứa Fe) khỏi bị ăn mòn điện hóa khi ngâm trong nước biển, người ta gắn vào vỏ tàu những tấm kim loại nào?',
        options: ['Kẽm (Zn)', 'Đồng (Cu)', 'Bạc (Ag)', 'Chì (Pb)'],
        correctIndex: 0,
        explanation: 'Phương pháp bảo vệ catot: Kẽm có tính khử mạnh hơn sắt nên đóng vai trò là anot bị ăn mòn trước (hy sinh), bảo vệ sắt.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 12,
        question: 'Xà phòng hóa hoàn toàn 8,8 gam etyl axetat bằng dung dịch NaOH vừa đủ, đun nóng. Khối lượng muối natri axetat thu được là bao nhiêu?',
        options: ['8,2 gam', '6,8 gam', '9,4 gam', '4,1 gam'],
        correctIndex: 0,
        explanation: 'n_este = 8,8 / 88 = 0,1 mol. n_muối CH₃COONa = 0,1 mol => m = 0,1 x 82 = 8,2 gam.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 13,
        question: 'Hợp chất lưỡng tính là chất vừa có khả năng tác dụng với dung dịch axit vừa tác dụng với kiềm. Hợp chất nào sau đây là oxit lưỡng tính?',
        options: ['Al₂O₃', 'Na₂O', 'Fe₂O₃', 'CaO'],
        correctIndex: 0,
        explanation: 'Nhôm oxit Al₂O₃ và Cr₂O₃ là các oxit lưỡng tính điển hình tác dụng được cả với HCl và NaOH.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 14,
        question: 'Trong công nghiệp luyện kim, phương pháp nhiệt luyện bằng CO hoặc H₂ ở nhiệt độ cao dùng để điều chế các kim loại nào?',
        options: ['Các kim loại có độ hoạt động trung bình và yếu (sau Al trong dãy điện hóa như Fe, Cu, Ni, Pb)', 'Kim loại kiềm và kiềm thổ', 'Nhôm', 'Tất cả kim loại'],
        correctIndex: 0,
        explanation: 'CO chỉ khử được oxit kim loại đứng sau nhôm trong dãy hoạt động hóa học. Kim loại đứng trước Al phải điện phân nóng chảy.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 15,
        question: 'Nguyên tắc của Hóa học Xanh (Green Chemistry) nhằm giảm thiểu tác động tiêu cực đến môi trường nhấn mạnh điều gì?',
        options: ['Thiết kế các quy trình hóa học tiết kiệm nguyên tử (Atom Economy), không tạo chất thải độc hại và sử dụng xúc tác tái tạo', 'Tăng tối đa lượng hóa chất sử dụng', 'Xả thải trực tiếp không xử lý', 'Ngừng hoàn toàn hoạt động sản xuất'],
        correctIndex: 0,
        explanation: 'Hóa học xanh là kim chỉ nam của nền công nghiệp tương lai, tập trung phòng ngừa ô nhiễm ngay từ gốc quy trình.',
        difficulty: 'expert',
        points: 50
      }
    ]
  },

  // 5. VẬT LÝ 12
  {
    id: 'physics_12',
    name: 'Vật lý 12: Dao Động Cơ, Sóng Cơ & Dòng Điện Xoay Chiều',
    category: 'Vật Lý',
    shortTag: 'Vật Lý',
    description: 'Chuyên đề con lắc lò xo, con lắc đơn, giao thoa sóng, mạch RLC mắc nối tiếp và quang học.',
    secretWord: 'DAODONG',
    secretHint: 'Chuyển động có giới hạn trong không gian, lặp đi lặp lại nhiều lần quanh một vị trí cân bằng.',
    questions: [
      {
        id: 1,
        question: 'Chu kỳ dao động T của con lắc lò xo có khối lượng m và độ cứng k được tính bằng công thức nào?',
        options: ['T = 2π √(m/k)', 'T = 2π √(k/m)', 'T = 2π √(l/g)', 'T = 1 / (2π √(m/k))'],
        correctIndex: 0,
        explanation: 'Chu kỳ con lắc lò xo tỷ lệ thuận với căn bậc hai của khối lượng và tỷ lệ nghịch với căn độ cứng: T = 2π √(m/k).',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 2,
        question: 'Sóng cơ học KHÔNG truyền được trong môi trường nào sau đây?',
        options: ['Chân không', 'Chất rắn', 'Chất lỏng', 'Chất khí'],
        correctIndex: 0,
        explanation: 'Sóng cơ là sự lan truyền dao động của các phần tử vật chất, do đó không thể truyền qua chân không.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 3,
        question: 'Hiện tượng cộng hưởng cơ xảy ra khi nào?',
        options: ['Tần số của lực cưỡng bức bằng tần số dao động riêng của hệ (f = f₀)', 'Biên độ lực cưỡng bức giảm về 0', 'Lực ma sát của môi trường triệt tiêu hoàn toàn', 'Chu kỳ lực cưỡng bức tiến tới vô cùng'],
        correctIndex: 0,
        explanation: 'Khi tần số ngoại lực cưỡng bức xấp xỉ bằng tần số riêng, biên độ dao động cưỡng bức đạt giá trị cực đại.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 4,
        question: 'Vận tốc truyền ánh sáng trong chân không có giá trị xấp xỉ bằng bao nhiêu?',
        options: ['3.10⁸ m/s', '3.10⁶ m/s', '340 m/s', '3.10⁵ m/s'],
        correctIndex: 0,
        explanation: 'Tốc độ ánh sáng trong chân không là hằng số vũ trụ c ≈ 3.10⁸ m/s (300.000 km/s).',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 5,
        question: 'Trong dao động điều hòa, gia tốc của vật biến thiên điều hòa như thế nào so với li độ?',
        options: ['Ngược pha so với li độ (lệch pha π rad)', 'Cùng pha so với li độ', 'Sớm pha π/2 so với li độ', 'Trễ pha π/2 so với li độ'],
        correctIndex: 0,
        explanation: 'Ta có a = -ω²x, dấu trừ biểu thị vectơ gia tốc luôn hướng về vị trí cân bằng và ngược pha với li độ.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 6,
        question: 'Bước sóng λ là gì?',
        options: ['Quãng đường mà sóng truyền được trong một chu kỳ dao động', 'Khoảng cách giữa hai điểm bất kỳ trên phương truyền sóng', 'Khoảng cách giữa một đỉnh sóng và một hõm sóng gần nhất', 'Thời gian sóng truyền đi được 1 mét'],
        correctIndex: 0,
        explanation: 'Định nghĩa bước sóng: λ = v.T = v / f, là quãng đường sóng lan truyền trong một chu kỳ.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 7,
        question: 'Trong mạch điện xoay chiều RLC mắc nối tiếp, hiện tượng cộng hưởng điện xảy ra khi điều kiện nào được thỏa mãn?',
        options: ['Cảm kháng bằng dung kháng (Z_L = Z_C hay ω = 1/√(LC))', 'Điện trở R bằng 0', 'Z_L > Z_C', 'Điện áp cùng pha với dòng điện tức thời'],
        correctIndex: 0,
        explanation: 'Khi Z_L = Z_C, tổng trở mạch Z đạt cực tiểu bằng R, cường độ dòng điện trong mạch đạt giá trị hiệu dụng cực đại.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 8,
        question: 'Thí nghiệm giao thoa ánh sáng của Y-âng (Young) là bằng chứng thực nghiệm không thể chối cãi chứng minh điều gì?',
        options: ['Ánh sáng có bản chất sóng', 'Ánh sáng có bản chất hạt', 'Ánh sáng là chùm hạt proton', 'Ánh sáng không phản xạ được'],
        correctIndex: 0,
        explanation: 'Hiện tượng vân sáng, vân tối xen kẽ do giao thoa là đặc trưng tiêu biểu khẳng định tính chất sóng của ánh sáng.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 9,
        question: 'Một con lắc đơn có chiều dài l = 1 m dao động tại nơi có g = π² ≈ 9.87 m/s². Chu kỳ dao động của con lắc là bao nhiêu?',
        options: ['2,0 giây', '1,0 giây', '3,14 giây', '0,5 giây'],
        correctIndex: 0,
        explanation: 'T = 2π √(l/g) = 2π √(1/π²) = 2π . (1/π) = 2,0 giây.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 10,
        question: 'Trong thí nghiệm Y-âng với ánh sáng đơn sắc, khoảng vân đo được là i = 0,8 mm. Khoảng cách giữa 5 vân sáng liên tiếp là bao nhiêu?',
        options: ['3,2 mm', '4,0 mm', '4,8 mm', '1,6 mm'],
        correctIndex: 0,
        explanation: 'Khoảng cách giữa n vân sáng liên tiếp bằng (n - 1) khoảng vân. Giữa 5 vân sáng liên tiếp có 4 khoảng vân: 4 x 0,8 = 3,2 mm.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 11,
        question: 'Tia laze (LASER) có những đặc điểm nổi bật nào sau đây?',
        options: ['Tính đơn sắc cao, tính định hướng cao và cường độ rất lớn', 'Tập hợp vô số màu sắc hỗn loạn', 'Góc phân kỳ rất rộng', 'Cường độ yếu không đốt cháy được vật thể'],
        correctIndex: 0,
        explanation: 'LASER (Light Amplification by Stimulated Emission of Radiation) là chùm sáng song song định hướng cực cao và đơn sắc lý tưởng.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 12,
        question: 'Một hạt nhân nguyên tử có năng lượng liên kết riêng càng lớn thì hạt nhân đó có đặc điểm gì?',
        options: ['Càng bền vững', 'Càng dễ bị phân hạch', 'Càng kém bền vững', 'Có khối lượng càng nhẹ'],
        correctIndex: 0,
        explanation: 'Năng lượng liên kết riêng (năng lượng liên kết tính trên một nuclon) là đại lượng đặc trưng cho mức độ bền vững của hạt nhân.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 13,
        question: 'Hiện tượng quang điện trong (quang dẫn) xảy ra ở chất bán dẫn khác với hiện tượng quang điện ngoài ở kim loại ở điểm nào?',
        options: ['Các electron chỉ bị giải phóng khỏi liên kết và chuyển động tự do trong khối bán dẫn, không bật ra ngoài không khí', 'Electron bị bật ra khỏi bề mặt', 'Cần ánh sáng có bước sóng cực ngắn tử ngoại', 'Chỉ xảy ra ở nhiệt độ 0 độ K'],
        correctIndex: 0,
        explanation: 'Quang điện trong giải phóng electron liên kết thành electron dẫn chuyển động trong mạng tinh thể bán dẫn, làm tăng độ dẫn điện.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 14,
        question: 'Hệ thức Anh-xtanh (Einstein) về mối liên hệ giữa năng lượng và khối lượng trong thuyết tương đối hẹp là gì?',
        options: ['E = m.c²', 'E = 1/2 m.v²', 'E = h.f', 'E = m.g.h'],
        correctIndex: 0,
        explanation: 'Phương trình kinh điển E = mc² khẳng định năng lượng và khối lượng tương đương nhau, làm nền tảng cho năng lượng hạt nhân.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 15,
        question: 'Nguyên lý bảo toàn và chuyển hóa năng lượng khẳng định điều gì trong toàn vũ trụ?',
        options: ['Năng lượng không tự nhiên sinh ra và cũng không tự nhiên mất đi, chỉ chuyển hóa từ dạng này sang dạng khác hoặc truyền từ vật này sang vật khác', 'Năng lượng tự nhiên biến mất theo thời gian', 'Có thể chế tạo động cơ vĩnh cửu loại 1', 'Nhiệt năng có thể tự truyền từ vật lạnh sang vật nóng'],
        correctIndex: 0,
        explanation: 'Đây là định luật cơ bản nhất chi phối toàn bộ các quá trình vật lý, hóa học và sinh học trong tự nhiên.',
        difficulty: 'expert',
        points: 50
      }
    ]
  },

  // 6. NGỮ VĂN 12
  {
    id: 'literature_12',
    name: 'Ngữ văn 12: Tác Phẩm Trọng Tâm Thi THPT',
    category: 'Ngữ Văn',
    shortTag: 'Ngữ Văn',
    description: 'Chuyên đề các tác phẩm văn học kinh điển: Tây Tiến, Việt Bắc, Đất Nước, Sông Đà, Vợ nhặt, Hồn Trương Ba...',
    secretWord: 'TRUYENKIEU',
    secretHint: 'Kiệt tác thi ca bằng chữ Nôm của Đại thi hào Nguyễn Du với 3254 câu thơ lục bát.',
    questions: [
      {
        id: 1,
        question: 'Tác phẩm "Truyện Kiều" (Đoạn trường tân thanh) là kiệt tác của tác giả nào?',
        options: ['Đại thi hào Nguyễn Du', 'Nguyễn Trãi', 'Hồ Xuân Hương', 'Nguyễn Khuyến'],
        correctIndex: 0,
        explanation: 'Truyện Kiều là đỉnh cao chói lọi của văn học trung đại Việt Nam do Nguyễn Du sáng tác.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 2,
        question: 'Bài thơ "Tây Tiến" là sáng tác tiêu biểu của nhà thơ nào?',
        options: ['Quang Dũng', 'Tố Hữu', 'Chính Hữu', 'Phạm Tiến Duật'],
        correctIndex: 0,
        explanation: 'Quang Dũng sáng tác "Tây Tiến" năm 1948 tại Phù Lưu Chanh khi nhớ về đơn vị cũ.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 3,
        question: 'Trường ca "Mặt đường khát vọng" chứa đoạn trích "Đất Nước" là của nhà thơ nào?',
        options: ['Nguyễn Khoa Điềm', 'Nguyễn Duy', 'Thanh Thảo', 'Hữu Thỉnh'],
        correctIndex: 0,
        explanation: 'Đoạn trích Đất Nước thuộc phần đầu chương V trường ca "Mặt đường khát vọng" của Nguyễn Khoa Điềm.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 4,
        question: 'Tập thơ "Từ ấy" và "Việt Bắc" gắn liền với sự nghiệp thi ca của ai?',
        options: ['Tố Hữu', 'Xuân Diệu', 'Huy Cận', 'Chế Lan Viên'],
        correctIndex: 0,
        explanation: 'Tố Hữu là lá cờ đầu của thơ ca cách mạng Việt Nam thế kỷ 20.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 5,
        question: 'Hai nét tính cách đối lập nhưng thống nhất của con Sông Đà trong tùy bút Nguyễn Tuân là gì?',
        options: ['Hung bạo và trữ tình', 'Hiền hòa và cô quạnh', 'Thơ mộng và lặng lẽ', 'Bí ẩn và tĩnh mịch'],
        correctIndex: 0,
        explanation: 'Nguyễn Tuân đã kỳ công khắc họa Sông Đà vừa hung bạo hiểm trở vừa trữ tình thơ mộng tuyệt bích.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 6,
        question: 'Bối cảnh lịch sử trực tiếp của truyện ngắn "Vợ nhặt" của nhà văn Kim Lân là gì?',
        options: ['Nạn đói khủng khiếp năm 1945', 'Cải cách ruộng đất', 'Kháng chiến chống Mỹ', 'Thời bao cấp'],
        correctIndex: 0,
        explanation: 'Truyện ngắn lấy bối cảnh nạn đói năm Ất Dậu 1945 cướp đi sinh mạng của hơn 2 triệu đồng bào ta.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 7,
        question: 'Hình ảnh chiếc thuyền ngoài xa trong truyện ngắn cùng tên của Nguyễn Minh Châu mang ý nghĩa biểu tượng gì?',
        options: ['Khoảng cách giữa nghệ thuật thuần túy và hiện thực cuộc đời lam lũ', 'Khát vọng chinh phục biển cả', 'Sự giàu có của thiên nhiên', 'Chiếc thuyền chở đầy cá bạc'],
        correctIndex: 0,
        explanation: 'Nguyễn Minh Châu đặt ra bài học: Người nghệ sĩ không thể nhìn đời qua lăng kính lãng mạn xa xôi mà phải thấu hiểu nỗi đau con người.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 8,
        question: 'Trong vở kịch "Hồn Trương Ba, da hàng thịt" của Lưu Quang Vũ, bi kịch lớn nhất của Trương Ba là gì?',
        options: ['Không được sống là chính mình, tâm hồn thanh cao bị thể xác dung tục chi phối', 'Bị làng xóm xa lánh', 'Mất hết tài sản', 'Tuổi thọ quá ngắn'],
        correctIndex: 0,
        explanation: 'Bi kịch "bên trong một đằng, bên ngoài một nẻo" gióng lên hồi chuông về sự toàn vẹn nhân cách con người.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 9,
        question: 'Tư tưởng bao trùm và sâu sắc nhất xuyên suốt đoạn trích "Đất Nước" của Nguyễn Khoa Điềm là gì?',
        options: ['"Đất Nước của Nhân Dân, Đất Nước của Ca dao Thần thoại"', 'Đất nước của các vương triều', 'Đất nước giàu tài nguyên khoáng sản', 'Đất nước của núi non trùng điệp'],
        correctIndex: 0,
        explanation: 'Tư tưởng cốt lõi: Nhân dân là người làm ra Đất Nước, gìn giữ tiếng nói và truyền thống văn hóa qua muôn đời.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 10,
        question: 'Chi tiết nồi cháo cám trong bữa cơm đầu tiên đón dâu mới của gia đình Tràng ("Vợ nhặt") gửi gắm thông điệp gì?',
        options: ['Tình mẫu tử ấm áp và khát vọng sống hướng tới tương lai giữa bờ vực cái chết', 'Sự tuyệt vọng cùng cực', 'Lòng oán hận số phận', 'Sự coi thường người dâu mới'],
        correctIndex: 0,
        explanation: 'Dù đắng chát nhưng nồi cháo cám thắp sáng niềm tin, hơi ấm tình người vượt lên bóng đen nạn đói.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 11,
        question: 'Chất thép và chất tình lãng mạn hòa quyện trong hình tượng người lính Tây Tiến thể hiện rõ nhất qua câu thơ nào?',
        options: ['"Tây Tiến đoàn binh không mọc tóc / Quân xanh màu lá dữ oai hùm"', '"Sài Gòn hoa lệ"', '"Đêm mơ Hà Nội dáng kiều thơm"', '"Nhà ai Pha Luông mưa xa khơi"'],
        correctIndex: 0,
        explanation: 'Câu thơ vừa khắc họa gian khổ sốt rét rừng vừa tôn lên vẻ oai phong, bi tráng của đoàn binh Tây Tiến.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 12,
        question: 'Nghệ thuật xây dựng tình huống truyện độc đáo của Kim Lân trong "Vợ nhặt" được giới phê bình đánh giá là tình huống gì?',
        options: ['Tình huống truyện éo le, lạ lùng mà thấm đẫm tình người', 'Tình huống phiêu lưu mạo hiểm', 'Tình huống trinh thám hình sự', 'Tình huống hài hước châm biếm'],
        correctIndex: 0,
        explanation: 'Nhặt được vợ giữa nạn đói - một nghịch cảnh trớ trêu nhưng làm bừng sáng bản tính lương thiện của người lao động nghèo.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 13,
        question: 'Nét đặc sắc nhất trong phong cách nghệ thuật của tùy bút Nguyễn Tuân là gì?',
        options: ['Uyên bác, tài hoa, khám phá sự vật ở phương diện văn hóa nghệ thuật và con người ở phương diện tài hoa nghệ sĩ', 'Mộc mạc, giản dị, đậm chất ca dao', 'Trào phúng châm biếm sâu cay', 'Huyền bí tâm linh'],
        correctIndex: 0,
        explanation: 'Nguyễn Tuân là bậc thầy của ngôn từ và sự tài hoa, khám phá mọi góc cạnh với tri thức bách khoa.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 14,
        question: 'Triết lý sống cao đẹp nhất mà vở kịch "Hồn Trương Ba, da hàng thịt" để lại cho mỗi người là gì?',
        options: ['Được sống trọn vẹn, hài hòa giữa thể xác và tâm hồn, trung thực với chính mình', 'Thỏa mãn mọi đam mê vật chất', 'Tránh xa mọi va chạm xã hội', 'Sống theo mong muốn của người khác'],
        correctIndex: 0,
        explanation: 'Lưu Quang Vũ nhắn nhủ: Sống thực sự có ý nghĩa là khi con người được là chính mình trong sự trong sạch của tâm hồn.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 15,
        question: 'Trong nền văn học Việt Nam hiện đại, nhà văn nào được tôn vinh là "người mở đường tinh anh và tài năng nhất" của văn học thời kỳ đổi mới?',
        options: ['Nguyễn Minh Châu', 'Nam Cao', 'Vũ Trọng Phụng', 'Nguyễn Khải'],
        correctIndex: 0,
        explanation: 'Nguyễn Minh Châu được Nguyên Ngọc và văn giới trân trọng phong tặng danh hiệu người mở đường tinh anh cho văn học đổi mới.',
        difficulty: 'expert',
        points: 50
      }
    ]
  },

  // 7. TIẾNG ANH 12
  {
    id: 'english_12',
    name: 'Tiếng Anh 12: Ngữ Pháp THPT, Thì Động Từ & Mệnh Đề',
    category: 'Tiếng Anh',
    shortTag: 'Tiếng Anh',
    description: 'Chuyên đề thì động từ, câu bị động, câu điều kiện, mệnh đề quan hệ và từ vựng trọng điểm.',
    secretWord: 'VOCABULARY',
    secretHint: 'Từ vựng tiếng Anh - vốn từ ngữ giúp phát triển toàn diện 4 kỹ năng nghe, nói, đọc, viết.',
    questions: [
      {
        id: 1,
        question: 'Choose the correct form: "She ______ English for five years before moving to London."',
        options: ['had studied', 'has studied', 'is studying', 'studies'],
        correctIndex: 0,
        explanation: 'Hành động học tiếng Anh diễn ra và hoàn tất trước một thời điểm/hành động trong quá khứ ("moving to London"), dùng Quá khứ hoàn thành (Past Perfect: had + V3/ed).',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 2,
        question: 'Identify the correct passive voice: "Someone stole my bicycle yesterday."',
        options: ['My bicycle was stolen yesterday.', 'My bicycle is stolen yesterday.', 'My bicycle had been stole yesterday.', 'My bicycle stole yesterday.'],
        correctIndex: 0,
        explanation: 'Quá khứ đơn bị động có cấu trúc: S + was/were + V3/ed. Chủ ngữ số ít "my bicycle" đi với "was stolen".',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 3,
        question: 'Which relative pronoun is used to refer to a person as an object?',
        options: ['Whom / Who', 'Which', 'Where', 'Whose'],
        correctIndex: 0,
        explanation: '"Whom" là đại từ quan hệ thay thế cho tân ngữ chỉ người trong mệnh đề quan hệ.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 4,
        question: 'Complete the sentence: "If it rains tomorrow, we ______ the picnic."',
        options: ['will cancel', 'would cancel', 'canceled', 'had canceled'],
        correctIndex: 0,
        explanation: 'Câu điều kiện loại 1 (Conditional Type 1) diễn tả điều kiện có thể xảy ra ở hiện tại/tương lai: If + V(hiện tại đơn), S + will + V_inf.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 5,
        question: 'Choose the correct conditional: "If I ______ you, I would accept that scholarship immediately."',
        options: ['were', 'am', 'was been', 'will be'],
        correctIndex: 0,
        explanation: 'Câu điều kiện loại 2 giả định trái ngược hiện tại: "If I were you, I would...". To be dùng "were" cho tất cả các ngôi.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 6,
        question: 'Which word is the CLOSEST in meaning to "ENHANCE"?',
        options: ['Improve', 'Destroy', 'Ignore', 'Diminish'],
        correctIndex: 0,
        explanation: '"Enhance" có nghĩa là nâng cao, cải thiện, đồng nghĩa với "improve".',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 7,
        question: 'Choose the correct preposition: "Students should focus ______ revising the core concepts."',
        options: ['on', 'in', 'at', 'with'],
        correctIndex: 0,
        explanation: 'Cụm động từ cố định: "focus on something" (tập trung vào điều gì).',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 8,
        question: 'Identify the correct reported speech: "I will call you tomorrow," said Tom to Mary.',
        options: ['Tom told Mary that he would call her the next day.', 'Tom told Mary that he will call her tomorrow.', 'Tom told to Mary that he called her.', 'Tom said Mary he would call tomorrow.'],
        correctIndex: 0,
        explanation: 'Chuyển đổi câu gián tiếp: "said to" -> "told", lùi thì "will" -> "would", đổi đại từ và "tomorrow" -> "the next day".',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 9,
        question: 'Choose the sentence with correct inversion: "Rarely ______ such an incredible performance."',
        options: ['have I seen', 'I have seen', 'did I saw', 'I saw'],
        correctIndex: 0,
        explanation: 'Đảo ngữ với trạng từ phủ định/bán phủ định đứng đầu câu ("Rarely"): Trợ động từ + S + V chính -> "Rarely have I seen...".',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 10,
        question: 'Complete with the correct subjunctive mood: "It is essential that every student ______ present on time."',
        options: ['be', 'is', 'was', 'are'],
        correctIndex: 0,
        explanation: 'Thể giả định thức hiện tại (Present Subjunctive) sau tính từ quan trọng ("It is essential that..."): động từ ở dạng nguyên thể không chia (bare infinitive) -> "be".',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 11,
        question: 'Choose the correct phrasal verb meaning "to postpone/delay":',
        options: ['Put off', 'Call off', 'Give up', 'Take over'],
        correctIndex: 0,
        explanation: '"Put off" = hoãn lại (delay). Trong khi "call off" = hủy bỏ (cancel).',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 12,
        question: 'What is the OPPOSITE in meaning to "ARTIFICIAL"?',
        options: ['Natural', 'Synthetic', 'Man-made', 'False'],
        correctIndex: 0,
        explanation: '"Artificial" là nhân tạo, đối nghĩa với "natural" (tự nhiên).',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 13,
        question: 'Choose the correct mixed conditional: "If he had studied harder last year, he ______ at university now."',
        options: ['would be', 'would have been', 'will be', 'is'],
        correctIndex: 0,
        explanation: 'Câu điều kiện trộn (Past -> Present): Điều kiện giả định quá khứ (had studied) dẫn đến kết quả ở hiện tại (would be... now).',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 14,
        question: 'Identify the correct idiom meaning "to make a supreme effort or do more than is expected":',
        options: ['Go the extra mile', 'Bite the bullet', 'Break a leg', 'Hit the nail on the head'],
        correctIndex: 0,
        explanation: '"Go the extra mile" nghĩa là nỗ lực vượt bậc, làm nhiều hơn mong đợi để đạt kết quả xuất sắc.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 15,
        question: 'Which principle of effective language acquisition emphasizes comprehensible input and natural communication over rote memorization?',
        options: ['Krashen’s Natural Order and Input Hypothesis', 'Grammar Translation Method only', 'Memorizing isolated word lists', 'Strict penalty for grammatical errors'],
        correctIndex: 0,
        explanation: 'Thuyết thụ đắc ngôn ngữ của Stephen Krashen khẳng định việc tiếp nhận thông tin hiểu được (i+1) trong ngữ cảnh tự nhiên là con đường thành thạo ngôn ngữ tối ưu.',
        difficulty: 'expert',
        points: 50
      }
    ]
  },

  // 8. ĐỊA LÝ 12
  {
    id: 'geography_12',
    name: 'Địa lý 12: Địa Lý Tự Nhiên, Dân Cư & Vùng Kinh Tế Trọng Điểm',
    category: 'Địa Lý',
    shortTag: 'Địa Lý',
    description: 'Chuyên đề vị trí địa lý, khí hậu nhiệt đới ẩm gió mùa, chuyển dịch cơ cấu kinh tế và biển đảo.',
    secretWord: 'BIENDAO',
    secretHint: 'Vùng biển đảo thiêng liêng giàu tiềm năng kinh tế và chủ quyền an ninh của Tổ quốc.',
    questions: [
      {
        id: 1,
        question: 'Đặc điểm khí hậu chung của toàn bộ lãnh thổ Việt Nam là gì?',
        options: ['Nhiệt đới ẩm gió mùa', 'Khí hậu xích đạo khô hạn', 'Ôn đới lục địa', 'Hàn đới quanh năm băng giá'],
        correctIndex: 0,
        explanation: 'Nằm hoàn toàn trong vành đai nội chí tuyến Bắc bán cầu và tiếp giáp Biển Đông tạo nên tính chất nhiệt đới ẩm gió mùa.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 2,
        question: 'Hai đồng bằng châu thổ sông lớn nhất và phì nhiêu nhất nước ta là hai đồng bằng nào?',
        options: ['Đồng bằng sông Hồng và Đồng bằng sông Cửu Long', 'Đồng bằng duyên hải miền Trung và Tây Bắc', 'Đồng bằng Thanh Hóa và Nghệ An', 'Đồng bằng Bình Trị Thiên'],
        correctIndex: 0,
        explanation: 'Đồng bằng sông Hồng (sông Hồng bồi đắp) và Đồng bằng sông Cửu Long (sông Mê Kông bồi đắp) là hai vựa lúa lớn nhất.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 3,
        question: 'Điểm cực Đông trên đất liền của nước ta thuộc địa phận tỉnh nào?',
        options: ['Khánh Hòa (Mũi Đôi)', 'Điện Biên (A Pa Chải)', 'Cà Mau (Mũi Cà Mau)', 'Hà Giang (Lũng Cú)'],
        correctIndex: 0,
        explanation: 'Mũi Đôi thuộc bán đảo Hòn Gốm, huyện Vạn Ninh, tỉnh Khánh Hòa là điểm cực Đông trên đất liền.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 4,
        question: 'Loại đất chiếm diện tích lớn nhất ở khu vực đồi núi nước ta là loại đất nào?',
        options: ['Đất Feralit', 'Đất phù sa ngọt', 'Đất cát pha', 'Đất mặn ven biển'],
        correctIndex: 0,
        explanation: 'Quá trình feralit là quá trình hình thành đất đặc trưng của vùng nhiệt đới ẩm gió mùa đồi núi Việt Nam.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 5,
        question: 'Nguyên nhân chủ yếu làm cho thiên nhiên nước ta có sự phân hóa sâu sắc theo chiều Bắc - Nam là gì?',
        options: ['Sự suy giảm bức xạ mặt trời từ Nam ra Bắc và tác động của gió mùa Đông Bắc', 'Địa hình chắn gió Tây Nam', 'Ảnh hưởng của dòng biển lạnh', 'Mạng lưới sông ngòi dày đặc'],
        correctIndex: 0,
        explanation: 'Gió mùa Đông Bắc làm cho miền Bắc có mùa đông lạnh, trong khi miền Nam có khí hậu cận xích đạo nóng quanh năm.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 6,
        question: 'Hiện nay, cơ cấu kinh tế ngành của nước ta đang chuyển dịch theo hướng tích cực nào?',
        options: ['Giảm tỉ trọng Nông - Lâm - Thủy sản, tăng tỉ trọng Công nghiệp - Xây dựng và Dịch vụ', 'Tăng tỉ trọng Nông nghiệp truyền thống', 'Giảm hoàn toàn ngành công nghiệp', 'Chỉ phát triển kinh tế tự cấp tự túc'],
        correctIndex: 0,
        explanation: 'Chuyển dịch cơ cấu theo hướng công nghiệp hóa, hiện đại hóa và nâng cao tỉ trọng dịch vụ chất lượng cao.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 7,
        question: 'Cây công nghiệp lâu năm quan trọng nhất được trồng nhiều nhất ở vùng Tây Nguyên là cây gì?',
        options: ['Cà phê', 'Cao su', 'Chè', 'Hồ tiêu'],
        correctIndex: 0,
        explanation: 'Tây Nguyên là thủ phủ cà phê của Việt Nam nhờ đất đỏ bazan màu mỡ và khí hậu cao nguyên.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 8,
        question: 'Hai quần đảo xa bờ có ý nghĩa chiến lược thiêng liêng về chủ quyền biển đảo của Việt Nam là gì?',
        options: ['Quần đảo Hoàng Sa và Quần đảo Trường Sa', 'Quần đảo Côn Đảo và Thổ Chu', 'Quần đảo Phú Quốc và Nam Du', 'Quần đảo Cô Tô và Cát Bà'],
        correctIndex: 0,
        explanation: 'Hoàng Sa (thuộc TP. Đà Nẵng) và Trường Sa (thuộc tỉnh Khánh Hòa) là hai quần đảo tiền tiêu khẳng định chủ quyền biển đảo.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 9,
        question: 'Vùng kinh tế nào sau đây của nước ta có quy mô GRDP lớn nhất và là đầu tàu kinh tế cả nước?',
        options: ['Vùng Đông Nam Bộ', 'Vùng Bắc Trung Bộ', 'Vùng Tây Nguyên', 'Vùng Trung du và miền núi Bắc Bộ'],
        correctIndex: 0,
        explanation: 'Đông Nam Bộ (trọng tâm là TP. Hồ Chí Minh) là vùng kinh tế năng động nhất, dẫn đầu về công nghiệp và thu hút FDI.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 10,
        question: 'Biện pháp quan trọng hàng đầu để giải quyết vấn đề thiếu việc làm ở khu vực nông thôn nước ta là gì?',
        options: ['Đa dạng hóa kinh tế nông thôn, phát triển tiểu thủ công nghiệp và làng nghề truyền thống', 'Di dân toàn bộ lên thành phố', 'Ngừng tăng năng suất lao động', 'Tăng số ngày nghỉ lễ'],
        correctIndex: 0,
        explanation: 'Phát triển ngành nghề phi nông nghiệp và dịch vụ nông thôn giúp tận dụng thời gian nhàn rỗi và giải quyết việc làm tại chỗ.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 11,
        question: 'Hạn chế lớn nhất của nền nông nghiệp nhiệt đới nước ta trước biến đổi khí hậu toàn cầu là gì?',
        options: ['Thời tiết, khí hậu thất thường với nhiều thiên tai bão lũ, hạn mặn gây bấp bênh cho sản xuất', 'Thiếu ánh sáng mặt trời', 'Không có đất phù sa', 'Địa hình bằng phẳng quá mức'],
        correctIndex: 0,
        explanation: 'Tính bấp bênh do thiên tai, bão lụt, rét đậm rét hại và xâm nhập mặn đòi hỏi phải chủ động chuyển đổi cơ cấu cây trồng.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 12,
        question: 'Ý nghĩa kinh tế to lớn nhất của việc phát triển kinh tế biển ở nước ta là gì?',
        options: ['Khai thác tổng hợp 4 ngành kinh tế biển: du lịch biển, hải sản, dầu khí và giao thông vận tải biển', 'Chỉ tập trung vào làm muối', 'Ngăn chặn hoàn toàn thiên tai', 'Biến toàn bộ đất liền thành bãi biển'],
        correctIndex: 0,
        explanation: 'Khai thác tổng hợp kinh tế biển kết hợp bảo vệ môi trường biển tạo động lực phát triển bền vững quốc gia.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 13,
        question: 'Chiến lược phát triển bền vững kinh tế biển Việt Nam đến năm 2030, tầm nhìn đến năm 2045 (Nghị quyết 36-NQ/TW) đặt mục tiêu gì?',
        options: ['Đưa Việt Nam trở thành quốc gia biển mạnh, phát triển bền vững, thịnh vượng, an ninh, an toàn', 'Khai thác cạn kiệt tài nguyên biển', 'Đóng cửa toàn bộ các cảng biển', 'Chỉ phát triển du lịch ven bờ'],
        correctIndex: 0,
        explanation: 'Việt Nam kiên quyết xây dựng đất nước mạnh về biển, làm giàu từ biển, bảo tồn hệ sinh thái biển đảo.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 14,
        question: 'Tại sao việc liên kết vùng kinh tế giữa Đồng bằng sông Cửu Long và TP. Hồ Chí Minh lại mang tính sống còn?',
        options: ['ĐBSCL là vựa nông thủy sản và an ninh lương thực, kết hợp với trung tâm chế biến, tài chính và logistics hiện đại của TP.HCM', 'Vì hai nơi không có đường giao thông', 'Để chuyển toàn bộ dân số về nông thôn', 'Không có ý nghĩa kinh tế'],
        correctIndex: 0,
        explanation: 'Liên kết chuỗi giá trị nông sản - công nghệ - xuất khẩu giữa ĐBSCL và TP.HCM tạo sức bật cho kinh tế cả vùng phía Nam.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 15,
        question: 'Khái niệm "Kinh tế tuần hoàn" (Circular Economy) trong quy hoạch địa lý kinh tế hiện đại hướng tới điều gì?',
        options: ['Biến chất thải của ngành này thành nguyên liệu đầu vào của ngành khác, tái chế và tối ưu hóa tài nguyên', 'Tăng lượng rác thải ra môi trường', 'Chỉ sản xuất hàng dùng một lần', 'Khai thác tối đa tài nguyên hóa thạch'],
        correctIndex: 0,
        explanation: 'Kinh tế tuần hoàn là xu thế tất yếu nhằm giảm thiểu khí thải carbon và bảo đảm phát triển xanh lâu dài.',
        difficulty: 'expert',
        points: 50
      }
    ]
  },

  // 9. GDCD / KINH TẾ & PHÁP LUẬT 12
  {
    id: 'civic_12',
    name: 'Giáo dục công dân 12: Quyền Bình Đẳng & Pháp Luật Đời Sống',
    category: 'GDCD',
    shortTag: 'GDCD',
    description: 'Chuyên đề pháp luật và đời sống, quyền tự do cơ bản, quyền dân chủ và phát triển bền vững.',
    secretWord: 'BINHDANG',
    secretHint: 'Nguyên tắc hiến định: Mọi công dân đều bình đẳng trước pháp luật không phân biệt đối xử.',
    questions: [
      {
        id: 1,
        question: 'Pháp luật là gì?',
        options: ['Hệ thống các quy tắc xử sự chung do Nhà nước ban hành và bảo đảm thực hiện bằng quyền lực nhà nước', 'Các quy ước ngầm giữa các cá nhân', 'Những lời khuyên không bắt buộc', 'Thói quen sinh hoạt hàng ngày'],
        correctIndex: 0,
        explanation: 'Pháp luật mang tính quy phạm phổ biến, tính quyền lực bắt buộc chung và tính xác định chặt chẽ về hình thức.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 2,
        question: 'Mọi công dân đều bình đẳng trước pháp luật được hiểu như thế nào?',
        options: ['Bình đẳng về quyền, nghĩa vụ và trách nhiệm pháp lý trước pháp luật', 'Mọi người đều phải có thu nhập bằng nhau', 'Mọi người đều được miễn trừ xử phạt', 'Ai cũng được làm bất cứ điều gì không cần xin phép'],
        correctIndex: 0,
        explanation: 'Công dân bình đẳng về quyền và nghĩa vụ, bất kỳ ai vi phạm đều phải chịu trách nhiệm pháp lý theo luật định.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 3,
        question: 'Độ tuổi nào công dân Việt Nam có quyền bầu cử đại biểu Quốc hội và Hội đồng nhân dân các cấp?',
        options: ['Đủ 18 tuổi trở lên', 'Đủ 16 tuổi trở lên', 'Đủ 20 tuổi trở lên', 'Đủ 21 tuổi trở lên'],
        correctIndex: 0,
        explanation: 'Hiến pháp quy định: Công dân đủ 18 tuổi trở lên có quyền bầu cử, đủ 21 tuổi trở lên có quyền ứng cử.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 4,
        question: 'Hành vi tự tiện bắt và giam, giữ người trái pháp luật đã xâm phạm đến quyền tự do cơ bản nào của công dân?',
        options: ['Quyền bất khả xâm phạm về thân thể của công dân', 'Quyền tự do ngôn luận', 'Quyền tự do kinh doanh', 'Quyền bình đẳng trong lao động'],
        correctIndex: 0,
        explanation: 'Không ai bị bắt nếu không có quyết định của Tòa án, quyết định hoặc phê chuẩn của Viện kiểm sát (trừ phạm tội quả tang).',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 5,
        question: 'Hành vi bịa đặt, vu khống làm tổn hại danh dự, nhân phẩm của người khác trên mạng xã hội là vi phạm quyền nào?',
        options: ['Quyền được pháp luật bảo hộ về tính mạng, sức khỏe, danh dự và nhân phẩm', 'Quyền khiếu nại tố cáo', 'Quyền bí mật thư tín', 'Quyền tự do tôn giáo'],
        correctIndex: 0,
        explanation: 'Danh dự, nhân phẩm của công dân được pháp luật tôn trọng và bảo vệ tuyệt đối.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 6,
        question: 'Quyền khiếu nại của công dân được sử dụng trong trường hợp nào?',
        options: ['Khi cá nhân, cơ quan có quyết định hành chính hoặc hành vi hành chính trái pháp luật xâm phạm quyền lợi ích hợp pháp của mình', 'Khi phát hiện hành vi phạm tội của người khác', 'Khi muốn xin trợ cấp xã hội', 'Khi tham gia bỏ phiếu bầu cử'],
        correctIndex: 0,
        explanation: 'Khiếu nại là quyền của công dân đề nghị cơ quan có thẩm quyền xem xét lại quyết định hành chính xâm phạm quyền của mình.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 7,
        question: 'Bất kỳ người nào cũng có quyền bắt giữ một người khi người đó thuộc trường hợp nào sau đây?',
        options: ['Đang thực hiện hành vi phạm tội quả tang hoặc đang bị truy nã', 'Có biểu hiện nghi vấn', 'Chưa đóng thuế đầy đủ', 'Không mang giấy tờ tùy thân'],
        correctIndex: 0,
        explanation: 'Đối với người đang phạm tội quả tang hoặc người đang bị truy nã thì bất kỳ ai cũng có quyền bắt và giải ngay đến công an.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 8,
        question: 'Quyền học tập của công dân bao gồm những nội dung căn bản nào?',
        options: ['Học không hạn chế, học bất cứ ngành nghề nào, học thường xuyên, học suốt đời và bình đẳng về cơ hội học tập', 'Chỉ được học trường công lập', 'Chỉ người giàu mới được học đại học', 'Bắt buộc học một ngành duy nhất'],
        correctIndex: 0,
        explanation: 'Mọi công dân không phân biệt dân tộc, tôn giáo, nguồn gốc xuất thân đều bình đẳng về cơ hội tiếp cận giáo dục.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 9,
        question: 'Trong hoạt động sản xuất kinh doanh, việc bảo vệ môi trường là nghĩa vụ của đối tượng nào?',
        options: ['Tất cả mọi tổ chức, doanh nghiệp và cá nhân sản xuất kinh doanh', 'Chỉ các doanh nghiệp nước ngoài', 'Chỉ chính quyền địa phương', 'Không phải nghĩa vụ của ai'],
        correctIndex: 0,
        explanation: 'Mọi chủ thể kinh doanh đều có trách nhiệm thực hiện quy định về đánh giá tác động và xử lý nước thải, khí thải.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 10,
        question: 'Quyền tự do ngôn luận của công dân được thực hiện theo đúng quy định pháp luật khi nào?',
        options: ['Bày tỏ quan điểm trên tinh thần xây dựng, tuân thủ pháp luật và không xâm phạm an ninh quốc gia, trật tự xã hội', 'Tung tin bịa đặt gây hoang mang dư luận', 'Xúc phạm lãnh đạo và tổ chức', 'Kêu gọi kích động biểu tình bạo lực'],
        correctIndex: 0,
        explanation: 'Tự do ngôn luận luôn đi kèm với trách nhiệm công dân và giới hạn pháp luật để bảo vệ lợi ích công cộng.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 11,
        question: 'Hình thức thực hiện pháp luật nào mà trong đó các cá nhân, tổ chức KIỀM CHẾ không làm những điều pháp luật cấm?',
        options: ['Tuân thủ pháp luật', 'Thi hành pháp luật', 'Sử dụng pháp luật', 'Áp dụng pháp luật'],
        correctIndex: 0,
        explanation: 'Tuân thủ pháp luật là việc các chủ thể kiềm chế không thực hiện các hành vi bị pháp luật cấm (ví dụ: không vượt đèn đỏ).',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 12,
        question: 'Quyền tham gia quản lý nhà nước và xã hội của công dân ở phạm vi cơ sở được thực hiện theo phương châm dân chủ nào?',
        options: ['"Dân biết, dân bàn, dân làm, dân kiểm tra, dân giám sát, dân thụ hưởng"', '"Tiền trảm hậu tấu"', '"Cấp trên quyết định tất cả"', '"Đóng cửa bảo nhau"'],
        correctIndex: 0,
        explanation: 'Phương châm cốt lõi của nền dân chủ xã hội chủ nghĩa được khẳng định sâu sắc trong Văn kiện Đại hội XIII của Đảng.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 13,
        question: 'Nhà nước pháp quyền xã hội chủ nghĩa Việt Nam có đặc trưng bản chất sâu sắc nhất là gì?',
        options: ['Nhà nước của Nhân dân, do Nhân dân, vì Nhân dân; tất cả quyền lực nhà nước thuộc về Nhân dân', 'Nhà nước phục vụ một nhóm lợi ích', 'Quyền lực phân chia độc lập không kiểm soát', 'Không cần hệ thống hiến pháp'],
        correctIndex: 0,
        explanation: 'Quyền lực nhà nước là thống nhất, có sự phân công, phối hợp và kiểm soát giữa các cơ quan trong việc thực hiện các quyền lập pháp, hành pháp, tư pháp.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 14,
        question: 'Để xây dựng một xã hội thượng tôn pháp luật (Rule of Law), nhân tố nào đóng vai trò nền tảng bền vững nhất?',
        options: ['Ý thức tự giác chấp hành pháp luật và văn hóa pháp lý của mỗi công dân kết hợp sự nghiêm minh của cơ quan tư pháp', 'Chỉ cần tăng mức phạt tiền thật cao', 'Lắp camera khắp mọi nơi', 'Bãi bỏ các quyền tự do'],
        correctIndex: 0,
        explanation: 'Giáo dục ý thức thượng tôn pháp luật từ học đường tạo nền móng vững chắc cho xã hội công bằng, văn minh.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 15,
        question: 'Mối quan hệ biện chứng giữa pháp luật và đạo đức trong đời sống xã hội thể hiện như thế nào?',
        options: ['Pháp luật thể chế hóa các giá trị đạo đức tiến bộ; đạo đức là nền tảng tinh thần nâng đỡ việc thực thi pháp luật', 'Hai phạm trù này hoàn toàn đối lập nhau', 'Có pháp luật thì không cần đạo đức', 'Đạo đức có quyền đứng trên pháp luật'],
        correctIndex: 0,
        explanation: 'Pháp luật và đạo đức bổ sung cho nhau, cùng hướng tới mục tiêu xây dựng con người hoàn thiện và xã hội nhân văn.',
        difficulty: 'expert',
        points: 50
      }
    ]
  },

  // 10. KỸ NĂNG SỐNG & AN TOÀN HỌC ĐƯỜNG
  {
    id: 'skills_discipline',
    name: 'Kỹ Năng Sống, An Toàn & Kỷ Luật Học Đường',
    category: 'Kỹ Năng',
    shortTag: 'Kỹ Năng',
    description: 'Chuyên đề văn hóa học đường, ứng xử văn minh mạng xã hội, an toàn giao thông và xây dựng Lớp học hạnh phúc.',
    secretWord: 'HOCDUONG',
    secretHint: 'Môi trường giáo dục thân thiện, kỷ cương, tình thương và trách nhiệm.',
    questions: [
      {
        id: 1,
        question: 'Theo Luật Giao thông đường bộ, học sinh THPT điều khiển xe đạp điện, xe máy điện bắt buộc phải làm gì?',
        options: ['Đội mũ bảo hiểm cài quai đúng quy cách', 'Chỉ đội mũ khi có cảnh sát giao thông', 'Không cần đội mũ bảo hiểm', 'Chỉ cần đội mũ vải'],
        correctIndex: 0,
        explanation: 'Đội mũ bảo hiểm bảo đảm an toàn tính mạng cho chính bản thân và tuân thủ pháp luật.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 2,
        question: 'Hành động nào sau đây thể hiện văn hóa ứng xử văn minh và lịch sự trong giờ học?',
        options: ['Lắng nghe thầy cô, giơ tay khi muốn phát biểu ý kiến', 'Nói chuyện tự do', 'Sử dụng điện thoại làm việc riêng', 'Ăn quà vặt trong lớp'],
        correctIndex: 0,
        explanation: 'Tôn trọng giờ học là tôn trọng thầy cô và các bạn xung quanh.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 3,
        question: 'Theo quy chế quản lý lớp học số, điểm trực nhật lớp được cộng cho đối tượng nào?',
        options: ['Cộng điểm thi đua cho TỔ', 'Chỉ cộng cho cá nhân người quét', 'Không được cộng điểm', 'Cộng cho cả khối'],
        correctIndex: 0,
        explanation: 'Trực nhật là trách nhiệm tập thể, điểm được tính vào tổng điểm thi đua tuần của cả Tổ.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 4,
        question: 'Mỗi buổi vắng học có phép được hệ thống tính trừ bao nhiêu điểm thi đua tổ?',
        options: ['Trừ 1 điểm', 'Trừ 2 điểm', 'Trừ 5 điểm', 'Không trừ điểm'],
        correctIndex: 0,
        explanation: 'Quy chế: Vắng có phép trừ 1 điểm tổ, vắng không phép trừ 2 điểm tổ.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 5,
        question: 'Phương pháp quản lý thời gian Pomodoro hướng dẫn chu kỳ tập trung như thế nào?',
        options: ['25 phút tập trung cao độ, sau đó nghỉ ngắn 5 phút', 'Học 60 phút nghỉ 30 phút', 'Học 5 phút nghỉ 25 phút', 'Học thâu đêm không nghỉ'],
        correctIndex: 0,
        explanation: 'Chu kỳ Pomodoro 25-5 giúp não bộ duy trì sự tập trung tối ưu và hạn chế mệt mỏi.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 6,
        question: 'Khi tiếp nhận một thông tin gây sốc chưa rõ nguồn gốc trên mạng xã hội, phản ứng đúng đắn nhất là gì?',
        options: ['Kiểm chứng nguồn tin chính thống từ cơ quan báo chí uy tín, tuyệt đối không chia sẻ tin giả', 'Lập tức chia sẻ lên trang cá nhân', 'Bình luận công kích người khác', 'Tag tất cả bạn bè vào bàn tán'],
        correctIndex: 0,
        explanation: 'Không lan truyền tin giả là trách nhiệm công dân số thông minh và văn minh.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 7,
        question: 'Kỹ năng lắng nghe chủ động (Active Listening) đòi hỏi người nghe phải làm gì?',
        options: ['Tập trung chú ý, quan sát ngôn ngữ cơ thể, thấu hiểu cảm xúc và không ngắt lời người nói', 'Giả vờ nghe nhưng bấm điện thoại', 'Liên tục ngắt lời để bảo vệ ý kiến cá nhân', 'Phán xét ngay lập tức'],
        correctIndex: 0,
        explanation: 'Lắng nghe chủ động là nền tảng để xây dựng mối quan hệ tin cậy và giải quyết xung đột.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 8,
        question: 'Nguyên tắc an toàn bảo mật mật khẩu tài khoản cá nhân trực tuyến quan trọng nhất là gì?',
        options: ['Sử dụng mật khẩu mạnh có chữ hoa, chữ thường, số, ký tự đặc biệt và bật xác thực 2 bước (2FA)', 'Đặt mật khẩu 123456 cho dễ nhớ', 'Dùng chung một mật khẩu cho mọi tài khoản', 'Chia sẻ mật khẩu cho bạn thân'],
        correctIndex: 0,
        explanation: 'Bảo mật 2 lớp giúp bảo vệ dữ liệu cá nhân trước các nguy cơ tấn công mạng.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 9,
        question: 'Nguyên lý 80/20 (Nguyên lý Pareto) trong việc tối ưu hóa hiệu quả học tập khuyên học sinh nên làm gì?',
        options: ['Dành 80% nỗ lực vào 20% kiến thức nền tảng cốt lõi mang lại 80% kết quả thi cử', 'Học dàn trải đều tất cả mọi trang sách', 'Bỏ học 80% thời gian', 'Chỉ học vẹt một phần nhỏ'],
        correctIndex: 0,
        explanation: 'Nắm chắc kiến thức cốt lõi là chìa khóa đạt điểm số vượt trội mà không bị quá tải.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 10,
        question: 'Khi phát hiện một bạn trong lớp có dấu hiệu bị bắt nạt học đường hoặc gặp khủng hoảng tâm lý, bạn nên làm gì?',
        options: ['Kịp thời động viên bạn và báo ngay cho Giáo viên chủ nhiệm hoặc Phòng Tham vấn tâm lý học đường', 'Quay video đăng lên mạng', 'Đứng xem và cổ vũ', 'Im lặng coi như không liên quan'],
        correctIndex: 0,
        explanation: 'Sự can thiệp kịp thời từ GVCN và chuyên gia tâm lý giúp bảo vệ an toàn cho học sinh.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 11,
        question: 'Mô hình tư duy "Tam giác cảm xúc" (Tư duy - Cảm xúc - Hành vi) của tâm lý học nhận thức khẳng định điều gì?',
        options: ['Cách ta suy nghĩ về một vấn đề sẽ quyết định cảm xúc và chi phối hành vi của ta', 'Cảm xúc hoàn toàn do hoàn cảnh bên ngoài chi phối', 'Hành vi không thể kiểm soát được', 'Tư duy không có vai trò gì'],
        correctIndex: 0,
        explanation: 'Thay đổi góc nhìn tích cực sẽ chuyển hóa cảm xúc và đem lại hành vi xây dựng.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 12,
        question: 'Trong làm việc nhóm, khi xuất hiện bất đồng quan điểm gay gắt giữa hai thành viên, nhóm trưởng nên xử lý ra sao?',
        options: ['Tạm dừng tranh luận, xác định rõ mục tiêu chung của nhóm và tạo không gian cho mỗi bên trình bày luận cứ khách quan', 'Chọn theo bạn thân của mình', 'Loại bỏ một trong hai bạn ra khỏi nhóm', 'Mặc kệ để hai bạn tự giải quyết'],
        correctIndex: 0,
        explanation: 'Giải quyết xung đột dựa trên mục tiêu chung là phẩm chất của nhà lãnh đạo tương lai.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 13,
        question: 'Khái niệm "Tư duy phát triển" (Growth Mindset) của Giáo sư Carol Dweck nhấn mạnh điều gì?',
        options: ['Trí thông minh và tài năng có thể được rèn luyện, bồi đắp thông qua sự kiên trì và học hỏi từ thất bại', 'Tài năng là bẩm sinh không thể thay đổi', 'Người thông minh không cần nỗ lực', 'Thất bại là dấu chấm hết'],
        correctIndex: 0,
        explanation: 'Growth Mindset giúp học sinh đón nhận thử thách và không ngừng tiến bộ trong cuộc sống.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 14,
        question: 'Để xây dựng một "Lớp học hạnh phúc" (Happy Classroom), 3 trụ cột giá trị cốt lõi nào theo định hướng của UNESCO là quan trọng nhất?',
        options: ['Yêu thương, An toàn và Tôn trọng', 'Điểm số cao, Cạnh tranh và Kỷ luật sắt', 'Tiện nghi vật chất, Miễn học phí và Tự do tuyệt đối', 'Không có bài kiểm tra, Chỉ chơi và Không kỷ luật'],
        correctIndex: 0,
        explanation: 'Yêu thương - An toàn - Tôn trọng là kim chỉ nam tạo nên môi trường giáo dục nhân văn và bền vững.',
        difficulty: 'expert',
        points: 50
      },
      {
        id: 15,
        question: 'Năng lực cốt lõi nào giúp học sinh thời đại trí tuệ nhân tạo (AI) không bị thay thế và luôn khẳng định giá trị bản thân?',
        options: ['Tư duy phản biện độc lập, năng lực sáng tạo độc bản, trí tuệ cảm xúc (EQ) và khả năng tự học suốt đời', 'Chỉ học thuộc lòng các định nghĩa', 'Ghi nhớ số liệu máy móc', 'Làm theo hướng dẫn có sẵn mà không suy nghĩ'],
        correctIndex: 0,
        explanation: 'Những giá trị nhân bản, sự thấu cảm, sáng tạo và tư duy phản biện là những điều máy móc không thể thay thế con người.',
        difficulty: 'expert',
        points: 50
      }
    ]
  }
];

/**
 * Tìm kiếm ngân hàng câu hỏi bám sát nhất theo chủ đề của giáo viên
 */
export function findMatchingTopicPreset(topicText: string): TopicBankPreset | null {
  if (!topicText) return null;
  const lower = topicText.toLowerCase().trim();

  // 1. Sinh học
  if (lower.includes('sinh') || lower.includes('adn') || lower.includes('menđen') || lower.includes('gen') || lower.includes('di truyền') || lower.includes('tế bào') || lower.includes('tiến hóa')) {
    return PRESET_TOPIC_BANKS.find(p => p.id === 'biology_12') || null;
  }
  // 2. Toán học
  if (lower.includes('toán') || lower.includes('đạo hàm') || lower.includes('hàm số') || lower.includes('tích phân') || lower.includes('oxyz') || lower.includes('hình học') || lower.includes('giải tích') || lower.includes('đại số')) {
    return PRESET_TOPIC_BANKS.find(p => p.id === 'math_12') || null;
  }
  // 3. Hóa học
  if (lower.includes('hóa') || lower.includes('este') || lower.includes('lipit') || lower.includes('kim loại') || lower.includes('glucoz') || lower.includes('polime') || lower.includes('phản ứng')) {
    return PRESET_TOPIC_BANKS.find(p => p.id === 'chemistry_12') || null;
  }
  // 4. Vật lý
  if (lower.includes('vật lý') || lower.includes('lý 12') || lower.includes('vật lí') || lower.includes('dao động') || lower.includes('con lắc') || lower.includes('sóng cơ') || lower.includes('xoay chiều') || lower.includes('quang học')) {
    return PRESET_TOPIC_BANKS.find(p => p.id === 'physics_12') || null;
  }
  // 5. Ngữ văn
  if (lower.includes('văn') || lower.includes('ngữ văn') || lower.includes('kiều') || lower.includes('tây tiến') || lower.includes('việt bắc') || lower.includes('sông đà') || lower.includes('vợ nhặt') || lower.includes('đất nước')) {
    return PRESET_TOPIC_BANKS.find(p => p.id === 'literature_12') || null;
  }
  // 6. Tiếng Anh
  if (lower.includes('anh') || lower.includes('english') || lower.includes('tiếng anh') || lower.includes('ngữ pháp') || lower.includes('grammar') || lower.includes('tenses') || lower.includes('từ vựng')) {
    return PRESET_TOPIC_BANKS.find(p => p.id === 'english_12') || null;
  }
  // 7. Địa lý
  if (lower.includes('địa') || lower.includes('địa lý') || lower.includes('địa lí') || lower.includes('khí hậu') || lower.includes('vùng kinh tế') || lower.includes('biển đảo') || lower.includes('đồng bằng')) {
    return PRESET_TOPIC_BANKS.find(p => p.id === 'geography_12') || null;
  }
  // 8. Lịch sử
  if (lower.includes('sử') || lower.includes('lịch sử') || lower.includes('chiến dịch') || lower.includes('điện biên') || lower.includes('kháng chiến') || lower.includes('cách mạng') || lower.includes('1945') || lower.includes('1975')) {
    return PRESET_TOPIC_BANKS.find(p => p.id === 'history_12') || null;
  }
  // 9. GDCD / Pháp luật
  if (lower.includes('gdcd') || lower.includes('công dân') || lower.includes('pháp luật') || lower.includes('kinh tế và pháp luật') || lower.includes('bình đẳng') || lower.includes('quyền') || lower.includes('nghĩa vụ')) {
    return PRESET_TOPIC_BANKS.find(p => p.id === 'civic_12') || null;
  }
  // 10. Kỹ năng sống & Kỷ luật
  if (lower.includes('kỹ năng') || lower.includes('kỷ luật') || lower.includes('an toàn') || lower.includes('giao thông') || lower.includes('học đường') || lower.includes('pomodoro') || lower.includes('bắt nạt')) {
    return PRESET_TOPIC_BANKS.find(p => p.id === 'skills_discipline') || null;
  }

  return null;
}
