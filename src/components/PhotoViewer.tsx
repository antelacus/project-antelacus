'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

import type { PhotoInfo } from '@/lib/photo-types';

// An album's photos, each a link to the full image, and PhotoSwipe to page through them: arrow keys,
// the previous / next buttons (shown on touch screens too — the site's styles override PhotoSwipe's
// hiding them there), or a swipe. Closing returns focus to the photo that was opened, whatever the
// browser thought was focused before.
export default function PhotoViewer({ photos }: { photos: PhotoInfo[] }) {
  const t = useTranslations('viewer');
  const gallery = useRef<HTMLDivElement>(null);
  const labels = useRef({ close: t('close'), prev: t('prev'), next: t('next'), zoom: t('zoom'), error: t('error') });

  useEffect(() => {
    const root = gallery.current;
    if (!root) return;
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[data-photo-index]'));
    const text = labels.current;
    const lightbox = new PhotoSwipeLightbox({
      gallery: root,
      children: 'a[data-photo-index]',
      pswpModule: () => import('photoswipe'),
      returnFocus: false,
      // Opens and closes at once: during PhotoSwipe's zoom animation it ignores keys, so an Esc pressed
      // straight away was lost.
      showHideAnimationType: 'none',
      pinchToClose: false,
      bgOpacity: 1,
      closeTitle: text.close,
      arrowPrevTitle: text.prev,
      arrowNextTitle: text.next,
      zoomTitle: text.zoom,
      errorMsg: text.error,
    });

    // The files do not state their size and PhotoSwipe needs it. The grid's own image gives it once
    // loaded; until then the slide opens at a stand-in ratio and is redrawn when the photo arrives.
    lightbox.addFilter('itemData', (itemData, index) => {
      const link = links[index];
      if (!link) return itemData;
      const shown = link.querySelector('img');
      const width = shown?.naturalWidth || Number(link.dataset.width) || 0;
      const height = shown?.naturalHeight || Number(link.dataset.height) || 0;
      if (width && height) return { ...itemData, src: link.href, width, height };
      if (!link.dataset.measuring) {
        link.dataset.measuring = '1';
        const probe = new window.Image();
        probe.onload = () => {
          link.dataset.width = String(probe.naturalWidth);
          link.dataset.height = String(probe.naturalHeight);
          lightbox.pswp?.refreshSlideContent(index);
        };
        probe.src = link.href;
      }
      return { ...itemData, src: link.href, width: 1600, height: 1200 };
    });

    // No thumbnail under the slide while it loads: PhotoSwipe leaves it there, and it shows through any
    // transparent part of the photo.
    lightbox.addFilter('placeholderSrc', () => false);

    let opened = -1;
    lightbox.on('beforeOpen', () => {
      opened = lightbox.pswp?.currIndex ?? -1;
    });
    lightbox.on('destroy', () => {
      links[opened]?.focus();
    });
    lightbox.init();
    return () => lightbox.destroy();
  }, []);

  return (
    <div ref={gallery} className="album-photos">
      {photos.map((photo, index) => (
        <a key={photo.path} href={photo.path} data-photo-index={index} className="album-photo">
          {/* eslint-disable-next-line @next/next/no-img-element -- PhotoSwipe opens the original file; the grid shows it as is */}
          <img src={photo.path} alt={photo.caption || t('photo', { n: index + 1 })} loading="lazy" />
        </a>
      ))}
    </div>
  );
}
