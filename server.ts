import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import mammoth from "mammoth";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Setup storage path for courses database
const COURSES_FILE = path.join(process.cwd(), "courses.json");

// Lazy load Gemini API
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in environment variables. AI features will be disabled or fall back to mock helper.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Default course seeds in Vietnamese
const DEFAULT_COURSES = [
  {
    id: "course-1",
    title: "Lập trình Web hiện đại với React & Tailwind CSS",
    description: "Khoá học toàn diện giúp bạn làm chủ React 19, Vite, và Tailwind CSS v4 để xây dựng các ứng dụng web siêu nhanh, tối ưu hóa hiệu năng và thiết kế giao diện hiện đại.",
    category: "Lập trình Web",
    level: "Cơ bản",
    priceVnd: 0,
    thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80",
    author: "Giảng viên Nguyễn Văn A",
    createdAt: "2026-07-01T00:00:00.000Z",
    lessons: [
      {
        id: "lesson-1-1",
        title: "Giới thiệu về React và cơ chế Virtual DOM",
        description: "Tìm hiểu các khái niệm cơ bản của React, tại sao React lại phổ biến và cơ chế Virtual DOM hoạt động ra sao để tối ưu hoá tốc độ render giao diện.",
        duration: "12 phút",
        videoUrl: "https://www.youtube.com/watch?v=dGcsHMXbSOA",
        documentType: "word",
        documentName: "Giao_trinh_React_Can_Ban.docx",
        documentContent: "# Giáo trình React Căn Bản\n\n## 1. React là gì?\nReact là một thư viện JavaScript mã nguồn mở được phát triển bởi Facebook (nay là Meta) dùng để xây dựng giao diện người dùng (UI), đặc biệt là các ứng dụng đơn trang (Single Page Application - SPA).\n\n## 2. Các đặc trưng cốt lõi\n- **Component-Based**: Chia nhỏ giao diện thành các thành phần độc lập, dễ dàng tái sử dụng và quản lý.\n- **Declarative**: React giúp lập trình viên mô tả giao diện một cách trực quan theo trạng thái (state), tự động cập nhật khi dữ liệu thay đổi.\n- **Virtual DOM**: Thay vì cập nhật trực tiếp lên DOM thật của trình duyệt (thao tác rất chậm), React sử dụng một bản sao nhẹ gọi là DOM ảo để tính toán những thay đổi tối thiểu cần cập nhật.\n\n## 3. Tại sao chọn React?\n- Cộng đồng lập trình viên cực kỳ lớn mạnh, tài liệu phong phú.\n- Hiệu năng cao nhờ Virtual DOM và thuật toán Reconciliation tối ưu.\n- Hệ sinh thái dồi dào, hỗ trợ cả phát triển ứng dụng di động thông qua React Native.",
        aiSummary: "Bài học này giới thiệu về React - thư viện UI component-based của Meta. Điểm nhấn kỹ thuật chính là cơ chế Virtual DOM giúp cải thiện hiệu năng vượt trội so với thao tác DOM truyền thống nhờ thuật toán so khớp (diffing) trước khi vẽ lại giao diện."
      },
      {
        "id": "lesson-1-2",
        "title": "Xây dựng giao diện Responsive với Tailwind CSS v4",
        "description": "Hướng dẫn sử dụng Tailwind CSS để thiết kế giao diện thích ứng thông minh với nhiều kích thước màn hình từ điện thoại di động đến máy tính để bàn.",
        "duration": "18 phút",
        "videoUrl": "https://www.youtube.com/watch?v=mSgD_S79P84",
        "documentType": "drive",
        "documentName": "Tailwind_Responsive_CheatSheet",
        "documentUrl": "https://docs.google.com/document/d/1t_I_T6wE4-bX3Bswq7zX5r1x_W81yM7bB89gXlI4ZkM/edit",
        "documentContent": "# Hướng dẫn Thiết kế Responsive với Tailwind CSS\n\nSử dụng các tiền tố kích thước màn hình (Breakpoints) của Tailwind để thiết kế giao diện thích ứng linh hoạt:\n\n- `sm:` Áp dụng từ màn hình nhỏ (>= 640px) trở lên (điện thoại nằm ngang)\n- `md:` Áp dụng từ màn hình trung bình (>= 768px) trở lên (máy tính bảng)\n- `lg:` Áp dụng từ màn hình lớn (>= 1024px) trở lên (máy tính xách tay)\n- `xl:` Áp dụng từ màn hình rất lớn (>= 1280px) trở lên (màn hình PC rộng)\n\n### Ví dụ thực tế về Grid Responsive:\n```html\n<div class=\"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4\">\n  <div class=\"bg-white p-4 rounded-xl border border-gray-100 shadow-sm\">Bài học 1</div>\n  <div class=\"bg-white p-4 rounded-xl border border-gray-100 shadow-sm\">Bài học 2</div>\n  <div class=\"bg-white p-4 rounded-xl border border-gray-100 shadow-sm\">Bài học 3</div>\n  <div class=\"bg-white p-4 rounded-xl border border-gray-100 shadow-sm\">Bài học 4</div>\n</div>\n```\nĐoạn mã trên sẽ hiển thị 1 cột trên điện thoại nhỏ, tự động giãn thành 2 cột trên màn hình điện thoại xoay ngang (`sm`), thành 3 cột trên máy tính bảng (`md`), và thành 4 cột trên máy tính xách tay (`lg`).",
        "aiSummary": "Bài học tập trung vào cách thiết kế Mobile-First và Responsive sử dụng hệ thống breakpoints mặc định của Tailwind CSS. Cung cấp ví dụ thực hành cụ thể về việc tối ưu hóa hiển thị lưới (grid layout) đa dạng trên các kích cỡ màn hình khác nhau."
      }
    ]
  },
  {
    id: "course-2",
    title: "Làm chủ Trí Tuệ Nhân Tạo với Gemini API",
    description: "Tìm hiểu cách tích hợp các mô hình ngôn ngữ lớn mới nhất từ Google vào ứng dụng của bạn. Xây dựng trợ lý ảo, phân tích tài liệu và xử lý thông tin thông minh.",
    category: "Trí tuệ nhân tạo",
    level: "Nâng cao",
    priceVnd: 199000,
    thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80",
    author: "Giảng viên Trần Chí T",
    createdAt: "2026-07-02T00:00:00.000Z",
    lessons: [
      {
        id: "lesson-2-1",
        title: "Tổng quan về Generative AI và các mô hình Gemini",
        description: "Tìm hiểu khái niệm Generative AI, lịch sử phát triển và cấu trúc các dòng mô hình Gemini mới nhất (Gemini 3.5 Flash, Gemini Pro).",
        duration: "15 phút",
        videoUrl: "https://www.youtube.com/watch?v=uK8f6fNAsvM",
        documentType: "word",
        documentName: "Tong_quan_Gemini_Models.docx",
        documentContent: "# Tổng quan về các mô hình Gemini từ Google\n\nGoogle Gemini đại diện cho thế hệ mô hình AI đa phương thức (multimodal) tiên tiến nhất, có khả năng hiểu và kết hợp thông tin trên nhiều định dạng khác nhau: văn bản, mã nguồn, âm thanh, hình ảnh và video ngay từ gốc.\n\n## Các dòng mô hình nổi bật:\n1. **Gemini Ultra**: Mô hình lớn nhất và có năng lực mạnh mẽ nhất dành cho các tác vụ cực kỳ phức tạp về lý thuyết và khoa học dữ liệu.\n2. **Gemini Pro**: Mô hình tối ưu hóa cho nhiều tác vụ suy luận thông thường, lập trình phức tạp và đối thoại dài.\n3. **Gemini Flash**: Mô hình cực kỳ nhanh, nhẹ, tiết kiệm chi phí nhưng vẫn duy trì độ chính xác cao cho các ứng dụng thời gian thực.\n\n## Đặc điểm đa phương thức gốc:\nKhông giống như các mô hình khác thường ghép nối các bộ xử lý riêng lẻ cho hình ảnh và văn bản thông qua các module bổ trợ, Gemini được thiết kế đa phương thức ngay từ đầu, giúp nó xử lý và kết hợp các loại dữ liệu đầu vào một cách liền mạch và hiệu quả hơn.",
        aiSummary: "Giới thiệu chi tiết về dòng mô hình Google Gemini mới nhất. Nhấn mạnh vào tính chất đa phương thức gốc (native multimodality), cho phép AI xử lý đồng thời văn bản, hình ảnh, âm thanh và video mà không cần qua các lớp trung gian, cùng sự phân chia các phiên bản Ultra, Pro, Flash phù hợp từng nhu cầu."
      }
    ]
  }
];

