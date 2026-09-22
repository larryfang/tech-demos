import type { PromptPack, SceneTag } from "@/lib/types";

export type FixtureId = "portrait" | "product" | "ui" | "landscape";

export type FixtureCard = {
  id: FixtureId;
  scene: SceneTag;
  title: string;
  titleZh: string;
  src: string;
  filename: string;
  blurb: string;
};

export const FIXTURES: FixtureCard[] = [
  {
    id: "portrait",
    scene: "portrait",
    title: "Studio portrait",
    titleZh: "影棚人像",
    src: "/fixtures/portrait.png",
    filename: "portrait.png",
    blurb: "Warm backdrop, short dark hair, knit cardigan.",
  },
  {
    id: "product",
    scene: "product",
    title: "Ceramic bottle",
    titleZh: "陶瓷瓶产品",
    src: "/fixtures/product.png",
    filename: "product.png",
    blurb: "Cream bottle, teal label, marble tabletop.",
  },
  {
    id: "ui",
    scene: "ui",
    title: "Analytics dashboard",
    titleZh: "分析界面",
    src: "/fixtures/ui.png",
    filename: "ui.png",
    blurb: "Sidebar, KPI cards, bar chart.",
  },
  {
    id: "landscape",
    scene: "landscape",
    title: "Hill lake dusk",
    titleZh: "丘陵暮色",
    src: "/fixtures/landscape.png",
    filename: "landscape.png",
    blurb: "Peach sky, layered hills, still water.",
  },
];

export const SCENE_LABELS: Record<SceneTag, { en: string; zh: string }> = {
  portrait: { en: "Portrait", zh: "人像" },
  product: { en: "Product", zh: "产品" },
  ui: { en: "UI", zh: "界面" },
  landscape: { en: "Landscape", zh: "风景" },
  illustration: { en: "Illustration", zh: "插画" },
  architecture: { en: "Architecture", zh: "建筑" },
  mixed: { en: "Mixed", zh: "混合" },
};

export const FIXTURE_PROMPTS: Record<FixtureId, PromptPack> = {
  portrait: {
    scene: "portrait",
    chinese:
      "半身肖像，一位东亚女性坐在中性灰米色影棚背景前，黑色短发微微分层，浅驼色针织开衫，神情平静并正视镜头。柔和侧逆光勾出颧骨与发丝边缘，浅景深，皮肤质感细腻真实，35mm 镜头，3:4 画幅。",
    english:
      "Half-body studio portrait of an East Asian woman against a warm greige seamless backdrop, layered short black hair, camel knit cardigan, calm eye contact. Soft rim-side lighting on cheekbones and hair edges, shallow depth of field, natural skin texture, 35mm look, 3:4.",
    json: {
      scene: "portrait",
      aspect: "3:4",
      subject: "East Asian woman, short layered black hair, camel knit cardigan",
      setting: "Neutral greige studio seamless",
      composition: "Centered half-body, eye-level, calm gaze",
      lighting: "Soft key with gentle rim on hair and cheek",
      palette: ["greige", "camel", "warm skin", "soft black"],
      materials: ["knit wool", "soft skin", "matte paper backdrop"],
      style: "Contemporary editorial portrait, natural texture",
      camera: "35mm, f/2, shallow DOF",
    },
    negativeChinese: "畸形五官，多余手指，塑料皮肤，过曝高光，文字水印，杂乱背景，低分辨率",
    negativeEnglish:
      "deformed face, extra fingers, plastic skin, blown highlights, watermark, cluttered background, low resolution",
  },
  product: {
    scene: "product",
    chinese:
      "静物产品摄影，一只奶油色陶瓷瓶立在浅色大理石台面上，瓶颈细长，瓶身贴有低饱和青绿标签，顶部有一圈哑光金属盖。柔和顶侧光，干净投影，高质感商业棚拍，4:5。",
    english:
      "Still-life product photo of a cream ceramic bottle on pale marble, slender neck, muted teal label, matte metal cap. Soft top-side lighting, tidy contact shadow, clean commercial studio look, 4:5.",
    json: {
      scene: "product",
      aspect: "4:5",
      subject: "Cream ceramic bottle with muted teal label and matte metal cap",
      setting: "Pale marble tabletop, cool seamless backdrop",
      composition: "Centered hero object, generous negative space",
      lighting: "Soft top-side key, controlled specular on glaze",
      palette: ["cream", "teal", "cool gray", "soft gold"],
      materials: ["glazed ceramic", "paper label", "brushed metal", "marble"],
      style: "High-end catalog still life",
      camera: "85mm, f/8, product table",
    },
    negativeChinese: "脏污指纹，标签歪斜，变形瓶身，强烈反光，杂物入镜，文字乱码",
    negativeEnglish:
      "smudges, crooked label, warped bottle, harsh glare, clutter, garbled text",
  },
  ui: {
    scene: "ui",
    chinese:
      "浅色 SaaS 分析仪表盘界面，左侧深色窄导航，顶部工具条，三张 KPI 卡片，下方白色面板中有一组圆角柱状图。极简无衬线字体，细分割线，大量留白，16:10，干净的产品设计渲染。",
    english:
      "Light SaaS analytics dashboard: slim dark sidebar, top toolbar, three KPI cards, rounded bar chart on a white panel. Minimal sans-serif type, hairline dividers, generous whitespace, 16:10, clean product-design render.",
    json: {
      scene: "ui",
      aspect: "16:10",
      subject: "Analytics dashboard with sidebar, KPI cards, and bar chart",
      setting: "Desktop web app, light theme",
      composition: "Left rail plus content grid, chart as hero",
      lighting: "Flat UI lighting, no dramatic shadows",
      palette: ["zinc 50", "zinc 950", "white", "muted gray"],
      materials: ["vector UI", "hairline borders", "soft cards"],
      style: "Minimal product interface, shadcn-like density",
      camera: "Orthographic UI mock, 16:10 frame",
    },
    negativeChinese: "歪斜控件，难以辨认文字，彩虹渐变，拟物阴影，破损布局，水印",
    negativeEnglish:
      "skewed controls, illegible text, rainbow gradients, skeuomorphic shadows, broken layout, watermark",
  },
  landscape: {
    scene: "landscape",
    chinese:
      "开阔风景，黄昏丘陵与静湖：上半幅由雾蓝过渡到暖桃的天空，一轮浅金色落日偏右，远山层叠，近处深绿坡地映入平静湖面。空气透视明显，电影感广角，16:9。",
    english:
      "Open landscape at dusk: misty blue-to-peach sky, pale gold sun to the right, layered hills, deep green foreground slope reflected in a still lake. Strong aerial perspective, cinematic wide view, 16:9.",
    json: {
      scene: "landscape",
      aspect: "16:9",
      subject: "Dusk hills and a still lake under a peach sky",
      setting: "Temperate countryside, golden hour",
      composition: "Wide establishing shot, sun in upper right, water along the base",
      lighting: "Low warm sun, soft atmospheric haze",
      palette: ["sky blue", "peach", "sage", "deep green"],
      materials: ["soft grass", "hazy air", "glassy water"],
      style: "Cinematic landscape painting-photograph hybrid",
      camera: "24mm wide, deep focus",
    },
    negativeChinese: "现代建筑，电线杆，人物，过饱和霓虹，镜头污点，文字",
    negativeEnglish: "modern buildings, power lines, people, neon oversat, lens dirt, text",
  },
};

