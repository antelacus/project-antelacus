import { PhotoMeta } from '../lib/gallery';

export default function PhotoCard({ photo }: { photo: PhotoMeta }) {
  return (
    <div className="masonry-item" key={photo.slug} style={{ breakInside: 'avoid', marginBottom: '1rem' }}>
      <a href={photo.sourceUrl || photo.image} target="_blank" rel="noopener noreferrer">
        <img src={photo.image} alt={photo.caption || ''} style={{ width: '100%', borderRadius: '6px', objectFit: 'cover' }} />
      </a>
      {photo.caption && <p style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>{photo.caption}</p>}
    </div>
  );
} 