// Helper to load courses
function loadCourses(): any[] {
  try {
    let list: any[];
    if (fs.existsSync(COURSES_FILE)) {
      const data = fs.readFileSync(COURSES_FILE, "utf-8");
      list = JSON.parse(data);
    } else {
      fs.writeFileSync(COURSES_FILE, JSON.stringify(DEFAULT_COURSES, null, 2), "utf-8");
      list = DEFAULT_COURSES;
    }
    let updated = false;
    list = list.map((c: any) => {
      if (c.priceVnd === undefined || c.priceVnd === null) {
        c.priceVnd = c.level === "Cơ bản" ? 0 : 199000;
        updated = true;
      } else {
        c.priceVnd = Number(c.priceVnd);
      }
      return c;
    });
    if (updated) {
      saveCourses(list);
    }
    return list;
  } catch (error) {
    console.error("Error reading courses file:", error);
    return DEFAULT_COURSES;
  }
}

// Helper to save courses
function saveCourses(courses: any[]) {
  try {
    fs.writeFileSync(COURSES_FILE, JSON.stringify(courses, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing courses file:", error);
  }
}

// Initial seed
loadCourses();

// Multer upload config
const upload = multer({ storage: multer.memoryStorage() });

// API: Get all courses
app.get("/api/courses", (req, res) => {
  const courses = loadCourses();
  res.json(courses);
});

// API: Get specific course
app.get("/api/courses/:id", (req, res) => {
  const courses = loadCourses();
  const course = courses.find((c) => c.id === req.params.id);
  if (course) {
    res.json(course);
  } else {
    res.status(404).json({ error: "Không tìm thấy khoá học" });
  }
});

// API: Create a new course (Admin)
app.post("/api/courses", (req, res) => {
  const courses = loadCourses();
  const newCourse = {
    id: `course-${Date.now()}`,
    title: req.body.title || "Khoá học mới",
    description: req.body.description || "Chưa có mô tả.",
    category: req.body.category || "Chưa phân loại",
    level: req.body.level || "Cơ bản",
    thumbnailUrl: req.body.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    author: req.body.author || "Quản trị viên",
    createdAt: new Date().toISOString(),
    lessons: req.body.lessons || [],
    priceVnd: req.body.priceVnd !== undefined ? Number(req.body.priceVnd) : (req.body.level === "Cơ bản" ? 0 : 199000)
  };
  courses.push(newCourse);
  saveCourses(courses);
  res.status(211).json(newCourse); // Using status 201 or 200, let's use 200/201
});

// API: Update course (Admin)
app.put("/api/courses/:id", (req, res) => {
  const courses = loadCourses();
  const index = courses.findIndex((c) => c.id === req.params.id);
  if (index !== -1) {
    courses[index] = {
      ...courses[index],
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      level: req.body.level,
      thumbnailUrl: req.body.thumbnailUrl || courses[index].thumbnailUrl,
      author: req.body.author || courses[index].author,
      lessons: req.body.lessons || courses[index].lessons,
      priceVnd: req.body.priceVnd !== undefined ? Number(req.body.priceVnd) : courses[index].priceVnd
    };
    saveCourses(courses);
    res.json(courses[index]);
  } else {
    res.status(404).json({ error: "Không tìm thấy khoá học để cập nhật" });
  }
});

// API: Delete course (Admin)
app.delete("/api/courses/:id", (req, res) => {
  let courses = loadCourses();
  const initialLength = courses.length;
  courses = courses.filter((c) => c.id !== req.params.id);
  if (courses.length < initialLength) {
    saveCourses(courses);
    res.json({ success: true, message: "Đã xoá khoá học thành công" });
  } else {
    res.status(404).json({ error: "Không tìm thấy khoá học để xoá" });
  }
});

// API: Upload .docx file and convert to structured text/markdown
app.post("/api/upload-docx", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Vui lòng đính kèm một file Word (.docx)" });
    }

    // Convert Word buffer to text using Mammoth
    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    const rawText = result.value;
    
    // Convert to HTML as well for fallback representation
    const htmlResult = await mammoth.convertToHtml({ buffer: req.file.buffer });
    const htmlContent = htmlResult.value;

    let structuredMarkdown = "";
    let aiSummary = "";

    // Let's use Gemini to organize this document beautifully in Vietnamese if API key is provided
    const ai = getAIClient();
    if (ai && rawText.trim().length > 10) {
      try {
        const prompt = `Bạn là một trợ lý giáo vụ chuyên nghiệp. Dưới đây là nội dung văn bản thô được trích xuất từ một file Word (.docx) của một bài học. 
Nhiệm vụ của bạn là định dạng lại nội dung này thành định dạng Markdown giáo trình học tập tiếng Việt vô cùng chi tiết, đẹp mắt, có tiêu đề rõ ràng (#, ##, ###), các đoạn văn phân chia hợp lý, từ ngữ chuẩn sư phạm, và mã code ví dụ được đóng khung định dạng thích hợp (nếu có).

Nội dung thô từ file Word:
---
${rawText}
---

Hãy trả về phản hồi dưới dạng JSON hợp lệ theo cấu trúc sau:
{
  "formattedMarkdown": "Nội dung giáo trình bài học đã được định dạng Markdown chi tiết ở đây",
  "aiSummary": "Tóm tắt bài học trong khoảng 2-3 câu ngắn gọn làm nổi bật kiến thức cốt lõi"
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const data = JSON.parse(response.text || "{}");
        structuredMarkdown = data.formattedMarkdown || rawText;
        aiSummary = data.aiSummary || "Nội dung bài giảng được trích xuất trực tiếp từ tài liệu Word.";
      } catch (aiError) {
        console.error("Failed to format DOCX with Gemini API:", aiError);
        // Fallback
        structuredMarkdown = `# ${req.file.originalname.replace(".docx", "")}\n\n${rawText}`;
        aiSummary = "Nội dung tài liệu được trích xuất trực tiếp từ file Word.";
      }
    } else {
      // Fallback if Gemini key is missing
      structuredMarkdown = `# ${req.file.originalname.replace(".docx", "")}\n\n${rawText}`;
      aiSummary = "Nội dung tài liệu được trích xuất từ file Word (Chưa kích hoạt AI định dạng).";
    }

    res.json({
      documentName: req.file.originalname,
      documentContent: structuredMarkdown,
      htmlContent: htmlContent,
      aiSummary: aiSummary
    });
  } catch (error: any) {
    console.error("Error processing Word document:", error);
    res.status(500).json({ error: "Lỗi xử lý file Word: " + error.message });
  }
});

