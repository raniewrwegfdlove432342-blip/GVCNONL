export type RoleType = 
  | 'admin'
  | 'gvcn'
  | 'gvbm'
  | 'khach'
  | 'lop_truong' 
  | 'lop_pho_hoc_tap' 
  | 'lop_pho_lao_dong' 
  | 'lop_pho_van_the_my' 
  | 'bi_thu_chi_doan'
  | 'pho_bi_thu'
  | 'thu_quy'
  | 'to_truong' 
  | 'to_pho'
  | 'hoc_sinh';

export interface UserRole {
  role: RoleType;
  title: string;
  name: string;
  studentId?: string;
  groupId?: number;
  avatar?: string;
  accountId?: string;
  classAssigned?: string;
  subject?: string;
}

export interface AccountUser {
  id: string;
  username: string;
  pin: string; // Mật khẩu / mã PIN
  fullName: string;
  role: RoleType;
  title: string;
  category: 'admin' | 'gvcn' | 'gvbm' | 'ban_can_su' | 'to_truong_pho' | 'hoc_sinh' | 'khach';
  studentId?: string;
  studentCode?: string;
  groupId?: number;
  email: string;
  phone: string;
  avatar: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'pending' | 'locked';
  lastLoginAt?: string;
  notes?: string;
  isCustomPin?: boolean; // Đánh dấu đã đổi mật khẩu riêng
  passwordChangedAt?: string; // Thời gian đổi mật khẩu gần nhất
  // Thông tin mở rộng quản trị đa lớp và không gian riêng
  subject?: string; // Môn giảng dạy (đối với GVBM)
  classAssigned?: string; // Lớp phụ trách (VD: 12C7, 10A1...)
  classSpreadsheetUrl?: string; // Link Google Sheet lưu không gian riêng của lớp đó
  classSpreadsheetId?: string; // ID Google Sheet riêng của lớp
  grantedByGVCNId?: string; // ID của GVCN đã cấp tài khoản này (cho GVBM)
  grantedByGVCNName?: string; // Tên của GVCN cấp quyền
  registeredAt?: string; // Ngày đăng ký
  approvedAt?: string; // Ngày admin duyệt
  approvedBy?: string; // Tên admin duyệt
}

export interface MasterTeacherRecord {
  id: string;
  code: string;
  username: string;
  pin: string;
  fullName: string;
  phone: string;
  email: string;
  role: 'admin' | 'gvcn' | 'gvbm';
  className: string;
  subject?: string;
  grantedByGVCN?: string;
  permissions: string[];
  status: 'pending' | 'active' | 'locked';
  classSpreadsheetUrl: string;
  registeredAt: string;
  approvedAt?: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  apiKey: string; // Personal Google API key
  appScriptUrl: string; // Google Apps Script Web App URL for direct multi-sheet read/write
  autoSync: boolean;
  lastSyncedAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  enabledSheets: {
    heThongGiaoVien?: boolean;
    thongTinLopGVCN?: boolean;
    taiKhoan: boolean;
    thongTinLop: boolean;
    danhSachLop: boolean;
    diemDanh: boolean;
    viPham: boolean;
    khenThuong: boolean;
    hocTap: boolean;
    trucNhat: boolean;
    laoDong: boolean;
    ngoaiKhoa: boolean;
    tuDanhGia: boolean;
    tongHopThiDua: boolean;
  };
}

export interface GVCNBackupSnapshot {
  id: string;
  createdAt: string;
  className: string;
  homeroomTeacher: string;
  schoolYear: string;
  totalStudents: number;
  note?: string;
  type: 'manual' | 'auto_sync' | 'before_restore';
  data: any;
}

export interface ClassInfo {
  className: string;
  gradeLevel?: string;
  schoolYear: string;
  semester?: string;
  schoolName?: string;
  homeroomTeacher: string;
  teacherPhone: string;
  teacherEmail: string;
  totalStudents: number;
  totalGroups: number;
  roomNumber: string;
  motto: string;
  bannerUrl?: string;
}

