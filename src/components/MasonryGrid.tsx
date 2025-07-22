"use client";
import { useState, useEffect, ReactElement } from 'react';

interface MasonryGridProps {
  children: ReactElement[];
  columns?: number;
  gap?: number;
}

export default function MasonryGrid({ 
  children, 
  columns = 3, 
  gap = 20 
}: MasonryGridProps) {
  const [columnItems, setColumnItems] = useState<ReactElement[][]>([]);
  const [currentColumns, setCurrentColumns] = useState(columns);

  useEffect(() => {
    // 响应式列数计算
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width <= 768) {
        setCurrentColumns(1); // 移动端1列
      } else if (width <= 1024) {
        setCurrentColumns(2); // 平板端2列
      } else {
        setCurrentColumns(columns); // 桌面端使用传入的列数
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
          }}
        >
          {columnChildren}
        </div>
      ))}
    </div>
  );
} 