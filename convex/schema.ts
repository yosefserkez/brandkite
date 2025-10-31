import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  companies: defineTable({
    name: v.string(),
    description: v.string(),
    ownerId: v.id("users"),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_public", ["isPublic"]),

  companyMembers: defineTable({
    companyId: v.id("companies"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("editor"), v.literal("viewer")),
    addedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_user", ["userId"])
    .index("by_company_user", ["companyId", "userId"]),

  brandModules: defineTable({
    companyId: v.id("companies"),
    type: v.string(),
    data: v.any(),
    published: v.boolean(),
    generationStatus: v.union(
      v.literal("idle"),
      v.literal("queued"),
      v.literal("in_progress"),
      v.literal("succeeded"),
      v.literal("failed"),
    ), 
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_type", ["companyId", "type"]) 
    .index("by_company_type_current", ["companyId", "type", "published"]),

  brandAssets: defineTable({
    companyId: v.id("companies"),
    moduleType: v.string(),
    assetType: v.string(), // "logo", "color", "font", etc.
    name: v.string(),
    fileId: v.optional(v.id("_storage")),
    data: v.any(), // For non-file assets like colors, text
    version: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_module", ["companyId", "moduleType"]),

  presence: defineTable({
    companyId: v.id("companies"),
    userId: v.id("users"),
    section: v.optional(v.string()),
    lastSeen: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_user", ["companyId", "userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