export interface CleanDataOptions {
  cleanWeeklyScores?: boolean;
  cleanViolations?: boolean;
  cleanAttendance?: boolean;
  cleanRewards?: boolean;
  cleanDuties?: boolean;
  cleanLabor?: boolean;
  cleanExtracurricular?: boolean;
  cleanEvaluations?: boolean;
  cleanGroupSummaries?: boolean;
  cleanAcademic?: boolean;
  cleanAllStudents?: boolean; // Xóa sạch toàn bộ danh sách học sinh
  targetWeek?: number | 'all';
}

export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'Nam' | 'Nữ';
  groupId: number; // Tổ 1, 2, 3, 4
  roleInClass: string; // 'Lớp trưởng', 'Lớp phó', 'Tổ trưởng', 'Thành viên', etc.
  phone: string;
  parentName: string;
  parentPhone: string;
  address: string;
  avatar: string;
  teacherNotes: string;
  email?: string;
  customUsername?: string; // Tên đăng nhập tùy chỉnh
  customPin?: string; // Mật khẩu / Mã PIN ban đầu tùy chỉnh
}

export type AttendanceStatus = 'present' | 'absent_excused' | 'absent_unexcused' | 'late' | 'skipped_lesson' | 'special';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  session: 'Sáng' | 'Chiều';
  status: AttendanceStatus;
  note?: string;
  recordedBy: string;
  recordedAt: string;
}

export type ViolationCategory = 'Học tập' | 'Nề nếp' | 'Khác';
export type ViolationSeverity = 'Nhẹ' | 'Vừa' | 'Nặng' | 'Rất nặng';
export type ViolationProcessStatus = 'Đã ghi nhận' | 'Đã nhắc nhở' | 'Đang khắc phục' | 'Đã tiến bộ';
export type ViolationStatus = ViolationProcessStatus;

export interface ViolationRecord {
  id: string;
  studentId: string;
  date: string;
  category: ViolationCategory;
  title: string;
  severity: ViolationSeverity;
  penaltyPoints: number; // e.g. -2, -5
  note?: string;
  recordedBy: string;
  status: ViolationProcessStatus;
  remedyAction?: string; // Biện pháp khắc phục
  isRepeated?: boolean;
  createdAt: string;
}

export type RewardCategory = 
  | 'Điểm tốt' 
  | 'Giúp đỡ bạn' 
  | 'Nhiệm vụ xuất sắc' 
  | 'Thành tích học tập' 
  | 'Văn nghệ - Thể thao' 
  | 'Việc tốt' 
  | 'Tiến bộ vượt bậc';

export interface RewardRecord {
  id: string;
  studentId: string;
  date: string;
  category: RewardCategory;
  title: string;
  bonusPoints: number; // e.g. +2, +5, +10
  note?: string;
  recordedBy: string;
  evidence?: string;
  createdAt: string;
}

export interface AcademicRecord {
  id: string;
  studentId: string;
  date: string;
  subject: string;
  type: 'Điểm tốt (9-10)' | 'Chưa làm bài' | 'Chưa chuẩn bị bài' | 'Phát biểu tốt' | 'Cần hỗ trợ';
  score?: number;
  note?: string;
  recordedBy: string;
  createdAt: string;
}

export type DutyStatus = 'Hoàn thành tốt' | 'Hoàn thành' | 'Chưa hoàn thành' | 'Không thực hiện' | 'Chờ trực';

export interface CleaningDuty {
  id: string;
  date: string;
  groupId: number;
  assignedStudentIds: string[];
  status: DutyStatus;
  evaluationNote?: string;
  inspectorName: string;
  inspectorRole: string;
  confirmedAt?: string;
  pointsDelta: number; // +2 for Good, 0 for normal, -5 for failed
}