// API: Smart AI Tutor Chat for E-learning
app.post("/api/ai/chat", async (req, res) => {
  const { message, history, lessonTitle, lessonContent, courseTitle } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Tin nhắn không được để trống" });
  }

  const ai = getAIClient();
  if (!ai) {
    // Return friendly local AI fallback
    const answers = [
      `Chào bạn! Rất tiếc hiện tại khóa học đang tắt chế độ Trợ lý AI thực tế (Thiếu GEMINI_API_KEY). Nhưng dựa vào tài liệu bài học "${lessonTitle || "này"}", đây là bài học rất bổ ích. Bạn hãy nghiên cứu kỹ mã nguồn ví dụ hoặc video đi kèm nhé!`,
      `Chào học viên! Tôi là trợ lý học tập giả lập. Bài giảng "${lessonTitle || "này"}" thuộc khóa học "${courseTitle || "lập trình"}". Bạn có cần tôi tóm tắt các điểm chính trong tài liệu không?`,
      `Tuyệt vời! Bạn đang hỏi về "${message}". Để trả lời câu hỏi này tốt nhất, bạn vui lòng kích hoạt mã khóa Secrets GEMINI_API_KEY trên thanh công cụ để tôi có thể suy luận thông minh nhất nhé!`
    ];
    const fallbackAnswer = answers[Math.floor(Math.random() * answers.length)];
    return res.json({ text: fallbackAnswer });
  }

  try {
    // Construct instructions context
    const systemInstruction = `Bạn là "Trợ lý Học tập AI" thông minh, tận tâm và thân thiện, thuộc hệ thống học tập trực tuyến.
Nhiệm vụ của bạn là hỗ trợ học viên giải đáp các thắc mắc liên quan đến bài học hiện tại.
Hãy trả lời một cách rõ ràng, dễ hiểu, sử dụng tiếng Việt tự nhiên, khuyến khích học viên tư duy sáng tạo.
Nếu câu hỏi nằm ngoài nội dung bài học hoặc lập trình chung, bạn vẫn có thể trả lời một cách khéo léo để hướng học viên học tập tiến bộ.

BỐI CẢNH BÀI HỌC HIỆN TẠI:
- Khoá học: "${courseTitle || "Chưa rõ"}"
- Bài học: "${lessonTitle || "Chưa rõ"}"
- Nội dung tài liệu bài học:
"""
${lessonContent || "Chưa có tài liệu đính kèm"}
"""`;

    // Construct simple conversation history
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }]
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini AI Chat Error:", error);
    res.status(500).json({ error: "Lỗi kết nối Trợ lý AI: " + error.message });
  }
});

