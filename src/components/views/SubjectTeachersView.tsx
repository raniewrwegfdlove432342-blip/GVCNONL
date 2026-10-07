import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  BookOpen,
  Key,
  Trash2,
  Edit2,
  CheckCircle2,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  Phone,
  Mail,
  UserCheck2,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AccountUser } from '../../types';
import * as XLSX from 'xlsx';

const COMMON_SUBJECTS = [
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lý',
  'Giáo dục công dân',
  'Tin học',
  'Công nghệ',
  'Giáo dục quốc phòng',
  'Giáo dục thể chất',
  'Âm nhạc',
  'Mỹ thuật',
];

const AVAILABLE_PERMISSIONS = [
  { id: 'view_students', label: 'Xem danh sách học sinh & sơ đồ lớp', desc: 'Được xem hồ sơ học sinh và sơ đồ chỗ ngồi' },
  { id: 'manage_grades', label: 'Nhập & chỉnh sửa điểm học tập bộ môn', desc: 'Được ghi điểm và nhận xét môn học mình phụ trách' },
  { id: 'record_violations', label: 'Ghi nhận vi phạm / nề nếp trong tiết', desc: 'Được ghi nhận lỗi vi phạm của học sinh trong giờ học' },
  { id: 'record_rewards', label: 'Ghi nhận việc tốt / khen thưởng tiết học', desc: 'Được cộng điểm việc tốt, phát biểu xuất sắc' },
  { id: 'take_attendance', label: 'Điểm danh học sinh tiết học', desc: 'Được điểm danh chuyên cần trong tiết dạy bộ môn' },
  { id: 'view_reports', label: 'Xem báo cáo thi đua tuần & tháng', desc: 'Được xem tổng hợp xếp hạng thi đua của lớp' },
];

