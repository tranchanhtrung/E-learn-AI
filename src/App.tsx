import React, { useState, useEffect } from "react";
import { 
  BookOpen, Sparkles, GraduationCap, Users, ShieldAlert, BookMarked, 
  Settings, Award, Loader2, Info
} from "lucide-react";
import { Course, AppRole } from "./types";
import LearnerPanel from "./components/LearnerPanel";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  const [role, setRole] = useState<AppRole>("learner");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(true);

  // Fetch courses from server API on mount
  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch("/api/courses");
        if (response.ok) {
          const data = await response.json();
          setCourses(data);
        } else {
          console.error("Failed to fetch courses");
        }
      } catch (err) {
        console.error("Connection error loading courses", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourses();
  }, []);

  // Handlers for real-time local state syncing in Admin
  const handleCourseAdded = (newCourse: Course) => {
    setCourses((prev) => [...prev, newCourse]);
  };

  const handleCourseUpdated = (updatedCourse: Course) => {
    setCourses((prev) => prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c)));
  };

  const handleCourseDeleted = (courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      {/* GLOBAL HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
              E
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5 leading-none">
                E-Learn AI
              </h1>
              <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider mt-0.5 block">Hệ thống Học trực tuyến</span>
            </div>
          </div>

          {/* ROLE SELECTOR AND CONTROLS */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center">
              <button
                id="btn-switch-learner"
                onClick={() => setRole("learner")}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  role === "learner"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Học viên
              </button>
              <button
                id="btn-switch-admin"
                onClick={() => setRole("admin")}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  role === "admin"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Giảng viên
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* QUICK BANNER INFO ABOUT GEMINI AI ASSISTANT */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white py-3.5 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-xs">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg text-emerald-400 shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <p className="leading-relaxed">
              <strong>Trí tuệ nhân tạo (Gemini AI):</strong> Hỗ trợ giải toán, tóm tắt bài giảng lý thuyết, định dạng giáo án tự động bằng tiếng Việt.
            </p>
          </div>
          <span className="text-[10px] text-slate-300 font-medium bg-slate-800/65 py-1 px-2.5 rounded-md border border-slate-700 select-none inline-block shrink-0 self-start md:self-auto">
            Mã khóa Secrets: Đã bật ⚡
          </span>
        </div>
      </div>

      {/* MAIN LAYOUT WRAPPER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Đang khởi tạo danh mục học tập của bạn...</p>
          </div>
        ) : role === "learner" ? (
          <LearnerPanel courses={courses} />
        ) : (
          <AdminPanel
            courses={courses}
            onCourseAdded={handleCourseAdded}
            onCourseUpdated={handleCourseUpdated}
            onCourseDeleted={handleCourseDeleted}
          />
        )}
      </main>

      {/* GLOBAL FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 E-Learn AI Platform. Sản xuất dựa trên tiêu chuẩn sư phạm công nghệ số.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Điều khoản học vụ</span>
            <span>•</span>
            <span className="hover:text-slate-600 transition-colors cursor-pointer">Hướng dẫn giảng viên</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

