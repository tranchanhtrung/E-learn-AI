export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl?: string; // YouTube video URL
  documentType: "word" | "drive" | "none";
  documentName?: string;
  documentContent?: string; // Markdown or plain text
  documentUrl?: string; // Google Drive link
  aiSummary?: string; // AI generated summary of the lesson
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: "Cơ bản" | "Trung cấp" | "Nâng cao";
  thumbnailUrl: string;
  author: string;
  createdAt: string;
  lessons: Lesson[];
  priceVnd: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type AppRole = "learner" | "admin";

export interface StudentAccount {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  joinedAt: string;
  subscriptionTier: "free" | "pro" | "lifetime";
  subscribedCourseIds: string[]; // List of course IDs subscribed specifically
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  priceVnd: number;
  googleProductId: string;
  description: string;
  benefits: string[];
}

export interface GoogleTransaction {
  id: string;
  email: string;
  courseId?: string; // Optional if subscribed to specific course
  packageId: string;
  packageName: string;
  amountVnd: number;
  googleOrderId: string;
  timestamp: string;
  status: "Thành công" | "Đang xử lý" | "Thất bại";
}

