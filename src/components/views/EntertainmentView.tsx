import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Trophy,
  Sparkles,
  Flame,
  HelpCircle,
  Gift,
  RefreshCw,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  BookOpen,
  Send,
  Zap,
  Star,
  Award,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Bot,
  Sliders,
  Download,
  Share2,
  ChevronRight,
  Volume2,
  VolumeX,
  Plus,
  Upload,
  FileText,
  FileCheck,
  Check,
  Trash2,
  Filter,
  Eye,
  Info,
  ArrowLeft,
  XCircle,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { EntertainmentGameId, QuizQuestion, DailyStreakRecord, Student } from '../../types';
import { generateQuizQuestionsWithAI } from '../../services/aiQuizService';
import { extractTextFromFile } from '../../utils/documentExtractor';
import {
  buildProgressiveQuiz,
  PRESET_TOPIC_BANKS,
  TopicBankPreset,
  shuffleQuestionChoices
} from '../../utils/quizShuffle';
import { QuestionManager } from './entertainment/QuestionManager';

// Bảng màu rực rỡ, vui tươi cho các nan quạt vòng quay học sinh
const WHEEL_COLORS = [
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#84cc16', // Lime
  '#eab308', // Amber / Gold
  '#f97316', // Orange
  '#d946ef', // Fuchsia
  '#0ea5e9', // Sky
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f59e0b', // Yellow-amber
];

// Các ô điểm trên Vòng quay Chiếc Nón Kỳ Diệu
const MAGIC_WHEEL_SLICES = [
  { label: '100', val: 100, color: '#3b82f6', type: 'pts' },
  { label: '200', val: 200, color: '#10b981', type: 'pts' },
  { label: '500', val: 500, color: '#f59e0b', type: 'pts' },
  { label: 'MẤT LƯỢT', val: 0, color: '#ef4444', type: 'lose' },
  { label: '300', val: 300, color: '#8b5cf6', type: 'pts' },
  { label: '700', val: 700, color: '#ec4899', type: 'pts' },
  { label: 'NHÂN ĐÔI', val: 2, color: '#06b6d4', type: 'double' },
  { label: '400', val: 400, color: '#84cc16', type: 'pts' },
  { label: '600', val: 600, color: '#f97316', type: 'pts' },
  { label: '1000', val: 1000, color: '#eab308', type: 'pts' },
  { label: 'PHẦN THƯỞNG', val: 300, color: '#a855f7', type: 'gift' },
  { label: '800', val: 800, color: '#14b8a6', type: 'pts' },
];

