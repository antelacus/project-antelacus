"use client";
import PostCard from './PostCard';
import { PostMeta } from '../lib/posts';

interface ClientPostCardProps {
  post: PostMeta;
  layout?: 'vertical' | 'horizontal';
}

/**
 * Client-side wrapper for PostCard to handle navigation tracking
 * This ensures the onClick handler works in Server Component contexts
 */
export default function ClientPostCard({ post, layout = 'vertical' }: ClientPostCardProps) {
  return <PostCard post={post} layout={layout} />;
}