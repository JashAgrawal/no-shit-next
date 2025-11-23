import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

// Ideas table
export const ideas = sqliteTable("ideas", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  validated: integer("validated", { mode: "boolean" }).default(false).notNull(),
  verdict: text("verdict"), // TRASH, MID, VIABLE, FIRE
  validationData: text("validation_data"), // JSON string
  dashboardData: text("dashboard_data"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
});

// Messages table (for all chat types)
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  ideaId: text("idea_id")
    .notNull()
    .references(() => ideas.id, { onDelete: "cascade" }),
  chatType: text("chat_type").notNull(), // oracle, agent, hivemind, boardroom
  agentId: text("agent_id"), // null for oracle/hivemind/boardroom
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

// Tasks table
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  ideaId: text("idea_id")
    .notNull()
    .references(() => ideas.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(), // todo, in-progress, done, blocked
  priority: text("priority").notNull(), // low, medium, high, urgent
  assignedTo: text("assigned_to"), // agent ID
  tags: text("tags"), // JSON array
  dueDate: integer("due_date", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
});

// Idea context table (for tracking agent interactions)
export const ideaContext = sqliteTable("idea_context", {
  id: text("id").primaryKey(),
  ideaId: text("idea_id")
    .notNull()
    .references(() => ideas.id, { onDelete: "cascade" }),
  agentId: text("agent_id").notNull(),
  message: text("message").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});
