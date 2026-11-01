import type { FamilyId, Layout, Palette, Style } from "@/lib/types";

export const DEFAULT_TOPIC = "雨天窗台上的橘猫";

export const FAMILY_LABEL: Record<FamilyId, { zh: string; en: string }> = {
  graphite: { zh: "铅笔", en: "Graphite" },
  ink: { zh: "水墨", en: "Ink" },
  watercolor: { zh: "水彩", en: "Watercolor" },
  print: { zh: "版印", en: "Print" },
  collage: { zh: "拼贴", en: "Collage" },
  marker: { zh: "马克笔", en: "Marker" },
  crayon: { zh: "蜡彩", en: "Crayon" },
  technical: { zh: "制图", en: "Technical" },
};

export const STYLES: Style[] = [
  {
    id: "SL-01",
    family: "graphite",
    name: { zh: "田间铅笔速写", en: "Graphite Field Sketch" },
    description: {
      zh: "松散排线、纸面齿痕和淡灰涂抹，像写生本上刚画完的一页。",
      en: "Loose hatching, paper tooth, and pale smudges, as if the page just left a field stool.",
    },
    prompt: {
      zh: "铅笔速写，可见纸纹，松散排线，指腹涂抹的淡灰阴影，边缘不闭合",
      en: "loose graphite field sketch, visible paper tooth, open hatching, fingertip-smudged midtones, unfinished contours",
    },
  },
  {
    id: "SL-02",
    family: "graphite",
    name: { zh: "建筑炭笔测绘图", en: "Charcoal Measured Drawing" },
    description: {
      zh: "炭笔加尺线，体积靠明暗块面，角落留着比例尺。",
      en: "Charcoal plus ruled lines; mass comes from value blocks, with a scale bar in the corner.",
    },
    prompt: {
      zh: "炭笔建筑测绘，块面明暗，淡尺线与比例标注，纸边留灰粉",
      en: "charcoal measured building study, planar values, faint ruled ticks and a scale bar, dust at the sheet edge",
    },
  },
  {
    id: "SL-03",
    family: "graphite",
    name: { zh: "人物铅笔肖像", en: "Graphite Portrait Study" },
    description: {
      zh: "头肩特写，眼神先落笔，衣服只用几根结构线。",
      en: "Head-and-shoulders study; the eyes land first, clothing stays as structure lines.",
    },
    prompt: {
      zh: "铅笔头肩肖像，眼神细画，衣纹克制，背景留白",
      en: "graphite head-and-shoulders portrait, careful eyes, restrained clothing lines, open paper background",
    },
  },
  {
    id: "SL-04",
    family: "graphite",
    name: { zh: "植物标本铅笔", en: "Botanical Graphite Plate" },
    description: {
      zh: "叶片脉理清楚，像标本页，旁注拉丁学名的空位。",
      en: "Clear venation like a herbarium plate, with a blank for a Latin name.",
    },
    prompt: {
      zh: "植物标本式铅笔图，叶脉清晰，轻微投影，旁侧预留学名栏",
      en: "herbarium-style graphite plate, crisp venation, light cast shadow, empty caption rule for a Latin name",
    },
  },
  {
    id: "SL-05",
    family: "graphite",
    name: { zh: "速写本涂抹页", en: "Smudged Sketchbook Spread" },
    description: {
      zh: "对页构图，一侧干净一侧被橡皮和拇指弄脏。",
      en: "A two-page spread: one side clean, the other scuffed by eraser and thumb.",
    },
    prompt: {
      zh: "对开速写本，一侧干净铅笔，一侧橡皮屑与指痕，装订线可见",
      en: "open sketchbook spread, clean graphite on one leaf, eraser crumbs and thumb prints on the other, visible gutter",
    },
  },
  {
    id: "SL-06",
    family: "ink",
    name: { zh: "焦墨枯笔写意", en: "Burnt-Ink Dry Brush" },
    description: {
      zh: "焦墨飞白，笔锋劈开，大面积留白。",
      en: "Dry burnt ink with split hairs and generous unpainted paper.",
    },
    prompt: {
      zh: "焦墨枯笔，飞白与断笔，大留白，墨色由浓到干",
      en: "burnt-ink dry brush, flying white and broken strokes, large unpainted paper, ink fading from dense to dry",
    },
  },
  {
    id: "SL-07",
    family: "ink",
    name: { zh: "细线白描册页", en: "Fine-Line Baimiao Folio" },
    description: {
      zh: "均匀细线，不涂墨块，衣褶像绣稿。",
      en: "Even hairlines, no ink fills; folds read like an embroidery cartoon.",
    },
    prompt: {
      zh: "白描细线册页，无墨块，衣褶均匀，纸色微黄",
      en: "fine-line baimiao folio, no ink fills, even garment folds, faintly warm paper",
    },
  },
  {
    id: "SL-08",
    family: "ink",
    name: { zh: "报纸漫画墨线", en: "Newsprint Ink Cartoon" },
    description: {
      zh: "粗细对比强的蘸水笔，网点像旧报纸。",
      en: "Dip-pen contrast on a newsprint field with cheap halftone dots.",
    },
    prompt: {
      zh: "蘸水笔报纸漫画，粗细对比，廉价网点，纸色发灰",
      en: "dip-pen newsprint cartoon, thick-to-thin contrast, cheap halftone dots, greyish paper",
    },
  },
  {
    id: "SL-09",
    family: "ink",
    name: { zh: "一笔画墨团", en: "Single-Stroke Ink Blob" },
    description: {
      zh: "几乎一笔成形，靠外形识别对象，余墨自然渗开。",
      en: "Almost one stroke; the silhouette names the subject, leftover ink blooms.",
    },
    prompt: {
      zh: "一笔成形的墨团，外形可辨，余墨洇开，几乎没有复笔",
      en: "single-stroke ink blob, readable silhouette, blooming leftover ink, almost no restated marks",
    },
  },
  {
    id: "SL-10",
    family: "ink",
    name: { zh: "碑拓残墨", en: "Stele-Rubbing Remnant" },
    description: {
      zh: "像拓片：白文凸起，边角缺蚀，墨不匀。",
      en: "Like a stone rubbing: raised white glyphs, eaten corners, uneven ink.",
    },
    prompt: {
      zh: "碑拓意味，白文凸起，边角残缺，墨色斑驳不匀",
      en: "stele-rubbing look, raised pale marks, eaten corners, mottled uneven ink",
    },
  },
  {
    id: "SL-11",
    family: "watercolor",
    name: { zh: "湿接水彩街景", en: "Wet-into-Wet Street Wash" },
    description: {
      zh: "颜色在湿纸上相遇，屋檐和行人只有色块。",
      en: "Puddled pigments meet on wet paper; eaves and walkers stay as shapes.",
    },
    prompt: {
      zh: "湿接水彩街景，色块相渗，屋檐与行人只剩形状，纸边水渍",
      en: "wet-into-wet street wash, bleeding color shapes, eaves and walkers as masses, tide marks at the sheet edge",
    },
  },
  {
    id: "SL-12",
    family: "watercolor",
    name: { zh: "分层水彩静物", en: "Layered Still-Life Wash" },
    description: {
      zh: "干后再罩染，杯子和水果有透明叠色。",
      en: "Dried layers reglazed; cups and fruit keep transparent overlap.",
    },
    prompt: {
      zh: "分层罩染水彩静物，透明叠色，高光留纸，桌面淡投影",
      en: "layered still-life watercolor, transparent glazes, reserved-paper highlights, faint table shadow",
    },
  },
  {
    id: "SL-13",
    family: "watercolor",
    name: { zh: "旅行手账淡彩", en: "Travel-Journal Tint" },
    description: {
      zh: "先硬笔后淡彩，边写日期和车票号码。",
      en: "Ink first, tint later, with a date and a ticket number in the margin.",
    },
    prompt: {
      zh: "旅行手账淡彩，硬笔底稿，薄彩罩染，页边日期与票号",
      en: "travel-journal tint, pen underdrawing, thin washes, date and ticket number in the margin",
    },
  },
  {
    id: "SL-14",
    family: "watercolor",
    name: { zh: "雨窗水彩", en: "Rain-Window Watercolor" },
    description: {
      zh: "玻璃上的水流决定形状，窗外景物被拉成长条。",
      en: "Runnels on glass decide the forms; the world outside stretches into stripes.",
    },
    prompt: {
      zh: "雨窗水彩，垂向水流拉成长条色带，窗框只剩淡痕",
      en: "rain-window watercolor, vertical runnels stretching the view into stripes, faint window-frame stains",
    },
  },
  {
    id: "SL-15",
    family: "watercolor",
    name: { zh: "矿物薄涂", en: "Mineral Thin Wash" },
    description: {
      zh: "颗粒感颜料薄薄铺开，像岩彩小样。",
      en: "Gritty pigment laid thin, like a mineral-color swatch.",
    },
    prompt: {
      zh: "矿物颜料薄涂，颗粒沉淀，浅色岩面，几乎不调油",
      en: "mineral thin wash, settled grit, pale stone ground, almost no binder shine",
    },
  },
  {
    id: "SL-16",
    family: "print",
    name: { zh: "油印滚筒招贴", en: "Oil-Roller Poster Print" },
    description: {
      zh: "滚筒不均的油墨，套色略微错位。",
      en: "Uneven roller ink and a slightly misregistered overprint.",
    },
    prompt: {
      zh: "油印滚筒招贴，墨层不匀，套色轻错位，纸边油渍",
      en: "oil-roller poster print, uneven ink film, slight misregistration, oily paper edge",
    },
  },
  {
    id: "SL-17",
    family: "print",
    name: { zh: "刀痕木刻", en: "Knife-Cut Woodblock" },
    description: {
      zh: "阳刻刀痕清楚，黑底留出主体。",
      en: "Clear raised cuts; the subject is reserved out of a black field.",
    },
    prompt: {
      zh: "阳刻木刻，刀痕清楚，大面积黑底留白主体，木纹隐约",
      en: "raised woodblock cut, visible knife tracks, large black field reserving the subject, faint wood grain",
    },
  },
  {
    id: "SL-18",
    family: "print",
    name: { zh: "孔版叠色", en: "Silk-Screen Overprint" },
    description: {
      zh: "两三层平涂色块相交，边缘略渗。",
      en: "Two or three flat screens crossing, edges slightly bled.",
    },
    prompt: {
      zh: "孔版叠色，平涂色块相交，边缘微渗，网孔质感",
      en: "silk-screen overprint, flat crossing fields, slightly bled edges, mesh texture",
    },
  },
  {
    id: "SL-19",
    family: "print",
    name: { zh: "橡皮章重复纹", en: "Rubber-Stamp Repeat" },
    description: {
      zh: "同一图章盖很多遍，墨有深有浅。",
      en: "One stamp hit many times, ink loading from fat to faint.",
    },
    prompt: {
      zh: "橡皮章重复纹，同一图章深浅不一，纸面盖印错位",
      en: "rubber-stamp repeat, one motif at uneven ink loads, slightly offset impressions",
    },
  },
  {
    id: "SL-20",
    family: "print",
    name: { zh: "铅字海报", en: "Letterpress Poster" },
    description: {
      zh: "金属活字压痕，标题字重，插图是一块小锌版。",
      en: "Metal type bite, a heavy title, and a small zinc illustration plate.",
    },
    prompt: {
      zh: "铅字海报，活字压痕，标题厚重，一枚小锌版插图",
      en: "letterpress poster, type bite in the paper, heavy title, one small zinc illustration plate",
    },
  },
  {
    id: "SL-21",
    family: "collage",
    name: { zh: "撕纸拼贴", en: "Torn-Paper Collage" },
    description: {
      zh: "手撕边缘露纤维，色纸层叠出体积。",
      en: "Hand-torn fiber edges; stacked color papers make the volume.",
    },
    prompt: {
      zh: "手撕色纸拼贴，纤维毛边，层叠体积，胶水微亮",
      en: "hand-torn paper collage, fibrous deckle edges, stacked volume, faint glue sheen",
    },
  },
  {
    id: "SL-22",
    family: "collage",
    name: { zh: "旧票根贴页", en: "Ticket-Stub Paste-up" },
    description: {
      zh: "车票、展览票和收据叠成画面。",
      en: "Train stubs, exhibit tickets, and receipts stacked into a picture.",
    },
    prompt: {
      zh: "旧票根贴页，车票与收据叠层，钉书针和胶带痕迹",
      en: "ticket-stub paste-up, stacked fares and receipts, staple holes and tape ghosts",
    },
  },
  {
    id: "SL-23",
    family: "collage",
    name: { zh: "布贴补丁画", en: "Cloth-Patch Appliqué" },
    description: {
      zh: "碎布补丁与粗缝线，像被面局部。",
      en: "Scrap-cloth patches and coarse stitches, like a quilt excerpt.",
    },
    prompt: {
      zh: "布贴补丁，粗缝线，碎布纹理，像被面裁下的一块",
      en: "cloth-patch appliqué, coarse stitching, scrap-fabric grain, like a cut from a quilt",
    },
  },
  {
    id: "SL-24",
    family: "collage",
    name: { zh: "剪影叠层纸", en: "Shadow-Layer Cut Paper" },
    description: {
      zh: "几层单色卡纸错位，投下浅阴影。",
      en: "Offset sheets of single-color card, casting shallow shadows.",
    },
    prompt: {
      zh: "单色卡纸剪影叠层，轻微错位，浅阴影，边缘干净",
      en: "single-color card silhouettes in offset layers, shallow shadows, clean knife edges",
    },
  },
  {
    id: "SL-25",
    family: "marker",
    name: { zh: "酒精马克笔速写", en: "Alcohol-Marker Sketch" },
    description: {
      zh: "酒精度高，色块有条纹，深色后压。",
      en: "Alcohol streaks in the fills, darks restated last.",
    },
    prompt: {
      zh: "酒精马克笔速写，色块条纹，深色后压，纸面微透",
      en: "alcohol-marker sketch, streaky fills, darks restated last, slightly see-through paper",
    },
  },
  {
    id: "SL-26",
    family: "marker",
    name: { zh: "荧光笔批注稿", en: "Highlighter Markup Draft" },
    description: {
      zh: "灰线底稿上几条荧光，像被改过的校样。",
      en: "Grey underdrawing with neon bars, like a marked proof.",
    },
    prompt: {
      zh: "灰线底稿加荧光笔批注，几条霓虹色带，像校样",
      en: "grey-line draft with highlighter bars, a few neon bands, proof-sheet look",
    },
  },
  {
    id: "SL-27",
    family: "marker",
    name: { zh: "双头马克笔产品图", en: "Dual-Tip Product Marker" },
    description: {
      zh: "产品居中，宽头铺色，细头勾倒角。",
      en: "Centered product: chisel fills, brush tip on the chamfers.",
    },
    prompt: {
      zh: "双头马克笔产品图，宽头铺色，细头勾倒角，桌面反光克制",
      en: "dual-tip product marker drawing, chisel fills, fine chamfers, restrained table reflection",
    },
  },
  {
    id: "SL-28",
    family: "marker",
    name: { zh: "漫画网点马克笔", en: "Comic-Screen Marker" },
    description: {
      zh: "马克笔色块加圆形网点，像周刊内页。",
      en: "Marker flats plus round screentone, like a weekly interior page.",
    },
    prompt: {
      zh: "马克笔加圆形网点，周刊内页感，对话框位置留空",
      en: "marker flats with round screentone, weekly-interior look, empty room for a balloon",
    },
  },
  {
    id: "SL-29",
    family: "crayon",
    name: { zh: "蜡笔厚涂童书", en: "Thick-Crayon Picture Book" },
    description: {
      zh: "蜡层厚，纸齿咬出白点，边线笨拙。",
      en: "Thick wax, paper tooth sparking white, clumsy outlines.",
    },
    prompt: {
      zh: "蜡笔厚涂童书，纸齿白点，边线笨拙，颜色饱和但不匀",
      en: "thick-crayon picture book, paper-tooth sparkles, clumsy outlines, saturated uneven color",
    },
  },
  {
    id: "SL-30",
    family: "crayon",
    name: { zh: "彩色铅笔花园", en: "Colored-Pencil Garden" },
    description: {
      zh: "交叉排线堆出色层，叶尖最用力。",
      en: "Cross-hatching builds the layers; leaf tips get the most pressure.",
    },
    prompt: {
      zh: "彩色铅笔花园，交叉排线，叶尖用力，浅色纸底",
      en: "colored-pencil garden, cross-hatched layers, extra pressure at leaf tips, pale paper ground",
    },
  },
  {
    id: "SL-31",
    family: "crayon",
    name: { zh: "粉笔黑板报", en: "Chalk Blackboard Poster" },
    description: {
      zh: "黑板上的粉尘字画，擦痕还在。",
      en: "Dusty chalk on a blackboard, with yesterday's wipe still visible.",
    },
    prompt: {
      zh: "粉笔黑板报，粉尘字画，昨日擦痕，边框用直尺粉笔",
      en: "chalk blackboard poster, dusty drawing and lettering, leftover wipe marks, ruler-drawn chalk border",
    },
  },
  {
    id: "SL-32",
    family: "crayon",
    name: { zh: "油画棒街角", en: "Oil-Pastel Street Corner" },
    description: {
      zh: "油性厚堆，刮出底层颜色，路灯一块高光。",
      en: "Oily impasto with scratched undercolor and one lamp highlight.",
    },
    prompt: {
      zh: "油画棒街角，厚堆与刮痕，一块路灯高光，地面反光脏",
      en: "oil-pastel street corner, scraped undercolor, one lamp highlight, dirty ground bounce",
    },
  },
  {
    id: "SL-33",
    family: "technical",
    name: { zh: "蓝图细线轴测", en: "Blueprint Axonometric" },
    description: {
      zh: "蓝底白线，轴测不透视，标注稀疏。",
      en: "White lines on blue, true axonometric, sparse notes.",
    },
    prompt: {
      zh: "蓝图细线轴测，蓝底白线，无透视缩短，稀疏尺寸",
      en: "blueprint axonometric, white lines on blue, no perspective foreshortening, sparse dimensions",
    },
  },
  {
    id: "SL-34",
    family: "technical",
    name: { zh: "解剖图注释板", en: "Annotated Anatomy Plate" },
    description: {
      zh: "中性线描加编号引出线，像教材插页。",
      en: "Neutral line work with numbered leaders, like a textbook plate.",
    },
    prompt: {
      zh: "解剖图注释板，中性线描，编号引出线，浅米色教材纸",
      en: "annotated anatomy plate, neutral linework, numbered leaders, pale textbook paper",
    },
  },
  {
    id: "SL-35",
    family: "technical",
    name: { zh: "手绘等高线地图", en: "Hand-Contour Map" },
    description: {
      zh: "等高线用针管笔，水面用平行短线。",
      en: "Technical-pen contours; water is parallel ticks.",
    },
    prompt: {
      zh: "手绘等高线地图，针管笔，水面平行短线，图例手写",
      en: "hand-contour map, technical pen, water as parallel ticks, handwritten legend",
    },
  },
  {
    id: "SL-36",
    family: "technical",
    name: { zh: "仪器针管笔图纸", en: "Instrument Pen Plate" },
    description: {
      zh: "线宽分档，圆用圆规，标题栏在右下。",
      en: "Stepped line weights, compass circles, title block at lower right.",
    },
    prompt: {
      zh: "仪器针管笔图纸，线宽分档，圆规圆，右下标题栏",
      en: "instrument pen plate, stepped line weights, compass-true circles, lower-right title block",
    },
  },
];

