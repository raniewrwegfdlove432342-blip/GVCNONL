import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Lock,
  Unlock,
  Key,
  School,
  FileSpreadsheet,
  Sparkles,
  Search,
  BookOpen,
  Trash2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Eye,
  Check,
  Copy,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AccountUser } from '../../types';
import * as XLSX from 'xlsx';

export const AdminPortalView: React.FC<{ setActiveTab?: (tab: any) => void }> = ({ setActiveTab }) => {
  const {
    accounts,
    students,
    classInfo,
    approveTeacherAccount,
    rejectTeacherAccount,
    toggleAccountStatus,
    adminResetPin,
    switchClassWorkspace,
    deleteAccount,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'gvcn' | 'gvbm' | 'pending' | 'active' | 'locked'>('all');
  const [selectedTeacherForPin, setSelectedTeacherForPin] = useState<AccountUser | null>(null);
  const [newPinInput, setNewPinInput] = useState('123456');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filter teacher accounts
  const teacherAccounts = useMemo(() => {
    return accounts.filter(a => a.role === 'admin' || a.role === 'gvcn' || a.role === 'gvbm' || a.category === 'admin' || a.category === 'gvcn' || a.category === 'gvbm');
  }, [accounts]);

  // Pending registrations
  const pendingRegistrations = useMemo(() => {
    return accounts.filter(a => a.status === 'pending');
  }, [accounts]);

  // Counts
  const gvcnList = useMemo(() => teacherAccounts.filter(a => a.role === 'gvcn'), [teacherAccounts]);
  const gvbmList = useMemo(() => teacherAccounts.filter(a => a.role === 'gvbm'), [teacherAccounts]);
  const uniqueClassesCount = useMemo(() => {
    const set = new Set<string>();
    gvcnList.forEach(g => {
      if (g.classAssigned) set.add(g.classAssigned);
    });
    if (classInfo.className) set.add(classInfo.className);
    return Math.max(set.size, 1);
  }, [gvcnList, classInfo.className]);

  const filteredTeachers = useMemo(() => {
    return teacherAccounts.filter(acc => {
      if (filterRole === 'gvcn' && acc.role !== 'gvcn') return false;
      if (filterRole === 'gvbm' && acc.role !== 'gvbm') return false;
      if (filterRole === 'pending' && acc.status !== 'pending') return false;
      if (filterRole === 'active' && acc.status !== 'active') return false;
      if (filterRole === 'locked' && acc.status !== 'locked') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          acc.fullName.toLowerCase().includes(q) ||
          acc.username.toLowerCase().includes(q) ||
          (acc.phone && acc.phone.includes(q)) ||
          (acc.classAssigned && acc.classAssigned.toLowerCase().includes(q)) ||
          (acc.subject && acc.subject.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [teacherAccounts, filterRole, searchQuery]);

  const handleApprove = (id: string) => {
    const res = approveTeacherAccount(id);
    if (res.success) {
      setActionSuccessMsg(res.message);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleReject = (id: string) => {
    if (window.confirm('Thầy/cô có chắc chắn muốn từ chối và xóa yêu cầu đăng ký này?')) {
      const res = rejectTeacherAccount(id);
      if (res.success) {
        setActionSuccessMsg(res.message);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    }
  };

  const handleToggleLock = (id: string) => {
    const res = toggleAccountStatus(id);
    if (res.success) {
      setActionSuccessMsg(res.message);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherForPin) return;
    const res = await adminResetPin(selectedTeacherForPin.id, newPinInput);
    if (res.success) {
      setActionSuccessMsg(res.message);
      setSelectedTeacherForPin(null);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      alert(res.message);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEnterWorkspace = async (teacher: AccountUser) => {
    if (!teacher.classSpreadsheetUrl && !teacher.classAssigned) {
      alert('Tài khoản này chưa có liên kết Google Sheet không gian lớp!');
      return;
    }
    const res = await switchClassWorkspace(teacher);
    if (res.success) {
      setActionSuccessMsg(res.message);
      if (setActiveTab) {
        setActiveTab('dashboard');
      }
    } else {
      alert(res.message);
    }
  };

  // Export HeThongGiaoVien to Excel
  const handleExportTeacherRegistryExcel = () => {
    const rows = teacherAccounts.map((t, idx) => ({
      'STT': idx + 1,
      'Mã Giáo Viên': t.id,
      'Tên Đăng Nhập': t.username,
      'Mật Khẩu / PIN': t.pin,
      'Họ Và Tên': t.fullName,
      'Vai Trò': t.role === 'admin' ? 'Quản trị viên' : t.role === 'gvcn' ? 'Giáo viên Chủ nhiệm' : 'Giáo viên Bộ môn',
      'Lớp Phụ Trách': t.classAssigned || '',
      'Môn Giảng Dạy': t.subject || (t.role === 'gvcn' ? 'Chủ nhiệm' : ''),
      'GVCN Cấp Quyền': t.grantedByGVCNName || (t.role === 'admin' ? 'Hệ thống' : 'Admin duyệt'),
      'Quyền Hạn Chi Tiết': Array.isArray(t.permissions) ? t.permissions.join(', ') : '',
      'Trạng Thái': t.status === 'active' ? 'Đã kích hoạt' : t.status === 'pending' ? 'Chờ duyệt' : 'Bị khóa',
      'Link Google Sheet Lớp': t.classSpreadsheetUrl || '',
      'Số Điện Thoại': t.phone || '',
      'Email': t.email || '',
      'Ngày Đăng Ký': t.registeredAt ? new Date(t.registeredAt).toLocaleString('vi-VN') : '',
      'Ngày Duyệt': t.approvedAt ? new Date(t.approvedAt).toLocaleString('vi-VN') : '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HeThongGiaoVien');
    XLSX.writeFile(wb, `DanhSach_GiaoVien_ToanTruong_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/40">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-bold mb-3 backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Cổng Quản Trị Hệ Thống Tối Cao • Super Admin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Quản Trị Nhà Trường & Duyệt Giáo Viên
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Quản lý toàn bộ tài khoản đăng ký giáo viên, kiểm duyệt link Google Sheet không gian riêng của từng lớp, phân bổ quyền hạn và giám sát học sinh toàn trường.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportTeacherRegistryExcel}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Sheet Quản Lý Giáo Viên (Excel)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-xs text-emerald-700 hover:text-emerald-900 underline font-bold">
            Đóng
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Đơn chờ duyệt</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{pendingRegistrations.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Cần Admin kích hoạt</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Số lớp học</p>
            <p className="text-2xl font-black text-blue-700 mt-0.5">{uniqueClassesCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Không gian riêng biệt</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng giáo viên</p>
            <p className="text-2xl font-black text-indigo-700 mt-0.5">{teacherAccounts.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{gvcnList.length} GVCN • {gvbmList.length} GVBM</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Học sinh lớp hiện tại</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{students.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Lớp {classInfo.className || '12C7'}</p>
          </div>
        </div>
      </div>

      {/* SECTION 1: PENDING APPROVAL REQUESTS */}
      {pendingRegistrations.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 border-2 border-amber-300 rounded-3xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Yêu Cầu Đăng Ký Chờ Phê Duyệt ({pendingRegistrations.length})
                </h2>
                <p className="text-xs text-amber-900 font-medium">
                  GVCN đăng ký tài khoản cần được Admin kiểm tra và duyệt để có thể đăng nhập.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRegistrations.map(req => (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={req.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                        alt={req.fullName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-xs"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{req.fullName}</h3>
                        <p className="text-xs font-semibold text-amber-700">
                          Đăng ký GVCN Lớp: <span className="font-black text-slate-900 uppercase">{req.classAssigned || 'Chưa đặt'}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Tài khoản: <strong>{req.username}</strong> • PIN: <strong>{req.pin}</strong>
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      Chờ duyệt
                    </span>
                  </div>

                  {/* Contact & Sheet link info */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    <p className="flex items-center justify-between">
                      <span className="text-slate-500">Số điện thoại:</span>
                      <strong className="text-slate-800">{req.phone || 'Chưa cung cấp'}</strong>
                    </p>
                    {req.email && (
                      <p className="flex items-center justify-between">
                        <span className="text-slate-500">Email:</span>
                        <strong className="text-slate-800">{req.email}</strong>
                      </p>
                    )}
                    {req.registeredAt && (
                      <p className="flex items-center justify-between">
                        <span className="text-slate-500">Thời gian đăng ký:</span>
                        <span className="text-slate-700">{new Date(req.registeredAt).toLocaleString('vi-VN')}</span>
                      </p>
                    )}
                    {req.classSpreadsheetUrl && (
                      <div className="pt-1.5 border-t border-slate-200/60">
                        <span className="text-slate-500 block mb-1">Google Sheet không gian lớp:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            readOnly
                            value={req.classSpreadsheetUrl}
                            className="flex-1 text-[11px] font-mono bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 truncate"
                          />
                          <a
                            href={req.classSpreadsheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 shrink-0"
                            title="Mở bảng tính Google Sheets"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Approve / Reject buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-700/20 active:scale-95 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Phê Duyệt Ngay</span>
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Từ chối</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: ALL TEACHER ACCOUNTS REGISTRY TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Danh Sách Giáo Viên Toàn Trường ({teacherAccounts.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Toàn bộ tài khoản Admin, Giáo viên Chủ nhiệm (GVCN) và Giáo viên Bộ môn (GVBM)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'gvcn', label: 'GVCN' },
                { key: 'gvbm', label: 'GVBM' },
                { key: 'pending', label: 'Chờ duyệt' },
                { key: 'active', label: 'Hoạt động' },
                { key: 'locked', label: 'Đã khóa' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterRole(f.key as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    filterRole === f.key
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm tên, lớp, môn, SĐT..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Giáo viên</th>
                <th className="py-3 px-4">Tài khoản & PIN</th>
                <th className="py-3 px-4">Vai trò / Lớp</th>
                <th className="py-3 px-4">Môn / Người cấp</th>
                <th className="py-3 px-4">Google Sheet Không Gian Lớp</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map(t => {
                const isAdminAcc = t.role === 'admin';
                const isGvcnAcc = t.role === 'gvcn';
                const isGvbmAcc = t.role === 'gvbm';

                return (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Teacher info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={t.avatar || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150'}
                          alt={t.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{t.fullName}</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {t.phone || t.email || 'Chưa cập nhật SĐT'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Account credentials */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <p className="text-indigo-700 font-bold">{t.username}</p>
                      <p className="text-slate-500 text-[10px]">PIN: {t.pin}</p>
                    </td>

                    {/* Role & Class */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isAdminAcc
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : isGvcnAcc
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isAdminAcc ? 'Quản trị viên' : isGvcnAcc ? 'Giáo viên CN' : 'Giáo viên BM'}
                        </span>
                        {t.classAssigned && (
                          <p className="text-slate-800 font-bold text-[11px]">Lớp: {t.classAssigned}</p>
                        )}
                      </div>
                    </td>

                    {/* Subject / Granted By */}
                    <td className="py-3 px-4">
                      {isGvbmAcc ? (
                        <div>
                          <p className="font-bold text-slate-800">{t.subject || 'Chưa rõ'}</p>
                          <p className="text-[10px] text-slate-500">Cấp bởi: {t.grantedByGVCNName || 'GVCN'}</p>
                        </div>
                      ) : isGvcnAcc ? (
                        <span className="text-slate-500 text-[11px]">Chủ nhiệm lớp</span>
                      ) : (
                        <span className="text-purple-700 text-[11px] font-semibold">Toàn trường</span>
                      )}
                    </td>

                    {/* Google Sheet Link */}
                    <td className="py-3 px-4 max-w-[200px]">
                      {t.classSpreadsheetUrl ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            readOnly
                            value={t.classSpreadsheetUrl}
                            className="w-28 text-[10px] font-mono bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 truncate"
                          />
                          <button
                            onClick={() => handleCopy(t.classSpreadsheetUrl!, t.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            title="Sao chép liên kết"
                          >
                            {copiedId === t.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a
                            href={t.classSpreadsheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-blue-600 hover:text-blue-800 rounded"
                            title="Mở Google Sheet"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Dùng Sheet mặc định</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : t.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {t.status === 'active' ? 'Hoạt động' : t.status === 'pending' ? 'Chờ duyệt' : 'Đã khóa'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* If pending: Approve button */}
                        {t.status === 'pending' ? (
                          <button
                            onClick={() => handleApprove(t.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Phê duyệt ngay"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Duyệt</span>
                          </button>
                        ) : (
                          <>
                            {/* Enter class workspace */}
                            {t.classSpreadsheetUrl && (
                              <button
                                onClick={() => handleEnterWorkspace(t)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] flex items-center gap-1 border border-blue-200 cursor-pointer"
                                title="Vào không gian lớp này"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Vào lớp</span>
                              </button>
                            )}

                            {/* Reset PIN */}
                            <button
                              onClick={() => {
                                setSelectedTeacherForPin(t);
                                setNewPinInput('123456');
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Cấp lại PIN / Mật khẩu"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Lock */}
                            {!isAdminAcc && (
                              <button
                                onClick={() => handleToggleLock(t.id)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  t.status === 'active'
                                    ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                    : 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={t.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                              >
                                {t.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              </button>
                            )}

                            {/* Delete */}
                            {!isAdminAcc && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Xác nhận xóa tài khoản giáo viên ${t.fullName}?`)) {
                                    deleteAccount(t.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: RESET TEACHER PIN */}
      {selectedTeacherForPin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Cấp Lại Mã PIN / Mật Khẩu</h3>
                <p className="text-xs text-slate-500">{selectedTeacherForPin.fullName} ({selectedTeacherForPin.username})</p>
              </div>
            </div>

            <form onSubmit={handleResetPinSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mã PIN mới:</label>
                <input
                  type="text"
                  value={newPinInput}
                  onChange={e => setNewPinInput(e.target.value)}
                  placeholder="Nhập mã PIN mới..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeacherForPin(null)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                >
                  Lưu Mật Khẩu Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
