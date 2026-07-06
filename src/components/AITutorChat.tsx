import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, X, User, Bot, HelpCircle, ArrowRight } from "lucide-react";
import { ChatMessage, Lesson } from "../types";

interface AITutorChatProps {
  courseTitle: string;
  lesson: Lesson;
  onClose?: () => void;
}

export default function AITutorChat({ courseTitle, lesson, onClose }: AITutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions for this lesson
  const suggestedQuestions = [
    "Tóm tắt các ý chính của bài học này.",
    "Cho tôi một ví dụ thực tế liên quan đến nội dung này.",
    "Tạo một câu hỏi trắc nghiệm nhỏ để kiểm tra kiến thức của tôi.",
  ];

  // Reset chat when lesson changes
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Chào bạn! Tôi là **Trợ lý AI Học tập**. Tôi đã đọc tài liệu bài học **"${lesson.title}"** và sẵn sàng hỗ trợ bạn. Bạn có câu hỏi nào cần giải đáp không?`,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [lesson.id]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setError(null);

    // Prepare API request history format
    const chatHistory = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory,
          lessonTitle: lesson.title,
          lessonContent: lesson.documentContent || "",
          courseTitle: courseTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Lỗi máy chủ trợ lý AI");
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.text,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      setError("Không thể kết nối với Trợ lý AI. Vui lòng kiểm tra lại cấu hình hoặc thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500 rounded-lg">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Trợ lý AI Học tập</h3>
            <p className="text-[10px] text-slate-300">Đang học: {lesson.title}</p>
          </div>
        </div>
        {onClose && (
          <button
            id="close-ai-chat"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === "user" ? "bg-slate-800 text-white" : "bg-emerald-600 text-white"
              }`}
            >
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className="flex flex-col">
              <div
                className={`p-3 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-slate-800 text-white rounded-tr-none"
                    : "bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm"
                }`}
              >
                {/* Parse basic markdown format simple inline bolding/headers */}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content.split("\n").map((para, i) => {
                    // Extremely lightweight parser for bullet points and bolding
                    let rendered = para;
                    if (rendered.startsWith("- ") || rendered.startsWith("* ")) {
                      rendered = "• " + rendered.substring(2);
                    }
                    
                    // Basic bold conversion for assistant
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    const parts = [];
                    let lastIndex = 0;
                    let match;
                    
                    while ((match = boldRegex.exec(rendered)) !== null) {
                      if (match.index > lastIndex) {
                        parts.push(rendered.substring(lastIndex, match.index));
                      }
                      parts.push(<strong key={match.index} className="font-semibold text-emerald-700">{match[1]}</strong>);
                      lastIndex = boldRegex.lastIndex;
                    }
                    if (lastIndex < rendered.length) {
                      parts.push(rendered.substring(lastIndex));
                    }

                    return (
                      <p key={i} className={para.startsWith("###") ? "font-bold text-slate-800 mt-2 mb-1 text-base" : "mb-1.5"}>
                        {parts.length > 0 ? parts : para}
                      </p>
                    );
                  })}
                </div>
              </div>
              <span className={`text-[10px] text-slate-400 mt-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs text-center">
            {error}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-2">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Gợi ý câu hỏi nhanh:
          </p>
          <div className="flex flex-col gap-1.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                id={`suggested-question-${idx}`}
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-left text-xs bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 p-2 rounded-lg border border-slate-200 transition-all flex items-center justify-between group"
              >
                <span>{q}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            id="ai-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Đặt câu hỏi về bài học..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            id="send-ai-message"
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
