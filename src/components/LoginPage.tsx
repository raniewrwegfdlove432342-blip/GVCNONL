import React, { useState } from 'react';
import {
  Lock,
  User,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Search,
  ChevronRight,
  GraduationCap,
  Users,
  Sparkles,
  School,
  ArrowRight,
  Shield,
  Clock,
  UserPlus,
  FileSpreadsheet,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AccountUser } from '../types';

export const LoginPage: React.FC = () => {
  const {
    accounts,
    classInfo,
    loginWithCredentials,
    registerTeacherAccount,
    googleSheetsConfig,
  } = useApp();

  // Page level mode: 'login' | 'register_gvcn'
  const [pageMode, setPageMode] = useState<'login' | 'register_gvcn'>('login');

  // Login sub-modes
  const [loginRole, setLoginRole] = useState<'gvcn' | 'student_cadre'>('gvcn');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPendingApprovalError, setIsPendingApprovalError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Quick picker states for student/cadre
  const [showPicker, setShowPicker] = useState(false);
  const [searchAccountQuery, setSearchAccountQuery] = useState('');
  const [pickerCategory, setPickerCategory] = useState<'all' | 'ban_can_su' | 'to_truong_pho' | 'hoc_sinh'>('all');

  // Registration Form states for GVCN
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regClassName, setRegClassName] = useState('12A1');
  const [regGradeLevel, setRegGradeLevel] = useState('Khối 12');
  const [regSchoolYear, setRegSchoolYear] = useState('2026 - 2027');
  const [regSheetUrl, setRegSheetUrl] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);
  const [regErrorMessage, setRegErrorMessage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRoleTabChange = (role: 'gvcn' | 'student_cadre') => {
    setLoginRole(role);
    setErrorMessage(null);
    setIsPendingApprovalError(false);
    setSuccessMessage(null);
    setPassword('');
    setUsername('');
    setShowPicker(false);
  };

  const targetAccount = accounts.find(a => a.username.toLowerCase() === username.trim().toLowerCase());

  const filteredAccounts = accounts.filter(acc => {
    if (acc.category === 'admin' || acc.role === 'admin' || acc.category === 'gvcn' || acc.role === 'gvcn' || acc.role === 'gvbm') return false;
    if (pickerCategory !== 'all' && acc.category !== pickerCategory) return false;
    if (searchAccountQuery.trim()) {
      const q = searchAccountQuery.toLowerCase().trim();
      return (
        acc.fullName.toLowerCase().includes(q) ||
        acc.username.toLowerCase().includes(q) ||
        acc.title.toLowerCase().includes(q) ||
        (acc.studentCode && acc.studentCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSelectAccount = (acc: AccountUser) => {
    setUsername(acc.username);
    setShowPicker(false);
    setErrorMessage(null);
    setIsPendingApprovalError(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsPendingApprovalError(false);
    setSuccessMessage(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMessage('Vui lòng nhập hoặc chọn Tên đăng nhập / Mã tài khoản!');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập Mật khẩu / Mã PIN!');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      let resolvedUsername = cleanUsername;
      const byCode = accounts.find(
        a => a.studentCode && a.studentCode.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (byCode) {
        resolvedUsername = byCode.username;
      }

      const result = loginWithCredentials(resolvedUsername, password);
      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.message);
        if (result.message.includes('chờ') || result.message.includes('duyệt')) {
          setIsPendingApprovalError(true);
        }
        return;
      }

      setSuccessMessage(result.message);
    }, 250);
  };

  const handleRegisterGVCN = (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMessage(null);
    setRegSuccessMessage(null);

    if (!regFullName.trim()) {
      setRegErrorMessage('Vui lòng nhập Họ và tên Giáo viên Chủ nhiệm!');
      return;
    }
    if (!regUsername.trim()) {
      setRegErrorMessage('Vui lòng nhập Tên đăng nhập!');
      return;
    }
    if (!regPin.trim() || regPin.trim().length < 3) {
      setRegErrorMessage('Mật khẩu / Mã PIN phải có tối thiểu 3 ký tự!');
      return;
    }
    if (!regClassName.trim()) {
      setRegErrorMessage('Vui lòng nhập Tên lớp phụ trách (ví dụ: 10A1, 12C7)!');
      return;
    }

    setIsRegistering(true);

    setTimeout(() => {
      const res = registerTeacherAccount({
        fullName: regFullName.trim(),
        username: regUsername.trim(),
        pin: regPin.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        className: regClassName.trim().toUpperCase(),
        gradeLevel: regGradeLevel,
        schoolYear: regSchoolYear,
        classSpreadsheetUrl: regSheetUrl.trim(),
      });
      setIsRegistering(false);

      if (!res.success) {
        setRegErrorMessage(res.message);
        return;
      }

      setRegSuccessMessage(res.message);
      // Auto pre-fill username for convenience
      setUsername(regUsername.trim());
    }, 300);
  };

  const handleUseDemoTemplate = () => {
    setRegSheetUrl(googleSheetsConfig.spreadsheetUrl || 'https://docs.google.com/spreadsheets/d/1szjTU26ybOsfMaanFjzXJMCs2JnqAnxWOLUAj_uISBA/edit');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 antialiased font-sans text-slate-100 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Right Floating Corner */}
      <div className="fixed top-3 right-3 sm:top-5 sm:right-6 lg:top-6 lg:right-8 z-30">
        <div className="flex flex-col items-end text-right bg-gradient-to-br from-slate-900/90 via-slate-900/85 to-indigo-950/90 border border-amber-400/45 hover:border-amber-300 px-4 sm:px-5 py-3 rounded-2xl backdrop-blur-xl shadow-2xl shadow-black/50 transition-all max-w-[340px] sm:max-w-md">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-amber-300 drop-shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>Bản quyền: Thầy Nguyễn Văn Nam</span>
          </div>
          <p className="text-[11px] sm:text-xs font-bold text-slate-200 mt-0.5">
            THPT Bình Sơn - Quảng Ngãi
          </p>
          <p className="text-[10px] sm:text-[11px] text-sky-200 font-medium mt-1 leading-snug">
            Chuyên cung cấp SKKN mới, KHKT hành vi, Viết app theo yêu cầu ...
          </p>
        </div>
      </div>

      {/* Main Form Center Box */}
      <main className="max-w-3xl mx-auto w-full my-auto py-4 sm:py-6 relative z-10 flex flex-col items-center">
        {/* Title Header */}
        <div className="w-full max-w-2xl mb-5 sm:mb-6 relative z-10 select-none animate-in fade-in zoom-in-95 duration-500">
          <div className="relative overflow-hidden bg-gradient-to-r from-rose-500/20 via-fuchsia-500/20 to-sky-500/25 border border-pink-400/35 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-2xl text-center">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-pink-500/25 via-purple-500/25 to-sky-500/25 border border-pink-300/40 text-pink-100 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Chuyển đổi số giáo dục & thi đua học đường</span>
            </div>

            <h1
              className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight relative z-10 py-1 whitespace-nowrap inline-block max-w-full"
              style={{
                color: '#fff',
                textShadow: `
                  0 1px 0 #f472b6,
                  0 2px 0 #ec4899,
                  0 3px 0 #db2777,
                  0 4px 0 #be185d,
                  0 5px 0 #9d174d,
                  0 6px 0 #831843,
                  0 7px 0 #0284c7,
                  0 8px 0 #0369a1,
                  0 10px 14px rgba(0, 0, 0, 0.7),
                  0 18px 30px rgba(219, 39, 119, 0.45),
                  0 0 35px rgba(244, 114, 182, 0.5)
                `,
                letterSpacing: '0.02em',
              }}
            >
              LỚP HỌC HẠNH PHÚC
            </h1>

            <p className="mt-1.5 text-xs sm:text-sm font-semibold text-pink-100 tracking-wide drop-shadow-md">
              Yêu Thương • Trách Nhiệm • Tích Cực • Cùng Nhau Tiến Bộ
            </p>
          </div>
        </div>

        {/* Outer Card with Navigation between Login and Register */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 text-slate-800 overflow-hidden transition-all w-full max-w-lg">
          {/* Main Top Tab Switch: Đăng nhập vs Đăng ký GVCN */}
          <div className="flex border-b border-slate-200 bg-slate-100">
            <button
              type="button"
              onClick={() => {
                setPageMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-3 px-4 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                pageMode === 'login'
                  ? 'bg-white text-indigo-700 border-b-2 border-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>Đăng Nhập</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPageMode('register_gvcn');
                setRegErrorMessage(null);
                setRegSuccessMessage(null);
              }}
              className={`flex-1 py-3 px-4 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                pageMode === 'register_gvcn'
                  ? 'bg-white text-blue-700 border-b-2 border-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>Đăng Ký GVCN Mới</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                Mở lớp
              </span>
            </button>
          </div>

          {/* VIEW 1: LOGIN FORM */}
          {pageMode === 'login' && (
            <div>
              {/* Role Switcher */}
              <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleRoleTabChange('gvcn')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginRole === 'gvcn'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Giáo viên (GVCN / GVBM)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleTabChange('student_cadre')}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginRole === 'student_cadre'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Học sinh / Cán sự</span>
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleLogin} className="p-6 space-y-4">
                {/* Target Account Badge if recognized */}
                {targetAccount && (
                  <div className="p-3 bg-blue-50/80 border border-blue-200/90 rounded-2xl flex items-center gap-3 animate-in fade-in">
                    <img
                      src={targetAccount.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={targetAccount.fullName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-blue-300 shadow-xs"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{targetAccount.fullName}</p>
                      <p className="text-[11px] text-blue-700 font-semibold truncate">
                        {targetAccount.title} {targetAccount.classAssigned ? `• Lớp ${targetAccount.classAssigned}` : ''}
                      </p>
                    </div>
                    {loginRole === 'student_cadre' && (
                      <button
                        type="button"
                        onClick={() => setShowPicker(true)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 underline font-bold shrink-0 cursor-pointer"
                      >
                        Đổi
                      </button>
                    )}
                  </div>
                )}

                {/* Student Quick Account Picker */}
                {loginRole === 'student_cadre' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Tài khoản học sinh:</label>
                      <button
                        type="button"
                        onClick={() => setShowPicker(prev => !prev)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{showPicker ? 'Đóng danh sách' : 'Chọn từ danh sách lớp'}</span>
                      </button>
                    </div>

                    {showPicker && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-in fade-in">
                        <div className="flex flex-wrap gap-1">
                          {[
                            { key: 'all', label: 'Tất cả' },
                            { key: 'ban_can_su', label: 'Ban cán sự' },
                            { key: 'to_truong_pho', label: 'Tổ trưởng' },
                            { key: 'hoc_sinh', label: 'Thành viên' },
                          ].map(tab => (
                            <button
                              key={tab.key}
                              type="button"
                              onClick={() => setPickerCategory(tab.key as any)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                pickerCategory === tab.key
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                          <input
                            type="text"
                            placeholder="Tìm tên, mã học sinh, tổ..."
                            value={searchAccountQuery}
                            onChange={e => setSearchAccountQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div className="max-h-44 overflow-y-auto space-y-1 divide-y divide-slate-100">
                          {filteredAccounts.map(acc => (
                            <button
                              key={acc.id}
                              type="button"
                              onClick={() => handleSelectAccount(acc)}
                              className="w-full text-left p-1.5 hover:bg-indigo-50 rounded-lg flex items-center justify-between transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <img src={acc.avatar} alt={acc.fullName} className="w-7 h-7 rounded-full object-cover shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-700">
                                    {acc.fullName}
                                  </p>
                                  <p className="text-[10px] text-slate-500 truncate">
                                    {acc.title} • {acc.studentCode || acc.username} {acc.groupId ? `(Tổ ${acc.groupId})` : ''}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Username input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {loginRole === 'gvcn'
                      ? 'Tên đăng nhập Giáo viên'
                      : 'Tên đăng nhập hoặc Mã học sinh'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder={
                        loginRole === 'gvcn'
                          ? 'Nhập tên đăng nhập...'
                          : 'Mã HS (ví dụ: HS01) hoặc tên đăng nhập...'
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Password input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Mật khẩu / Mã PIN bảo mật
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Nhập mã PIN / Mật khẩu..."
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all tracking-wider font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Prominent Pending Approval Alert */}
                {isPendingApprovalError && (
                  <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs text-amber-950 flex items-start gap-3 shadow-xs animate-in fade-in">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="font-extrabold text-amber-900 text-sm">Tài khoản đang chờ Ban Quản trị phê duyệt!</p>
                      <p className="text-amber-800 mt-0.5 leading-relaxed text-[11px]">
                        Theo quy định của nhà trường, sau khi đăng ký, tài khoản phải được <strong>Ban Quản trị (Admin) phê duyệt</strong> thì mới có thể đăng nhập vào không gian lớp. Vui lòng liên hệ nhà trường để được kích hoạt.
                      </p>
                    </div>
                  </div>
                )}

                {/* Generic Error Message */}
                {errorMessage && !isPendingApprovalError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{errorMessage}</p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="font-semibold">{successMessage}</p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    loginRole === 'gvcn'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-blue-500/25 active:scale-[0.98]'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 shadow-indigo-500/25 active:scale-[0.98]'
                  } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng nhập vào Hệ thống</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Help tip */}
                <div className="pt-2 text-center text-[11px] text-slate-500">
                  <span>Chưa có tài khoản GVCN? </span>
                  <button
                    type="button"
                    onClick={() => setPageMode('register_gvcn')}
                    className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                  >
                    Đăng ký mở không gian lớp mới ngay
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW 2: REGISTER GVCN FORM */}
          {pageMode === 'register_gvcn' && (
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <UserPlus className="w-5 h-5" />
                  <h3 className="font-black text-base text-slate-900">Đăng Ký Tài Khoản GVCN & Mở Lớp Riêng</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mỗi GVCN có một không gian riêng biệt lưu trữ theo Google Sheet lớp. Sau khi gửi, Admin sẽ phê duyệt để kích hoạt tài khoản.
                </p>
              </div>

              {/* Success alert */}
              {regSuccessMessage && (
                <div className="mb-4 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-950 text-xs flex items-start gap-3 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-emerald-900 text-sm">Gửi đơn đăng ký thành công!</p>
                    <p className="text-emerald-800 mt-1 leading-relaxed">
                      Tài khoản của thầy/cô đã được lưu vào hệ thống và đang ở trạng thái <strong>Chờ Admin phê duyệt</strong>.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPageMode('login')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs hover:bg-emerald-200 cursor-pointer shadow-xs"
                      >
                        Về trang Đăng nhập
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Error alert */}
              {regErrorMessage && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="font-semibold">{regErrorMessage}</p>
                </div>
              )}

              <form onSubmit={handleRegisterGVCN} className="space-y-3.5">
                {/* Full name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Họ và tên Giáo viên Chủ nhiệm: *
                  </label>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    placeholder="Ví dụ: Cô Nguyễn Thị Mai"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Username & PIN */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Tên đăng nhập: *
                    </label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      placeholder="gv_12a1, mainguyen..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Mật khẩu khởi tạo: *
                    </label>
                    <input
                      type="text"
                      value={regPin}
                      onChange={e => setRegPin(e.target.value)}
                      placeholder="Tạo mật khẩu..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Class name & Grade level */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Tên Lớp chủ nhiệm: *
                    </label>
                    <input
                      type="text"
                      value={regClassName}
                      onChange={e => setRegClassName(e.target.value)}
                      placeholder="VD: 10A1, 11B2, 12C7..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Khối lớp:
                    </label>
                    <select
                      value={regGradeLevel}
                      onChange={e => setRegGradeLevel(e.target.value)}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Khối 10">Khối 10</option>
                      <option value="Khối 11">Khối 11</option>
                      <option value="Khối 12">Khối 12</option>
                    </select>
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Số điện thoại:
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Email liên hệ:
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="gv@edu.vn"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Google Sheets Link for private workspace */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-900">
                      Link Google Sheet không gian riêng của lớp:
                    </label>
                    <button
                      type="button"
                      onClick={handleUseDemoTemplate}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                    >
                      Điền link mẫu có sẵn
                    </button>
                  </div>
                  <input
                    type="url"
                    value={regSheetUrl}
                    onChange={e => setRegSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Thầy/cô dán liên kết Google Sheet của lớp mình để toàn bộ dữ liệu học sinh, điểm danh, thi đua lưu vào file riêng.
                  </p>
                </div>

                {/* Notice */}
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-snug">
                  <strong>⚠️ Lưu ý quy trình kiểm duyệt:</strong> Sau khi gửi form đăng ký, tài khoản sẽ được chuyển tới Ban Giám hiệu / Admin trường học để duyệt. Khi Admin duyệt thành công, thầy/cô có thể đăng nhập ngay!
                </div>

                {/* Submit buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPageMode('login')}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-600/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isRegistering ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang gửi hồ sơ...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Gửi Hồ Sơ Đăng Ký GVCN</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* System notice footer */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400">
            Hệ thống Quản lý Nề nếp & Thi đua Lớp học • Chế độ Quản trị Đa lớp và Phân quyền Tầng bậc
          </p>
        </div>
      </main>

      {/* Footer Banner */}
      <footer className="max-w-6xl mx-auto w-full py-2.5 px-4 text-xs text-slate-400 border-t border-white/10 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <span className="italic">{classInfo.motto || 'Mỗi ngày cố gắng 1 chút, thành công ngày càng sẽ gần hơn'}</span>
        <span className="text-[11px] text-amber-300/90 font-medium">
          Tác giả: Thầy Nguyễn Văn Nam (THPT Bình Sơn - Quảng Ngãi)
        </span>
      </footer>
    </div>
  );
};
