import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Plus,
  Shuffle,
  Rocket,
  Check,
  X,
  Sparkles,
  HelpCircle,
  Award,
  Layers,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuizQuestion } from '../../../types';
import { shuffleQuestionChoices } from '../../../utils/quizShuffle';

interface QuestionManagerProps {
  questions: QuizQuestion[];
  onUpdateQuestions: (updated: QuizQuestion[]) => void;
  onDeployToGames: () => void;
  topicName: string;
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({
  questions,
  onUpdateQuestions,
  onDeployToGames,
  topicName,
}) => {
  // Modal chỉnh sửa câu hỏi
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form state
  const [formQuestion, setFormQuestion] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrectIndex, setFormCorrectIndex] = useState(0);
  const [formExplanation, setFormExplanation] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');
  const [formPoints, setFormPoints] = useState(20);

  // Mở modal sửa câu hỏi
  const handleOpenEdit = (q: QuizQuestion) => {
    setEditingQuestion(q);
    setFormQuestion(q.question);
    setFormOptions([...q.options]);
    setFormCorrectIndex(q.correctIndex);
    setFormExplanation(q.explanation || '');
    setFormDifficulty((q.difficulty as any) || 'medium');
    setFormPoints(q.points || 20);
    setIsAddingNew(false);
  };

  // Mở modal thêm câu hỏi mới
  const handleOpenAdd = () => {
    setIsAddingNew(true);
    setEditingQuestion(null);
    setFormQuestion('');
    setFormOptions(['', '', '', '']);
    setFormCorrectIndex(0);
    setFormExplanation('');
    setFormDifficulty('medium');
    setFormPoints(20);
  };

  // Lưu chỉnh sửa câu hỏi
  const handleSaveEdit = () => {
    if (!formQuestion.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi!');
      return;
    }
    if (formOptions.some(opt => !opt.trim())) {
      alert('Vui lòng điền đủ 4 phương án A, B, C, D!');
      return;
    }

    if (editingQuestion) {
      const updated = questions.map(q => {
        if (q.id === editingQuestion.id) {
          return {
            ...q,
            question: formQuestion.trim(),
            options: formOptions.map(o => o.trim()),
            correctIndex: formCorrectIndex,
            explanation: formExplanation.trim() || 'Đáp án chính xác.',
            difficulty: formDifficulty,
            points: formPoints,
            isApproved: true,
          };
        }
        return q;
      });
      onUpdateQuestions(updated);
      setEditingQuestion(null);
    } else if (isAddingNew) {
      const newQ: QuizQuestion = {
        id: questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1,
        question: formQuestion.trim(),
        options: formOptions.map(o => o.trim()),
        correctIndex: formCorrectIndex,
        explanation: formExplanation.trim() || 'Đáp án chính xác.',
        difficulty: formDifficulty,
        points: formPoints,
        isApproved: true,
      };
      onUpdateQuestions([...questions, newQ]);
      setIsAddingNew(false);
    }
  };

