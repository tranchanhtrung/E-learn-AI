import React, { useState, useEffect } from "react";
import { 
  BookOpen, Video, FileText, CheckCircle2, ChevronRight, Play, ExternalLink, 
  Sparkles, MessageSquare, ArrowLeft, Trophy, Clock, GraduationCap, CheckCircle,
  User, CreditCard, Lock, Unlock, Mail, Calendar, BadgeCheck, History, AlertCircle,
  ShieldCheck, Check, Loader2, Save
} from "lucide-react";
import { Course, Lesson, StudentAccount, GoogleTransaction } from "../types";
import AITutorChat from "./AITutorChat";
import Markdown from "react-markdown";

interface LearnerPanelProps {
  courses: Course[];
}

export default function LearnerPanel({ courses }: LearnerPanelProps) {
  // Current logged in student state
  const [studentEmail, setStudentEmail] = useState<string>("tranchanhtrung@gmail.com");
  const [currentStudent, setCurrentStudent] = useState<StudentAccount | null>(null);
  const [tempName, setTempName] = useState<string>("");
  const [tempAvatar, setTempAvatar] = useState<string>("");
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [activeTab, setActiveTab] = useState<"courses" | "profile" | "subscriptions">("courses");
  
  // Progress tracking - stored locally in state or localStorage for instant feedback
  const [completedLessons, setCompletedLessons] = useState<Record<string, string[]>>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Billing & Transactions states
  const [transactions, setTransactions] = useState<GoogleTransaction[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);

  // Google Play Sandbox payment modal state
  const [showGooglePayModal, setShowGooglePayModal] = useState(false);
  const [payTarget, setPayTarget] = useState<{
    packageId: string;
    packageName: string;
    priceVnd: number;
    courseId?: string;
  } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"confirm" | "paying" | "success">("confirm");
  const [simulatedOrderId, setSimulatedOrderId] = useState("");

  // Fetch or create student profile from database
  const fetchStudentProfile = async (emailToFetch: string) => {
    setIsLoadingProfile(true);
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(emailToFetch.trim())}`);
      if (res.ok) {
        const data: StudentAccount = await res.json();
        setCurrentStudent(data);
        setTempName(data.name);
        setTempAvatar(data.avatarUrl);
      }
    } catch (err) {
      console.error("Error loading student profile:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Fetch student transaction logs
  const fetchTransactions = async () => {
    setIsLoadingTxs(true);
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        // Filter transactions for current logged in user
        const userTxs = data.filter((tx: any) => tx.email.toLowerCase() === studentEmail.toLowerCase());
        setTransactions(userTxs);
      }
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setIsLoadingTxs(false);
    }
  };

  // Load student on mount and when email changes
  useEffect(() => {
    fetchStudentProfile(studentEmail);
    fetchTransactions();
  }, [studentEmail]);

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("elearning_student_progress");
    if (saved) {
      try {
        setCompletedLessons(JSON.parse(saved));
      } catch (e) {
        console.error("Error reading progress", e);
      }
    }
  }, []);

  const saveProgress = (courseId: string, lessonIds: string[]) => {
    const updated = {
      ...completedLessons,
      [courseId]: lessonIds
    };
    setCompletedLessons(updated);
    localStorage.setItem("elearning_student_progress", JSON.stringify(updated));
  };

  const toggleLessonCompleted = (courseId: string, lessonId: string) => {
    const currentList = completedLessons[courseId] || [];
    let updatedList: string[];
    if (currentList.includes(lessonId)) {
      updatedList = currentList.filter((id) => id !== lessonId);
    } else {
      updatedList = [...currentList, lessonId];
    }
    saveProgress(courseId, updatedList);
  };

  // Check if a course is unlocked for the current student
  const isCourseUnlocked = (course: Course): boolean => {
    if (!currentStudent) return false;
    // Lifetime tier or Pro tier unlocks everything
    if (currentStudent.subscriptionTier === "lifetime" || currentStudent.subscriptionTier === "pro") {
      return true;
    }
    // "Cơ bản" level or priceVnd === 0 is free, others are locked
    if (course.level === "Cơ bản" || course.priceVnd === 0) {
      return true;
    }
    // Specifically purchased/subscribed course ID
    if (currentStudent.subscribedCourseIds?.includes(course.id)) {
      return true;
    }
    return false;
  };

  // Helper to extract Youtube ID
  const getYoutubeEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    if (course.lessons && course.lessons.length > 0) {
      setActiveLesson(course.lessons[0]);
    } else {
      setActiveLesson(null);
    }
    setShowAIChat(false);
  };

  // Update profile name or avatar
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;
    setIsUpdatingProfile(true);

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentStudent.email,
          name: tempName,
          avatarUrl: tempAvatar
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setCurrentStudent(updated);
        alert("Đã lưu thông tin tài học học viên thành công!");
      }
    } catch (err) {
      console.error("Error updating profile", err);
      alert("Lỗi kết nối cập nhật hồ sơ");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Initialize the simulated Google Play Billing Dialog
  const triggerGoogleSubscription = (packageId: string, packageName: string, priceVnd: number, courseId?: string) => {
    setPayTarget({ packageId, packageName, priceVnd, courseId });
    setSimulatedOrderId(`GPA.${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10000 + Math.random() * 90000)}`);
    setPaymentStep("confirm");
    setShowGooglePayModal(true);
  };

  // Finalize payment simulation inside sandbox
  const handleConfirmGooglePayment = async () => {
    if (!payTarget || !currentStudent) return;
    setPaymentStep("paying");
    
    // Simulate payment delays
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/students/${encodeURIComponent(currentStudent.email)}/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            packageId: payTarget.packageId,
            packageName: payTarget.packageName,
            amountVnd: payTarget.priceVnd,
            courseId: payTarget.courseId || null,
            googleOrderId: simulatedOrderId
          })
        });

        if (response.ok) {
          const result = await response.json();
          // Update local state instantly
          setCurrentStudent(result.student);
          setPaymentStep("success");
          fetchTransactions();
        } else {
          alert("Lỗi máy chủ khi xử lý giao dịch Google Play");
          setShowGooglePayModal(false);
        }
      } catch (err) {
        console.error("Payment sync failed:", err);
        alert("Lỗi kết nối thanh toán");
        setShowGooglePayModal(false);
      }
    }, 1500);
  };

  // Calculate stats
  const getCourseProgressPercentage = (course: Course): number => {
    const completed = completedLessons[course.id] || [];
    const total = course.lessons?.length || 0;
    if (total === 0) return 0;
    return Math.round((completed.length / total) * 100);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. MAIN STUDENT SUB-HEADER / CONTROLLER */}
      {!selectedCourse && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          {/* Active Logged In Account Display */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            {isLoadingProfile ? (
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <img 
                src={currentStudent?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                alt="Avatar" 
                className="w-12 h-12 rounded-full border-2 border-indigo-200 object-cover ring-4 ring-indigo-50"
              />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-800 text-sm tracking-tight truncate">
                  {currentStudent?.name || "ĐANG TẢI..."}
                </h4>
                
                {/* Subscription Badge */}
                {currentStudent?.subscriptionTier === "pro" && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-md text-[9px] font-black tracking-wide uppercase flex items-center gap-0.5 shadow-sm">
                    <BadgeCheck className="w-3 h-3" /> PRO YEARLY
                  </span>
                )}
                {currentStudent?.subscriptionTier === "lifetime" && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-md text-[9px] font-black tracking-wide uppercase flex items-center gap-0.5 shadow-sm">
                    <Trophy className="w-3 h-3" /> LIFETIME
                  </span>
                )}
                {currentStudent?.subscriptionTier === "free" && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-bold uppercase border border-slate-200">
                    MEMBER
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{currentStudent?.email}</p>
            </div>
          </div>

          {/* Account Sub-navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab("courses")}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "courses" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Khóa học
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "subscriptions" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Subscription Google
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "profile" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5" /> Hồ sơ học viên
            </button>
          </div>
        </div>
      )}

      {/* Back button when inside a course */}
      {selectedCourse && (
        <div className="flex items-center justify-between">
          <button
            id="back-to-course-list"
            onClick={() => setSelectedCourse(null)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại trang cá nhân
          </button>
          <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
            <GraduationCap className="w-4 h-4" /> Chế độ Học viên
          </span>
        </div>
      )}

      {/* =========================================
          TAB 1: COURSES VIEW (LIST OR INSIDE COURSE)
         ========================================= */}
      {activeTab === "courses" && (
        <>
          {!selectedCourse ? (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto py-4">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
                  <BookOpen className="w-6 h-6 text-indigo-600" /> Danh Mục Khóa Học
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  Các khóa học gắn nhãn <span className="text-amber-600 font-bold">Trung cấp / Nâng cao</span> yêu cầu đăng ký subscription học phần hoặc nâng cấp tài khoản để học đầy đủ.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => {
                  const progress = getCourseProgressPercentage(course);
                  const unlocked = isCourseUnlocked(course);
                  return (
                    <div 
                      key={course.id} 
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      <div>
                        <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                          <img 
                            src={course.thumbnailUrl} 
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                          />
                          <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/90 text-white rounded-md text-[10px] font-black tracking-wider uppercase">
                            {course.category}
                          </div>
                          
                          {/* Locked Badge if premium */}
                          <div className="absolute top-3 right-3">
                            {unlocked ? (
                              <span className="px-2 py-1 bg-emerald-500/90 text-white rounded-md text-[9px] font-bold flex items-center gap-0.5 shadow-sm">
                                <Unlock className="w-2.5 h-2.5" /> Đã mở
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-indigo-600/95 text-white rounded-md text-[9px] font-bold flex items-center gap-0.5 shadow-sm">
                                <Lock className="w-2.5 h-2.5" /> Premium
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="p-5 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.lessons?.length || 0} bài học</span>
                            <span className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${
                              course.level === "Cơ bản" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                              course.level === "Trung cấp" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                              "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            }`}>{course.level}</span>
                          </div>
                          <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-2 min-h-[2.75rem] group-hover:text-indigo-600 transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-2 border-t border-slate-50 space-y-4">
                        {progress > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-medium text-slate-500">
                              <span>Tiến độ học tập</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {unlocked ? (
                            <button
                              id={`start-course-${course.id}`}
                              onClick={() => handleSelectCourse(course)}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wide transition-colors flex items-center justify-center gap-1"
                            >
                              Vào học ngay <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="flex flex-col gap-1.5 w-full">
                              <button
                                onClick={() => triggerGoogleSubscription(`course_${course.id}_sub`, `Mở khóa: ${course.title}`, course.priceVnd !== undefined ? course.priceVnd : 199000, course.id)}
                                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-xs font-extrabold tracking-wide hover:from-indigo-700 hover:to-indigo-800 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <CreditCard className="w-3.5 h-3.5" /> Đăng ký học phần ({course.priceVnd === 0 ? "Miễn phí" : `${(course.priceVnd !== undefined ? course.priceVnd : 199000).toLocaleString("vi-VN")}đ`})
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {courses.length === 0 && (
                  <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center">
                    <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-700">Chưa có khóa học trực tuyến nào</p>
                    <p className="text-xs text-slate-400 mt-1">Vui lòng chuyển sang hệ "Giảng viên" ở góc trên để tạo khóa học đầu tiên nhé!</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VIEW 2: ACTIVE COURSE LEARNING SYLLABUS */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT/MAIN COLUMN (8/12) - Lesson Content, Video & Document Viewer */}
              <div className="lg:col-span-8 space-y-6">
                
                {!isCourseUnlocked(selectedCourse) ? (
                  /* LOCK SCREEN ON PREMIUM LESSONS FOR FREE USERS */
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-md space-y-6 py-16">
                    <div className="w-16 h-16 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <Lock className="w-8 h-8 animate-pulse" />
                    </div>
                    
                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="text-xl font-extrabold text-slate-950">Nội dung học phần bị khóa</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Khóa học này ở cấp độ <strong>{selectedCourse.level}</strong> và yêu cầu đăng ký học phần riêng biệt hoặc tài khoản E-Learn Pro được kích hoạt qua Google để xem bài giảng.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-600 text-left max-w-sm mx-auto space-y-2">
                      <p className="font-bold text-slate-700 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Quyền lợi mở khóa qua Google Play:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Truy cập trọn vẹn toàn bộ bài học lý thuyết</li>
                        <li>Xem các video bài giảng chất lượng cao</li>
                        <li>Trò chuyện không giới hạn với Trợ lý AI giáo vụ</li>
                        <li>Được đồng bộ bảo mật trực tiếp với tài khoản Google</li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                      <button
                        onClick={() => triggerGoogleSubscription(`course_${selectedCourse.id}_sub`, `Mở khóa: ${selectedCourse.title}`, selectedCourse.priceVnd !== undefined ? selectedCourse.priceVnd : 199000, selectedCourse.id)}
                        className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CreditCard className="w-4 h-4" /> Đăng ký học phần ({selectedCourse.priceVnd === 0 ? "Miễn phí" : `${(selectedCourse.priceVnd !== undefined ? selectedCourse.priceVnd : 199000).toLocaleString("vi-VN")}đ`})
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCourse(null);
                          setActiveTab("subscriptions");
                        }}
                        className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                      >
                        Nâng cấp gói Pro 1 năm
                      </button>
                    </div>
                  </div>
                ) : activeLesson ? (
                  <div className="space-y-6 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
                    
                    {/* Active Lesson Header Info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{activeLesson.title}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Thời lượng: <strong>{activeLesson.duration}</strong></span>
                          <span>•</span>
                          <span>Khóa: {selectedCourse.title}</span>
                        </p>
                      </div>
                      
                      {/* Mark as completed Button */}
                      <button
                        id="toggle-complete-btn"
                        onClick={() => toggleLessonCompleted(selectedCourse.id, activeLesson.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                          (completedLessons[selectedCourse.id] || []).includes(activeLesson.id)
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${
                          (completedLessons[selectedCourse.id] || []).includes(activeLesson.id) ? "text-emerald-600 fill-emerald-100" : "text-slate-400"
                        }`} />
                        {(completedLessons[selectedCourse.id] || []).includes(activeLesson.id)
                          ? "Đã hoàn thành"
                          : "Đánh dấu hoàn thành"
                        }
                      </button>
                    </div>

                    {/* YOUTUBE VIDEO EMBED */}
                    {activeLesson.videoUrl && getYoutubeEmbedUrl(activeLesson.videoUrl) ? (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                          <Play className="w-3.5 h-3.5 fill-red-600" /> Video bài giảng YouTube:
                        </span>
                        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-sm border border-slate-200">
                          <iframe
                            id="youtube-player-frame"
                            src={getYoutubeEmbedUrl(activeLesson.videoUrl)!}
                            title={activeLesson.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full border-0"
                          ></iframe>
                        </div>
                      </div>
                    ) : activeLesson.videoUrl ? (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs flex items-center gap-2">
                        <span>Đường dẫn video không đúng định dạng nhúng YouTube: <a href={activeLesson.videoUrl} target="_blank" rel="noopener noreferrer" className="underline">{activeLesson.videoUrl}</a></span>
                      </div>
                    ) : null}

                    {/* AI SUMMARY BOX */}
                    {activeLesson.aiSummary && (
                      <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-1.5">
                        <h5 className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Tóm tắt kiến thức AI:
                        </h5>
                        <p className="text-xs text-indigo-950 leading-relaxed italic">{activeLesson.aiSummary}</p>
                      </div>
                    )}

                    {/* LESSON DOCUMENT VIEWER */}
                    {activeLesson.documentType === "word" && activeLesson.documentContent ? (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-blue-600" /> Giáo trình bài đọc:
                          </span>
                          {activeLesson.documentName && (
                            <span className="text-[10px] text-slate-400 font-mono">{activeLesson.documentName}</span>
                          )}
                        </div>
                        {/* RENDER THE MARKDOWN CLEANLY */}
                        <div className="markdown-body text-slate-800 leading-relaxed text-sm bg-slate-50 p-5 rounded-2xl border border-slate-100/70 overflow-x-auto">
                          <Markdown>{activeLesson.documentContent}</Markdown>
                        </div>
                      </div>
                    ) : activeLesson.documentType === "drive" && activeLesson.documentUrl ? (
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-emerald-600" /> Tài liệu đính kèm Google Drive:
                          </span>
                          {activeLesson.documentName && (
                            <span className="text-[10px] text-slate-400 font-mono">{activeLesson.documentName}</span>
                          )}
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
                          <div className="w-12 h-12 bg-white text-emerald-600 border border-slate-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="max-w-md mx-auto">
                            <h4 className="font-semibold text-slate-800 text-sm">{activeLesson.documentName || "Tài liệu bổ trợ bài giảng"}</h4>
                            <p className="text-xs text-slate-500 mt-1">Tài liệu này được lưu trữ ngoài trên Google Drive. Để có trải nghiệm đọc và tải xuống đầy đủ nhất, vui lòng mở liên kết trực tiếp.</p>
                          </div>
                          
                          {activeLesson.documentContent && (
                            <div className="text-left text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                              <strong>Ghi chú từ giảng viên:</strong>
                              <p className="mt-1">{activeLesson.documentContent}</p>
                            </div>
                          )}

                          <a
                            id="open-drive-doc"
                            href={activeLesson.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                          >
                            Mở Google Drive <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Bài học này không có tài liệu bài viết đi kèm. Vui lòng xem video hướng dẫn ở trên.
                      </div>
                    )}

                    {/* Floating AI tutor chat trigger inside page */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Gặp khó khăn khi giải bài tập hoặc hiểu lý thuyết?</span>
                      <button
                        id="toggle-ai-chat-btn"
                        onClick={() => setShowAIChat(!showAIChat)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Hỏi Trợ lý AI ngay
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-700">Khoá học chưa có bài giảng nào</p>
                    <p className="text-xs text-slate-400 mt-1">Giảng viên sẽ sớm cập nhật giáo án đầy đủ.</p>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN (4/12) - Syllabus Sidebar or Chat Box */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* COURSE PROGRESS SUMMARY & LESSONS LIST */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{selectedCourse.title}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">Cung cấp bởi {selectedCourse.author}</span>
                  </div>

                  {/* Progress Summary */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">Tiến độ khóa học</span>
                      <span className="font-bold text-indigo-700">{getCourseProgressPercentage(selectedCourse)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${getCourseProgressPercentage(selectedCourse)}%` }} 
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">
                      Đã học { (completedLessons[selectedCourse.id] || []).length } / { selectedCourse.lessons?.length || 0 } bài giảng
                    </p>
                  </div>

                  {/* Lesson playlist items */}
                  <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nội dung bài học:</span>
                    
                    {selectedCourse.lessons?.map((lesson, index) => {
                      const isCompleted = (completedLessons[selectedCourse.id] || []).includes(lesson.id);
                      const isActive = activeLesson?.id === lesson.id;
                      const unlocked = isCourseUnlocked(selectedCourse);

                      return (
                        <button
                          id={`select-lesson-${lesson.id}`}
                          key={lesson.id}
                          disabled={!unlocked}
                          onClick={() => {
                            setActiveLesson(lesson);
                            setShowAIChat(false);
                          }}
                          className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left border transition-all ${
                            isActive 
                              ? "bg-indigo-50 border-indigo-200" 
                              : !unlocked 
                                ? "bg-slate-50 opacity-60 cursor-not-allowed border-transparent" 
                                : "bg-white border-transparent hover:bg-slate-50"
                          }`}
                        >
                          <div className="mt-0.5">
                            {!unlocked ? (
                              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            ) : isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-50 shrink-0" />
                            ) : (
                              <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                                isActive ? "border-indigo-600" : "border-slate-300"
                              }`} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h5 className={`text-xs font-semibold leading-tight line-clamp-2 ${
                              isActive ? "text-indigo-950 font-bold" : "text-slate-700"
                            }`}>
                              {index + 1}. {lesson.title}
                            </h5>
                            <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400">
                              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {lesson.duration}</span>
                              {lesson.videoUrl && <span>• Video</span>}
                              {lesson.documentType !== "none" && <span>• Tài liệu</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FLOATING CHAT COMPONENT CONTAINER */}
                {showAIChat && activeLesson && isCourseUnlocked(selectedCourse) && (
                  <div className="h-[480px] animate-slide-in">
                    <AITutorChat
                      courseTitle={selectedCourse.title}
                      lesson={activeLesson}
                      onClose={() => setShowAIChat(false)}
                    />
                  </div>
                )}
                
              </div>

            </div>
          )}
        </>
      )}

      {/* =========================================
          TAB 2: GOOGLE SUBSCRIPTIONS MANAGER
         ========================================= */}
      {activeTab === "subscriptions" && (
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="max-w-2xl space-y-4 relative z-10">
              <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/30 text-indigo-300 rounded-full text-[10px] font-bold tracking-wider uppercase inline-block">
                Tích hợp Google Play Billing
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Chọn khóa học để đăng ký mở khóa qua Google Play Billing
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Nâng cao trình độ lập trình và làm chủ Trí tuệ nhân tạo. Đăng ký an toàn chỉ trong 1-click qua tài khoản Google của bạn. Quản lý và theo dõi hóa đơn ngay trên nền tảng.
              </p>
            </div>
          </div>

          {/* Core Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const unlocked = isCourseUnlocked(course);
              const priceVal = course.priceVnd !== undefined ? course.priceVnd : 199000;
              const isFree = priceVal === 0 || course.level === "Cơ bản";
              const isGloballyUnlocked = currentStudent?.subscriptionTier === "lifetime" || currentStudent?.subscriptionTier === "pro";
              const isSpecificallySubscribed = currentStudent?.subscribedCourseIds?.includes(course.id);

              return (
                <div 
                  key={`sub-card-${course.id}`} 
                  className={`bg-white border rounded-3xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative ${
                    isSpecificallySubscribed ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-200"
                  }`}
                >
                  {isSpecificallySubscribed && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-600 text-white text-[9px] font-black tracking-wider uppercase rounded-full shadow-sm z-10 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> Đã sở hữu
                    </span>
                  )}
                  
                  <div>
                    {/* Thumbnail Section */}
                    <div className="relative aspect-video w-full bg-slate-50 overflow-hidden">
                      <img 
                        src={course.thumbnailUrl} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 px-2 py-0.5 bg-slate-950/80 backdrop-blur-sm text-white rounded-md text-[9px] font-bold uppercase">
                        {course.category}
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${
                            course.level === "Cơ bản" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            course.level === "Trung cấp" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                            "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          }`}>
                            {course.level}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Giảng viên: {course.author}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">
                          {course.title}
                        </h3>
                      </div>

                      <div className="py-2 border-y border-slate-100/80 flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-900">
                          {isFree ? "Miễn phí" : `${priceVal.toLocaleString("vi-VN")}đ`}
                        </span>
                        {!isFree && <span className="text-[10px] text-slate-400 font-medium">/ trọn học phần</span>}
                      </div>

                      <div className="space-y-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>Mở khóa toàn bộ {course.lessons?.length || 0} bài giảng</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>Hỗ trợ không giới hạn bởi Trợ lý AI giáo vụ</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>Tải tài liệu Word & Google Drive gốc</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    {isGloballyUnlocked ? (
                      <button
                        onClick={() => {
                          handleSelectCourse(course);
                          setActiveTab("courses");
                        }}
                        className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Đã mở khóa (Học ngay)
                      </button>
                    ) : isSpecificallySubscribed ? (
                      <button
                        onClick={() => {
                          handleSelectCourse(course);
                          setActiveTab("courses");
                        }}
                        className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Đã đăng ký (Vào học ngay)
                      </button>
                    ) : isFree ? (
                      <button
                        onClick={() => {
                          handleSelectCourse(course);
                          setActiveTab("courses");
                        }}
                        className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                      >
                        Học miễn phí ngay
                      </button>
                    ) : (
                      <button
                        onClick={() => triggerGoogleSubscription(`course_${course.id}_sub`, `Mở khóa: ${course.title}`, priceVal, course.id)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Đăng ký qua Google Play
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {courses.length === 0 && (
              <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700">Chưa có khóa học nào để hiển thị</p>
                <p className="text-xs text-slate-400 mt-1">Giảng viên cần tạo khóa học trước khi đăng ký thanh toán.</p>
              </div>
            )}
          </div>

          {/* GOOGLE BILLING PURCHASE TRANSACTION LOGS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <History className="w-4.5 h-4.5 text-indigo-600" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Lịch sử Đăng ký và Hóa đơn Google Play</h4>
                <p className="text-[10px] text-slate-400">Các hóa đơn thật được mã hóa đồng bộ an toàn qua Google Console API</p>
              </div>
            </div>

            {isLoadingTxs ? (
              <div className="text-center py-6">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto" />
              </div>
            ) : transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="py-2">Gói đăng ký</th>
                      <th className="py-2">Mã đơn hàng Google</th>
                      <th className="py-2">Thời gian</th>
                      <th className="py-2">Giá tiền</th>
                      <th className="py-2 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-semibold text-slate-800">{tx.packageName}</td>
                        <td className="py-3 font-mono text-[10px] text-indigo-600">{tx.googleOrderId}</td>
                        <td className="py-3 text-[11px] text-slate-400">{new Date(tx.timestamp).toLocaleString("vi-VN")}</td>
                        <td className="py-3 font-bold text-slate-800">{tx.amountVnd.toLocaleString("vi-VN")}đ</td>
                        <td className="py-3 text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-bold border border-emerald-200">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Bạn chưa thực hiện giao dịch đăng ký subscription nào qua Google.
              </div>
            )}
          </div>

        </div>
      )}

      {/* =========================================
          TAB 3: USER PROFILE EDITOR
         ========================================= */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* PROFILE CARD & LOGOUT OPTIONS */}
          <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 text-center">
            <div className="relative inline-block mx-auto">
              <img 
                src={currentStudent?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                alt="Avatar" 
                className="w-20 h-20 rounded-full border-4 border-white shadow-md mx-auto object-cover"
              />
              <span className="absolute bottom-0 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full ring-2 ring-emerald-50" />
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 text-base leading-tight">{currentStudent?.name}</h4>
              <p className="text-xs text-slate-400 mt-1">Học viên chính thức</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Trạng thái:</span>
                <span className="font-bold text-indigo-700 uppercase">
                  {currentStudent?.subscriptionTier === "pro" ? "Gói Pro Yearly" :
                   currentStudent?.subscriptionTier === "lifetime" ? "Gói Trọn Đời" : "Miễn Phí"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ngày tham gia:</span>
                <span className="text-slate-700 font-mono">
                  {currentStudent?.joinedAt ? new Date(currentStudent.joinedAt).toLocaleDateString("vi-VN") : "---"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Giao dịch Google:</span>
                <span className="text-slate-700 font-bold">{transactions.length} hóa đơn</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <span className="text-[10px] text-slate-400 block mb-2 font-semibold">MÔ PHỎNG SWITCH TÀI KHOẢN KHÁC:</span>
              <div className="flex gap-1">
                <input 
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="Nhập email học viên..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[9px] text-slate-400 text-left mt-1.5 leading-relaxed">
                * Nhập bất kỳ email hợp lệ nào (ví dụ: `hocvien.test@gmail.com`). Hệ thống sẽ tự tạo hồ sơ và đồng bộ thanh toán Google tương ứng.
              </p>
            </div>
          </div>

          {/* PROFILE SETTINGS FORM */}
          <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Cập nhật hồ sơ học viên</h3>
              <p className="text-xs text-slate-400">Thông tin này được đồng bộ để phục vụ cấp chứng chỉ học vụ trực tuyến.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-600" /> Họ và tên học viên
                  </label>
                  <input
                    type="text"
                    required
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" /> Địa chỉ Email (Không được đổi)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentStudent?.email || ""}
                    className="w-full px-3 py-2 border border-slate-100 bg-slate-50 text-slate-400 rounded-xl text-xs font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Đường dẫn ảnh đại diện (Avatar URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={tempAvatar}
                    onChange={(e) => setTempAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setTempAvatar(`https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                  >
                    Ngẫu nhiên
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                >
                  {isUpdatingProfile ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* =======================================================
          GOOGLE PLAY BILLING / GOOGLE PAY SIMULATOR MODAL (SANDBOX)
         ======================================================= */}
      {showGooglePayModal && payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between transform transition-all animate-scale-up">
            
            {/* GOOGLE BILLING TOP GREEN HEADER BAR */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {/* Custom Google Styled White Circle "G" Logo */}
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-teal-700 font-extrabold text-sm shadow-sm select-none">
                  G
                </div>
                <span className="font-extrabold tracking-tight text-sm">Google Play Billing</span>
              </div>
              <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider select-none">
                Sandbox Mode ⚡
              </span>
            </div>

            {/* MODAL MAIN STAGES */}
            <div className="p-6 space-y-5">
              
              {/* STEP 1: CONFIRM ORDER & SECURE PAYMENT METHOD */}
              {paymentStep === "confirm" && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] text-indigo-600 font-black tracking-widest uppercase">E-LEARN AI PLATFORM</span>
                      <h4 className="font-bold text-slate-800 text-sm mt-0.5">{payTarget.packageName}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Sản phẩm kỹ thuật số số hóa chính thức</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-slate-950">{payTarget.priceVnd.toLocaleString("vi-VN")}đ</span>
                      <p className="text-[9px] text-slate-400 mt-0.5">Thanh toán 1 lần</p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-55 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="text-slate-400">Tài khoản Google:</span>
                      <span className="font-mono font-bold truncate max-w-[160px]">{currentStudent?.email}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="text-slate-400">Phương thức:</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Google Pay Balance
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="text-slate-400">Mã giao dịch thử nghiệm:</span>
                      <span className="font-mono text-[9px] text-indigo-600 truncate max-w-[150px]">{simulatedOrderId}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Bằng việc nhấp thanh toán, bạn đồng ý kích hoạt gói học tập qua Google Play Services. Quy trình hoàn toàn tự động bảo mật.</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowGooglePayModal(false)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={handleConfirmGooglePayment}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md"
                    >
                      Thanh toán 1 chạm
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PROCESSING ANIMATION */}
              {paymentStep === "paying" && (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 text-sm">Đang bảo mật giao dịch...</p>
                    <p className="text-xs text-slate-400">Kết nối tới Google Play Console Billing API</p>
                  </div>
                </div>
              )}

              {/* STEP 3: TRANSACTION SUCCESSFUL CONFIRMATION */}
              {paymentStep === "success" && (
                <div className="py-4 text-center space-y-5">
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                    <Check className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-950 text-base">Thanh toán Thành công!</h4>
                    <p className="text-xs text-slate-500">
                      Gói <strong>{payTarget.packageName}</strong> đã được kích hoạt trực tiếp vào tài khoản Google của bạn.
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 text-[10px] text-emerald-800 font-mono text-left space-y-1">
                    <p><strong>Order ID:</strong> {simulatedOrderId}</p>
                    <p><strong>Khách hàng:</strong> {currentStudent?.name}</p>
                    <p><strong>Sản phẩm:</strong> Activated</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowGooglePayModal(false);
                      // If specific course subscription was purchased, select it or refresh locked status
                      if (payTarget.courseId) {
                        const course = courses.find((c) => c.id === payTarget.courseId);
                        if (course) {
                          handleSelectCourse(course);
                        }
                      }
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    Bắt đầu học ngay 🚀
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
