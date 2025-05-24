// User and session types
export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin?: boolean;
}

export interface Session {
  user: User;
  expires: string;
}

// Video related types
export interface Video {
  id: number;
  title: string;
  description?: string | null;
  url: string;
  thumbnailUrl?: string | null;
  frameUrls: string[];
  duration?: number | null;
  userId: string;
  isProcessed: boolean;
  createdAt: Date;
}

export interface VideoUploadData {
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  frameUrls: string[];
  duration?: number;
}

// Chat message types
export interface Message {
  id: number;
  conversationId: number;
  content: string;
  role: "user" | "assistant";
  createdAt: Date;
}

export interface Conversation {
  id: number;
  videoId: number;
  userId: string;
  createdAt: Date;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