export const EntertainmentView: React.FC = () => {
  const {
    students,
    currentUserRole,
    dailyStreaks,
    gameHistory,
    checkInDailyHabit,
    batchCheckInDailyHabits,
    redeemStreakReward,
    recordGameResult,
    awardBonusToStudent,
    awardBonusToGroup,
    exportToExcel,
    syncAllToGoogleSheets,
  } = useApp();

  const [activeGame, setActiveGame] = useState<EntertainmentGameId | 'ai_generator' | 'history'>('lucky_wheel');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // =========================================================================
  // NGÂN HÀNG CÂU HỎI CHỦ ĐỀ & AI STUDIO
  // =========================================================================
  const [selectedPresetTopicId, setSelectedPresetTopicId] = useState<string>('history_12');
  const [currentTopic, setCurrentTopic] = useState<string>(PRESET_TOPIC_BANKS[0].name);
  const [customContent, setCustomContent] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(15);
  const [progressiveDifficulty, setProgressiveDifficulty] = useState<boolean>(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [generateNotice, setGenerateNotice] = useState<string | null>(null);
  const [rawQuestionPool, setRawQuestionPool] = useState<QuizQuestion[]>(PRESET_TOPIC_BANKS[0].questions);
  const [questionBank, setQuestionBank] = useState<QuizQuestion[]>(() =>
    buildProgressiveQuiz(PRESET_TOPIC_BANKS[0].questions, 15)
  );

  // Từ khóa bí mật cho Chiếc Nón Kỳ Diệu lấy theo chủ đề
  const [secretWord, setSecretWord] = useState<string>(PRESET_TOPIC_BANKS[0].secretWord);
  const [secretHint, setSecretHint] = useState<string>(PRESET_TOPIC_BANKS[0].secretHint);
  const [showDeployModal, setShowDeployModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TÍCH HỢP BỘ CÂU HỎI TỪ NGÂN HÀNG SANG TẤT CẢ 5 TRÒ CHƠI
  const handleDeployToGames = () => {
    if (questionBank.length === 0) {
      alert('Chưa có câu hỏi nào để tích hợp! Hãy tạo hoặc chọn chủ đề trước.');
      return;
    }

    // Đảm bảo xáo trộn câu hỏi từ dễ đến khó và xáo trộn 4 đáp án A B C D ngẫu nhiên
    const deployed = buildProgressiveQuiz(questionBank, Math.max(15, questionBank.length));
    setQuestionBank(deployed);

    // 1. Vòng quay gọi tên
    setActiveQuestion(deployed[0]);
    setCurrentWheelQuestionIdx(0);
    setAnsweredQuestion(false);
    setSelectedAnswerIdx(null);

    // 2. Rung chuông vàng
    setActiveBellQuestion(deployed[0]);
    setBellRound(1);
    setBellTimer(20);
    setBellShowAnswer(false);
    setBellFinished(false);

    // 3. Ai là triệu phú
    setMillionaireStep(1);
    setMillionaireLifelines({ fiftyFifty: true, askAudience: true, callFriend: true });
    setHiddenOptions([]);
    setAudiencePoll(null);
    setFriendAdvice(null);

    // 4. Chiếc nón kỳ diệu
    const normalizedSecret = currentTopic
      .toUpperCase()
      .replace(/[^A-Z0-9À-Ỹ]/g, '')
      .slice(0, 12);
    if (normalizedSecret.length >= 3) {
      setSecretWord(normalizedSecret);
      setSecretHint(`Chủ đề trọng tâm: ${currentTopic}`);
    }
    setRevealedLetters([]);
    setMagicWheelScore(0);

    confetti({ particleCount: 150, spread: 90 });
    setShowDeployModal(true);
  };

  // Khi chọn chủ đề mẫu từ ngân hàng
  const handleSelectPresetTopic = (presetId: string) => {
    const found = PRESET_TOPIC_BANKS.find(p => p.id === presetId);
    if (!found) return;

    setSelectedPresetTopicId(presetId);
    setCurrentTopic(found.name);
    setRawQuestionPool(found.questions);
    setSecretWord(found.secretWord);
    setSecretHint(found.secretHint);

    // Xáo trộn ngẫu nhiên câu hỏi và đáp án từ dễ đến khó
    const prepared = buildProgressiveQuiz(found.questions, 15);
    setQuestionBank(prepared);

    // Đồng bộ lại các trò chơi
    setBellRound(1);
    setActiveBellQuestion(prepared[0]);
    setBellTimer(20);
    setBellShowAnswer(false);
    setBellFinished(false);
    setMillionaireStep(1);

    setGenerateNotice(`Đã chuyển sang Ngân hàng chủ đề: "${found.name}" với 15 câu hỏi sắp xếp từ Dễ đến Khó!`);
    setTimeout(() => setGenerateNotice(null), 4000);
  };

  // Tải file tài liệu lên không bị lỗi font (Hỗ trợ .docx qua mammoth, .xlsx, .txt UTF-8)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setGenerateNotice('Đang giải mã và đọc file tài liệu tiếng Việt...');
      const res = await extractTextFromFile(file);

      if (res.success && res.text) {
        setUploadedFileName(res.fileName);
        setUploadedFileSize(res.fileSize);
        setCustomContent(res.text);
        setGenerateNotice(`🎉 ${res.message} (${res.charCount} ký tự)`);
      } else {
        alert(res.message || 'Lỗi khi đọc file tài liệu.');
      }
    } catch (err: any) {
      console.error('Lỗi khi tải file:', err);
      alert('Không thể đọc file. Bạn có thể mở file và copy/dán văn bản trực tiếp vào ô bên dưới.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setGenerateNotice(null), 5000);
    }
  };

  // Tạo câu hỏi AI từ chủ đề và nội dung giáo viên đưa
  const handleGenerateQuestions = async () => {
    if (!currentTopic.trim()) {
      alert('Vui lòng nhập chủ đề câu hỏi!');
      return;
    }

    setIsGeneratingAI(true);
    setGenerateNotice('Gemini AI đang đọc hiểu tài liệu & soạn bộ câu hỏi với độ khó tăng dần...');

    try {
      const res = await generateQuizQuestionsWithAI({
        topic: currentTopic.trim(),
        content: customContent.trim(),
        count: numQuestions,
        progressiveDifficulty,
        gradeLevel: 'Lớp 12',
      });

      if (res.success && res.questions.length > 0) {
        setRawQuestionPool(res.questions);

        // Chuẩn bị câu hỏi ngẫu nhiên và đáp án ngẫu nhiên từ dễ đến khó
        const prepared = buildProgressiveQuiz(res.questions, numQuestions);
        setQuestionBank(prepared);

        // Tạo từ khóa bí mật từ chủ đề cho Chiếc Nón Kỳ Diệu
        const normalizedSecret = currentTopic
          .toUpperCase()
          .replace(/[^A-Z0-9À-Ỹ]/g, '')
          .slice(0, 12);
        if (normalizedSecret.length >= 4) {
          setSecretWord(normalizedSecret);
          setSecretHint(`Chủ đề trọng tâm: ${currentTopic}`);
        }

        // Cập nhật lại các trò chơi
        setBellRound(1);
        setActiveBellQuestion(prepared[0]);
        setBellTimer(20);
        setBellShowAnswer(false);
        setBellFinished(false);
        setMillionaireStep(1);

        confetti({ particleCount: 90, spread: 80 });
        setGenerateNotice(`🎉 Đã tạo thành công ${prepared.length} câu hỏi theo mức độ khó tăng dần! Câu hỏi và đáp án đã được xáo trộn ngẫu nhiên và tích hợp vào tất cả trò chơi.`);
      } else {
        setGenerateNotice(res.message || 'Không thể tạo câu hỏi lúc này, vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Lỗi tạo câu hỏi:', err);
      setGenerateNotice('Đã xảy ra lỗi khi gọi AI. Hệ thống đã chuẩn bị bộ câu hỏi tương đương.');
    } finally {
      setIsGeneratingAI(false);
      setTimeout(() => setGenerateNotice(null), 8000);
    }
  };

  // =========================================================================
  // GAME 1: 🎡 VÒNG QUAY MAY MẮN – TRONG VÒNG QUAY CÓ TÊN HỌC SINH
  // =========================================================================
  const [calledStudentIds, setCalledStudentIds] = useState<string[]>([]);
  const [excludeCalled, setExcludeCalled] = useState<boolean>(false);

  const eligibleStudents: Student[] = useMemo(() => {
    let list = selectedGroupFilter === 0
      ? students
      : students.filter(s => s.groupId === selectedGroupFilter);

    if (excludeCalled && calledStudentIds.length > 0) {
      const remaining = list.filter(s => !calledStudentIds.includes(s.id));
      if (remaining.length > 0) return remaining;
    }
    return list;
  }, [students, selectedGroupFilter, excludeCalled, calledStudentIds]);

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelDegree, setWheelDegree] = useState<number>(0);
  const [selectedWinner, setSelectedWinner] = useState<Student | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<QuizQuestion | null>(null);
  const [answeredQuestion, setAnsweredQuestion] = useState<boolean>(false);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [currentWheelQuestionIdx, setCurrentWheelQuestionIdx] = useState<number>(0);

  const getSliceDisplayName = (student: Student, index: number, total: number) => {
    const parts = student.fullName.trim().split(/\s+/);
    const shortName = parts.length >= 2
      ? `${parts[parts.length - 2]} ${parts[parts.length - 1]}`
      : student.fullName;

    if (total <= 10) {
      return `${index + 1}. ${student.fullName}`;
    }
    return `${index + 1}. ${shortName}`;
  };

  const spinWheel = () => {
    if (isSpinning || eligibleStudents.length === 0) return;

    setIsSpinning(true);
    setSelectedWinner(null);
    setActiveQuestion(null);
    setAnsweredQuestion(false);
    setSelectedAnswerIdx(null);

    const winnerIdx = Math.floor(Math.random() * eligibleStudents.length);
    const chosen = eligibleStudents[winnerIdx];

    const numSlices = eligibleStudents.length;
    const sliceAngle = 360 / numSlices;
    const sliceCenterAngle = (winnerIdx + 0.5) * sliceAngle;
    const targetBase = (360 - sliceCenterAngle) % 360;

    const fullSpins = (6 + Math.floor(Math.random() * 3)) * 360;
    const currentMod = wheelDegree % 360;
    let delta = targetBase - currentMod;
    if (delta < 0) delta += 360;

    const newFinalDegree = wheelDegree + fullSpins + delta;
    setWheelDegree(newFinalDegree);

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedWinner(chosen);
      setCalledStudentIds(prev => [...prev, chosen.id]);

      confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });

      if (questionBank.length > 0) {
        const nextQ = questionBank[currentWheelQuestionIdx % questionBank.length];
        setActiveQuestion(nextQ);
        setCurrentWheelQuestionIdx(prev => (prev + 1) % questionBank.length);
      }
    }, 4200);
  };

  const handleAnswerWheelQuestion = (choiceIdx: number) => {
    if (!activeQuestion || !selectedWinner || answeredQuestion) return;
    setSelectedAnswerIdx(choiceIdx);
    setAnsweredQuestion(true);

    const isCorrect = choiceIdx === activeQuestion.correctIndex;
    const pointsAwarded = activeQuestion.points || (activeQuestion.difficulty === 'expert' ? 50 : activeQuestion.difficulty === 'hard' ? 30 : activeQuestion.difficulty === 'medium' ? 20 : 10);

    if (isCorrect) {
      confetti({ particleCount: 120, spread: 90 });
      awardBonusToStudent(
        selectedWinner.id,
        pointsAwarded,
        `[Vòng quay gọi tên] Trả lời chính xác câu hỏi [${getDifficultyBadgeText(activeQuestion.difficulty)}]: "${activeQuestion.question}"`
      );
      recordGameResult({
        gameId: 'lucky_wheel',
        gameName: 'Vòng quay may mắn',
        date: new Date().toLocaleString('vi-VN'),
        topic: currentTopic,
        studentIds: [selectedWinner.id],
        studentNames: [selectedWinner.fullName],
        groupIds: [selectedWinner.groupId],
        scoreEarned: pointsAwarded,
        result: `Trả lời đúng: ${activeQuestion.options[choiceIdx]}`,
        note: `Nhận +${pointsAwarded}đ thưởng cá nhân & cộng điểm tổ ${selectedWinner.groupId}`,
      });
    } else {
      recordGameResult({
        gameId: 'lucky_wheel',
        gameName: 'Vòng quay may mắn',
        date: new Date().toLocaleString('vi-VN'),
        topic: currentTopic,
        studentIds: [selectedWinner.id],
        studentNames: [selectedWinner.fullName],
        groupIds: [selectedWinner.groupId],
        scoreEarned: 0,
        result: 'Chưa chính xác',
        note: `Đáp án đúng là: ${activeQuestion.options[activeQuestion.correctIndex]}`,
      });
    }
  };

  const getDifficultyBadge = (diff?: string) => {
    switch (diff) {
      case 'expert':
        return (
          <span className="bg-purple-100 text-purple-900 border border-purple-300 font-black px-2 py-0.5 rounded text-[10px]">
            ⚡ VẬN DỤNG CAO (+50đ)
          </span>
        );
      case 'hard':
        return (
          <span className="bg-rose-100 text-rose-900 border border-rose-300 font-bold px-2 py-0.5 rounded text-[10px]">
            🔥 MỨC KHÓ (+30đ)
          </span>
        );
      case 'medium':
        return (
          <span className="bg-sky-100 text-sky-900 border border-sky-300 font-bold px-2 py-0.5 rounded text-[10px]">
            💡 TRUNG BÌNH (+20đ)
          </span>
        );
      case 'easy':
      default:
        return (
          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 rounded text-[10px]">
            🌱 MỨC DỄ (+10đ)
          </span>
        );
    }
  };

  const getDifficultyBadgeText = (diff?: string) => {
    switch (diff) {
      case 'expert': return 'Vận dụng cao';
      case 'hard': return 'Mức Khó';
      case 'medium': return 'Trung bình';
      default: return 'Mức Dễ';
    }
  };

  // =========================================================================
  // GAME 2: 🔔 RUNG CHUÔNG VÀNG (CẢ LỚP CÙNG TRẢ LỜI, HẾT GIỜ HIỆN ĐÁP ÁN, QUA CÂU SAU)
  // =========================================================================
  const [bellRound, setBellRound] = useState(1);
  const [bellStarted, setBellStarted] = useState(false);
  const [bellTimer, setBellTimer] = useState(20);
  const [activeBellQuestion, setActiveBellQuestion] = useState<QuizQuestion | null>(questionBank[0] || null);
  const [bellShowAnswer, setBellShowAnswer] = useState(false);
  const [bellFinished, setBellFinished] = useState(false);

  useEffect(() => {
    let interval: any;
    if (bellStarted && !bellShowAnswer && !bellFinished && bellTimer > 0) {
      interval = setInterval(() => {
        setBellTimer(prev => prev - 1);
      }, 1000);
    } else if (bellTimer === 0 && !bellShowAnswer && bellStarted) {
      setBellShowAnswer(true);
      confetti({ particleCount: 50, spread: 60 });
    }
    return () => clearInterval(interval);
  }, [bellStarted, bellShowAnswer, bellTimer, bellFinished]);

  const startGoldenBell = () => {
    if (questionBank.length === 0) return;
    setBellRound(1);
    setBellStarted(true);
    setBellTimer(20);
    setBellShowAnswer(false);
    setBellFinished(false);
    setActiveBellQuestion(questionBank[0]);
  };

  const nextBellQuestion = () => {
    if (bellRound < questionBank.length) {
      const nextIdx = bellRound;
      setBellRound(prev => prev + 1);
      setActiveBellQuestion(questionBank[nextIdx]);
      setBellTimer(20);
      setBellShowAnswer(false);
    } else {
      confetti({ particleCount: 200, spread: 100 });
      setBellFinished(true);
      setBellStarted(false);
    }
  };

  const prevBellQuestion = () => {
    if (bellRound > 1) {
      const prevIdx = bellRound - 2;
      setBellRound(prev => prev - 1);
      setActiveBellQuestion(questionBank[prevIdx]);
      setBellTimer(20);
      setBellShowAnswer(false);
    }
  };

  // =========================================================================
  // GAME 3: 🌟 THÓI QUEN TỐT & TÍCH ĐIỂM HÀNG NGÀY (DAILY STREAK)
  // =========================================================================
  const habitOptions = [
    { id: 'h1', title: '📖 Đọc sách / Xem bài trước khi đến lớp', pts: 5, icon: '📚' },
    { id: 'h2', title: '⏰ Đi học đúng giờ, trang phục chỉnh tề', pts: 5, icon: '⏰' },
    { id: 'h3', title: '🙋‍♂️ Tích cực phát biểu xây dựng bài học', pts: 5, icon: '💡' },
    { id: 'h4', title: '🤝 Giúp đỡ bạn cùng tiến / Làm một việc tốt', pts: 5, icon: '❤️' },
    { id: 'h5', title: '🧹 Giữ gìn vệ sinh lớp học & bàn ghế sạch đẹp', pts: 5, icon: '🌿' },
  ];

  const rewardShopItems = [
    { id: 'r1', title: '🎟️ Vé miễn 1 buổi trực nhật lớp', cost: 50, desc: 'Được miễn phân công trực nhật 1 buổi bất kỳ', icon: '🎫' },
    { id: 'r2', title: '🪑 Quyền ưu tiên chọn vị trí ngồi tuần mới', cost: 100, desc: 'Được chọn bạn cùng bàn hoặc dãy bàn yêu thích', icon: '✨' },
    { id: 'r3', title: '✒️ Bút ghi điểm 10 may mắn của thầy Nam', cost: 60, desc: 'Bút ký phong thủy may mắn thi cử', icon: '🖊️' },
    { id: 'r4', title: '⭐ Giấy tuyên dương "Ngôi sao tuần" gửi gia đình', cost: 150, desc: 'Thư khen chính thức từ GVCN gửi về phụ huynh', icon: '📜' },
    { id: 'r5', title: '🏆 Cộng 2 điểm thi đua tuần cho Tổ', cost: 80, desc: 'Cống hiến điểm trực tiếp cho Tổ của mình', icon: '🏅' },
  ];

  const [selectedStudentForStreak, setSelectedStudentForStreak] = useState<string>(students[0]?.id || '');
  const [selectedHabits, setSelectedHabits] = useState<string[]>(['h1', 'h2']);
  const [streakSuccessMsg, setStreakSuccessMsg] = useState<string | null>(null);

  const handleStudentCheckIn = () => {
    if (!selectedStudentForStreak || selectedHabits.length === 0) return;
    const res = checkInDailyHabit(selectedStudentForStreak, selectedHabits);
    if (res.success) {
      confetti({ particleCount: 70, spread: 60 });
      setStreakSuccessMsg(res.message);
      setTimeout(() => setStreakSuccessMsg(null), 4000);
    } else {
      alert(res.message);
    }
  };

  const handleBatchCheckIn = () => {
    const ids = eligibleStudents.map(s => s.id);
    const count = batchCheckInDailyHabits(ids, selectedHabits);
    confetti({ particleCount: 80, spread: 70 });
    setStreakSuccessMsg(`🎉 Đã điểm danh thói quen thành công cho ${count} học sinh!`);
    setTimeout(() => setStreakSuccessMsg(null), 4000);
  };

  const handleRedeem = (rewardId: string, cost: number, title: string) => {
    if (!selectedStudentForStreak) return;
    const res = redeemStreakReward(selectedStudentForStreak, rewardId, cost, title);
    if (res.success) {
      confetti({ particleCount: 60, spread: 60 });
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  // =========================================================================
  // GAME 4: 💰 AI LÀ TRIỆU PHÚ (15 CÂU 3 MỐC, TRẢ LỜI SAI MẤT LƯỢT QUAY LẠI TỪ ĐẦU)
  // =========================================================================
  const MILLIONAIRE_LADDER = [
    { step: 15, prize: '150.000.000đ', bonus: 50, milestone: true },
    { step: 14, prize: '85.000.000đ', bonus: 40, milestone: false },
    { step: 13, prize: '60.000.000đ', bonus: 35, milestone: false },
    { step: 12, prize: '40.000.000đ', bonus: 30, milestone: false },
    { step: 11, prize: '30.000.000đ', bonus: 28, milestone: false },
    { step: 10, prize: '22.000.000đ', bonus: 25, milestone: true },
    { step: 9, prize: '14.000.000đ', bonus: 20, milestone: false },
    { step: 8, prize: '10.000.000đ', bonus: 18, milestone: false },
    { step: 7, prize: '6.000.000đ', bonus: 15, milestone: false },
    { step: 6, prize: '3.000.000đ', bonus: 12, milestone: false },
    { step: 5, prize: '2.000.000đ', bonus: 10, milestone: true },
    { step: 4, prize: '1.000.000đ', bonus: 8, milestone: false },
    { step: 3, prize: '600.000đ', bonus: 6, milestone: false },
    { step: 2, prize: '400.000đ', bonus: 4, milestone: false },
    { step: 1, prize: '200.000đ', bonus: 2, milestone: false },
  ];

  const [millionaireStep, setMillionaireStep] = useState(1);
  const [millionairePlayer, setMillionairePlayer] = useState<Student | null>(students[0] || null);
  const [millionaireLifelines, setMillionaireLifelines] = useState({
    fiftyFifty: true,
    askAudience: true,
    callFriend: true,
  });
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [audiencePoll, setAudiencePoll] = useState<{ [key: number]: number } | null>(null);
  const [friendAdvice, setFriendAdvice] = useState<string | null>(null);

  // Câu hỏi hiện tại của Ai Là Triệu Phú (theo mốc từ 1 đến 15)
  const currentMillionaireQ = questionBank[(millionaireStep - 1) % (questionBank.length || 1)];

  const handleMillionaireAnswer = (choiceIdx: number) => {
    if (!currentMillionaireQ || !millionairePlayer) return;

    if (choiceIdx === currentMillionaireQ.correctIndex) {
      confetti({ particleCount: 70, spread: 60 });

      // Nếu chinh phục câu 15 (Mốc triệu phú tối cao)
      if (millionaireStep === 15) {
        confetti({ particleCount: 250, spread: 100 });
        alert(`🏆 XUẤT SẮC! ${millionairePlayer.fullName} ĐÃ CHINH PHỤC CÂU SỐ 15 VÀ TRỞ THÀNH TRIỆU PHÚ TRI THỨC VỚI 150.000.000đ (+50đ thi đua)!`);
        awardBonusToStudent(millionairePlayer.id, 50, 'Quán quân 15 câu hỏi Ai Là Triệu Phú');
        recordGameResult({
          gameId: 'millionaire',
          gameName: 'Ai Là Triệu Phú',
          date: new Date().toLocaleString('vi-VN'),
          topic: currentTopic,
          studentIds: [millionairePlayer.id],
          studentNames: [millionairePlayer.fullName],
          groupIds: [millionairePlayer.groupId],
          scoreEarned: 50,
          result: 'Vượt qua 15/15 câu hỏi đỉnh cao',
          note: 'Xuất sắc nhận giải thưởng 150.000.000đ',
        });
        // Reset lại cho người chơi tiếp theo
        setMillionaireStep(1);
        setMillionaireLifelines({ fiftyFifty: true, askAudience: true, callFriend: true });
        setHiddenOptions([]);
        setAudiencePoll(null);
        setFriendAdvice(null);
      } else {
        // Đúng câu hỏi -> lên mốc tiếp theo
        setMillionaireStep(prev => prev + 1);
        setHiddenOptions([]);
        setAudiencePoll(null);
        setFriendAdvice(null);
      }
    } else {
      // TRẢ LỜI SAI: MẤT LƯỢT, CÂU HỎI QUAY LẠI TỪ ĐẦU!
      let guaranteedPrize = '0đ';
      let bonusPts = 0;

      if (millionaireStep > 10) {
        guaranteedPrize = '22.000.000đ (Mốc an toàn 2)';
        bonusPts = 25;
      } else if (millionaireStep > 5) {
        guaranteedPrize = '2.000.000đ (Mốc an toàn 1)';
        bonusPts = 10;
      }

      if (bonusPts > 0) {
        awardBonusToStudent(millionairePlayer.id, bonusPts, `Bảo toàn mốc an toàn Ai Là Triệu Phú (${guaranteedPrize})`);
      }

      alert(
        `❌ RẤT TIẾC! BẠN ĐÃ TRẢ LỜI SAI VÀ MẤT LƯỢT!\n\n` +
        `Đáp án đúng là: ${String.fromCharCode(65 + currentMillionaireQ.correctIndex)}. ${currentMillionaireQ.options[currentMillionaireQ.correctIndex]}\n` +
        `Phần thưởng bảo toàn: ${guaranteedPrize}.\n\n` +
        `Trò chơi sẽ QUAY LẠI TỪ ĐẦU (Câu số 1) cho bạn tiếp theo lên ghế nóng!`
      );

      // QUAY LẠI TỪ ĐẦU CÂU 1
      setMillionaireStep(1);
      setMillionaireLifelines({ fiftyFifty: true, askAudience: true, callFriend: true });
      setHiddenOptions([]);
      setAudiencePoll(null);
      setFriendAdvice(null);
    }
  };

  const useFiftyFifty = () => {
    if (!millionaireLifelines.fiftyFifty || !currentMillionaireQ) return;
    const wrongIndices = [0, 1, 2, 3].filter(idx => idx !== currentMillionaireQ.correctIndex);
    const toHide = wrongIndices.slice(0, 2);
    setHiddenOptions(toHide);
    setMillionaireLifelines(prev => ({ ...prev, fiftyFifty: false }));
  };

  const useAskAudience = () => {
    if (!millionaireLifelines.askAudience || !currentMillionaireQ) return;
    const correct = currentMillionaireQ.correctIndex;
    const poll: { [key: number]: number } = { 0: 10, 1: 12, 2: 15, 3: 13 };
    poll[correct] = 60;
    setAudiencePoll(poll);
    setMillionaireLifelines(prev => ({ ...prev, askAudience: false }));
  };

  const useCallFriend = () => {
    if (!millionaireLifelines.callFriend || !currentMillionaireQ) return;
    const randomBuddy = students.filter(s => s.id !== millionairePlayer?.id)[0] || students[1];
    setFriendAdvice(`Bạn ${randomBuddy?.fullName || 'bạn đồng hành'} gợi ý: "Mình chắc chắn 90% đáp án là ${String.fromCharCode(65 + currentMillionaireQ.correctIndex)}!"`);
    setMillionaireLifelines(prev => ({ ...prev, callFriend: false }));
  };

  // =========================================================================
  // GAME 5: 🧩 CHIẾC NÓN KỲ DIỆU (CÓ VÒNG QUAY, HIỆN CÂU HỎI, ĐOÁN 1 CHỮ HOẶC CẢ CÂU)
  // =========================================================================
  const [magicWheelDegree, setMagicWheelDegree] = useState(0);
  const [isMagicWheelSpinning, setIsMagicWheelSpinning] = useState(false);
  const [currentSliceReward, setCurrentSliceReward] = useState<typeof MAGIC_WHEEL_SLICES[0] | null>(MAGIC_WHEEL_SLICES[1]);
  const [revealedLetters, setRevealedLetters] = useState<string[]>([]);
  const [guessingLetter, setGuessingLetter] = useState<string>('');
  const [fullSolutionGuess, setFullSolutionGuess] = useState<string>('');
  const [magicWheelScore, setMagicWheelScore] = useState<number>(0);
  const [turnGroup, setTurnGroup] = useState<number>(1);

  // Quay Chiếc Nón Kỳ Diệu để xác định điểm số của lượt chơi
  const spinMagicWheel = () => {
    if (isMagicWheelSpinning) return;

    setIsMagicWheelSpinning(true);
    const chosenIdx = Math.floor(Math.random() * MAGIC_WHEEL_SLICES.length);
    const chosenSlice = MAGIC_WHEEL_SLICES[chosenIdx];

    const sliceAngle = 360 / MAGIC_WHEEL_SLICES.length;
    const sliceCenter = (chosenIdx + 0.5) * sliceAngle;
    const targetBase = (360 - sliceCenter) % 360;

    const fullSpins = (5 + Math.floor(Math.random() * 3)) * 360;
    const currentMod = magicWheelDegree % 360;
    let delta = targetBase - currentMod;
    if (delta < 0) delta += 360;

    const newDeg = magicWheelDegree + fullSpins + delta;
    setMagicWheelDegree(newDeg);

    setTimeout(() => {
      setIsMagicWheelSpinning(false);
      setCurrentSliceReward(chosenSlice);

      if (chosenSlice.type === 'lose') {
        alert(`Ô "MẤT LƯỢT"! Quyền đoán chữ chuyển sang Tổ tiếp theo!`);
        setTurnGroup(prev => (prev % 4) + 1);
      } else if (chosenSlice.type === 'double') {
        alert(`Ô "NHÂN ĐÔI ĐIỂM SỐ"! Hãy đoán chữ cái thật chính xác.`);
      } else if (chosenSlice.type === 'gift') {
        confetti({ particleCount: 60, spread: 60 });
        alert(`Ô "PHẦN THƯỞNG ĐẶC BIỆT"! Nhận ngay +300 điểm.`);
        setMagicWheelScore(prev => prev + 300);
      }
    }, 3800);
  };

  // Đoán 1 chữ cái
  const handleGuessSingleLetter = () => {
    const letter = guessingLetter.toUpperCase().trim();
    if (!letter) return;

    if (revealedLetters.includes(letter)) {
      alert(`Chữ cái '${letter}' đã được đoán trước đó!`);
      return;
    }

    const cleanWord = secretWord.toUpperCase();
    if (cleanWord.includes(letter)) {
      // Đếm số lần xuất hiện của chữ cái
      const count = cleanWord.split('').filter(c => c === letter).length;
      const ptsPerLetter = currentSliceReward?.type === 'double'
        ? 400
        : currentSliceReward?.val || 200;
      const totalEarned = ptsPerLetter * count;

      confetti({ particleCount: 60, spread: 60 });
      setRevealedLetters(prev => [...prev, letter]);
      setMagicWheelScore(prev => prev + totalEarned);
      awardBonusToGroup(turnGroup, Math.round(totalEarned / 20), `Đoán đúng ${count} chữ '${letter}' trong Chiếc Nón Kỳ Diệu`);

      alert(`🎉 CHÍNH XÁC! Có ${count} chữ '${letter}' trong ô chữ. Tổ ${turnGroup} nhận +${totalEarned} điểm nón!`);
    } else {
      alert(`❌ RẤT TIẾC! Không có chữ '${letter}' trong ô chữ. Quyền đoán chuyển sang Tổ tiếp theo.`);
      setTurnGroup(prev => (prev % 4) + 1);
    }
    setGuessingLetter('');
  };

  // Đoán và điền TOÀN BỘ ĐÁP ÁN
  const handleGuessFullSolution = () => {
    const rawGuess = fullSolutionGuess.toUpperCase().replace(/\s+/g, '').trim();
    const rawTarget = secretWord.toUpperCase().replace(/\s+/g, '').trim();

    if (!rawGuess) {
      alert('Vui lòng nhập đáp án của bạn!');
      return;
    }

    if (rawGuess === rawTarget) {
      confetti({ particleCount: 200, spread: 100 });
      // Lật mở toàn bộ các chữ cái
      const allChars = Array.from(new Set(rawTarget.split('')));
      setRevealedLetters(allChars);
      const victoryBonus = 1000;
      setMagicWheelScore(prev => prev + victoryBonus);
      awardBonusToGroup(turnGroup, 50, `Xuất sắc giải mã toàn bộ ô chữ Chiếc Nón Kỳ Diệu: "${secretWord}"`);

      alert(`🏆 XUẤT SẮC! TỔ ${turnGroup} ĐÃ GIẢI ĐƯỢC TOÀN BỘ Ô CHỮ: "${secretWord}" VÀ NHẬN +1000 ĐIỂM CHIẾC NÓN KỲ DIỆU (+50đ THI ĐUA)!`);
    } else {
      alert(`❌ RẤT TIẾC! Đáp án "${fullSolutionGuess}" chưa chính xác. Quyền chơi chuyển sang Tổ tiếp theo.`);
      setTurnGroup(prev => (prev % 4) + 1);
    }
    setFullSolutionGuess('');
  };

  const handleSyncToSheets = async () => {
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const res = await syncAllToGoogleSheets();
      if (res.success) {
        setSyncNotice('Đã lưu thành công Bảng Tích Điểm Hàng Ngày (Sheet TichDiem_DoiThuong) & Lịch Sử Trò Chơi lên Google Sheets!');
      } else {
        setSyncNotice(res.message || 'Chưa thể kết nối Google Sheets.');
      }
    } catch {
      setSyncNotice('Lỗi kết nối mạng.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner Vui tươi & 3D */}
      <div className="bg-gradient-to-r from-fuchsia-600 via-pink-600 to-indigo-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-white/20 border border-white/30 text-pink-100 text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
              <Gamepad2 className="w-4 h-4 text-yellow-300" />
              Menu 12 • Hoạt Động Giải Trí & Minigame Lớp Học
            </span>
            <span className="bg-amber-400 text-amber-950 font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-xs">
              Ngân Hàng Câu Hỏi Tích Hợp
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-2">
            <span>SÂN CHƠI TƯƠNG TÁC & RÈN LUYỆN TRI THỨC</span>
          </h2>

          <p className="text-pink-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Vòng quay có tên học sinh • Rung chuông vàng cả lớp cùng chơi • Ai là triệu phú 15 mốc chuẩn VTV3 • Chiếc nón kỳ diệu có vòng quay • Không lỗi font khi tải file.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 relative z-10">
          <button
            onClick={() => setActiveGame('ai_generator')}
            className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-amber-950 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-900" />
            <span>🤖 AI Soạn Câu Hỏi Mới</span>
          </button>

          <button
            onClick={exportToExcel}
            className="px-3.5 py-2.5 bg-white hover:bg-pink-50 text-slate-900 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={handleSyncToSheets}
            disabled={isSyncing}
            className="px-3.5 py-2.5 bg-pink-950/70 hover:bg-pink-900 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-white/25 transition-all shadow-md active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 text-yellow-300 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang lưu...' : 'Lưu Sheet Tích Điểm'}</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{syncNotice}</span>
        </div>
      )}

      {generateNotice && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900 flex items-center gap-2 shadow-xs animate-fadeIn">
          <Sparkles className="w-5 h-5 text-purple-600 shrink-0 animate-spin" />
          <span className="font-semibold">{generateNotice}</span>
        </div>
      )}

      {/* THANH CHỌN CHỦ ĐỀ NHANH & ĐỒNG BỘ CẢ 5 TRÒ CHƠI */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span className="font-black text-slate-800">Chủ đề câu hỏi đang dùng:</span>
          <span className="bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold px-3 py-1 rounded-xl">
            {currentTopic}
          </span>
          <span className="text-[11px] text-slate-500 font-semibold">
            ({questionBank.length} câu • Từ Dễ ➔ Khó • Đáp án ngẫu nhiên)
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-semibold mr-1">Đổi chủ đề mẫu:</span>
          {PRESET_TOPIC_BANKS.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectPresetTopic(p.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedPresetTopicId === p.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {p.category}
            </button>
          ))}
          <button
            onClick={() => setActiveGame('ai_generator')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold shadow-xs transition-all"
          >
            ✏️ Duyệt & Sửa ({questionBank.length})
          </button>
          <button
            onClick={handleDeployToGames}
            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white rounded-xl font-black shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span>🚀 TÍCH HỢP VÀO TRÒ CHƠI</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar for 5 Games + AI Generator + History */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'lucky_wheel', label: '1. Vòng Quay Gọi Tên HS', icon: '🎡', color: 'from-amber-500 to-orange-500' },
          { id: 'golden_bell', label: '2. Rung Chuông Vàng Cả Lớp', icon: '🔔', color: 'from-yellow-500 to-amber-600' },
          { id: 'daily_streak', label: '3. Tích Điểm Hàng Ngày (Streak)', icon: '🌟', color: 'from-pink-500 to-rose-600' },
          { id: 'millionaire', label: '4. Ai Là Triệu Phú (15 Mốc VTV3)', icon: '💰', color: 'from-indigo-600 to-blue-600' },
          { id: 'word_puzzle', label: '5. Chiếc Nón Kỳ Diệu', icon: '🧩', color: 'from-emerald-500 to-teal-600' },
          { id: 'ai_generator', label: '🤖 AI Soạn Câu Hỏi & Tài Liệu', icon: '✨', color: 'from-purple-600 to-fuchsia-600' },
          { id: 'history', label: '📜 Lịch Sử & Bảng Vàng', icon: '📊', color: 'from-slate-700 to-slate-900' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveGame(tab.id as any)}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs shrink-0 flex items-center gap-2 transition-all ${
              activeGame === tab.id
                ? 'bg-slate-900 text-white shadow-md scale-102'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filter by Group Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-fuchsia-600" />
          <span className="font-bold text-slate-700">Tích hợp học sinh tham gia trò chơi:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedGroupFilter(0)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              selectedGroupFilter === 0 ? 'bg-fuchsia-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cả lớp ({students.length} HS)
          </button>
          {[1, 2, 3, 4].map(g => (
            <button
              key={g}
              onClick={() => setSelectedGroupFilter(g)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedGroupFilter === g ? 'bg-fuchsia-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tổ {g} ({students.filter(s => s.groupId === g).length} HS)
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 🎡 VÒNG QUAY MAY MẮN – TRONG VÒNG QUAY PHẢI CÓ TÊN HỌC SINH */}
      {/* ========================================================================= */}
      {activeGame === 'lucky_wheel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="text-left">
                <span className="bg-amber-100 text-amber-900 font-bold px-3 py-0.5 rounded-full text-xs">
                  🎡 Vòng Quay Học Sinh Lớp Học
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Quay Gọi Tên Tương Tác & Thử Thách AI
                </h3>
                <p className="text-xs text-slate-500">
                  Hiển thị đầy đủ tên {eligibleStudents.length} học sinh trên các nan quạt
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={excludeCalled}
                    onChange={e => setExcludeCalled(e.target.checked)}
                    className="rounded text-fuchsia-600 focus:ring-fuchsia-500"
                  />
                  <span>Loại trừ bạn đã gọi ({calledStudentIds.length})</span>
                </label>
                {calledStudentIds.length > 0 && (
                  <button
                    onClick={() => setCalledStudentIds([])}
                    className="text-[11px] text-rose-600 hover:underline font-semibold"
                    title="Xóa danh sách đã gọi"
                  >
                    Đặt lại
                  </button>
                )}
              </div>
            </div>

            {/* SVG Interactive Wheel với TÊN HỌC SINH VẼ TRỰC TIẾP TRÊN TỪNG NAN QUẠT */}
            <div className="relative w-72 h-72 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px] flex items-center justify-center my-2">
              <div className="absolute -top-4 z-30 flex flex-col items-center filter drop-shadow-lg">
                <div className="w-5 h-5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 border-2 border-white shadow-xs" />
                <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[30px] border-t-rose-600 -mt-1.5" />
              </div>

              <div
                className="w-full h-full relative transition-transform ease-out"
                style={{
                  transform: `rotate(${wheelDegree}deg)`,
                  transitionDuration: isSpinning ? '4200ms' : '0ms',
                  transitionTimingFunction: 'cubic-bezier(0.12, 0.8, 0.2, 1)',
                }}
              >
                <svg
                  viewBox="0 0 440 440"
                  className="w-full h-full drop-shadow-2xl rounded-full"
                >
                  <defs>
                    <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="60%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#ca8a04" />
                    </radialGradient>
                    <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#facc15" />
                      <stop offset="50%" stopColor="#ca8a04" />
                      <stop offset="100%" stopColor="#eab308" />
                    </linearGradient>
                  </defs>

                  <circle cx="220" cy="220" r="218" fill="url(#rimGrad)" stroke="#78350f" strokeWidth="3" />
                  <circle cx="220" cy="220" r="206" fill="#1e293b" />

                  {eligibleStudents.map((st, i) => {
                    const N = eligibleStudents.length;
                    const sliceAngle = 360 / N;
                    const a1 = i * sliceAngle;
                    const a2 = (i + 1) * sliceAngle;
                    const midAngle = (i + 0.5) * sliceAngle;
                    const R = 204;
                    const cx = 220;
                    const cy = 220;

                    const rad1 = (a1 * Math.PI) / 180;
                    const rad2 = (a2 * Math.PI) / 180;
                    const x1 = cx + R * Math.sin(rad1);
                    const y1 = cy - R * Math.cos(rad1);
                    const x2 = cx + R * Math.sin(rad2);
                    const y2 = cy - R * Math.cos(rad2);
                    const largeArc = sliceAngle > 180 ? 1 : 0;

                    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                    const sliceColor = WHEEL_COLORS[i % WHEEL_COLORS.length];
                    const displayName = getSliceDisplayName(st, i, N);

                    return (
                      <g key={st.id}>
                        <path
                          d={pathData}
                          fill={sliceColor}
                          stroke="#ffffff"
                          strokeWidth={N > 25 ? '1' : '1.5'}
                        />

                        <g transform={`rotate(${midAngle}, ${cx}, ${cy})`}>
                          <text
                            x={cx}
                            y={cy - R * 0.65}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize={N <= 10 ? '13px' : N <= 20 ? '10.5px' : '9px'}
                            fontWeight="800"
                            transform={`rotate(-90, ${cx}, ${cy - R * 0.65})`}
                            style={{
                              textShadow: '0 1px 2px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.5)',
                              letterSpacing: '-0.3px',
                            }}
                          >
                            {displayName}
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {Array.from({ length: 24 }).map((_, bulbIdx) => {
                    const bAngle = (bulbIdx * 360) / 24;
                    const bRad = (bAngle * Math.PI) / 180;
                    const bx = 220 + 212 * Math.sin(bRad);
                    const by = 220 - 212 * Math.cos(bRad);
                    return (
                      <circle
                        key={bulbIdx}
                        cx={bx}
                        cy={by}
                        r="3.5"
                        fill={bulbIdx % 2 === 0 ? '#ffffff' : '#fef08a'}
                        stroke="#b45309"
                        strokeWidth="1"
                      />
                    );
                  })}

                  <circle cx="220" cy="220" r="42" fill="url(#hubGrad)" stroke="#ffffff" strokeWidth="4" />
                  <circle cx="220" cy="220" r="30" fill="#ffffff" />
                  <text
                    x="220"
                    y="225"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="900"
                    fill="#b45309"
                  >
                    🎲
                  </text>
                </svg>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
              <button
                onClick={spinWheel}
                disabled={isSpinning || eligibleStudents.length === 0}
                className={`px-8 py-3.5 rounded-2xl font-black text-sm text-white shadow-xl transition-all active:scale-95 flex items-center gap-2.5 ${
                  isSpinning
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:opacity-95 shadow-orange-500/30'
                }`}
              >
                <Play className="w-5 h-5 fill-white" />
                <span>{isSpinning ? 'Đang quay may mắn...' : `BẮT ĐẦU QUAY (${eligibleStudents.length} HS)`}</span>
              </button>
            </div>
          </div>

          {/* Winner Card & Question Modal Panel */}
          <div className="lg:col-span-5 space-y-4">
            {selectedWinner ? (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 p-6 rounded-3xl shadow-sm text-center space-y-4 animate-in zoom-in-95">
                <div className="inline-block relative">
                  <img
                    src={selectedWinner.avatar}
                    alt={selectedWinner.fullName}
                    className="w-20 h-20 rounded-full object-cover border-4 border-amber-400 shadow-md mx-auto"
                  />
                  <span className="absolute bottom-0 right-0 text-xl">🎉</span>
                </div>

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-amber-800 font-bold block">
                    HỌC SINH ĐƯỢC CHỌN LÊN BẢNG
                  </span>
                  <h4 className="text-xl font-black text-slate-900 mt-0.5">
                    {selectedWinner.fullName}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Mã HS: <strong>{selectedWinner.studentCode}</strong> • Tổ: <strong>{selectedWinner.groupId}</strong>
                  </p>
                </div>

                {activeQuestion ? (
                  <div className="bg-white p-5 rounded-2xl border border-amber-200 text-left space-y-3 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900 flex-wrap gap-1">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        CÂU HỎI THỬ THÁCH AI:
                      </span>
                      {getDifficultyBadge(activeQuestion.difficulty)}
                    </div>

                    <p className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                      {activeQuestion.question}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      {activeQuestion.options.map((opt, oIdx) => {
                        const isCorrect = oIdx === activeQuestion.correctIndex;
                        const isSelected = selectedAnswerIdx === oIdx;

                        return (
                          <button
                            key={oIdx}
                            disabled={answeredQuestion}
                            onClick={() => handleAnswerWheelQuestion(oIdx)}
                            className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition-all border ${
                              answeredQuestion
                                ? isCorrect
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                                  : isSelected
                                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                                : 'bg-slate-50 hover:bg-amber-100/60 border-slate-200 text-slate-800'
                            }`}
                          >
                            <span className="font-black mr-2 text-slate-600">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {answeredQuestion && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <span>💡 Lời giải chi tiết:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-600">
                          {activeQuestion.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-white/80 rounded-2xl border border-amber-200 text-xs text-amber-800">
                    <p className="font-semibold">Chưa có câu hỏi nào trong ngân hàng.</p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={spinWheel}
                    disabled={isSpinning}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs"
                  >
                    Quay Lượt Tiếp Theo
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-300 p-8 rounded-3xl text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-3xl mx-auto">
                  🎯
                </div>
                <h4 className="font-bold text-sm text-slate-800">
                  Sẵn sàng gọi tên học sinh!
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Nhấn nút "Bắt đầu quay" để chọn ngẫu nhiên 1 học sinh trả lời câu hỏi bám sát chủ đề {currentTopic}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 🔔 RUNG CHUÔNG VÀNG – CẢ LỚP CÙNG TRẢ LỜI, HẾT GIỜ HIỆN ĐÁP ÁN, QUA CÂU SAU */}
      {/* ========================================================================= */}
      {activeGame === 'golden_bell' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="bg-yellow-100 text-yellow-900 font-bold px-3 py-1 rounded-full text-xs">
                🔔 Hội Thi Cả Lớp Cùng Tham Gia
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Rung Chuông Vàng Toàn Lớp
              </h3>
              <p className="text-xs text-slate-500">
                Tất cả học sinh cùng suy nghĩ và giơ bảng • Hết giờ tự động hiện đáp án chuẩn • Nhấn nút chuyển câu sau
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!bellStarted ? (
                <button
                  onClick={startGoldenBell}
                  disabled={questionBank.length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Bắt Đầu Hội Thi (Câu 1)</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevBellQuestion}
                    disabled={bellRound <= 1}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Câu Trước</span>
                  </button>

                  <button
                    onClick={() => setBellShowAnswer(true)}
                    disabled={bellShowAnswer}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Hiện Đáp Án Ngay</span>
                  </button>

                  <button
                    onClick={nextBellQuestion}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                  >
                    <span>{bellRound < questionBank.length ? 'Qua Câu Sau ➔' : 'Tổng Kết Hội Thi 🏆'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Màn hình thi câu hỏi */}
          {activeBellQuestion ? (
            <div className="bg-gradient-to-br from-amber-50/70 via-yellow-50/40 to-orange-50/60 p-6 sm:p-8 rounded-3xl border border-amber-200 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-black text-sm text-amber-900 bg-amber-200/90 px-3.5 py-1 rounded-full shadow-xs">
                    CÂU {bellRound} / {questionBank.length}
                  </span>
                  {getDifficultyBadge(activeBellQuestion.difficulty)}
                </div>

                {/* Đồng hồ đếm ngược */}
                <div className="flex items-center gap-2 bg-white/90 px-4 py-1.5 rounded-2xl border border-amber-300 shadow-xs">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span className={`font-mono text-lg font-black ${bellTimer <= 5 ? 'text-rose-600 animate-bounce' : 'text-amber-900'}`}>
                    {bellTimer} giây
                  </span>
                </div>
              </div>

              {/* Nội dung câu hỏi */}
              <div className="p-6 bg-white rounded-2xl border border-amber-200 text-center shadow-xs">
                <h4 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                  {activeBellQuestion.question}
                </h4>
              </div>

              {/* 4 Đáp án A B C D */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeBellQuestion.options.map((opt, oIdx) => {
                  const isCorrect = oIdx === activeBellQuestion.correctIndex;
                  return (
                    <div
                      key={oIdx}
                      className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold transition-all flex items-center gap-3 ${
                        bellShowAnswer
                          ? isCorrect
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-black shadow-md ring-2 ring-emerald-500'
                            : 'bg-white/60 border-slate-200 text-slate-400'
                          : 'bg-white border-amber-200 text-slate-800 shadow-xs'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        bellShowAnswer && isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {bellShowAnswer && isCorrect && (
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Khi hết giờ hoặc bấm hiện đáp án */}
              {bellShowAnswer && (
                <div className="p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-300 text-xs sm:text-sm text-emerald-950 space-y-1.5 animate-fadeIn shadow-xs">
                  <div className="font-black text-base flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>
                      HẾT GIỜ! ĐÁP ÁN CHÍNH XÁC: {String.fromCharCode(65 + activeBellQuestion.correctIndex)}. {activeBellQuestion.options[activeBellQuestion.correctIndex]}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed pl-7">
                    💡 <strong>Lời giải chi tiết:</strong> {activeBellQuestion.explanation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Nhấn "Bắt đầu hội thi" để mở câu hỏi đầu tiên.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: 🌟 THÓI QUEN TỐT & TÍCH ĐIỂM HÀNG NGÀY (DAILY STREAK) */}
      {/* ========================================================================= */}
      {activeGame === 'daily_streak' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <span className="bg-pink-100 text-pink-900 font-bold px-3 py-1 rounded-full text-xs">
                🌟 Rèn Luyện Kỷ Luật Tự Giác
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                Tích Điểm Thói Quen Tốt Hàng Ngày (Streak)
              </h3>
              <p className="text-xs text-slate-500">
                Làm mỗi ngày để tích lũy chuỗi ngày liên tục • Điểm thưởng tăng theo cấp số nhân
              </p>
            </div>

            {streakSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{streakSuccessMsg}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Chọn học sinh ghi nhận:
              </label>
              <select
                value={selectedStudentForStreak}
                onChange={e => setSelectedStudentForStreak(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {eligibleStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.studentCode} - {s.fullName} (Tổ {s.groupId})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Các thói quen hoàn thành hôm nay:
              </label>
              <div className="space-y-2">
                {habitOptions.map(h => {
                  const checked = selectedHabits.includes(h.id);
                  return (
                    <div
                      key={h.id}
                      onClick={() => {
                        setSelectedHabits(prev =>
                          checked ? prev.filter(x => x !== h.id) : [...prev, h.id]
                        );
                      }}
                      className={`p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                        checked
                          ? 'bg-pink-50 border-pink-300 text-pink-950 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{h.icon}</span>
                        <span>{h.title}</span>
                      </div>
                      <span className="text-[11px] font-black text-pink-600">+{h.pts}đ</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleStudentCheckIn}
                className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md active:scale-95"
              >
                Tích Điểm Cá Nhân (+{selectedHabits.length * 5}đ)
              </button>

              <button
                onClick={handleBatchCheckIn}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Tích Cả Lớp
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-black text-sm text-slate-900">
                  🎁 Cửa Hàng Đổi Thưởng
                </h4>
                <p className="text-[11px] text-slate-500">
                  Đổi điểm thói quen lấy đặc quyền lớp học
                </p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {rewardShopItems.map(item => (
                <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <span>{item.icon}</span>
                      <span>{item.title}</span>
                    </span>
                    <span className="text-pink-600 font-black">{item.cost}đ</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                  <button
                    onClick={() => handleRedeem(item.id, item.cost, item.title)}
                    className="w-full py-1.5 bg-white hover:bg-pink-50 border border-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition-all"
                  >
                    Đổi Quà Ngay
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: 💰 AI LÀ TRIỆU PHÚ (15 CÂU, 3 MỐC 5-10-15 CHUẨN VTV3, SAI MẤT LƯỢT QUAY LẠI TỪ ĐẦU) */}
      {/* ========================================================================= */}
      {activeGame === 'millionaire' && (
        <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-900 text-indigo-200 font-black px-3 py-1 rounded-full text-xs">
                  💰 AI LÀ TRIỆU PHÚ • 15 CÂU 3 MỐC QUAN TRỌNG
                </span>
                <span className="bg-rose-900/60 border border-rose-500 text-rose-300 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                  Sai mất lượt & quay lại từ đầu
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-2">
                Trường Quay Ai Là Triệu Phú Tri Thức Lớp Học
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={millionairePlayer?.id || ''}
                onChange={e => {
                  const s = students.find(x => x.id === e.target.value) || null;
                  setMillionairePlayer(s);
                  setMillionaireStep(1);
                  setMillionaireLifelines({ fiftyFifty: true, askAudience: true, callFriend: true });
                }}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl"
              >
                {eligibleStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    Ghế nóng: {s.fullName} (Tổ {s.groupId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Vùng chơi chính */}
            <div className="lg:col-span-8 space-y-5">
              {/* Các quyền trợ giúp */}
              <div className="flex items-center gap-3">
                <button
                  onClick={useFiftyFifty}
                  disabled={!millionaireLifelines.fiftyFifty}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    millionaireLifelines.fiftyFifty
                      ? 'bg-indigo-900/80 border-indigo-400 text-white hover:bg-indigo-800'
                      : 'bg-slate-900 border-slate-800 text-slate-600 line-through'
                  }`}
                >
                  <span>50:50</span>
                </button>
                <button
                  onClick={useAskAudience}
                  disabled={!millionaireLifelines.askAudience}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    millionaireLifelines.askAudience
                      ? 'bg-indigo-900/80 border-indigo-400 text-white hover:bg-indigo-800'
                      : 'bg-slate-900 border-slate-800 text-slate-600 line-through'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Hỏi Ý Kiến Lớp</span>
                </button>
                <button
                  onClick={useCallFriend}
                  disabled={!millionaireLifelines.callFriend}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    millionaireLifelines.callFriend
                      ? 'bg-indigo-900/80 border-indigo-400 text-white hover:bg-indigo-800'
                      : 'bg-slate-900 border-slate-800 text-slate-600 line-through'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Gọi Bạn Thân</span>
                </button>
              </div>

              {friendAdvice && (
                <div className="p-3.5 bg-indigo-950 border border-indigo-500 rounded-2xl text-xs text-indigo-200 animate-fadeIn">
                  💡 {friendAdvice}
                </div>
              )}

              {audiencePoll && (
                <div className="p-3.5 bg-indigo-950 border border-indigo-500 rounded-2xl text-xs space-y-1 animate-fadeIn">
                  <div className="font-bold text-amber-400">📊 Kết quả biểu quyết của cả lớp:</div>
                  <div className="grid grid-cols-4 gap-2 text-center pt-1 font-bold">
                    {['A', 'B', 'C', 'D'].map((lbl, idx) => (
                      <div key={idx} className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                        {lbl}: {audiencePoll[idx] || 0}%
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentMillionaireQ ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-400 font-mono text-sm">
                      CÂU HỎI SỐ {millionaireStep} / 15
                    </span>
                    {getDifficultyBadge(currentMillionaireQ.difficulty)}
                  </div>

                  <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-indigo-950/80 border-2 border-indigo-600 rounded-3xl text-center text-sm sm:text-base font-bold shadow-xl leading-relaxed">
                    {currentMillionaireQ.question}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {currentMillionaireQ.options.map((opt, oIdx) => {
                      if (hiddenOptions.includes(oIdx)) {
                        return (
                          <div key={oIdx} className="p-4 bg-slate-900/30 border border-slate-800/40 rounded-2xl opacity-10" />
                        );
                      }

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleMillionaireAnswer(oIdx)}
                          className="p-4 bg-slate-900 hover:bg-indigo-950/90 border border-indigo-700/60 hover:border-amber-400 rounded-2xl text-left text-xs sm:text-sm font-semibold transition-all active:scale-98 flex items-center gap-3 shadow-md"
                        >
                          <span className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 font-black flex items-center justify-center text-xs">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Chưa có câu hỏi. Hãy bấm "AI Soạn Câu Hỏi" để tạo bộ câu hỏi.
                </div>
              )}
            </div>

            {/* Thang tiền thưởng 15 mốc (Giống trường quay VTV3) */}
            <div className="lg:col-span-4 bg-slate-900/90 p-4 rounded-3xl border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center pb-2 border-b border-slate-800">
                Thang Tiền Thưởng 15 Câu
              </div>
              <div className="space-y-1 text-xs font-mono">
                {MILLIONAIRE_LADDER.map(item => {
                  const isCurrent = item.step === millionaireStep;
                  const isPassed = item.step < millionaireStep;

                  return (
                    <div
                      key={item.step}
                      className={`px-3 py-1.5 rounded-xl flex items-center justify-between font-bold transition-all ${
                        isCurrent
                          ? 'bg-amber-400 text-slate-950 font-black shadow-md scale-102 ring-2 ring-amber-300'
                          : isPassed
                          ? 'bg-emerald-950/60 text-emerald-400'
                          : item.milestone
                          ? 'text-white bg-slate-800/80 font-black'
                          : 'text-slate-400 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{item.step}</span>
                        {item.milestone && <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{item.prize}</span>
                        <span className="text-[10px] opacity-75">+{item.bonus}đ</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: 🧩 CHIẾC NÓN KỲ DIỆU (CÓ VÒNG QUAY, HIỆN CÂU HỎI, ĐOÁN 1 CHỮ HOẶC CẢ CÂU) */}
      {/* ========================================================================= */}
      {activeGame === 'word_puzzle' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="bg-emerald-100 text-emerald-900 font-bold px-3 py-1 rounded-full text-xs">
                🧩 Vòng Quay Điểm Số & Ô Chữ Bí Mật
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Chiếc Nón Kỳ Diệu Tri Thức Lớp Học
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                Lượt quay hiện tại: <strong>Tổ {turnGroup}</strong>
              </div>
              <div className="text-xs font-black text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                Tổng điểm nón: <strong>{magicWheelScore} điểm</strong>
              </div>
            </div>
          </div>

          {/* VÙNG VÒNG QUAY ĐIỂM SỐ CHIẾC NÓN KỲ DIỆU */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Vòng quay SVG 12 nan quạt điểm số */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2">
                <div className="absolute -top-3 z-30 flex flex-col items-center filter drop-shadow-md">
                  <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[26px] border-t-rose-600" />
                </div>

                <div
                  className="w-full h-full relative transition-transform ease-out"
                  style={{
                    transform: `rotate(${magicWheelDegree}deg)`,
                    transitionDuration: isMagicWheelSpinning ? '3800ms' : '0ms',
                    transitionTimingFunction: 'cubic-bezier(0.12, 0.8, 0.2, 1)',
                  }}
                >
                  <svg viewBox="0 0 360 360" className="w-full h-full drop-shadow-xl rounded-full">
                    <circle cx="180" cy="180" r="176" fill="#facc15" stroke="#78350f" strokeWidth="4" />
                    {MAGIC_WHEEL_SLICES.map((slice, sIdx) => {
                      const N = MAGIC_WHEEL_SLICES.length;
                      const sAngle = 360 / N;
                      const a1 = sIdx * sAngle;
                      const a2 = (sIdx + 1) * sAngle;
                      const midA = (sIdx + 0.5) * sAngle;
                      const R = 170;

                      const rad1 = (a1 * Math.PI) / 180;
                      const rad2 = (a2 * Math.PI) / 180;
                      const x1 = 180 + R * Math.sin(rad1);
                      const y1 = 180 - R * Math.cos(rad1);
                      const x2 = 180 + R * Math.sin(rad2);
                      const y2 = 180 - R * Math.cos(rad2);

                      return (
                        <g key={sIdx}>
                          <path
                            d={`M 180 180 L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`}
                            fill={slice.color}
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                          <g transform={`rotate(${midA}, 180, 180)`}>
                            <text
                              x={180}
                              y={180 - R * 0.6}
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="11"
                              fontWeight="900"
                              transform={`rotate(-90, 180, ${180 - R * 0.6})`}
                              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                            >
                              {slice.label}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                    <circle cx="180" cy="180" r="32" fill="#ffffff" stroke="#eab308" strokeWidth="4" />
                    <text x="180" y="185" textAnchor="middle" fontSize="13" fontWeight="900" fill="#78350f">
                      NÓN
                    </text>
                  </svg>
                </div>
              </div>

              <button
                onClick={spinMagicWheel}
                disabled={isMagicWheelSpinning}
                className={`mt-2 px-6 py-2.5 rounded-2xl font-black text-xs text-white shadow-md transition-all active:scale-95 ${
                  isMagicWheelSpinning
                    ? 'bg-slate-400'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95'
                }`}
              >
                {isMagicWheelSpinning ? 'Đang quay nón...' : '🎡 BẤM QUAY ĐIỂM SỐ NÓN'}
              </button>

              {currentSliceReward && (
                <div className="mt-2 text-xs font-bold text-slate-700">
                  Lượt này: <span className="text-emerald-700 font-black">{currentSliceReward.label}</span>
                </div>
              )}
            </div>

            {/* HIỆN CÂU HỎI & VÙNG ĐOÁN Ô CHỮ */}
            <div className="lg:col-span-7 space-y-4">
              {/* Gợi ý & Câu hỏi câu đố */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-[11px] font-black text-emerald-800 uppercase flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                  CÂU HỎI GỢI Ý Ô CHỮ:
                </span>
                <p className="text-sm font-bold text-emerald-950 leading-relaxed">
                  {secretHint}
                </p>
              </div>

              {/* Hàng ô chữ bí mật */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap p-4 bg-slate-50 rounded-2xl border border-slate-200">
                {secretWord.split('').map((char, cIdx) => {
                  if (char === ' ') {
                    return <div key={cIdx} className="w-5" />;
                  }
                  const isRevealed = revealedLetters.includes(char.toUpperCase());
                  return (
                    <div
                      key={cIdx}
                      className={`w-10 h-12 sm:w-11 sm:h-13 rounded-xl border-2 flex items-center justify-center text-base sm:text-lg font-black shadow-xs transition-all ${
                        isRevealed
                          ? 'bg-emerald-500 border-emerald-600 text-white animate-in zoom-in-75'
                          : 'bg-white border-slate-300 text-transparent'
                      }`}
                    >
                      {isRevealed ? char : '?'}
                    </div>
                  );
                })}
              </div>

              {/* 2 Chế độ: Đoán 1 chữ cái HOẶC Đoán toàn bộ đáp án */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Đoán 1 chữ cái */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Cách 1: Đoán 1 chữ cái:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={1}
                      value={guessingLetter}
                      onChange={e => setGuessingLetter(e.target.value)}
                      placeholder="1 ký tự (A..Z)"
                      className="w-20 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-center text-sm font-black uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleGuessSingleLetter}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
                    >
                      Đoán Chữ Cái
                    </button>
                  </div>
                </div>

                {/* 2. Đoán toàn bộ đáp án */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Cách 2: Điền toàn bộ đáp án:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={fullSolutionGuess}
                      onChange={e => setFullSolutionGuess(e.target.value)}
                      placeholder="Nhập toàn bộ đáp án..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleGuessFullSolution}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
                    >
                      Đoán Cả Ô
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: 🤖 AI TỰ TẠO BỘ CÂU HỎI THEO CHỦ ĐỀ & TÀI LIỆU GV ĐƯA (ĐỘ KHÓ TĂNG DẦN) */}
      {/* ========================================================================= */}
      {activeGame === 'ai_generator' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20">
                <Bot className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  AI Studio Soạn Bộ Câu Hỏi Tức Thì
                </h3>
                <p className="text-xs text-slate-500">
                  Câu hỏi bám sát 100% chủ đề & nội dung tài liệu do giáo viên đưa • Mức độ khó tăng dần
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                Hiện có: {questionBank.length} câu hỏi sẵn sàng
              </span>
            </div>
          </div>

          {/* Form nhập liệu giáo viên */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                1. Chủ đề bài học hoặc chuyên đề:
              </label>
              <input
                type="text"
                value={currentTopic}
                onChange={e => setCurrentTopic(e.target.value)}
                placeholder="VD: Lịch sử Điện Biên Phủ, Văn học hiện đại, Hóa học Este, Sinh học Di truyền, Kỹ năng sống..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[11px] text-slate-400 font-semibold mr-1">Chuyên đề mẫu THPT:</span>
                {PRESET_TOPIC_BANKS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPresetTopic(p.id)}
                    title={p.name}
                    className={`text-[11px] px-3 py-1.5 rounded-xl font-bold transition-all border ${
                      selectedPresetTopicId === p.id
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    {p.category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>2. Nội dung bài học / Tài liệu chi tiết (Copy bỏ nội dung vô hoặc tải file không lỗi font):</span>
                </label>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.xlsx,.xls,.txt,.csv,.md,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải File Lên (.docx, .xlsx, .txt)</span>
                  </button>
                  {uploadedFileName && (
                    <button
                      onClick={() => {
                        setUploadedFileName(null);
                        setUploadedFileSize(null);
                        setCustomContent('');
                      }}
                      className="text-xs text-rose-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa file</span>
                    </button>
                  )}
                </div>
              </div>

              {uploadedFileName && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 font-semibold mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-purple-600" />
                    Đã tải file: <strong>{uploadedFileName}</strong> ({uploadedFileSize} • {customContent.length} ký tự)
                  </span>
                  <span className="text-emerald-700 font-bold text-[11px]">Đã trích xuất Unicode chuẩn không lỗi font!</span>
                </div>
              )}

              <textarea
                rows={5}
                value={customContent}
                onChange={e => setCustomContent(e.target.value)}
                placeholder="Dán hoặc copy nội dung bài giảng, văn bản, đoạn tài liệu hoặc đề cương vào đây... Gemini AI sẽ đọc hiểu văn bản này và đặt câu hỏi trắc nghiệm 100% bám sát tài liệu!"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Số lượng câu hỏi cần tạo:
                </label>
                <div className="flex items-center gap-2">
                  {[5, 10, 15, 20].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setNumQuestions(cnt)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                        numQuestions === cnt
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cnt} câu
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={progressiveDifficulty}
                    onChange={e => setProgressiveDifficulty(e.target.checked)}
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      Mức độ khó tăng dần cho các câu về sau (Khuyến nghị)
                    </span>
                    <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                      Câu đầu: Dễ (10đ) ➔ Câu giữa: Trung bình (20đ) ➔ Câu sau: Khó (30đ) ➔ Câu cuối: Vận dụng cao (50đ).
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <button
                onClick={handleGenerateQuestions}
                disabled={isGeneratingAI}
                className={`w-full py-4 rounded-2xl font-black text-sm text-white shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2.5 ${
                  isGeneratingAI
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:opacity-95 shadow-purple-600/30'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                <span>
                  {isGeneratingAI
                    ? 'Gemini AI đang phân tích tài liệu & soạn câu hỏi theo độ khó tăng dần...'
                    : '🚀 NHẤN NÚT TẠO CÂU HỎI BẰNG AI NGAY'}
                </span>
              </button>
            </div>
          </div>

          {/* BẢNG KIỂM DUYỆT, BIÊN TẬP VÀ NÚT TÍCH HỢP SANG TRÒ CHƠI */}
          <div className="pt-4 border-t border-slate-100">
            <QuestionManager
              questions={questionBank}
              onUpdateQuestions={setQuestionBank}
              onDeployToGames={handleDeployToGames}
              topicName={currentTopic}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: 📜 LỊCH SỬ THI ĐẤU & BẢNG VÀNG THÀNH TÍCH */}
      {/* ========================================================================= */}
      {activeGame === 'history' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Lịch Sử Quy Trình 5 Trò Chơi & Bảng Tích Điểm
              </h3>
              <p className="text-xs text-slate-500">
                Toàn bộ dữ liệu được ghi nhận minh bạch và sẵn sàng xuất Google Sheet
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncToSheets}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Đồng Bộ Ngay Lên Google Sheets</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Trò chơi</th>
                  <th className="py-2.5 px-3">Học sinh / Tổ</th>
                  <th className="py-2.5 px-3">Chủ đề</th>
                  <th className="py-2.5 px-3 text-center">Điểm</th>
                  <th className="py-2.5 px-3">Kết quả</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gameHistory.length > 0 ? (
                  gameHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500">{rec.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{rec.gameName}</td>
                      <td className="py-2.5 px-3 font-semibold text-fuchsia-700">{rec.studentNames.join(', ')}</td>
                      <td className="py-2.5 px-3 text-slate-600">{rec.topic || 'Kiến thức chung'}</td>
                      <td className="py-2.5 px-3 text-center font-black text-emerald-600">+{rec.scoreEarned}đ</td>
                      <td className="py-2.5 px-3 text-slate-800">{rec.result}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{rec.note}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Chưa có lịch sử trò chơi nào được ghi nhận. Hãy bắt đầu chơi các trò trên để ghi điểm!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL THÔNG BÁO TÍCH HỢP THÀNH CÔNG VÀO 5 TRÒ CHƠI */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 text-center shadow-2xl border-2 border-indigo-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-sm animate-bounce">
              🚀
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                ĐÃ TÍCH HỢP THÀNH CÔNG
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Bộ Câu Hỏi Đã Sẵn Sàng Trong 5 Trò Chơi!
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                Đã nạp <strong>{questionBank.length} câu hỏi</strong> chủ đề <em>"{currentTopic}"</em>. Câu hỏi và đáp án đã được xáo trộn ngẫu nhiên theo thứ tự Dễ ➔ Khó.
              </p>
            </div>

            {/* Danh sách 4 trò chơi đã nhận câu hỏi */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs">
              <button
                onClick={() => {
                  setShowDeployModal(false);
                  setActiveGame('lucky_wheel');
                }}
                className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all font-bold text-amber-900 flex items-center gap-2"
              >
                <span>🎡</span>
                <span>Vòng Quay Gọi Tên</span>
              </button>

              <button
                onClick={() => {
                  setShowDeployModal(false);
                  setActiveGame('golden_bell');
                }}
                className="p-3 rounded-2xl bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 transition-all font-bold text-yellow-950 flex items-center gap-2"
              >
                <span>🔔</span>
                <span>Rung Chuông Vàng</span>
              </button>

              <button
                onClick={() => {
                  setShowDeployModal(false);
                  setActiveGame('millionaire');
                }}
                className="p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all font-bold text-indigo-950 flex items-center gap-2"
              >
                <span>💰</span>
                <span>Ai Là Triệu Phú</span>
              </button>

              <button
                onClick={() => {
                  setShowDeployModal(false);
                  setActiveGame('word_puzzle');
                }}
                className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all font-bold text-emerald-950 flex items-center gap-2"
              >
                <span>🧩</span>
                <span>Chiếc Nón Kỳ Diệu</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowDeployModal(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Đóng & Bắt Đầu Chơi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
