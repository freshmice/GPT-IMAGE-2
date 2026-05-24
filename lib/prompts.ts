import type { TurnaroundPromptOptions } from "@/lib/types";

/** 漫剧 prompt 模板 */

export const CHARACTER_LOCK_PREFIX =
  "使用参考图中同一角色的外貌特征（脸型、发型、发色、瞳色、体型、标志性服饰细节），" +
  "在下列新场景中严格保持角色一致性，禁止改变五官比例与服装主色调。画面要求：";

export const SCENE_VIEW_DIRECTIONS: ReadonlyArray<{
  key: string;
  label: string;
  prompt: string;
}> = [
  { key: "front", label: "正面", prompt: "正面视角：镜头平视，正对场景中心" },
  { key: "left",  label: "左侧", prompt: "左侧视角：镜头向场景左方偏移约 60°，展示左侧环境" },
  { key: "right", label: "右侧", prompt: "右侧视角：镜头向场景右方偏移约 60°，展示右侧环境" },
  { key: "bird",  label: "俯视", prompt: "俯视/鸟瞰：镜头从上方约 45° 俯拍整体布局" },
];

/** scene-views page: sceneViewPrompt(extraDescription?) */
export function sceneViewPrompt(extra?: string): string {
  const base =
    "基于参考图中的场景建筑、地形、光线氛围与美术风格，保持相同的时间、天气、色调、材质，" +
    "生成该场景的前、后、左、右四个方向视图，排列在同一张横版画布中，每个视图等宽，标注方向标签。";
  return extra ? `${base}\n补充：${extra}` : base;
}

/** character page: characterConsistencyPrompt(description?, scene) */
export function characterConsistencyPrompt(description: string, scene: string): string {
  const descPart = description ? `角色补充描述：${description}。` : "";
  return CHARACTER_LOCK_PREFIX + descPart + scene;
}

/** storyboard page: STORYBOARD_FRAME_TEMPLATE(idx, scene, dialogue) */
export const STORYBOARD_FRAME_TEMPLATE = (
  idx: number,
  scene: string,
  dialogue: string,
): string =>
  `【第 ${idx} 格】场景：${scene}` +
  (dialogue ? `；对话/旁白：「${dialogue}」` : "") +
  "。";

export const TURNAROUND_LAYOUT =
  "生成一张专业角色三视图设定稿，严格参考如下版式：\n" +
  "1. 整体为超宽横版画布，纯白或极浅灰背景，干净棚拍光线，无文字、无水印、无边框、无标签。\n" +
  "2. 左侧约 42% 画布放一张角色正面半身肖像，必须是正面拍摄，头顶到胸口/上半身，脸部清晰，占据左侧主要面积。\n" +
  "3. 右侧约 58% 画布水平排列三个全身站立视图，从左到右依次为：正面全身、侧面全身、背面全身。\n" +
  "4. 三个全身视图高度一致，脚底站在同一地平线，人物间距均匀，姿态自然放松，镜头平视，不能透视夸张。\n" +
  "5. 四个形象必须是同一角色：脸型、发型、发饰、服装、纹样、配饰、腰带、鞋履、体型和主色调完全一致。\n" +
  "6. 画面质感像角色造型定妆照/游戏影视角色设定稿，细节清晰，服装纹理和背面结构可读。\n";

function optionLines(options?: TurnaroundPromptOptions) {
  return [
    options?.style && `视觉风格：${options.style}`,
    options?.background && `背景与光线：${options.background}`,
    options?.shot && `镜头规格：${options.shot}`,
    options?.notes && `补充设定：${options.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** turnaround page (ref mode): TURNAROUND_REF_PROMPT(extraDesc?) */
export const TURNAROUND_REF_PROMPT = (
  extra?: string,
  options?: TurnaroundPromptOptions,
): string =>
  `基于参考图中同一角色的外貌特征，尤其锁定脸型、五官、发型、发色、发饰、服装剪裁、刺绣纹样、配饰和鞋履。\n${TURNAROUND_LAYOUT}` +
  [extra && `补充设定：${extra}`, optionLines(options)]
    .filter(Boolean)
    .map((line) => `\n${line}`)
    .join("");

/** turnaround page (text mode): TURNAROUND_TXT_PROMPT(charDesc) */
export const TURNAROUND_TXT_PROMPT = (
  charDesc: string,
  options?: TurnaroundPromptOptions,
): string =>
  `根据下面的角色文字设定生成同一角色。\n${TURNAROUND_LAYOUT}角色设定：${charDesc}` +
  (optionLines(options) ? `\n${optionLines(options)}` : "");

export const TWELVE_GRID_DEFAULT_CELLS = [
  "正面半身微笑", "侧脸凝视远方", "开怀大笑",
  "生气瞪眼", "惊讶张嘴", "害羞低头",
  "挥手打招呼", "双手叉腰自信",
  "坐姿托腮思考", "回眸一笑",
  "奔跑中动态", "背影仰望天空",
];

/** grid12 page: twelveGridPrompt(description?, cells) */
export function twelveGridPrompt(description: string | undefined, cells: string[]): string {
  const list = cells
    .slice(0, 12)
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");
  const charPart = description
    ? `根据以下角色描述：${description}\n`
    : "基于参考图中同一角色的外貌特征，";
  return (
    `${charPart}生成一张 **3 行 × 4 列的 12 宫格合集图**，` +
    "每格展示同一角色的不同姿态/表情，格子间有细白线分隔，整体构图整齐。" +
    `每格内容（按从左到右、从上到下顺序）：\n${list}\n` +
    "要求：角色长相、发型、服装主色调必须完全一致；每格光照和背景保持统一（纯色或简约背景），不要出现文字、数字、边框装饰。"
  );
}