  // Xóa câu hỏi
  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng không?')) {
      const updated = questions.filter(q => q.id !== id);
      onUpdateQuestions(updated);
    }
  };

  // Duyệt 1 câu hỏi
  const handleToggleApprove = (id: number) => {
    const updated = questions.map(q =>
      q.id === id ? { ...q, isApproved: !q.isApproved } : q
    );
    onUpdateQuestions(updated);
  };

  // Phê duyệt tất cả câu hỏi
  const handleApproveAll = () => {
    const updated = questions.map(q => ({ ...q, isApproved: true }));
    onUpdateQuestions(updated);
    confetti({ particleCount: 50, spread: 50 });
  };

  // Xáo trộn ngẫu nhiên đáp án từng câu
  const handleShuffleChoices = (id: number) => {
    const updated = questions.map(q =>
      q.id === id ? shuffleQuestionChoices(q) : q
    );
    onUpdateQuestions(updated);
  };

  // Xáo trộn ngẫu nhiên toàn bộ đáp án
  const handleShuffleAllChoices = () => {
    const updated = questions.map(q => shuffleQuestionChoices(q));
    onUpdateQuestions(updated);
    confetti({ particleCount: 40, spread: 50 });
  };

  const approvedCount = questions.filter(q => q.isApproved).length;

  return (
    <div className="space-y-4">
      {/* BẢNG ĐIỀU KHIỂN & PHÊ DUYỆT CÂU HỎI */}
      <div className="p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 rounded-2xl border-2 border-indigo-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-sm text-indigo-950 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              BẢNG DUYỆT & BIÊN TẬP CÂU HỎI (GV KIỂM SOÁT 100%)
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Đã duyệt: {approvedCount}/{questions.length} câu
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Thầy cô kiểm tra, sửa nội dung/đáp án hoặc thêm câu hỏi mới. Sau khi duyệt, bấm <strong>"TÍCH HỢP BỘ CÂU HỎI VÀO TRÒ CHƠI"</strong> để áp dụng ngay.
          </p>
        </div>

        {/* CÁC NÚT THAO TÁC QUAN TRỌNG */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-purple-600" />
            <span>+ Thêm Câu Hỏi</span>
          </button>

          <button
            onClick={handleShuffleAllChoices}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            title="Đổi ngẫu nhiên vị trí các đáp án A, B, C, D"
          >
            <Shuffle className="w-4 h-4 text-indigo-600" />
            <span>Xáo Trộn Đáp Án</span>
          </button>

          <button
            onClick={handleApproveAll}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Duyệt Tất Cả</span>
          </button>

          {/* NÚT TÍCH HỢP TỪ NGÂN HÀNG SANG TRÒ CHƠI */}
          <button
            onClick={onDeployToGames}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all active:scale-95 ring-2 ring-purple-300"
          >
            <Rocket className="w-4 h-4 text-yellow-300 animate-bounce" />
            <span>🚀 TÍCH HỢP CÂU HỎI VÀO TRÒ CHƠI</span>
          </button>
        </div>
      </div>

      {/* DANH SÁCH TỪNG CÂU HỎI ĐỂ GIÁO VIÊN DUYỆT & SỬA */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {questions.map((q, idx) => {
          const isAppr = q.isApproved ?? true;

          return (
            <div
              key={q.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all text-xs space-y-3 ${
                isAppr
                  ? 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
                  : 'bg-amber-50/50 border-amber-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-xs text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-lg">
                    Câu {idx + 1}
                  </span>

                  {/* Độ khó badge */}
                  {q.difficulty === 'expert' && (
                    <span className="bg-purple-100 text-purple-900 border border-purple-300 font-black px-2 py-0.5 rounded text-[10px]">
                      ⚡ VẬN DỤNG CAO (+50đ)
                    </span>
                  )}
                  {q.difficulty === 'hard' && (
                    <span className="bg-rose-100 text-rose-900 border border-rose-300 font-bold px-2 py-0.5 rounded text-[10px]">
                      🔥 MỨC KHÓ (+30đ)
                    </span>
                  )}
                  {q.difficulty === 'medium' && (
                    <span className="bg-sky-100 text-sky-900 border border-sky-300 font-bold px-2 py-0.5 rounded text-[10px]">
                      💡 TRUNG BÌNH (+20đ)
                    </span>
                  )}
                  {(!q.difficulty || q.difficulty === 'easy') && (
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 rounded text-[10px]">
                      🌱 MỨC DỄ (+10đ)
                    </span>
                  )}

                  {/* Trạng thái duyệt */}
                  <button
                    onClick={() => handleToggleApprove(q.id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                      isAppr
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {isAppr ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    <span>{isAppr ? 'Đã duyệt' : 'Chờ GV duyệt'}</span>
                  </button>
                </div>

                {/* Các nút sửa / xóa / xáo trộn cho từng câu */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => handleShuffleChoices(q.id)}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg text-[11px] font-bold flex items-center gap-1"
                    title="Đổi ngẫu nhiên vị trí 4 đáp án A B C D"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Đổi đáp án</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa câu hỏi</span>
                  </button>

                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all"
                    title="Xóa câu hỏi này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Nội dung câu hỏi */}
              <p className="font-bold text-slate-900 text-sm leading-snug">
                {q.question}
              </p>

              {/* 4 Đáp án A B C D */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((opt, oIdx) => {
                  const isCorrect = oIdx === q.correctIndex;
                  return (
                    <div
                      key={oIdx}
                      className={`p-3 rounded-xl border flex items-center gap-2 ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && (
                        <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-black px-1.5 py-0.5 rounded">
                          ĐÚNG
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Lời giải thích */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] space-y-0.5">
                <span className="font-bold text-slate-800">💡 Giải thích chi tiết:</span>
                <p className="leading-relaxed">{q.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL SỬA / THÊM CÂU HỎI */}
      {(editingQuestion || isAddingNew) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">
                  {editingQuestion ? 'Biên Tập & Chỉnh Sửa Câu Hỏi' : 'Soạn Thảo Câu Hỏi Mới Thủ Công'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setIsAddingNew(false);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Nội dung câu hỏi */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nội dung câu hỏi:
                </label>
                <textarea
                  rows={3}
                  value={formQuestion}
                  onChange={e => setFormQuestion(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi rõ ràng, chính xác..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              {/* 4 Phương án A B C D */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">
                  4 Phương án lựa chọn (Tích chọn nút tròn cho đáp án đúng):
                </label>
                {formOptions.map((opt, oIdx) => {
                  const isChecked = formCorrectIndex === oIdx;

                  return (
                    <div
                      key={oIdx}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                        isChecked ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer font-black text-xs text-slate-700 px-1">
                        <input
                          type="radio"
                          name="correctIndexRadio"
                          checked={isChecked}
                          onChange={() => setFormCorrectIndex(oIdx)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{String.fromCharCode(65 + oIdx)}:</span>
                      </label>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const next = [...formOptions];
                          next[oIdx] = e.target.value;
                          setFormOptions(next);
                        }}
                        placeholder={`Phương án ${String.fromCharCode(65 + oIdx)}`}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {isChecked && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md shrink-0">
                          Đáp án ĐÚNG
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Độ khó & Điểm số */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Mức độ khó:
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={e => {
                      const d = e.target.value as any;
                      setFormDifficulty(d);
                      if (d === 'easy') setFormPoints(10);
                      else if (d === 'medium') setFormPoints(20);
                      else if (d === 'hard') setFormPoints(30);
                      else setFormPoints(50);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="easy">Dễ (Nhận biết - 10đ)</option>
                    <option value="medium">Trung bình (Thông hiểu - 20đ)</option>
                    <option value="hard">Khó (Vận dụng - 30đ)</option>
                    <option value="expert">Vận dụng cao (Đỉnh cao - 50đ)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Điểm thưởng:
                  </label>
                  <input
                    type="number"
                    value={formPoints}
                    onChange={e => setFormPoints(Number(e.target.value))}
                    min={5}
                    max={100}
                    step={5}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Lời giải thích */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Lời giải chi tiết & Căn cứ bài học:
                </label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={e => setFormExplanation(e.target.value)}
                  placeholder="Giải thích vì sao đáp án này đúng để học sinh hiểu sâu sắc..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            {/* Nút lưu */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setIsAddingNew(false);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-md active:scale-95"
              >
                Lưu Thay Đổi & Đánh Dấu Đã Duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