export const SubjectTeachersView: React.FC = () => {
  const {
    accounts,
    classInfo,
    currentUserRole,
    createSubjectTeacher,
    updateSubjectTeacher,
    deleteSubjectTeacher,
    adminResetPin,
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<AccountUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('123456');
  const [subject, setSubject] = useState('Toán học');
  const [customSubject, setCustomSubject] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'view_students',
    'manage_grades',
    'record_violations',
  ]);

  // Reset PIN modal
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [targetPinTeacher, setTargetPinTeacher] = useState<AccountUser | null>(null);
  const [newPin, setNewPin] = useState('123456');

  // List of subject teachers for this class (GVCN chỉ xem GVBM do chính mình tạo ra)
  const classSubjectTeachers = useMemo(() => {
    if (currentUserRole.role === 'admin') {
      return accounts.filter(a => a.role === 'gvbm');
    }
    return accounts.filter(a => 
      a.role === 'gvbm' && (
        a.grantedByGVCNId === currentUserRole.accountId ||
        a.grantedByGVCNName === currentUserRole.name ||
        (currentUserRole.classAssigned && a.classAssigned === currentUserRole.classAssigned)
      )
    );
  }, [accounts, currentUserRole]);

  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return classSubjectTeachers;
    const q = searchQuery.toLowerCase().trim();
    return classSubjectTeachers.filter(t => 
      t.fullName.toLowerCase().includes(q) ||
      t.username.toLowerCase().includes(q) ||
      (t.subject && t.subject.toLowerCase().includes(q)) ||
      (t.phone && t.phone.includes(q))
    );
  }, [classSubjectTeachers, searchQuery]);

  const handleOpenCreate = () => {
    setEditingTeacher(null);
    setFullName('');
    setUsername('');
    setPin('123456');
    setSubject('Toán học');
    setCustomSubject('');
    setPhone('');
    setEmail('');
    setSelectedPermissions(['view_students', 'manage_grades', 'record_violations']);
    setModalOpen(true);
  };

  const handleOpenEdit = (teacher: AccountUser) => {
    setEditingTeacher(teacher);
    setFullName(teacher.fullName);
    setUsername(teacher.username);
    setPin(teacher.pin);
    const sub = teacher.subject || 'Toán học';
    if (COMMON_SUBJECTS.includes(sub)) {
      setSubject(sub);
      setCustomSubject('');
    } else {
      setSubject('other');
      setCustomSubject(sub);
    }
    setPhone(teacher.phone || '');
    setEmail(teacher.email || '');
    setSelectedPermissions(Array.isArray(teacher.permissions) ? teacher.permissions : []);
    setModalOpen(true);
  };

  const togglePermission = (permLabel: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permLabel) ? prev.filter(p => p !== permLabel) : [...prev, permLabel]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = subject === 'other' ? customSubject.trim() : subject;
    if (!finalSubject) {
      alert('Vui lòng chọn hoặc nhập tên môn giảng dạy!');
      return;
    }

    if (editingTeacher) {
      const res = updateSubjectTeacher(editingTeacher.id, {
        fullName: fullName.trim(),
        subject: finalSubject,
        phone: phone.trim(),
        email: email.trim(),
        permissions: selectedPermissions,
      });
      if (res.success) {
        setSuccessMsg(res.message);
        setModalOpen(false);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert(res.message);
      }
    } else {
      const res = createSubjectTeacher({
        fullName: fullName.trim(),
        username: username.trim(),
        pin: pin.trim() || '123456',
        phone: phone.trim(),
        email: email.trim(),
        subject: finalSubject,
        permissions: selectedPermissions,
      });
      if (res.success) {
        setSuccessMsg(res.message);
        setModalOpen(false);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert(res.message);
      }
    }
  };

  const handleDelete = (teacher: AccountUser) => {
    if (window.confirm(`Xác nhận thu hồi tài khoản GVBM của thầy/cô ${teacher.fullName} (Môn: ${teacher.subject})?`)) {
      const res = deleteSubjectTeacher(teacher.id);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    }
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPinTeacher) return;
    const res = await adminResetPin(targetPinTeacher.id, newPin);
    if (res.success) {
      setSuccessMsg(res.message);
      setPinModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      alert(res.message);
    }
  };

  const handleExportExcel = () => {
    const rows = classSubjectTeachers.map((t, idx) => ({
      'STT': idx + 1,
      'Họ Và Tên': t.fullName,
      'Môn Giảng Dạy': t.subject || '',
      'Tên Đăng Nhập': t.username,
      'Mật Khẩu / PIN': t.pin,
      'Lớp Phụ Trách': classInfo.className || '',
      'Số Điện Thoại': t.phone || '',
      'Email': t.email || '',
      'Quyền Hạn Được Cấp': Array.isArray(t.permissions) ? t.permissions.join(', ') : '',
      'GVCN Cấp Quyền': t.grantedByGVCNName || currentUserRole.name || 'GVCN',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSach_GVBM');
    XLSX.writeFile(wb, `DanhSach_GVBM_Lop_${classInfo.className || '12C7'}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-blue-100 text-xs font-bold mb-3 backdrop-blur-xs">
            <UserCheck2 className="w-4 h-4 text-blue-200" />
            <span>Quyền Hạn Giáo Viên Chủ Nhiệm (GVCN)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Quản Lý Giáo Viên Bộ Môn (GVBM)
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl leading-relaxed">
            GVCN có quyền cấp tài khoản riêng và phân quyền cụ thể cho từng giáo viên bộ môn giảng dạy tại lớp {classInfo.className}. Mỗi GVBM chỉ có thể thao tác đúng theo các quyền hạn được cấp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Danh Sách Excel</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-950/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cấp Tài Khoản GVBM Mới</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metrics & Search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs font-bold text-slate-700">
            Tổng số: <span className="text-indigo-600 font-black text-sm">{classSubjectTeachers.length}</span> GVBM
          </div>
          <div className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs font-bold text-slate-700">
            Lớp: <span className="text-blue-700 font-black">{classInfo.className || '12C7'}</span>
          </div>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên, môn, tài khoản..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filteredTeachers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 border border-indigo-200 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-bold text-base text-slate-900">Chưa có tài khoản Giáo viên bộ môn nào</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Thầy/cô GVCN có thể bấm nút <strong>"+ Cấp Tài Khoản GVBM Mới"</strong> để tạo tài khoản cho các giáo viên dạy Toán, Văn, Ngoại ngữ... của lớp mình.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm GVBM ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeachers.map(teacher => (
            <div
              key={teacher.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
            >
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={teacher.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                      alt={teacher.fullName}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {teacher.fullName}
                      </h3>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Môn: {teacher.subject || 'Bộ môn'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Login credentials box */}
                <div className="mt-3.5 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans text-[11px]">Tên đăng nhập:</span>
                    <strong className="text-indigo-700">{teacher.username}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans text-[11px]">Mật khẩu / PIN:</span>
                    <strong className="text-slate-800">{teacher.pin}</strong>
                  </div>
                </div>

                {/* Contact info */}
                {(teacher.phone || teacher.email) && (
                  <div className="mt-2.5 space-y-1 text-[11px] text-slate-600">
                    {teacher.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{teacher.phone}</span>
                      </p>
                    )}
                    {teacher.email && (
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{teacher.email}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Permissions badges */}
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Quyền hạn được cấp:</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(teacher.permissions) && teacher.permissions.length > 0 ? (
                      teacher.permissions.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-semibold"
                        >
                          ✓ {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-[10px] italic">Chỉ xem thông tin</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                <button
                  onClick={() => {
                    setTargetPinTeacher(teacher);
                    setNewPin('123456');
                    setPinModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  <span>Đổi PIN</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(teacher)}
                    className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                    title="Chỉnh sửa quyền hạn"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(teacher)}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                    title="Thu hồi tài khoản"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CREATE / EDIT SUBJECT TEACHER */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingTeacher ? 'Cập Nhật Tài Khoản GVBM' : 'Cấp Tài Khoản GVBM Mới'}
                  </h3>
                  <p className="text-xs text-slate-500">Lớp {classInfo.className || '12C7'}</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Full name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Họ và tên Giáo viên: *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ví dụ: Thầy Trần Quang Huy"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Môn giảng dạy: *</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {COMMON_SUBJECTS.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    <option value="other">Môn học khác...</option>
                  </select>

                  {subject === 'other' && (
                    <input
                      type="text"
                      value={customSubject}
                      onChange={e => setCustomSubject(e.target.value)}
                      placeholder="Nhập tên môn..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Username & PIN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tên đăng nhập: *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="gv_toan, huy_tq..."
                    disabled={!!editingTeacher}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mật khẩu PIN: *</label>
                  <input
                    type="text"
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Số điện thoại:</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="gv@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Permissions Checkboxes */}
              <div>
                <label className="text-xs font-bold text-slate-900 block mb-2">
                  Phân quyền hạn thao tác trong lớp:
                </label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 max-h-48 overflow-y-auto">
                  {AVAILABLE_PERMISSIONS.map(p => {
                    const isChecked = selectedPermissions.includes(p.label);
                    return (
                      <label
                        key={p.id}
                        className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(p.label)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{p.label}</p>
                          <p className="text-[11px] text-slate-500">{p.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit / Cancel */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 cursor-pointer transition-all active:scale-95"
                >
                  {editingTeacher ? 'Cập Nhật Tài Khoản' : 'Cấp Tài Khoản GVBM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PIN */}
      {pinModalOpen && targetPinTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Cấp Lại Mã PIN GVBM</h3>
                <p className="text-xs text-slate-500">{targetPinTeacher.fullName} ({targetPinTeacher.subject})</p>
              </div>
            </div>

            <form onSubmit={handleResetPinSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mã PIN mới:</label>
                <input
                  type="text"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="Nhập mã PIN..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                >
                  Lưu PIN Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