// === STUDENT ACCOUNT & GOOGLE SUBSCRIPTION PERSISTENCE ===
const STUDENTS_FILE = path.join(process.cwd(), "students.json");
const TRANSACTIONS_FILE = path.join(process.cwd(), "transactions.json");

const DEFAULT_STUDENTS = [
  {
    id: "student-1",
    email: "tranchanhtrung@gmail.com",
    name: "Trần Chánh Trung",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    joinedAt: "2026-07-01T08:30:00.000Z",
    subscriptionTier: "pro",
    subscribedCourseIds: ["course-1"]
  },
  {
    id: "student-2",
    email: "hocvien@gmail.com",
    name: "Nguyễn Văn Học Viên",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    joinedAt: "2026-07-03T10:15:00.000Z",
    subscriptionTier: "free",
    subscribedCourseIds: []
  }
];

const DEFAULT_TRANSACTIONS = [
  {
    id: "tx-1",
    email: "tranchanhtrung@gmail.com",
    packageId: "sub_elearn_pro_yearly",
    packageName: "Gói E-Learn AI Pro (1 Năm)",
    amountVnd: 499000,
    googleOrderId: "GPA.3312-5819-2241-10522",
    timestamp: "2026-07-01T09:00:00.000Z",
    status: "Thành công"
  }
];