export type LaborStatus = 'Chờ thực hiện' | 'Hoàn thành tốt' | 'Hoàn thành' | 'Chưa hoàn thành' | 'Không thực hiện';
export type LaborStudentStatus = 'Có mặt' | 'Vắng có phép' | 'Vắng không phép' | 'Hoàn thành tốt' | 'Chưa hoàn thành';

export interface LaborActivity {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  notes?: string;
  assignedGroupIds?: number[];
  assignedGroup?: string;
  status?: LaborStatus; // 'Chờ thực hiện' (chưa làm, không tính điểm), 'Hoàn thành tốt', 'Hoàn thành', 'Chưa hoàn thành'
  isConfirmed?: boolean; // true khi đã nghiệm thu/xác nhận sau khi làm xong
  confirmedAt?: string;
  inspectorName?: string;
  inspectorRole?: string;
  evaluationNote?: string;
  participations: {
    studentId: string;
    status: LaborStudentStatus;
    note?: string;
    pointsDelta?: number;
  }[];
}

export interface ExtracurricularActivity {
  id: string;
  title: string;
  category?: 'Văn nghệ' | 'Thể thao' | 'Cuộc thi' | 'Đoàn - Đội' | 'Tình nguyện' | string;
  type?: 'Văn nghệ' | 'Thể thao' | 'Thiện nguyện' | 'Câu lạc bộ' | 'Khác' | string;
  date: string;
  description?: string;
  result?: string;
  bonusScore?: number;
  participants?: string[];
  notes?: string;
  participations?: {
    studentId: string;
    role: string; // 'Đội trưởng', 'Biểu diễn', 'Cổ vũ', 'Thí sinh'
    achievement?: string; // 'Giải Nhất', 'Giải Ba', 'Hoàn thành xuất sắc'
    pointsBonus: number;
  }[];
}

export interface StudentSelfEvaluation {
  id: string;
  studentId: string;
  week: number;
  goodDeeds: string; // Điều em làm tốt
  weaknesses: string; // Điều em chưa làm tốt
  nextWeekPlan: string; // Việc em sẽ cải thiện trong tuần tới
  leaderRemark?: string; // Tổ trưởng nhận xét
  teacherRemark?: string; // GVCN nhận xét
  submittedAt: string;
}

export interface WeeklyGroupSummary {
  groupId: number;
  week: number;
  leaderNotes: string;
  proposedRank: 'Tốt' | 'Khá' | 'Trung bình' | 'Cần cố gắng';
  submittedAt: string;
}

export interface CompetitionSettings {
  baseScore: number; // 100
  attendanceWeight: number; // 20
  academicWeight: number; // 25
  disciplineWeight: number; // 20
  hygieneWeight: number; // 15
  activityWeight: number; // 10
  solidarityWeight: number; // 10
  showRankToStudents: boolean;
  warningThresholds: {
    maxAbsences: number; // 3
    maxLate: number; // 3
    maxViolations: number; // 2
    minScoreWarning: number; // 85
  };
}

export interface ActivityLog {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  target: string;
  timestamp: string;
  undoable?: boolean;
  meta?: any;
}

export interface EmulationDailyTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // Thứ Hai, Thứ Ba...
  week: number;
  month: number;
  monthLabel: string; // Tháng 08/2026, Tháng 09/2026...
  semester: string; // Học kỳ I / Học kỳ II / Hè
  schoolYear: string; // 2026 - 2027
  studentId: string;
  studentCode: string;
  fullName: string;
  groupId: number;
  categoryType: 'Khen thưởng (+)' | 'Vi phạm (-)' | 'Chuyên cần' | 'Trực nhật' | 'Lao động' | 'Học tập' | 'Ngoại khóa';
  content: string;
  pointsDelta: number; // +2, -3, etc.
  recordedBy: string;
  status?: string;
  notes?: string;
}

