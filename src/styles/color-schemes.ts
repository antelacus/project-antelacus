// 地中海四国风情颜色方案
// 每套方案都包含明暗模式的完整配色

export interface ColorScheme {
  name: string;
  country: string;
  flag: string;
  description: string;
  inspiration: string;
  light: {
    // 主色彩系统
    primary: string;
    primaryHover: string;
    primaryLight: string;
    secondary: string;
    accent: string;
    
    // 背景与表面
    bg: string;
    bgSecondary: string;
    cardBg: string;
    cardHover: string;
    
    // 文本颜色
    text: string;
    textSecondary: string;
    textMuted: string;
    
    // 边框与分割线
    border: string;
    borderSubtle: string;
    
    // 渐变系统
    gradientPrimary: string;
    gradientSecondary: string;
    gradientAccent: string;
  };
  dark: {
    // 主色彩系统
    primary: string;
    primaryHover: string;
    primaryLight: string;
    secondary: string;
    accent: string;
    
    // 背景与表面
    bg: string;
    bgSecondary: string;
    cardBg: string;
    cardHover: string;
    
    // 文本颜色
    text: string;
    textSecondary: string;
    textMuted: string;
    
    // 边框与分割线
    border: string;
    borderSubtle: string;
    
    // 渐变系统
    gradientPrimary: string;
    gradientSecondary: string;
    gradientAccent: string;
  };
}

// 🇪🇸 西班牙 · 弗拉门戈热情（当前使用）
export const spainScheme: ColorScheme = {
  name: "西班牙 · 弗拉门戈热情",
  country: "Spain",
  flag: "🇪🇸",
  description: "安达卢西亚的烈日与弗拉门戈的激情，深沉的赤土配合火红的撞色",
  inspiration: "塞维利亚的弗拉门戈、安达卢西亚的白色村庄、格拉纳达的阿尔罕布拉宫",
  light: {
    primary: "#7c2d12",
    primaryHover: "#92400e",
    primaryLight: "#fed7aa",
    secondary: "#a16207",
    accent: "#dc2626",
    
    bg: "#fffbf7",
    bgSecondary: "#fef7ed",
    cardBg: "#ffffff",
    cardHover: "#fefcf9",
    
    text: "#451a03",
    textSecondary: "#7c2d12",
    textMuted: "#a16207",
    
    border: "#fed7aa",
    borderSubtle: "#fef2e2",
    
    gradientPrimary: "linear-gradient(135deg, #7c2d12 0%, #a16207 100%)",
    gradientSecondary: "linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%)",
    gradientAccent: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
  },
  dark: {
    primary: "#fed7aa",
    primaryHover: "#fdba74",
    primaryLight: "#7c2d12",
    secondary: "#fdba74",
    accent: "#f87171",
    
    bg: "#1c0f0a",
    bgSecondary: "#2d1b16",
    cardBg: "#451a03",
    cardHover: "#5c2518",
    
    text: "#fed7aa",
    textSecondary: "#fdba74",
    textMuted: "#fb923c",
    
    border: "#7c2d12",
    borderSubtle: "#5c2518",
    
    gradientPrimary: "linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)",
    gradientSecondary: "linear-gradient(135deg, #451a03 0%, #2d1b16 100%)",
    gradientAccent: "linear-gradient(135deg, #f87171 0%, #dc2626 100%)"
  }
};

// 🇫🇷 法国 · 蔚蓝海岸优雅
export const franceScheme: ColorScheme = {
  name: "法国 · 蔚蓝海岸优雅",
  country: "France",
  flag: "🇫🇷",
  description: "普罗旺斯的薰衣草与蔚蓝海岸的精致，深蓝基调配紫色雅韵",
  inspiration: "尼斯的蔚蓝海岸、普罗旺斯的薰衣草田、戛纳的优雅生活",
  light: {
    primary: "#1e40af",
    primaryHover: "#2563eb",
    primaryLight: "#dbeafe",
    secondary: "#6b7280",
    accent: "#8b5cf6",
    
    bg: "#fefcff",
    bgSecondary: "#faf5ff",
    cardBg: "#ffffff",
    cardHover: "#fdfcff",
    
    text: "#1e1b4b",
    textSecondary: "#3730a3",
    textMuted: "#6b7280",
    
    border: "#e9d5ff",
    borderSubtle: "#f3f0ff",
    
    gradientPrimary: "linear-gradient(135deg, #1e40af 0%, #3730a3 100%)",
    gradientSecondary: "linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%)",
    gradientAccent: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
  },
  dark: {
    primary: "#dbeafe",
    primaryHover: "#bfdbfe",
    primaryLight: "#1e40af",
    secondary: "#c4b5fd",
    accent: "#c4b5fd",
    
    bg: "#0f0b1e",
    bgSecondary: "#1e1b4b",
    cardBg: "#312e81",
    cardHover: "#3730a3",
    
    text: "#dbeafe",
    textSecondary: "#bfdbfe",
    textMuted: "#a5b4fc",
    
    border: "#3730a3",
    borderSubtle: "#312e81",
    
    gradientPrimary: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    gradientSecondary: "linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)",
    gradientAccent: "linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 100%)"
  }
};

