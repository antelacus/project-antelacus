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

    // 预加载所有图片并获取真实尺寸
    const preloadImageDimensions = async () => {
      const links = galleryRef.current?.querySelectorAll('a') || [];
      const dimensionPromises = Array.from(links).map((link) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            link.setAttribute('data-pswp-width', img.naturalWidth.toString());
            link.setAttribute('data-pswp-height', img.naturalHeight.toString());
            resolve();
          };
          img.onerror = () => {
            // 使用默认尺寸作为后备
            link.setAttribute('data-pswp-width', '1920');
            link.setAttribute('data-pswp-height', '1080');
            resolve();
          };
          img.src = link.getAttribute('href') || '';
        });
      });
      
      await Promise.all(dimensionPromises);
    };

    // 初始化PhotoSwipe lightbox
    const initLightbox = async () => {
      await preloadImageDimensions();
      
      const lightbox = new PhotoSwipeLightbox({
        gallery: galleryRef.current!,
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

      // 监听内容加载，确保使用正确的尺寸
      lightbox.on('contentLoad', (e) => {
        const { content } = e;
        
        if (content.type === 'image' && content.data.src) {
          // 从链接的data属性获取预加载的尺寸
          const linkElement = content.data.element;
          if (linkElement && linkElement.dataset) {
            const width = parseInt(linkElement.dataset.pswpWidth || '1920');
            const height = parseInt(linkElement.dataset.pswpHeight || '1080');
            
            content.width = width;
            content.height = height;
          } else {
            // 后备尺寸
            content.width = 1920;
            content.height = 1080;
          }
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
    };

    // 执行初始化
    initLightbox();

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
    const content = document.createElement('div');
    content.className = 'photo-info-content';
    for (const name of ['photo-counter', 'photo-details']) {
      const part = document.createElement('div');
      part.className = name;
      content.appendChild(part);
    }
    element.appendChild(content);
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
      // Built from text nodes: the location and date come from the database, never from markup.
      details.replaceChildren();
      for (const [label, value] of [['地点:', location], ['时间:', date]] as const) {
        if (!value) continue;
        const item = document.createElement('div');
        item.className = 'detail-item';
        const labelNode = document.createElement('span');
        labelNode.className = 'label';
        labelNode.textContent = label;
        item.append(labelNode, ` ${value}`);
        details.appendChild(item);
      }
    }
  };

  return (
    <div ref={galleryRef} className="photo-grid">
      {photos.map((photo, index) => (
        <a
          key={photo.filename}
          href={photo.path}
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