"use client";
import { useState, useEffect, useCallback } from 'react';
import { PhotoInfo } from '../lib/gallery';

interface PhotoViewerProps {
  photos: PhotoInfo[];
}

export default function PhotoViewer({ photos }: PhotoViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 键盘导航
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (selectedIndex === null) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        setSelectedIndex(prev => prev === null ? null : Math.max(0, prev - 1));
        break;
      case 'ArrowRight':
        event.preventDefault();
        setSelectedIndex(prev => prev === null ? null : Math.min(photos.length - 1, prev + 1));
        break;
      case 'Escape':
        event.preventDefault();
        setSelectedIndex(null);
        break;
    }
  }, [selectedIndex, photos.length]);

  useEffect(() => {
    if (selectedIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown, selectedIndex]);

  const openPhoto = (index: number) => {
    setSelectedIndex(index);
  };

  const closeViewer = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    setSelectedIndex(prev => prev === null ? null : Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex(prev => prev === null ? null : Math.min(photos.length - 1, prev + 1));
  };

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      closeViewer();
    }
  };

  return (
    <>
      {/* 照片网格 */}
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div 
            key={photo.filename}
            className="photo-grid-item"
            onClick={() => openPhoto(index)}
          >
            <img
              src={photo.path}
              alt={photo.caption || `照片 ${index + 1}`}
              className="photo-grid-image"
              loading="lazy"
            />
            <div className="photo-grid-overlay">
              <div className="photo-grid-info">
                <span className="photo-number">{index + 1}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 照片放大浏览器 */}
      {selectedIndex !== null && (
        <div className="photo-lightbox" onClick={handleOverlayClick}>
          <div className="lightbox-overlay">
            {/* 关闭按钮 */}
            <button 
              className="lightbox-close" 
              onClick={closeViewer}
              aria-label="关闭照片浏览器"
            >
              ✕
            </button>

            {/* 上一张按钮 */}
            {selectedIndex > 0 && (
              <button 
                className="lightbox-nav lightbox-nav-prev" 
                onClick={goToPrevious}
                aria-label="上一张照片"
              >
                ‹
              </button>
            )}

            {/* 下一张按钮 */}
            {selectedIndex < photos.length - 1 && (
              <button 
                className="lightbox-nav lightbox-nav-next" 
                onClick={goToNext}
                aria-label="下一张照片"
              >
                ›
              </button>
            )}

            {/* 照片容器 */}
            <div className="lightbox-content">
              <img
                src={photos[selectedIndex].path}
                alt={photos[selectedIndex].caption || `照片 ${selectedIndex + 1}`}
                className="lightbox-image"
                onLoad={() => setIsLoading(false)}
                onLoadStart={() => setIsLoading(true)}
              />

              {isLoading && (
                <div className="lightbox-loading">
                  <div className="loading-spinner"></div>
                </div>
              )}
            </div>

            {/* 照片信息 */}
            <div className="lightbox-info">
              <div className="photo-meta">
                <div className="photo-meta-item">
                  <span className="meta-label">照片</span>
                  <span className="meta-value">{selectedIndex + 1} / {photos.length}</span>
                </div>
                {photos[selectedIndex].caption && (
                  <div className="photo-meta-item">
                    <span className="meta-label">说明</span>
                    <span className="meta-value">{photos[selectedIndex].caption}</span>
                  </div>
                )}
                {photos[selectedIndex].location && (
                  <div className="photo-meta-item">
                    <span className="meta-label">地点</span>
                    <span className="meta-value">{photos[selectedIndex].location}</span>
                  </div>
                )}
                {photos[selectedIndex].camera && (
                  <div className="photo-meta-item">
                    <span className="meta-label">相机</span>
                    <span className="meta-value">{photos[selectedIndex].camera}</span>
                  </div>
                )}
                {photos[selectedIndex].settings && (
                  <div className="photo-meta-item">
                    <span className="meta-label">参数</span>
                    <span className="meta-value">{photos[selectedIndex].settings}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 