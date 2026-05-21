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
  "生成一张**角色三视图设定稿**（character sheet），画面构图严格如下：\n" +
  "• 整体横版画布，淡灰/米白纯色背景，画面干净无杂物、无文字、无水印。\n" +
  "• **左侧约 1/3** 区域：放**一张半身肖像**（头到胸，正面 3/4 侧视角），作为该角色的主视觉、展示五官与表情。\n" +
  "• **右侧约 2/3** 区域：水平等距并列**三个全身站立图**，从左到右依次是" +
  "**正面（front view）** · **侧面（side view，面向画面左侧）** · **背面（back view）**。\n" +
  "• 三个全身图高度一致、站在同一地平线、使用 T-pose 或自然放松站姿；" +
  "服装、发型、配饰、发色、瞳色、体型在所有视图中**完全一致**；光源统一（柔和顶光）。\n" +
  "• 整张图像呈现为专业游戏/动漫**角色设定稿**风格。\n";

/** turnaround page (ref mode): TURNAROUND_REF_PROMPT(extraDesc?) */
export const TURNAROUND_REF_PROMPT = (extra?: string): string =>
  `基于参考图中同一角色的外貌特征（脸型、发型、发色、瞳色、服装细节），${TURNAROUND_LAYOUT}` +
  (extra ? `\n补充设定：${extra}` : "");

/** turnaround page (text mode): TURNAROUND_TXT_PROMPT(charDesc) */
export const TURNAROUND_TXT_PROMPT = (charDesc: string): string =>
  `根据下面的**角色文字设定**，${TURNAROUND_LAYOUT}角色设定：${charDesc}`;

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