export const GENERIC_PROMPTS: Record<SceneTag, PromptPack> = {
  portrait: FIXTURE_PROMPTS.portrait,
  product: FIXTURE_PROMPTS.product,
  ui: FIXTURE_PROMPTS.ui,
  landscape: FIXTURE_PROMPTS.landscape,
  illustration: {
    scene: "illustration",
    chinese:
      "平面插画，主体明确、边缘干净，扁平色块与有限阴影，构图居中，适合海报或封面。色彩克制，留白充分，无乱码文字。",
    english:
      "Flat illustration with a clear subject, clean edges, limited shading, centered composition, poster-or-cover ready. Restrained palette, generous negative space, no garbled type.",
    json: {
      scene: "illustration",
      aspect: "4:5",
      subject: "Stylized illustrated subject",
      setting: "Simple graphic field",
      composition: "Centered, poster hierarchy",
      lighting: "Graphic, limited shadows",
      palette: ["ink", "paper", "accent"],
      materials: ["flat fill", "crisp outline"],
      style: "Contemporary editorial illustration",
      camera: "Graphic flat, no lens distortion",
    },
    negativeChinese: "照片噪点，三维渲染感过强，变形文字，杂乱纹理",
    negativeEnglish: "photo noise, overly 3D render, warped type, noisy texture",
  },
  architecture: {
    scene: "architecture",
    chinese:
      "建筑空间照片，结构线条清晰，交代材料、比例与光线方向，避免人物抢镜，强调空间纵深。",
    english:
      "Architectural photograph with clear structural lines, materials, proportion, and light direction; no competing figures; strong spatial depth.",
    json: {
      scene: "architecture",
      aspect: "3:2",
      subject: "Building or interior volume",
      setting: "Designed space",
      composition: "Leading lines, one- or two-point perspective",
      lighting: "Natural directional light",
      palette: ["stone", "concrete", "warm wood"],
      materials: ["masonry", "glass", "metal"],
      style: "Editorial architecture",
      camera: "24–35mm, verticals corrected",
    },
    negativeChinese: "倾斜竖线，镜头畸变，过曝窗户，杂乱广告牌",
    negativeEnglish: "tilted verticals, lens distortion, blown windows, cluttered signage",
  },
  mixed: {
    scene: "mixed",
    chinese:
      "根据画面主体重绘：保持原图的构图、光线方向与色彩关系，补充材质与氛围，生成可直接用于文生图的描述，避免添加原图没有的文字。",
    english:
      "Redraw from the frame: keep the original composition, light direction, and color relationships, add material and mood, and write an image-gen-ready description without inventing on-image text.",
    json: {
      scene: "mixed",
      aspect: "1:1",
      subject: "Primary subject inferred from the upload",
      setting: "Setting inferred from the upload",
      composition: "Match the source framing",
      lighting: "Match the source light direction",
      palette: ["source-led"],
      materials: ["source-led"],
      style: "Photoreal or match the source medium",
      camera: "Match implied lens",
    },
    negativeChinese: "水印，乱码文字，畸形解剖，风格混杂到不可识别",
    negativeEnglish: "watermark, garbled text, deformed anatomy, unreadable style mash",
  },
};

export function getFixture(id: string | undefined): FixtureCard | undefined {
  return FIXTURES.find((item) => item.id === id);
}