export const LAYOUTS: Layout[] = [
  {
    id: "LY-01",
    name: { zh: "居中肖像卡", en: "Centered Portrait Card" },
    description: {
      zh: "主体在中轴，四周留白，底边一条窄标题带。",
      en: "Subject on the axis, quiet margins, a slim title band along the bottom.",
    },
    prompt: {
      zh: "居中肖像构图，中轴对称，四周留白，底边窄标题带",
      en: "centered portrait composition, vertical axis, generous margins, slim title band at the bottom",
    },
  },
  {
    id: "LY-02",
    name: { zh: "引言条海报", en: "Quote-Band Poster" },
    description: {
      zh: "上图下文，引言占一条横带，字少而大。",
      en: "Image above, a horizontal quote band below, few large words.",
    },
    prompt: {
      zh: "上图下文，横向引言条，字少而大，左右对齐版心",
      en: "image over a horizontal quote band, few large words, aligned to a quiet text column",
    },
  },
  {
    id: "LY-03",
    name: { zh: "左右对照", en: "Split Comparison" },
    description: {
      zh: "一分为二，中间细缝，两边同一物的两种状态。",
      en: "A thin gutter splits two states of the same subject.",
    },
    prompt: {
      zh: "左右对照，中间细缝，同一对象两种状态，标题压在缝上",
      en: "split comparison, thin center gutter, two states of one subject, title sitting on the seam",
    },
  },
  {
    id: "LY-04",
    name: { zh: "三步流程", en: "Three-Step Process" },
    description: {
      zh: "从左到右三格，箭头轻，数字 1 2 3。",
      en: "Three cells left to right, light arrows, numerals 1 2 3.",
    },
    prompt: {
      zh: "三步横排流程，轻箭头，数字 1 2 3，每格一件事",
      en: "three-step horizontal process, light arrows, numerals 1 2 3, one action per cell",
    },
  },
  {
    id: "LY-05",
    name: { zh: "四格漫画", en: "Four-Panel Comic" },
    description: {
      zh: "2×2 或竖四格，格线手绘，最后一格收束。",
      en: "2×2 or a vertical strip, hand-drawn gutters, a punch in the last panel.",
    },
    prompt: {
      zh: "四格漫画，手绘格线，最后一格收束，对白位置留空",
      en: "four-panel comic, hand-drawn gutters, payoff in the last panel, empty balloon room",
    },
  },
  {
    id: "LY-06",
    name: { zh: "节气大海报", en: "Festival Poster" },
    description: {
      zh: "大标题压在画面中部偏上，角落一枚小印。",
      en: "A large title sits high-center, with a small seal in a corner.",
    },
    prompt: {
      zh: "节气大海报，大标题偏上，角落小印，主体作隐喻不要直译文字",
      en: "festival poster, large title high-center, small corner seal, subject as metaphor rather than literal type",
    },
  },
  {
    id: "LY-07",
    name: { zh: "产品平铺", en: "Product Knolling" },
    description: {
      zh: "俯视，物件正交摆放，留出呼吸空隙。",
      en: "Top-down knolling, objects orthogonal, breathing gaps.",
    },
    prompt: {
      zh: "俯视产品平铺，正交摆放，空隙均匀，一件主物略大",
      en: "top-down product knolling, orthogonal placement, even gaps, one hero object slightly larger",
    },
  },
  {
    id: "LY-08",
    name: { zh: "旅程手绘地图", en: "Journey Map" },
    description: {
      zh: "一条路串起三五个站点，比例可以不诚实。",
      en: "A path strings three to five stops; the scale may lie.",
    },
    prompt: {
      zh: "旅程手绘地图，一条路串三五个站点，比例可夸张，图例手写",
      en: "hand journey map, one path through three to five stops, playful scale, handwritten legend",
    },
  },
  {
    id: "LY-09",
    name: { zh: "编号清单卡", en: "Numbered List Card" },
    description: {
      zh: "左侧编号，右侧短句，顶部一个小插图。",
      en: "Numbers on the left, short lines on the right, a small drawing on top.",
    },
    prompt: {
      zh: "编号清单卡，左号右句，顶部小插图，条目不超过五条",
      en: "numbered list card, numerals left and short lines right, small header drawing, five items or fewer",
    },
  },
  {
    id: "LY-10",
    name: { zh: "宽幅风景条", en: "Wide Landscape Strip" },
    description: {
      zh: "极端横幅，地平线偏低，天空占大部分。",
      en: "Extreme letterbox, low horizon, sky owning most of the frame.",
    },
    prompt: {
      zh: "宽幅风景条，地平线偏低，天空大，左右可裁成封面",
      en: "wide landscape strip, low horizon, large sky, croppable as a cover banner",
    },
  },
  {
    id: "LY-11",
    name: { zh: "等轴测桌面", en: "Isometric Desk" },
    description: {
      zh: "桌面等轴测，物件不透视，像玩具房间。",
      en: "Isometric desktop, no perspective, like a toy room.",
    },
    prompt: {
      zh: "等轴测桌面，物件不透视缩短，像玩具房间，光源来自左上",
      en: "isometric desk, no foreshortening, toy-room scale, light from upper left",
    },
  },
  {
    id: "LY-12",
    name: { zh: "杂志对开", en: "Magazine Spread" },
    description: {
      zh: "左页大图，右页栏宽文字区，中缝明确。",
      en: "Full image on the left, columned type on the right, a clear gutter.",
    },
    prompt: {
      zh: "杂志对开，左大图右栏文，中缝明确，页码在外下角",
      en: "magazine spread, full image left and columns right, clear gutter, folio at the outer foot",
    },
  },
  {
    id: "LY-13",
    name: { zh: "邮票联张", en: "Stamp Sheet" },
    description: {
      zh: "同一主题的小格重复，齿孔边，一枚略偏色。",
      en: "Repeated mini-frames with perforations; one stamp is off-register.",
    },
    prompt: {
      zh: "邮票联张，齿孔边，同一主题小变奏，一枚套色略偏",
      en: "stamp sheet, perforated edges, small variations on one theme, one stamp slightly off-register",
    },
  },
  {
    id: "LY-14",
    name: { zh: "图画书单页", en: "Storybook Page" },
    description: {
      zh: "上图下文，页边像锁线装，文字三两行。",
      en: "Picture over two or three lines of type, sewn-book margins.",
    },
    prompt: {
      zh: "图画书单页，上图下文，两三行字，锁线装页边",
      en: "storybook page, picture over two or three lines, sewn-book margins",
    },
  },
  {
    id: "LY-15",
    name: { zh: "圆形徽章", en: "Circular Emblem" },
    description: {
      zh: "圆形纹章，外圈一圈字，中心一个符号。",
      en: "A round emblem, type on the ring, one symbol in the center.",
    },
    prompt: {
      zh: "圆形徽章，外圈一圈字，中心单一符号，外边留纸",
      en: "circular emblem, type on the outer ring, a single center symbol, paper showing around the badge",
    },
  },
];

