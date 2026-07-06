import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Trash, Edit3, BookOpen, Video, FileText, Upload, Link2, Check, 
  Loader2, ArrowLeft, Eye, Save, Sparkles, FolderOpen, AlertCircle,
  Users, CreditCard, History, Globe, Download, BadgeCheck, ShieldAlert, Trophy,
  Clipboard, ShieldCheck, Mail, Calendar
} from "lucide-react";
import { Course, Lesson, StudentAccount, GoogleTransaction } from "../types";

interface AdminPanelProps {
  courses: Course[];
  onCourseAdded: (course: Course) => void;
  onCourseUpdated: (course: Course) => void;
  onCourseDeleted: (courseId: string) => void;
}

export default function AdminPanel({ courses, onCourseAdded, onCourseUpdated, onCourseDeleted }: AdminPanelProps) {
  // Main admin category tabs
  const [adminSubTab, setAdminSubTab] = useState<"courses" | "students" | "transactions" | "store">("courses");
  
  // Existing Course lists states
  const [activeTab, setActiveTab] = useState<"list" | "create" | "edit">("list");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Form states for Course
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Lập trình Web");
  const [level, setLevel] = useState<"Cơ bản" | "Trung cấp" | "Nâng cao">("Cơ bản");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [priceVnd, setPriceVnd] = useState<number>(199000);

  // Form states for Lesson Modal/Section
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);
  
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonDuration, setLessonDuration] = useState("15 phút");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [documentType, setDocumentType] = useState<"word" | "drive" | "none">("none");
  const [documentName, setDocumentName] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [aiSummary, setAiSummary] = useState("");

  // Document upload state
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Managed Student Accounts state
  const [students, setStudents] = useState<StudentAccount[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Google Transactions state
  const [transactions, setTransactions] = useState<GoogleTransaction[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);

  // Google Store Release Assets
  const [storeAssets, setStoreAssets] = useState<{
    listing: string;
    policy: string;
    playStoreConfig: {
      bundleId: string;
      versionCode: number;
      versionName: string;
      requiredSdk: string;
      supportEmail: string;
      developerName: string;
    };
  } | null>(null);
  const [isLoadingStore, setIsLoadingStore] = useState(false);
  const [copiedListing, setCopiedListing] = useState(false);
  const [copiedPolicy, setCopiedPolicy] = useState(false);

  // Fetch lists from database
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const res = await fetch("/api/students");
      if (res.ok) {
        setStudents(await res.json());
      }
    } catch (err) {
      console.error("Error loading student database", err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchTransactions = async () => {
    setIsLoadingTxs(true);
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        setTransactions(await res.json());
      }
    } catch (err) {
      console.error("Error loading transactions", err);
    } finally {
      setIsLoadingTxs(false);
    }
  };

  const fetchStoreAssets = async () => {
    setIsLoadingStore(true);
    try {
      const res = await fetch("/api/store-assets");
      if (res.ok) {
        setStoreAssets(await res.json());
      }
    } catch (err) {
      console.error("Error loading store listing assets", err);
    } finally {
      setIsLoadingStore(false);
    }
  };

  // Initial loading
  useEffect(() => {
    fetchStudents();
    fetchTransactions();
    fetchStoreAssets();
  }, []);

  const resetCourseForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Lập trình Web");
    setLevel("Cơ bản");
    setThumbnailUrl("");
    setAuthor("");
    setLessons([]);
    setPriceVnd(199000);
    setShowLessonForm(false);
    setEditingLessonIndex(null);
  };

  const handleCreateNewCourse = () => {
    resetCourseForm();
    setActiveTab("create");
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setTitle(course.title);
    setDescription(course.description);
    setCategory(course.category);
    setLevel(course.level);
    setThumbnailUrl(course.thumbnailUrl);
    setAuthor(course.author);
    setLessons(course.lessons || []);
    setPriceVnd(course.priceVnd !== undefined ? course.priceVnd : 199000);
    setActiveTab("edit");
  };

  // Drag and drop events for .docx file
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileProcess(e.target.files[0]);
    }
  };

  const handleFileProcess = async (file: File) => {
    if (!file.name.endsWith(".docx")) {
      alert("Vui lòng chỉ tải lên file Word định dạng .docx");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload-docx", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Không thể xử lý file Word.");
      }

      const data = await response.json();
      setDocumentName(data.documentName);
      setDocumentContent(data.documentContent);
      setAiSummary(data.aiSummary);
    } catch (error: any) {
      console.error(error);
      alert("Đã xảy ra lỗi: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Lessons handlers
  const handleOpenLessonForm = () => {
    setLessonTitle("");
    setLessonDescription("");
    setLessonDuration("15 phút");
    setLessonVideoUrl("");
    setDocumentType("none");
    setDocumentName("");
    setDocumentContent("");
    setDocumentUrl("");
    setAiSummary("");
    setEditingLessonIndex(null);
    setShowLessonForm(true);
  };

  const handleEditLesson = (index: number) => {
    const lesson = lessons[index];
    setLessonTitle(lesson.title);
    setLessonDescription(lesson.description);
    setLessonDuration(lesson.duration);
    setLessonVideoUrl(lesson.videoUrl || "");
    setDocumentType(lesson.documentType);
    setDocumentName(lesson.documentName || "");
    setDocumentContent(lesson.documentContent || "");
    setDocumentUrl(lesson.documentUrl || "");
    setAiSummary(lesson.aiSummary || "");
    setEditingLessonIndex(index);
    setShowLessonForm(true);
  };

  const handleDeleteLesson = (index: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xoá bài học này?")) {
      setLessons(lessons.filter((_, idx) => idx !== index));
    }
  };

  const handleSaveLesson = () => {
    if (!lessonTitle.trim()) {
      alert("Vui lòng nhập tiêu đề bài học");
      return;
    }

    const newLesson: Lesson = {
      id: editingLessonIndex !== null ? lessons[editingLessonIndex].id : `lesson-${Date.now()}`,
      title: lessonTitle,
      description: lessonDescription,
      duration: lessonDuration,
      videoUrl: lessonVideoUrl,
      documentType,
      documentName: documentType === "none" ? undefined : documentName,
      documentContent: documentType === "word" ? documentContent : documentType === "drive" ? documentContent : undefined,
      documentUrl: documentType === "drive" ? documentUrl : undefined,
      aiSummary: aiSummary || undefined
    };

    if (editingLessonIndex !== null) {
      const updated = [...lessons];
      updated[editingLessonIndex] = newLesson;
      setLessons(updated);
    } else {
      setLessons([...lessons, newLesson]);
    }

    setShowLessonForm(false);
    setEditingLessonIndex(null);
  };

  // Submit Course
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Vui lòng điền tiêu đề khoá học");
      return;
    }

    const courseData = {
      title,
      description,
      category,
      level,
      thumbnailUrl: thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
      author: author || "Giảng viên",
      lessons,
      priceVnd: Number(priceVnd)
    };

    try {
      if (activeTab === "create") {
        const response = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(courseData),
        });
        if (response.ok) {
          const newCourse = await response.json();
          onCourseAdded(newCourse);
          setActiveTab("list");
          resetCourseForm();
        } else {
          throw new Error("Lỗi khi thêm khoá học");
        }
      } else if (activeTab === "edit" && selectedCourse) {
        const response = await fetch(`/api/courses/${selectedCourse.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(courseData),
        });
        if (response.ok) {
          const updatedCourse = await response.json();
          onCourseUpdated(updatedCourse);
          setActiveTab("list");
          setSelectedCourse(null);
          resetCourseForm();
        } else {
          throw new Error("Lỗi khi cập nhật khoá học");
        }
      }
    } catch (error: any) {
      alert("Đã xảy ra lỗi khi lưu khoá học: " + error.message);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm("Bạn có thật sự muốn xoá khoá học này và tất cả các bài học liên quan?")) {
      try {
        const response = await fetch(`/api/courses/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          onCourseDeleted(id);
        } else {
          throw new Error("Không thể xoá khoá học trên máy chủ");
        }
      } catch (error: any) {
        alert("Lỗi khi xoá khoá học: " + error.message);
      }
    }
  };

  const copyToClipboard = (text: string, isPolicy: boolean) => {
    navigator.clipboard.writeText(text);
    if (isPolicy) {
      setCopiedPolicy(true);
      setTimeout(() => setCopiedPolicy(false), 2000);
    } else {
      setCopiedListing(true);
      setTimeout(() => setCopiedListing(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. ADMIN PANEL TOP HEADER WITH MULTI-TABS SUB-BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            Bảng điều khiển Giảng viên
          </h2>
          <p className="text-xs text-slate-500">Quản lý kho lưu trữ, kiểm duyệt tài khoản học viên và chuẩn bị hồ sơ lên Google Store</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto self-start md:self-auto">
          <button
            onClick={() => setAdminSubTab("courses")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              adminSubTab === "courses" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Giáo án ({courses.length})
          </button>
          <button
            onClick={() => { setAdminSubTab("students"); fetchStudents(); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              adminSubTab === "students" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Học viên ({students.length})
          </button>
          <button
            onClick={() => { setAdminSubTab("transactions"); fetchTransactions(); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              adminSubTab === "transactions" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Google Revenue
          </button>
          <button
            onClick={() => { setAdminSubTab("store"); fetchStoreAssets(); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              adminSubTab === "store" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Google Store Ready 🚀
          </button>
        </div>
      </div>

      {/* ========================================================
          SUB-TAB 1: EXISTING SYLLABUS / COURSES MANAGER (ORIGINAL)
         ======================================================== */}
      {adminSubTab === "courses" && (
        <div className="space-y-6">
          {activeTab === "list" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh sách Khóa học giảng dạy</span>
                <button
                  id="btn-create-course"
                  onClick={handleCreateNewCourse}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Tạo khoá học mới
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <div key={course.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="p-5 flex gap-4">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-20 h-20 object-cover rounded-xl shrink-0 bg-slate-100 border border-slate-100"
                      />
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold mb-1.5">
                          {course.category}
                        </span>
                        <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{course.title}</h3>
                        <p className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                          <span>Cấp độ: <strong className="text-indigo-600">{course.level}</strong></span>
                          <span>•</span>
                          <span>Bài học: <strong>{course.lessons?.length || 0}</strong></span>
                          <span>•</span>
                          <span>Giá: <strong className="text-emerald-600">{course.priceVnd === 0 ? "Miễn phí" : `${course.priceVnd?.toLocaleString("vi-VN")}đ`}</strong></span>
                        </p>
                      </div>
                    </div>
                    <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Tác giả: {course.author}</span>
                      <div className="flex items-center gap-2">
                        <button
                          id={`btn-edit-course-${course.id}`}
                          onClick={() => handleEditCourse(course)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Chỉnh sửa giáo trình"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-course-${course.id}`}
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xoá khoá học"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {courses.length === 0 && (
                  <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                    <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-medium text-slate-600">Chưa có khoá học nào được tạo</p>
                    <p className="text-xs text-slate-400 mt-1">Hãy bắt đầu tạo khoá học học trực tuyến đầu tiên ngay bây giờ!</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CREATE OR EDIT COURSE FORM */
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 hover:text-slate-800 cursor-pointer mb-6 text-sm font-medium" onClick={() => setActiveTab("list")}>
                <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
              </div>

              <form onSubmit={handleSaveCourse} className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800">
                  {activeTab === "create" ? "Thêm mới khoá học" : `Chỉnh sửa: ${selectedCourse?.title}`}
                </h3>

                {/* Course Information Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Tiêu đề khoá học *</label>
                    <input
                      id="course-title-input"
                      type="text"
                      required
                      placeholder="Ví dụ: Lập trình React đại cương"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Danh mục / Chủ đề</label>
                    <select
                      id="course-category-input"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Lập trình Web">Lập trình Web</option>
                      <option value="Trí tuệ nhân tạo">Trí tuệ nhân tạo</option>
                      <option value="Thiết kế UI/UX">Thiết kế UI/UX</option>
                      <option value="Kinh doanh & Marketing">Kinh doanh & Marketing</option>
                      <option value="Kỹ năng mềm">Kỹ năng mềm</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Trình độ khoá học</label>
                    <div className="flex gap-2">
                      {["Cơ bản", "Trung cấp", "Nâng cao"].map((lvl) => (
                        <button
                          id={`level-${lvl}`}
                          key={lvl}
                          type="button"
                          onClick={() => setLevel(lvl as any)}
                          className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${
                            level === lvl 
                              ? "bg-indigo-50 border-indigo-600 text-indigo-700" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Giảng viên đứng lớp</label>
                    <input
                      id="course-author-input"
                      type="text"
                      placeholder="Tên giáo viên hoặc thương hiệu học viện"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Giá tiền khóa học (VNĐ) *</label>
                    <div className="relative">
                      <input
                        id="course-price-input"
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="Ví dụ: 199000 (0 nếu là miễn phí)"
                        value={priceVnd}
                        onChange={(e) => setPriceVnd(Number(e.target.value))}
                        className="w-full pl-3.5 pr-12 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                      />
                      <span className="absolute right-3.5 top-2 text-xs font-bold text-slate-400">đ</span>
                    </div>
                  </div>

                  <div className="space-y-1 col-span-full">
                    <label className="text-xs font-semibold text-slate-600">Đường dẫn ảnh thu nhỏ (Thumbnail Image URL)</label>
                    <input
                      id="course-thumbnail-input"
                      type="text"
                      placeholder="Dán link ảnh từ Unsplash hoặc lưu trữ ngoài"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 col-span-full">
                    <label className="text-xs font-semibold text-slate-600">Tóm tắt mô tả khoá học</label>
                    <textarea
                      id="course-description-input"
                      rows={3}
                      placeholder="Viết một đoạn ngắn giới thiệu mục tiêu học tập, đối tượng phù hợp và kết quả của khoá học."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>

                {/* LESSONS LIST MANAGEMENT */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Danh sách bài học ({lessons.length})</h4>
                      <p className="text-[11px] text-slate-500">Bấm nút "Thêm bài học mới" để tạo bài viết giảng dạy và chèn video</p>
                    </div>
                    <button
                      id="btn-add-lesson-modal"
                      type="button"
                      onClick={handleOpenLessonForm}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm bài học mới
                    </button>
                  </div>

                  {/* Lesson Items */}
                  <div className="space-y-2">
                    {lessons.map((lesson, index) => (
                      <div key={index} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">
                            {index + 1}
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-slate-800">{lesson.title}</h5>
                            <p className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{lesson.duration}</span>
                              {lesson.videoUrl && (
                                <span className="flex items-center gap-0.5 text-red-600"><Video className="w-3 h-3" /> YouTube Video</span>
                              )}
                              {lesson.documentType !== "none" && (
                                <span className="flex items-center gap-0.5 text-blue-600">
                                  <FileText className="w-3 h-3" /> 
                                  {lesson.documentType === "word" ? "Word document" : "Google Drive"}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            id={`edit-lesson-${index}`}
                            type="button"
                            onClick={() => handleEditLesson(index)}
                            className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete-lesson-${index}`}
                            type="button"
                            onClick={() => handleDeleteLesson(index)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {lessons.length === 0 && (
                      <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <p className="text-xs text-slate-400">Khoá học này chưa có bài giảng nào. Vui lòng thêm bài giảng đầu tiên.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* LESSON DETAIL MODAL/FORM OVERLAY */}
                {showLessonForm && (
                  <div className="p-5 border border-indigo-100 bg-indigo-50/30 rounded-2xl space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2">
                      <h5 className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                        {editingLessonIndex !== null ? `Chỉnh sửa bài học #${editingLessonIndex + 1}` : "Tạo bài học mới"}
                      </h5>
                      <button
                        type="button"
                        onClick={() => setShowLessonForm(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Đóng
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-indigo-950">Tiêu đề bài học *</label>
                        <input
                          id="lesson-title-input"
                          type="text"
                          placeholder="Nhập tiêu đề chương/bài giảng"
                          value={lessonTitle}
                          onChange={(e) => setLessonTitle(e.target.value)}
                          className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-indigo-950">Thời lượng học tập (ước tính)</label>
                        <input
                          id="lesson-duration-input"
                          type="text"
                          placeholder="Ví dụ: 15 phút, 1 tiếng"
                          value={lessonDuration}
                          onChange={(e) => setLessonDuration(e.target.value)}
                          className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="space-y-1 col-span-full">
                        <label className="text-xs font-semibold text-indigo-950">Mô tả ngắn bài học</label>
                        <input
                          id="lesson-desc-input"
                          type="text"
                          placeholder="Giới thiệu nhanh học viên sẽ thu nhận được gì từ bài giảng này."
                          value={lessonDescription}
                          onChange={(e) => setLessonDescription(e.target.value)}
                          className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="space-y-1 col-span-full">
                        <label className="text-xs font-semibold text-indigo-950 flex items-center gap-1 text-red-700">
                          <Video className="w-3.5 h-3.5" /> Đường dẫn Video YouTube (Tùy chọn)
                        </label>
                        <input
                          id="lesson-video-input"
                          type="text"
                          placeholder="Ví dụ: https://www.youtube.com/watch?v=..."
                          value={lessonVideoUrl}
                          onChange={(e) => setLessonVideoUrl(e.target.value)}
                          className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      {/* Document Choice selector */}
                      <div className="space-y-1.5 col-span-full pt-2">
                        <label className="text-xs font-semibold text-indigo-950 block">Tài liệu học kèm bài giảng</label>
                        <div className="flex gap-2">
                          <button
                            id="doc-none-selector"
                            type="button"
                            onClick={() => setDocumentType("none")}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                              documentType === "none" ? "bg-indigo-600 text-white border-transparent" : "bg-white text-slate-600 border-slate-200"
                            }`}
                          >
                            Không có tài liệu
                          </button>
                          <button
                            id="doc-word-selector"
                            type="button"
                            onClick={() => setDocumentType("word")}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                              documentType === "word" ? "bg-indigo-600 text-white border-transparent" : "bg-white text-slate-600 border-slate-200"
                            }`}
                          >
                            Word file (.docx)
                          </button>
                          <button
                            id="doc-drive-selector"
                            type="button"
                            onClick={() => setDocumentType("drive")}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                              documentType === "drive" ? "bg-indigo-600 text-white border-transparent" : "bg-white text-slate-600 border-slate-200"
                            }`}
                          >
                            Google Drive Link
                          </button>
                        </div>
                      </div>

                      {/* DOCUMENT CHOICE VIEWS */}
                      {documentType === "word" && (
                        <div className="col-span-full bg-white p-4 border border-slate-200 rounded-xl space-y-3">
                          <span className="text-xs font-bold text-slate-700">Tải lên Giáo án/Bài viết Word (.docx)</span>

                          <div
                            id="docx-drag-container"
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                              dragActive 
                                ? "border-indigo-500 bg-indigo-50/50" 
                                : "border-slate-300 hover:border-slate-400 bg-slate-50"
                            }`}
                          >
                            <input
                              id="docx-file-input"
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept=".docx"
                              className="hidden"
                            />
                            {isUploading ? (
                              <div className="space-y-2">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                                <p className="text-xs text-slate-600 font-medium">Đang trích xuất văn bản & Định dạng giáo trình bằng Gemini AI...</p>
                              </div>
                            ) : documentName ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-center gap-1 text-emerald-600 font-medium">
                                  <Check className="w-5 h-5" />
                                  <span className="text-xs">Đã trích xuất xong:</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-700">{documentName}</p>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                                <p className="text-xs text-slate-700 font-medium">Kéo thả file .docx vào đây, hoặc <span className="text-indigo-600 underline">bấm chọn file</span></p>
                              </div>
                            )}
                          </div>

                          {documentContent && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                  <Eye className="w-4 h-4 text-indigo-600" /> Bản xem trước giáo án thô:
                                </span>
                              </div>
                              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-lg text-[11px] font-mono max-h-36 overflow-y-auto whitespace-pre-wrap border border-slate-800">
                                {documentContent}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {documentType === "drive" && (
                        <div className="col-span-full bg-white p-4 border border-slate-200 rounded-xl space-y-3">
                          <span className="text-xs font-bold text-slate-700">Liên kết tài liệu Google Drive</span>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-slate-500">Đường dẫn chia sẻ (Google Drive Link) *</label>
                              <input
                                id="drive-url-input"
                                type="text"
                                placeholder="Ví dụ: https://docs.google.com/document/d/.../edit"
                                value={documentUrl}
                                onChange={(e) => setDocumentUrl(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-slate-500">Tên tài liệu hiển thị</label>
                              <input
                                id="drive-name-input"
                                type="text"
                                placeholder="Ví dụ: Slide_Thiet_Ke_Trang_Chu.pdf"
                                value={documentName}
                                onChange={(e) => setDocumentName(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-indigo-100/30">
                      <button
                        type="button"
                        onClick={() => setShowLessonForm(false)}
                        className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs text-slate-600"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        id="save-lesson-btn"
                        type="button"
                        onClick={handleSaveLesson}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                      >
                        <Check className="w-3.5 h-3.5" /> Lưu bài học này
                      </button>
                    </div>
                  </div>
                )}

                {/* ACTION SAVE COURSE */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("list");
                      setSelectedCourse(null);
                      resetCourseForm();
                    }}
                    className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-sm text-slate-600 font-medium"
                  >
                    Hủy thay đổi
                  </button>
                  <button
                    id="btn-save-course-sub"
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm"
                  >
                    <Save className="w-4 h-4" /> Lưu khoá học
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: STUDENT ACCOUNTS MANAGEMENT (NEW!)
         ======================================================== */}
      {adminSubTab === "students" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Danh sách cơ sở dữ liệu</span>
              <h3 className="text-base font-bold text-slate-800">Quản lý Tài khoản Học viên</h3>
            </div>
            <button
              onClick={fetchStudents}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              Làm mới danh sách
            </button>
          </div>

          {isLoadingStudents ? (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Đang tải hồ sơ học viên...</p>
            </div>
          ) : students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5">Học viên</th>
                    <th className="py-2.5">Đăng nhập email</th>
                    <th className="py-2.5">Ngày tham gia</th>
                    <th className="py-2.5">Gói Subscription Google</th>
                    <th className="py-2.5 text-right">Khóa học đăng ký lẻ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={student.avatarUrl} 
                            alt={student.name} 
                            className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                          />
                          <span className="font-bold text-slate-800">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-slate-500">{student.email}</td>
                      <td className="py-3 text-slate-400">{new Date(student.joinedAt).toLocaleDateString("vi-VN")}</td>
                      <td className="py-3">
                        {student.subscriptionTier === "pro" && (
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md text-[9px] font-black tracking-wide uppercase">
                            PRO YEARLY
                          </span>
                        )}
                        {student.subscriptionTier === "lifetime" && (
                          <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-md text-[9px] font-black tracking-wide uppercase">
                            LIFETIME VIP
                          </span>
                        )}
                        {student.subscriptionTier === "free" && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-md text-[9px] font-medium uppercase">
                            MEMBER FREE
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold">
                          {student.subscribedCourseIds?.length || 0} khóa học lẻ
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              Chưa có thông tin học viên trong cơ sở dữ liệu.
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: GOOGLE TRANSACTIONS LOGS (NEW!)
         ======================================================== */}
      {adminSubTab === "transactions" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sổ cái doanh thu Google Play</span>
              <h3 className="text-base font-bold text-slate-800">Lịch sử Đăng ký Subscription</h3>
            </div>
            <button
              onClick={fetchTransactions}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              Đồng bộ dữ liệu Google Play Console
            </button>
          </div>

          {isLoadingTxs ? (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 mt-2">Đang đồng bộ giao dịch thanh toán...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5">Khách hàng</th>
                    <th className="py-2.5">Sản phẩm đăng ký</th>
                    <th className="py-2.5">Mã Google Order ID</th>
                    <th className="py-2.5">Doanh thu VNĐ</th>
                    <th className="py-2.5">Ngày mua</th>
                    <th className="py-2.5 text-right">Trạng thái Google API</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-slate-800">{tx.email}</td>
                      <td className="py-3">{tx.packageName}</td>
                      <td className="py-3 font-mono text-[10px] text-indigo-600">{tx.googleOrderId}</td>
                      <td className="py-3 font-bold text-slate-900">{tx.amountVnd.toLocaleString("vi-VN")}đ</td>
                      <td className="py-3 text-slate-400">{new Date(tx.timestamp).toLocaleString("vi-VN")}</td>
                      <td className="py-3 text-right">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 rounded-full text-[9px]">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              Chưa có giao dịch subscription nào qua Google Play Services.
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 4: GOOGLE PLAY STORE RELEASE DOCUMENTS (NEW!)
         ======================================================== */}
      {adminSubTab === "store" && (
        <div className="space-y-6">
          {/* General instructions */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-emerald-950 text-sm">Hồ sơ Cửa hàng và Tài liệu Pháp lý Google Store đã sẵn sàng</h4>
              <p className="text-xs text-emerald-850 leading-relaxed">
                Các tệp tin **`google_play_store_listing.txt`** và **`privacy_policy.md`** đã được tự động tạo lập, mã hóa thành công trong thư mục gốc của dự án. Bạn có thể trực tiếp sao chép nội dung hoặc định cấu hình In-App Subscriptions bên dưới để đẩy ứng dụng lên Google Play Developer Console.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (5/12) - Build Configuration for Google Console */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thông số kỹ thuật</span>
                <h4 className="font-bold text-slate-800 text-sm">Cấu hình Đóng gói Android (Play Store SDK)</h4>
              </div>

              {isLoadingStore ? (
                <div className="text-center py-4">
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mx-auto" />
                </div>
              ) : storeAssets ? (
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Tên gói (Package ID):</span>
                    <span className="font-mono font-bold text-slate-800">{storeAssets.playStoreConfig.bundleId}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Yêu cầu SDK tối thiểu:</span>
                    <span className="font-semibold text-slate-800">{storeAssets.playStoreConfig.requiredSdk}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Phiên bản ban đầu:</span>
                    <span className="font-semibold text-slate-800">v{storeAssets.playStoreConfig.versionName} (Build {storeAssets.playStoreConfig.versionCode})</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Email Nhà phát triển:</span>
                    <span className="font-bold text-indigo-600">{storeAssets.playStoreConfig.supportEmail}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50">
                    <span className="text-slate-400">Họ tên chủ tài khoản:</span>
                    <span className="font-bold text-slate-800">{storeAssets.playStoreConfig.developerName}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2 mt-4">
                    <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Các mã ID In-App Product ID cần khai báo:</p>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-1 font-mono">
                      <li>sub_premium_course_monthly</li>
                      <li>sub_elearn_pro_yearly</li>
                      <li>sub_elearn_lifetime</li>
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right Column (7/12) - Assets Copy Box */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* ASSET 1: STORE LISTING COPY */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4.5 h-4.5 text-indigo-600" />
                    <h4 className="font-bold text-slate-800 text-xs">Mô tả Cửa hàng Google Play (Play Store Meta)</h4>
                  </div>
                  <button
                    onClick={() => storeAssets && copyToClipboard(storeAssets.listing, false)}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold transition-all"
                  >
                    {copiedListing ? <Check className="w-3 h-3 text-emerald-600" /> : <Clipboard className="w-3 h-3" />}
                    {copiedListing ? "Đã sao chép!" : "Sao chép"}
                  </button>
                </div>
                
                <textarea
                  readOnly
                  rows={6}
                  value={storeAssets?.listing || "Đang tải dữ liệu..."}
                  className="w-full p-3 bg-slate-900 text-slate-300 rounded-xl text-[10.5px] font-mono leading-relaxed focus:outline-none resize-none"
                />
              </div>

              {/* ASSET 2: PRIVACY POLICY COPY */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4.5 h-4.5 text-emerald-600" />
                    <h4 className="font-bold text-slate-800 text-xs">Chính sách bảo mật bắt buộc (Privacy Policy XML/Markdown)</h4>
                  </div>
                  <button
                    onClick={() => storeAssets && copyToClipboard(storeAssets.policy, true)}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-bold transition-all"
                  >
                    {copiedPolicy ? <Check className="w-3 h-3 text-emerald-600" /> : <Clipboard className="w-3 h-3" />}
                    {copiedPolicy ? "Đã sao chép!" : "Sao chép"}
                  </button>
                </div>
                
                <textarea
                  readOnly
                  rows={6}
                  value={storeAssets?.policy || "Đang tải dữ liệu..."}
                  className="w-full p-3 bg-slate-900 text-slate-300 rounded-xl text-[10.5px] font-mono leading-relaxed focus:outline-none resize-none"
                />
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
