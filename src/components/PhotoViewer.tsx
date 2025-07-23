"use client";
import { useEffect, useRef } from 'react';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import { PhotoInfo } from '../lib/gallery';

interface PhotoViewerProps {
  photos: PhotoInfo[];
  location?: string;
  date?: string;
}

export default function PhotoViewer({ photos, location, date }: PhotoViewerProps) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null);

  useEffect(() => {
    if (!galleryRef.current) return;

    // 初始化PhotoSwipe lightbox
    const lightbox = new PhotoSwipeLightbox({
      gallery: galleryRef.current,
      children: 'a',
      pswpModule: () => import('photoswipe'),
      // 缩放和手势配置
      zoom: true,
      initialZoomLevel: 'fit',
      secondaryZoomLevel: 1.5,
      maxZoomLevel: 3,
      // 移动端手势优化
      allowPanToNext: false, // 禁用拖拽切换，优先缩放
      pinchToClose: false, // 禁用捏合关闭，避免意外退出
      closeOnVerticalDrag: true,
      // 鼠标滚轮缩放
      wheelToZoom: true,
      // 开启预加载
      preload: [1, 1],
      // 关键：单击只切换控件和信息，双击才缩放，桌面端也一致
      tapAction: 'toggle-controls',
      imageClickAction: 'toggle-controls',
      doubleTapAction: 'zoom',
    });

    // 监听beforeOpen事件，确保正确的图片尺寸
    lightbox.on('beforeOpen', () => {
      // 为每个链接预设默认尺寸，防止拉伸
      const links = galleryRef.current?.querySelectorAll('a');
      links?.forEach((link) => {
        if (!link.dataset.pswpWidth) {
          link.dataset.pswpWidth = '1920';
          link.dataset.pswpHeight = '1080';
        }
      });
    });

    // 监听内容加载，动态获取真实尺寸
    lightbox.on('contentLoad', (e) => {
      const { content } = e;
      
      if (content.type === 'image' && content.data.src) {
        const img = new Image();
        img.onload = () => {
          // 更新PhotoSwipe的内容尺寸
          content.width = img.naturalWidth;
          content.height = img.naturalHeight;
        };
        img.src = content.data.src;
      }
    });

    // 监听PhotoSwipe实例初始化
    lightbox.on('firstUpdate', () => {
      const pswp = lightboxRef.current?.pswp;
      if (!pswp) return;

      // 添加自定义照片信息UI
      const photoInfoElement = createPhotoInfoElement();
      pswp.scrollWrap?.appendChild(photoInfoElement);

      // 监听点击事件来切换信息显示
      const handleClick = (e: Event) => {
        // 检查是否点击在图片上（而不是控件上）
        const target = e.target as HTMLElement;
        if (target.classList.contains('pswp__img') || target.closest('.pswp__zoom-wrap')) {
          // 隐藏首次使用提示
          if (pswp.container) {
            pswp.container.classList.add('hint-used');
          }
          togglePhotoInfo(photoInfoElement);
        }
      };

      pswp.scrollWrap?.addEventListener('click', handleClick);

      // 初始更新照片信息
      updatePhotoInfo(photoInfoElement, pswp);

      // 只保留关闭按钮，隐藏其他控件
      const ui = pswp.element?.querySelector('.pswp__ui');
      if (ui) {
        // 隐藏所有按钮，后面再显示关闭按钮
        ui.querySelectorAll('.pswp__button').forEach(btn => {
          if (!btn.classList.contains('pswp__button--close')) {
            (btn as HTMLElement).style.display = 'none';
          } else {
            (btn as HTMLElement).style.display = '';
          }
        });
      }
    });

    // 监听幻灯片切换，更新照片信息
    lightbox.on('change', () => {
      const pswp = lightboxRef.current?.pswp;
      if (!pswp) return;
      
      const photoInfoElement = pswp.scrollWrap?.querySelector('.custom-photo-info') as HTMLElement;
      if (photoInfoElement) {
        updatePhotoInfo(photoInfoElement, pswp);
      }
    });

    // 初始化lightbox
    lightbox.init();
    lightboxRef.current = lightbox;

    // 清理函数
    return () => {
      if (lightboxRef.current) {
        lightboxRef.current.destroy();
        lightboxRef.current = null;
      }
    };
  }, []);

  // 创建照片信息元素
  const createPhotoInfoElement = () => {
    const element = document.createElement('div');
    element.className = 'custom-photo-info';
    element.innerHTML = `
      <div class="photo-info-content">
        <div class="photo-counter"></div>
        <div class="photo-details"></div>
      </div>
    `;
    return element;
  };

  // 切换照片信息显示/隐藏
  const togglePhotoInfo = (element: HTMLElement) => {
    element.classList.toggle('visible');
  };

  // 更新照片信息内容
  const updatePhotoInfo = (element: HTMLElement, pswp: { currIndex: number }) => {
    // 只显示帖子级别的location和date
    const counter = element.querySelector('.photo-counter');
    const details = element.querySelector('.photo-details');
    const currentIndex = pswp.currIndex;
    if (counter) {
      counter.textContent = `${currentIndex + 1} / ${photos.length}`;
    }
    if (details) {
      let detailsHTML = '';
      if (location) {
        detailsHTML += `<div class="detail-item"><span class="label">地点:</span> ${location}</div>`;
      }
      if (date) {
        detailsHTML += `<div class="detail-item"><span class="label">时间:</span> ${date}</div>`;
      }
      details.innerHTML = detailsHTML;
    }
  };

  return (
    <div ref={galleryRef} className="photo-grid">
      {photos.map((photo, index) => (
        <a
          key={photo.filename}
          href={photo.path}
          data-pswp-width="1920"
          data-pswp-height="1080"
          target="_blank"
          rel="noreferrer"
          className="photo-grid-item"
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
        </a>
      ))}
    </div>
  );
} 