export const PALETTES: Palette[] = [
  {
    id: "PA-01",
    name: { zh: "海雾蓝", en: "Sea Fog" },
    description: { zh: "冷灰蓝铺底，一点暖赭点醒。", en: "Cool grey-blue ground with one warm ochre spark." },
    prompt: {
      zh: "海雾蓝主色，浅灰纸底，一点暖赭点缀，整体偏冷",
      en: "sea-fog blue dominant, pale grey paper, one warm ochre accent, overall cool",
    },
    swatches: ["#4A6FA5", "#C5D4E0", "#F4F1EA", "#C27A4A"],
  },
  {
    id: "PA-02",
    name: { zh: "砖茶棕", en: "Brick Tea" },
    description: { zh: "晒干茶叶的褐，配浅米纸。", en: "Sun-dried tea brown on rice-pale paper." },
    prompt: {
      zh: "砖茶棕主色，浅米纸底，少量墨绿叶脉",
      en: "brick-tea brown dominant, rice-pale paper, a little moss-green vein",
    },
    swatches: ["#8A5A3A", "#D8C4A8", "#F6F0E6", "#3F5344"],
  },
  {
    id: "PA-03",
    name: { zh: "地衣灰", en: "Lichen Grey" },
    description: { zh: "石头上的灰绿，几乎无饱和。", en: "Stone lichen, barely saturated." },
    prompt: {
      zh: "地衣灰绿，低饱和，浅石色底，一条更深的苔痕",
      en: "lichen grey-green, low saturation, pale stone ground, one darker moss streak",
    },
    swatches: ["#8B9284", "#D5D2C8", "#F3F1EC", "#4E564C"],
  },
  {
    id: "PA-04",
    name: { zh: "夜靛", en: "Night Indigo" },
    description: { zh: "接近墨的靛，留一线冷白。", en: "Near-ink indigo with a thin cold white." },
    prompt: {
      zh: "夜靛主色，接近墨，一线冷白，禁止高饱和辅色",
      en: "night indigo near ink, one cold-white edge, no high-chroma extras",
    },
    swatches: ["#1C2740", "#3A4A6B", "#E7EAF0", "#9AA6C0"],
  },
  {
    id: "PA-05",
    name: { zh: "宣纸奶油", en: "Xuan Cream" },
    description: { zh: "几乎无色的暖白，靠纸色成立。", en: "Almost colorless warm white; the paper does the work." },
    prompt: {
      zh: "宣纸奶油底，极浅暖白，墨色与淡赭即可",
      en: "xuan-cream ground, barely-warm white, ink plus a whisper of ochre only",
    },
    swatches: ["#F7F1E4", "#E4D8C4", "#2B2B28", "#B08968"],
  },
  {
    id: "PA-06",
    name: { zh: "铜箔", en: "Copper Leaf" },
    description: { zh: "氧化铜的褐金，配石墨黑。", en: "Oxidized copper gold against graphite black." },
    prompt: {
      zh: "铜箔褐金，石墨黑压底，少量铜绿氧化斑",
      en: "copper-leaf brown-gold, graphite-black ground, a few verdigris specks",
    },
    swatches: ["#B87333", "#2C2A28", "#E8E0D4", "#4F7A6B"],
  },
  {
    id: "PA-07",
    name: { zh: "抹茶灰", en: "Matcha Dust" },
    description: { zh: "干抹茶的灰绿，配豆色。", en: "Dry matcha grey-green with a bean-brown note." },
    prompt: {
      zh: "抹茶灰绿，豆色点缀，浅席色纸底",
      en: "matcha-dust grey-green, bean-brown accent, pale tatami paper",
    },
    swatches: ["#7A8A5A", "#C4B49A", "#F3EFE4", "#5A4030"],
  },
  {
    id: "PA-08",
    name: { zh: "砚台", en: "Inkstone" },
    description: { zh: "黑、灰、一点湿墨高光。", en: "Black, grey, and one wet-ink highlight." },
    prompt: {
      zh: "砚台黑灰，湿墨高光一点，几乎单色",
      en: "inkstone black and grey, one wet-ink highlight, nearly monochrome",
    },
    swatches: ["#1A1A1A", "#6B6B6B", "#D8D8D6", "#0D0D0D"],
  },
  {
    id: "PA-09",
    name: { zh: "窑土", en: "Kiln Clay" },
    description: { zh: "陶坯的橙褐，配烟灰。", en: "Bisque orange-brown with kiln smoke." },
    prompt: {
      zh: "窑土橙褐，烟灰灰，少量未烧白泥",
      en: "kiln-clay orange-brown, smoke grey, a little unfired white slip",
    },
    swatches: ["#C56A3A", "#8A6A58", "#EFE6DC", "#4A4440"],
  },
  {
    id: "PA-10",
    name: { zh: "藕粉", en: "Lotus Root" },
    description: { zh: "浅粉灰，像切开的藕，配青绿一点。", en: "Pale pink-grey like cut lotus, plus a teal fleck." },
    prompt: {
      zh: "藕粉浅粉灰，一点青绿，纸色偏暖",
      en: "lotus-root pink-grey, one teal fleck, warm paper",
    },
    swatches: ["#E6C7C0", "#F7EEE8", "#5E8A84", "#8A5A58"],
  },
];

export const DEFAULT_STYLE_ID = "SL-01";
export const DEFAULT_LAYOUT_ID = "LY-01";
export const DEFAULT_PALETTE_ID = "PA-01";

export function styleById(id: string): Style {
  return STYLES.find((item) => item.id === id) ?? STYLES[0];
}

export function layoutById(id: string): Layout {
  return LAYOUTS.find((item) => item.id === id) ?? LAYOUTS[0];
}

export function paletteById(id: string): Palette {
  return PALETTES.find((item) => item.id === id) ?? PALETTES[0];
}
