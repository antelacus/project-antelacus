"use client";
import PhotoCard from './PhotoCard';
import { PhotoMeta } from '../lib/gallery';

interface ClientPhotoCardProps {
  photo: PhotoMeta;
}

/**
 * Client-side wrapper for PhotoCard to handle navigation tracking
 * This ensures the onClick handler works in Server Component contexts
 */
export default function ClientPhotoCard({ photo }: ClientPhotoCardProps) {
  return <PhotoCard photo={photo} />;
}