export interface StudentPeriodScore {
  studentId: string;
  studentCode: string;
  fullName: string;
  groupId: number;
  roleInClass: string;
  avatar: string;
  baseScore: number;
  bonusPoints: number;
  penaltyPoints: number;
  attendancePenalty: number;
  dutyPoints: number;
  laborPoints?: number;
  academicBonus: number;
  extraCurricularPoints: number;
  totalScore: number;
  rankInClass: number;
  rankInGroup: number;
  tier: 'Xuất sắc' | 'Tốt' | 'Khá' | 'Đạt' | 'Cần cố gắng';
  totalViolations: number;
  totalRewards: number;
  totalAbsences: number;
  totalLate: number;
  trend?: 'up' | 'down' | 'steady';
  notes?: string;
}

export interface GroupPeriodScore {
  groupId: number;
  groupName: string;
  leaderName: string;
  memberCount: number;
  attendanceScore: number;
  academicScore: number;
  disciplineScore: number;
  hygieneScore: number;
  activityScore: number;
  solidarityScore: number;
  totalScore: number;
  rank: number;
  totalViolations: number;
  totalRewards: number;
  avgStudentScore: number;
}

export interface EmulationPeriodSummary {
  periodType: 'all' | 'day' | 'week' | 'month' | 'semester' | 'school_year';
  periodKey: string;
  periodLabel: string;
  studentScores: StudentPeriodScore[];
  groupScores: GroupPeriodScore[];
}

export interface SeatAssignment {
  column: number; // 1 đến 4 (4 cột/dãy bàn)
  row: number;    // 1 đến 8 (8 hàng bàn)
  deskPosition: 1 | 2; // 1: Vị trí Trái, 2: Vị trí Phải
  studentId: string;
  notes?: string;
  assignedAt?: string;
}

export interface SeatingChartConfig {
  columns: number; // Mặc định 4 cột
  rows: number;    // Mặc định 8 hàng
  seatsPerDesk: number; // Mặc định 2 chỗ ngồi mỗi bàn
  updatedAt?: string;
  updatedBy?: string;
}

// ==================== CÁC KIỂU DỮ LIỆU GIẢI TRÍ & TRÒ CHƠI LỚP HỌC ====================
export type EntertainmentGameId = 
  | 'lucky_wheel'     // Trò 1: Vòng quay may mắn / tương tác
  | 'golden_bell'     // Trò 2: Đấu trí Rung Chuông Vàng AI
  | 'daily_streak'    // Trò 3: Thói quen tốt & Tích điểm hàng ngày
  | 'millionaire'     // Trò 4: Ai là triệu phú lớp học
  | 'word_puzzle';    // Trò 5: Chiếc nón kỳ diệu - Ô chữ bí mật

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points?: number;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | string;
  isApproved?: boolean;
}

export interface DailyStreakRecord {
  id: string;
  studentId: string;
  studentCode: string;
  fullName: string;
  groupId: number;
  streakCount: number;         // Chuỗi ngày tích lũy liên tục (streak)
  lastCheckInDate: string;     // Ngày tích điểm gần nhất (YYYY-MM-DD)
  totalPoints: number;         // Tổng điểm tích lũy được từ trước tới nay
  availablePoints: number;     // Điểm khả dụng để đổi quà
  redeemedRewards: {
    rewardId: string;
    rewardTitle: string;
    pointsSpent: number;
    redeemedAt: string;
  }[];
  todayHabits: string[];       // Danh sách thói quen đã tích hôm nay
  history: {
    date: string;
    habits: string[];
    pointsEarned: number;
    multiplier: number;
  }[];
}

export interface GameHistoryRecord {
  id: string;
  gameId: EntertainmentGameId;
  gameName: string;
  date: string;
  topic?: string;
  studentIds: string[];
  studentNames: string[];
  groupIds?: number[];
  scoreEarned: number;
  result: string;
  note?: string;
}


