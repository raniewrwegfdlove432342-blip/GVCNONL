import {
  Student,
  AttendanceRecord,
  ViolationRecord,
  RewardRecord,
  AcademicRecord,
  CleaningDuty,
  LaborActivity,
  ExtracurricularActivity,
  StudentSelfEvaluation,
  WeeklyGroupSummary,
  CompetitionSettings,
  ActivityLog,
  UserRole,
  AccountUser,
  GoogleSheetsConfig,
  ClassInfo,
} from '../types';

export const MASTER_GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxnoetIi5SJdok9kLXC520cfxDq6pNuCgJkOTcFAtfqJ272GaT2Z-bLY6-HS3StAdI/exec';

export const INITIAL_CLASS_INFO: ClassInfo = {
  className: '12C7',
  schoolYear: '2026 - 2027',
  homeroomTeacher: 'Giáo viên Chủ nhiệm',
  teacherPhone: '',
  teacherEmail: '',
  totalStudents: 0,
  totalGroups: 4,
  roomNumber: '',
  motto: 'Mỗi ngày cố gắng 1 chút, thành công ngày càng sẽ gần hơn',
  gradeLevel: 'Khối 12',
  semester: 'Học kỳ I',
  schoolName: 'Trường THPT Bình Sơn',
  bannerUrl: '',
};

export const INITIAL_GOOGLE_SHEETS_CONFIG: GoogleSheetsConfig = {
  spreadsheetId: '1szjTU26ybOsfMaanFjzXJMCs2JnqAnxWOLUAj_uISBA',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1szjTU26ybOsfMaanFjzXJMCs2JnqAnxWOLUAj_uISBA/edit',
  apiKey: '',
  appScriptUrl: MASTER_GOOGLE_APPS_SCRIPT_URL,
  autoSync: true,
  lastSyncedAt: new Date().toISOString(),
  syncStatus: 'idle',
  syncError: null,
  enabledSheets: {
    thongTinLopGVCN: true,
    taiKhoan: true,
    thongTinLop: true,
    danhSachLop: true,
    diemDanh: true,
    viPham: true,
    khenThuong: true,
    hocTap: true,
    trucNhat: true,
    laoDong: true,
    ngoaiKhoa: true,
    tuDanhGia: true,
    tongHopThiDua: true,
  },
};

export const GUEST_ROLE: UserRole = {
  role: 'khach',
  title: 'Khách (Chế độ xem)',
  name: 'Khách chưa đăng nhập',
  accountId: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
};

export const INITIAL_ROLES: UserRole[] = [
  GUEST_ROLE,
  {
    role: 'admin',
    title: 'Quản trị viên Hệ thống',
    name: 'Ban Giám Hiệu / Quản Trị Viên',
    accountId: 'acc_admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    role: 'gvcn',
    title: 'Giáo viên Chủ nhiệm',
    name: 'Giáo viên Chủ nhiệm',
    accountId: 'acc_gvcn',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    classAssigned: '12C7',
  },
];

export const INITIAL_ACCOUNTS: AccountUser[] = [
  {
    id: 'acc_admin',
    username: 'admin',
    pin: 'admin123',
    fullName: 'Quản Trị Viên Hệ Thống',
    role: 'admin',
    title: 'Quản trị viên Hệ thống',
    category: 'admin',
    email: 'admin@truongthpt.edu.vn',
    phone: '0901234567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    permissions: [
      'Toàn quyền quản trị hệ thống',
      'Phê duyệt tài khoản GVCN',
      'Quản lý danh sách giáo viên toàn trường',
      'Quản lý học sinh tất cả các lớp',
      'Truy cập và điều phối không gian các lớp',
      'Cấu hình Google Sheets Master'
    ],
    status: 'active',
    lastLoginAt: '',
    notes: 'Tài khoản Quản trị viên tối cao của toàn trường',
  },
  {
    id: 'acc_gvcn',
    username: 'gvcn',
    pin: '123456',
    fullName: 'Giáo viên Chủ nhiệm',
    role: 'gvcn',
    title: 'Giáo viên Chủ nhiệm',
    category: 'gvcn',
    email: '',
    phone: '',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    classAssigned: '12C7',
    classSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1szjTU26ybOsfMaanFjzXJMCs2JnqAnxWOLUAj_uISBA/edit',
    classSpreadsheetId: '1szjTU26ybOsfMaanFjzXJMCs2JnqAnxWOLUAj_uISBA',
    registeredAt: '2026-09-01T07:00:00.000Z',
    approvedAt: '2026-09-01T08:00:00.000Z',
    approvedBy: 'admin',
    permissions: [
      'Toàn quyền quản trị lớp',
      'Quản lý học sinh & cán sự',
      'Tạo tài khoản và phân quyền GVBM',
      'Cấu hình thi đua',
      'Xuất/Nhập dữ liệu',
      'Đồng bộ Google Sheets không gian riêng',
    ],
    status: 'active',
    lastLoginAt: '',
    notes: 'Tài khoản GVCN lớp 12C7',
  },
];

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_SETTINGS: CompetitionSettings = {
  baseScore: 100,
  attendanceWeight: 20,
  academicWeight: 25,
  disciplineWeight: 20,
  hygieneWeight: 15,
  activityWeight: 10,
  solidarityWeight: 10,
  showRankToStudents: true,
  warningThresholds: {
    maxAbsences: 3,
    maxLate: 3,
    maxViolations: 2,
    minScoreWarning: 85,
  },
};

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_VIOLATIONS: ViolationRecord[] = [];
export const INITIAL_REWARDS: RewardRecord[] = [];
export const INITIAL_ACADEMIC: AcademicRecord[] = [];
export const INITIAL_DUTIES: CleaningDuty[] = [];
export const INITIAL_LABOR: LaborActivity[] = [];
export const INITIAL_EXTRACURRICULAR: ExtracurricularActivity[] = [];
export const INITIAL_EVALUATIONS: StudentSelfEvaluation[] = [];
export const INITIAL_GROUP_SUMMARIES: WeeklyGroupSummary[] = [];
export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];
