import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "@auth/core/adapters";

/**
 * Users table - stores user information
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // Add this field for storing hashed passwords
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
  isApproved: boolean("is_approved").default(false), // Add approval status field
  approvedAt: timestamp("approved_at"), // When the user was approved
  isAdmin: boolean("is_admin").default(false), // Whether user has admin privileges
});

/**
 * Accounts table - stores OAuth accounts linked to users
 * Required by NextAuth.js
 */
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}) as any as AdapterAccount;

/**
 * Sessions table - stores active user sessions
 * Required by NextAuth.js
 */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("sessionToken").notNull().unique(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

/**
 * Verification tokens - stores tokens for email verification
 * Required by NextAuth.js
 */
export const verificationTokens = pgTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

/**
 * Videos table - stores video metadata
 */
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(), // Supabase storage URL
  thumbnailUrl: text("thumbnail_url"),
  frameUrls: jsonb("frame_urls").$type<string[]>(), // Store array of frame URLs
  duration: integer("duration"), // in seconds
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  isProcessed: boolean("is_processed").default(false),
  isRemoved: boolean("is_removed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Conversations table - stores conversation contexts for videos
 */
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videos.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});


export const frameAnalyses = pgTable('frame_analyses', {
  id: serial('id').primaryKey(),
  frameUrl: text('frame_url').notNull(),
  description: text('description').notNull(),
  position: integer('position').notNull(),
  videoId: integer('video_id').notNull()
    .references(() => videos.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/**
 * Messages table - stores chat messages within conversations
 */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(
    () => conversations.id,
    { onDelete: "cascade" }
  ),
  content: text("content").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  createdAt: timestamp("created_at").defaultNow(),
});
