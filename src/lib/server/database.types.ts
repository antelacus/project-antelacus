import { z } from 'zod';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export const contentTypeSchema = z.enum(['post', 'note', 'project', 'gallery']);
export const contentStatusSchema = z.enum(['draft', 'published']);
export const projectLinkTypeSchema = z.enum(['repository', 'demo', 'reference', 'other']);

export type ContentType = z.infer<typeof contentTypeSchema>;
export type ContentStatus = z.infer<typeof contentStatusSchema>;
export type ProjectLinkType = z.infer<typeof projectLinkTypeSchema>;

export const contentItemInsertSchema = z.object({
  content_type: contentTypeSchema,
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().nullable().optional(),
  body_markdown: z.string().min(1),
  status: contentStatusSchema.default('draft'),
  published_at: z.string().datetime({ offset: true }).nullable().optional(),
  locale: z.string().min(2).default('zh-CN'),
  cover_image_url: z.string().url().nullable().optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  extra_metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const contentTagInsertSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const contentItemTagInsertSchema = z.object({
  content_item_id: z.string().uuid(),
  tag_id: z.string().uuid(),
});

export const galleryImageInsertSchema = z.object({
  content_item_id: z.string().uuid(),
  storage_path: z.string().min(1),
  public_url: z.string().url(),
  alt_text: z.string().nullable().optional(),
  sort_order: z.number().int().nonnegative().default(0),
  captured_at: z.string().datetime({ offset: true }).nullable().optional(),
});

export const projectLinkInsertSchema = z.object({
  content_item_id: z.string().uuid(),
  label: z.string().min(1),
  url: z.string().url(),
  link_type: projectLinkTypeSchema.default('other'),
});

export type ContentItemInsert = z.infer<typeof contentItemInsertSchema>;
export type ContentTagInsert = z.infer<typeof contentTagInsertSchema>;
export type ContentItemTagInsert = z.infer<typeof contentItemTagInsertSchema>;
export type GalleryImageInsert = z.infer<typeof galleryImageInsertSchema>;
export type ProjectLinkInsert = z.infer<typeof projectLinkInsertSchema>;

export interface Database {
  public: {
    Tables: {
      content_items: {
        Row: {
          id: string;
          content_type: ContentType;
          slug: string;
          title: string;
          summary: string | null;
          body_markdown: string;
          status: ContentStatus;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          locale: string;
          cover_image_url: string | null;
          seo_title: string | null;
          seo_description: string | null;
          extra_metadata: Json | null;
        };
        Insert: ContentItemInsert;
        Update: Partial<ContentItemInsert>;
        Relationships: [];
      };
      content_tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: ContentTagInsert;
        Update: Partial<ContentTagInsert>;
        Relationships: [];
      };
      content_item_tags: {
        Row: {
          content_item_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: ContentItemTagInsert;
        Update: Partial<ContentItemTagInsert>;
        Relationships: [];
      };
      gallery_images: {
        Row: {
          id: string;
          content_item_id: string;
          storage_path: string;
          public_url: string;
          alt_text: string | null;
          sort_order: number;
          captured_at: string | null;
          created_at: string;
        };
        Insert: GalleryImageInsert;
        Update: Partial<GalleryImageInsert>;
        Relationships: [];
      };
      project_links: {
        Row: {
          id: string;
          content_item_id: string;
          label: string;
          url: string;
          link_type: ProjectLinkType;
          created_at: string;
        };
        Insert: ProjectLinkInsert;
        Update: Partial<ProjectLinkInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      content_type: ContentType;
      content_status: ContentStatus;
      project_link_type: ProjectLinkType;
    };
  };
}
