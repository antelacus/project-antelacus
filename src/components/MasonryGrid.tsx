"use client";
import { useState, useEffect, ReactElement } from 'react';

interface MasonryGridProps {
  children: ReactElement[];
  columns?: number;
  gap?: number;
}

export default function MasonryGrid({ 
  children, 
  columns = 4, 
  gap = 20 
}: MasonryGridProps) {
  const [columnItems, setColumnItems] = useState<ReactElement[][]>([]);
  const [currentColumns, setCurrentColumns] = useState(columns);

  useEffect(() => {
    // 响应式列数计算
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width <= 640) {
        setCurrentColumns(1); // 移动端1列
      } else if (width <= 1024) {
        setCurrentColumns(2); // 小平板2列
      } else if (width <= 1400) {
        setCurrentColumns(3); // 大平板3列
      } else {
        setCurrentColumns(columns); // 桌面端使用传入的列数（4列）
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    
    return () => window.removeEventListener('resize', updateColumns);
  }, [columns]);

  useEffect(() => {
    // 将子元素分配到不同列中
    const cols: ReactElement[][] = Array(currentColumns).fill(null).map(() => []);
    
    children.forEach((child, index) => {
      const columnIndex = index % currentColumns;
      cols[columnIndex].push(child);
    });
    
    setColumnItems(cols);
  }, [children, currentColumns]);

  return (
    <div 
      className="masonry-grid"
      style={{
        display: 'flex',
        gap: `${gap}px`,
        alignItems: 'flex-start',
      }}
    >
      {columnItems.map((columnChildren, columnIndex) => (
        <div
          key={columnIndex}
          className="masonry-column"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: `${gap}px`,
            // Staggered animation delay for columns
            animationDelay: `${columnIndex * 0.1}s`,
          }}
        >
          {columnChildren.map((child, childIndex) => (
            <div
              key={`${columnIndex}-${childIndex}`}
              style={{
                // Staggered animation for individual items
                animationDelay: `${(columnIndex * columnChildren.length + childIndex) * 0.05}s`,
                animation: 'quietReveal 0.6s cubic-bezier(0.4, 0, 0.2, 1) both',
              }}
            >
              {child}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
} 