// 🇮🇹 意大利 · 文艺复兴深沉
export const italyScheme: ColorScheme = {
  name: "意大利 · 文艺复兴深沉",
  country: "Italy",
  flag: "🇮🇹",
  description: "托斯卡纳的橄榄绿与文艺复兴的温暖橙，深沉而富有文化底蕴",
  inspiration: "托斯卡纳的橄榄园、佛罗伦萨的文艺复兴、五渔村的温暖色彩",
  light: {
    primary: "#365314",
    primaryHover: "#4d7c0f",
    primaryLight: "#d9f99d",
    secondary: "#57534e",
    accent: "#ea580c",
    
    bg: "#fefdf8",
    bgSecondary: "#f5f5f4",
    cardBg: "#ffffff",
    cardHover: "#fdfdf9",
    
    text: "#1c1917",
    textSecondary: "#365314",
    textMuted: "#57534e",
    
    border: "#d6d3d1",
    borderSubtle: "#f5f5f4",
    
    gradientPrimary: "linear-gradient(135deg, #365314 0%, #4d7c0f 100%)",
    gradientSecondary: "linear-gradient(135deg, #f5f5f4 0%, #d6d3d1 100%)",
    gradientAccent: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)"
  },
  dark: {
    primary: "#d9f99d",
    primaryHover: "#bef264",
    primaryLight: "#365314",
    secondary: "#d6d3d1",
    accent: "#fb923c",
    
    bg: "#1c1917",
    bgSecondary: "#292524",
    cardBg: "#44403c",
    cardHover: "#57534e",
    
    text: "#d9f99d",
    textSecondary: "#bef264",
    textMuted: "#a3a3a3",
    
    border: "#57534e",
    borderSubtle: "#44403c",
    
    gradientPrimary: "linear-gradient(135deg, #d9f99d 0%, #bef264 100%)",
    gradientSecondary: "linear-gradient(135deg, #44403c 0%, #292524 100%)",
    gradientAccent: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)"
  }
};

// 🇬🇷 希腊 · 圣托里尼纯净
export const greeceScheme: ColorScheme = {
  name: "希腊 · 圣托里尼纯净",
  country: "Greece",
  flag: "🇬🇷",
  description: "爱琴海的纯净蓝白与天空的明亮蓝，经典而永恒的地中海色彩",
  inspiration: "圣托里尼的蓝白建筑、米科诺斯的纯净色彩、爱琴海的天空蓝",
  light: {
    primary: "#1e3a8a",
    primaryHover: "#1e40af",
    primaryLight: "#dbeafe",
    secondary: "#64748b",
    accent: "#0ea5e9",
    
    bg: "#fffffe",
    bgSecondary: "#f8fafc",
    cardBg: "#ffffff",
    cardHover: "#fdfdfe",
    
    text: "#0f172a",
    textSecondary: "#1e40af",
    textMuted: "#64748b",
    
    border: "#cbd5e1",
    borderSubtle: "#f1f5f9",
    
    gradientPrimary: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
    gradientSecondary: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)",
    gradientAccent: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)"
  },
  dark: {
    primary: "#dbeafe",
    primaryHover: "#bfdbfe",
    primaryLight: "#1e3a8a",
    secondary: "#94a3b8",
    accent: "#38bdf8",
    
    bg: "#0f172a",
    bgSecondary: "#1e293b",
    cardBg: "#334155",
    cardHover: "#475569",
    
    text: "#dbeafe",
    textSecondary: "#bfdbfe",
    textMuted: "#94a3b8",
    
    border: "#475569",
    borderSubtle: "#334155",
    
    gradientPrimary: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    gradientSecondary: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
    gradientAccent: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)"
  }
};

// 导出所有方案
export const colorSchemes = {
  spain: spainScheme,
  france: franceScheme,
  italy: italyScheme,
  greece: greeceScheme
};

// 当前使用的方案
export const currentScheme = spainScheme;

// 生成 CSS 变量的函数
export function generateCSSVariables(scheme: ColorScheme, isDark: boolean = false) {
  const colors = isDark ? scheme.dark : scheme.light;
  
  return `
  /* === ${scheme.name} === */
  --color-primary: ${colors.primary};
  --color-primary-hover: ${colors.primaryHover};
  --color-primary-light: ${colors.primaryLight};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  
  /* === 背景与表面 === */
  --color-bg: ${colors.bg};
  --color-bg-secondary: ${colors.bgSecondary};
  --color-card-bg: ${colors.cardBg};
  --color-card-hover: ${colors.cardHover};
  
  /* === 文本颜色 === */
  --color-text: ${colors.text};
  --color-text-secondary: ${colors.textSecondary};
  --color-text-muted: ${colors.textMuted};
  
  /* === 边框与分割线 === */
  --color-border: ${colors.border};
  --color-border-subtle: ${colors.borderSubtle};
  
  /* === 渐变系统 === */
  --gradient-primary: ${colors.gradientPrimary};
  --gradient-secondary: ${colors.gradientSecondary};
  --gradient-accent: ${colors.gradientAccent};
  `;
}

// 使用说明和切换方法
export const usage = `
// 如何切换颜色方案：

1. 导入所需的方案：
   import { franceScheme, generateCSSVariables } from './styles/color-schemes';

2. 生成 CSS 变量：
   const lightCSS = generateCSSVariables(franceScheme, false);
   const darkCSS = generateCSSVariables(franceScheme, true);

3. 替换 globals.css 中的相应变量即可

// 或者直接使用预定义的方案对象：
console.log(colorSchemes.france.light.primary); // #1e40af
`; 