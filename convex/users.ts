import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Get user by ID
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List all users
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").collect();
  },
});

// Get pending users (awaiting approval)
export const getPending = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_approval_status", (q) => q.eq("approvalStatus", "PENDING"))
      .collect();
  },
});

// Create user (self-registration)
export const create = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
    role: v.string(),
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    initials: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      throw new Error("An account with this email already exists");
    }
    
    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      name: args.name,
      password: args.password,
      role: args.role,
      department: args.department,
      phone: args.phone,
      initials: args.initials,
      dateOfBirth: args.dateOfBirth,
      isActive: true,
      isFirstLogin: false,
      approvalStatus: "PENDING",
      createdAt: now,
    });
    
    return userId;
  },
});

// Approve user
export const approve = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      approvalStatus: "APPROVED",
    });
    return true;
  },
});

// Reject user
export const reject = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      approvalStatus: "REJECTED",
    });
    return true;
  },
});

// Update last login
export const updateLastLogin = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastLogin: new Date().toISOString(),
    });
    return true;
  },
});

// Update user
export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    initials: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return true;
  },
});

// Deactivate user
export const deactivate = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: false,
    });
    return true;
  },
});

// Activate user
export const activate = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: true,
    });
    return true;
  },
});

// Update password
export const updatePassword = mutation({
  args: {
    id: v.id("users"),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      password: args.password,
      isFirstLogin: false,
    });
    return true;
  },
});

// Create super admin (for seeding)
export const createSuperAdmin = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
    initials: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Check if super admin already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      return existing._id;
    }
    
    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      name: args.name,
      password: args.password,
      role: "SUPER_ADMIN",
      department: "Administration",
      initials: args.initials || "SA",
      isActive: true,
      isFirstLogin: false,
      approvalStatus: "APPROVED",
      createdAt: now,
    });
    
    return userId;
  },
});

// Count users by approval status
export const countByStatus = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return {
      total: users.length,
      pending: users.filter(u => u.approvalStatus === "PENDING").length,
      approved: users.filter(u => u.approvalStatus === "APPROVED").length,
      rejected: users.filter(u => u.approvalStatus === "REJECTED").length,
    };
  },
});