function loadStudents() {
  try {
    if (fs.existsSync(STUDENTS_FILE)) {
      return JSON.parse(fs.readFileSync(STUDENTS_FILE, "utf-8"));
    } else {
      fs.writeFileSync(STUDENTS_FILE, JSON.stringify(DEFAULT_STUDENTS, null, 2), "utf-8");
      return DEFAULT_STUDENTS;
    }
  } catch (err) {
    console.error("Error loading students:", err);
    return DEFAULT_STUDENTS;
  }
}

function saveStudents(students: any[]) {
  try {
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving students:", err);
  }
}

function loadTransactions() {
  try {
    if (fs.existsSync(TRANSACTIONS_FILE)) {
      return JSON.parse(fs.readFileSync(TRANSACTIONS_FILE, "utf-8"));
    } else {
      fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(DEFAULT_TRANSACTIONS, null, 2), "utf-8");
      return DEFAULT_TRANSACTIONS;
    }
  } catch (err) {
    console.error("Error loading transactions:", err);
    return DEFAULT_TRANSACTIONS;
  }
}

function saveTransactions(txs: any[]) {
  try {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(txs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving transactions:", err);
  }
}

// Ensure database files are initialized on boot
loadStudents();
loadTransactions();

// API: Get all student accounts (for Admin view)
app.get("/api/students", (req, res) => {
  const students = loadStudents();
  res.json(students);
});

// API: Get or automatically create student profile on login/simulate
app.get("/api/students/:email", (req, res) => {
  const email = req.params.email.toLowerCase().trim();
  const students = loadStudents();
  let student = students.find((s: any) => s.email.toLowerCase() === email);
  
  if (!student) {
    // Auto-create basic profile
    const randomImgNum = Math.floor(Math.random() * 70);
    student = {
      id: `student-${Date.now()}`,
      email: email,
      name: email.split("@")[0].toUpperCase(),
      avatarUrl: `https://i.pravatar.cc/150?img=${randomImgNum}`,
      joinedAt: new Date().toISOString(),
      subscriptionTier: "free",
      subscribedCourseIds: []
    };
    students.push(student);
    saveStudents(students);
  }
  res.json(student);
});

// API: Save or update student account details
app.post("/api/students", (req, res) => {
  const { email, name, avatarUrl, subscriptionTier, subscribedCourseIds } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email không được để trống" });
  }

  const emailNorm = email.toLowerCase().trim();
  const students = loadStudents();
  let index = students.findIndex((s: any) => s.email.toLowerCase() === emailNorm);

  if (index !== -1) {
    students[index] = {
      ...students[index],
      name: name || students[index].name,
      avatarUrl: avatarUrl || students[index].avatarUrl,
      subscriptionTier: subscriptionTier || students[index].subscriptionTier,
      subscribedCourseIds: subscribedCourseIds || students[index].subscribedCourseIds
    };
    saveStudents(students);
    res.json(students[index]);
  } else {
    const newStudent = {
      id: `student-${Date.now()}`,
      email: emailNorm,
      name: name || emailNorm.split("@")[0],
      avatarUrl: avatarUrl || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      joinedAt: new Date().toISOString(),
      subscriptionTier: subscriptionTier || "free",
      subscribedCourseIds: subscribedCourseIds || []
    };
    students.push(newStudent);
    saveStudents(students);
    res.json(newStudent);
  }
});

