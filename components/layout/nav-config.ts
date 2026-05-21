import {
  Wand2,
  Brush,
  FileText,
  User,
  Mountain,
  Clapperboard,
  PersonStanding,
  Grid3x3,
  History,
  HardDrive,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "基础" | "漫剧" | "其他";
  description?: string;
}

export const NAV: NavItem[] = [
  { href: "/text-to-image", label: "文生图",    icon: Wand2,        group: "基础", description: "按提示词生成图像" },
  { href: "/edit",          label: "图像编辑",  icon: Brush,        group: "基础", description: "图生图 / 多图融合 / 局部重绘" },
  { href: "/text-file",     label: "文本配图",  icon: FileText,     group: "基础", description: "上传 txt/pdf/docx 自动出图" },
  { href: "/character",     label: "角色一致性", icon: User,        group: "漫剧", description: "锁定角色形象换场景" },
  { href: "/scene-views",   label: "场景四视角", icon: Mountain,    group: "漫剧", description: "一张场景 → 四个视角" },
  { href: "/storyboard",    label: "分镜故事板", icon: Clapperboard, group: "漫剧", description: "大纲 + 分镜表批量出图" },
  { href: "/turnaround",    label: "人物三视图", icon: PersonStanding, group: "漫剧", description: "左半身 + 右正/侧/背设定稿" },
  { href: "/grid12",        label: "12 宫格",   icon: Grid3x3,      group: "漫剧", description: "同角色多姿态合集图" },
  { href: "/history",       label: "历史画廊",  icon: History,      group: "其他", description: "最近生成记录" },
  { href: "/saved",         label: "已保存图片", icon: HardDrive,    group: "其他", description: "服务器磁盘上的图片" },
];

export const NAV_GROUPS = ["基础", "漫剧", "其他"] as const;