// API: Trigger Google Subscription registration / Sandbox purchase processing
app.post("/api/students/:email/subscribe", (req, res) => {
  const email = req.params.email.toLowerCase().trim();
  const { packageId, packageName, amountVnd, courseId, googleOrderId } = req.body;

  if (!packageId || !googleOrderId) {
    return res.status(400).json({ error: "Thiếu thông tin gói đăng ký hoặc Mã đơn hàng Google Play" });
  }

  const students = loadStudents();
  const transactions = loadTransactions();

  const studentIndex = students.findIndex((s: any) => s.email.toLowerCase() === email);
  if (studentIndex === -1) {
    return res.status(404).json({ error: "Không tìm thấy tài khoản học viên này" });
  }

  // 1. Create secure Google payment log transaction
  const newTx = {
    id: `tx-${Date.now()}`,
    email: email,
    packageId: packageId,
    packageName: packageName,
    amountVnd: Number(amountVnd),
    googleOrderId: googleOrderId,
    courseId: courseId || null,
    timestamp: new Date().toISOString(),
    status: "Thành công"
  };
  transactions.push(newTx);
  saveTransactions(transactions);

  // 2. Upgrade student subscription status
  if (packageId === "sub_elearn_pro_yearly") {
    students[studentIndex].subscriptionTier = "pro";
  } else if (packageId === "sub_elearn_lifetime") {
    students[studentIndex].subscriptionTier = "lifetime";
  } else if (courseId) {
    // Specifically subscribed to this individual course/module
    const currentList = students[studentIndex].subscribedCourseIds || [];
    if (!currentList.includes(courseId)) {
      students[studentIndex].subscribedCourseIds = [...currentList, courseId];
    }
  }

  saveStudents(students);
  res.json({
    success: true,
    message: "Giao dịch Đăng ký qua Google hoàn tất thành công!",
    student: students[studentIndex],
    transaction: newTx
  });
});

// API: Fetch Google transaction logs (Admin)
app.get("/api/transactions", (req, res) => {
  const transactions = loadTransactions();
  res.json(transactions);
});

// API: Fetch Google Store deployment document assets
app.get("/api/store-assets", (req, res) => {
  try {
    const listingPath = path.join(process.cwd(), "google_play_store_listing.txt");
    const policyPath = path.join(process.cwd(), "privacy_policy.md");

    const listingText = fs.existsSync(listingPath) 
      ? fs.readFileSync(listingPath, "utf-8")
      : "File listing chưa được tạo.";
    const policyText = fs.existsSync(policyPath)
      ? fs.readFileSync(policyPath, "utf-8")
      : "File chính sách bảo mật chưa được tạo.";

    res.json({
      listing: listingText,
      policy: policyText,
      playStoreConfig: {
        bundleId: "com.elearn.ai.platform",
        versionCode: 1,
        versionName: "1.0.0",
        requiredSdk: "Android 8.0 (API 26) trở lên",
        supportEmail: "tranchanhtrung@gmail.com",
        developerName: "Trần Chánh Trung"
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Lỗi tải tài liệu cửa hàng: " + err.message });
  }
});

// Start Full-Stack Server (Express + Vite wrapper)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
