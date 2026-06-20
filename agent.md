# agent.md — 摄像头手势绘画交互作品实现方案

## 0. 项目目标

实现一个基于电脑摄像头的手势交互网页作品：

- 屏幕上方显示素材选项：`珍珠 / 小花 / 小草 / 藤蔓 / 花枝 / 蝴蝶`
- 用户用食指指尖移动到对应文字按钮区域，触发 hover / click 效果并选中素材
- 用户用食指和拇指捏合后，在空中移动手指，即可沿手指轨迹生成对应素材
- 例如选择“小花”后，捏合移动时生成一条随手指移动的曲线，曲线上分布小花
- 第一版先做 2D 稳定原型；增强版优化美术和交互手感；高级版升级为 Three.js 粒子 / 3D 视觉系统

核心技术路线：

1. 第一版：`p5.js + MediaPipe Hand Landmarker`
2. 增强版：`p5.js + MediaPipe + PNG/SVG 素材 + 交互状态机 + 轨迹平滑`
3. 高级版：`Three.js + MediaPipe + 粒子系统 + 3D brush`

---

## 1. 总体技术判断

本项目不优先使用 TouchDesigner。原因：

- 作品核心是“手势识别 + 状态判断 + 路径生成 + 素材画笔”，用代码实现更清晰
- 用户后续要交给 Codex 实现，Web 前端方案更适合自动化开发和逐步调试
- p5.js 更适合 2D 创意绘画原型
- Three.js 更适合后续高级粒子、3D、发光、空间感
- TouchDesigner 更适合现场装置、投影映射、实时影像合成，但学习成本高，且不利于代码版本管理

最终目标不是先追求复杂技术，而是先让交互稳定、再让视觉变漂亮。

---

## 2. 推荐开发顺序

不要一次性实现全部素材和全部高级视觉。按三阶段推进。

### 阶段 A：第一版 MVP

目标：验证核心交互链路。

必须实现：

- 摄像头打开
- MediaPipe 检测手部关键点
- 显示食指指尖光标
- 屏幕上方显示 6 个素材按钮
- 食指进入按钮区域后触发 hover 效果
- hover 停留一定时间或捏合点击后选中素材
- 识别食指与拇指捏合
- 捏合移动时记录轨迹点
- 沿轨迹生成当前素材
- 至少先完整实现“小花”一种 brush
- 其他素材可先用简单占位图形

技术：

- Vite
- JavaScript
- p5.js
- MediaPipe Hand Landmarker
- HTML/CSS

---

### 阶段 B：增强版

目标：让作品变得可展示、可操作、视觉更精致。

必须实现：

- 坐标平滑，减少手指抖动
- 捏合阈值按手掌尺度归一化
- 按钮选择加入冷却时间，避免误触
- 素材生成间距控制，避免过密
- 曲线平滑
- 素材随机旋转、缩放、透明度、颜色微扰
- 每种素材形成独立 brush
- 加入清空画布、撤销上一笔、保存截图功能
- 加入摄像头镜像校正
- 加入性能统计 FPS
- 支持图片素材加载失败时自动使用程序化图形 fallback

技术：

- p5.js 主渲染
- MediaPipe 手势识别
- 可选：SVG/PNG 素材库
- 可选：GSAP 做按钮动画
- 可选：dat.GUI / lil-gui 做参数调试面板

---

### 阶段 C：高级版

目标：升级为更强视觉系统，适合展览、作品集、视频演示。

必须实现：

- Three.js 场景
- 3D 手势指针映射
- 粒子化素材
- 3D 曲线轨迹
- 蝴蝶动态飞行
- 藤蔓沿曲线生长
- 花枝带分叉结构
- 珍珠带高光和深度
- 可选透明立方体、粒子聚散、发光 bloom、景深
- p5.js 版本保持为 fallback 或快速草图版本

技术：

- Three.js
- MediaPipe Hand Landmarker
- Vite
- EffectComposer / Bloom pass
- InstancedMesh 或 Points 粒子系统
- 可选：@react-three/fiber 不建议第一阶段使用，避免复杂化

---

## 3. 推荐项目结构

```txt
gesture-flora-drawing/
├── agent.md
├── package.json
├── index.html
├── public/
│   └── assets/
│       ├── flower.png
│       ├── pearl.png
│       ├── grass.png
│       ├── vine_leaf.png
│       ├── branch.png
│       └── butterfly.png
├── src/
│   ├── main.js
│   ├── config.js
│   ├── appState.js
│   ├── hand/
│   │   ├── handTracker.js
│   │   ├── handLandmarks.js
│   │   ├── gestureDetector.js
│   │   └── smoothing.js
│   ├── ui/
│   │   ├── materialMenu.js
│   │   ├── toolbar.js
│   │   └── hud.js
│   ├── brushes/
│   │   ├── BrushBase.js
│   │   ├── FlowerBrush.js
│   │   ├── PearlBrush.js
│   │   ├── GrassBrush.js
│   │   ├── VineBrush.js
│   │   ├── BranchBrush.js
│   │   └── ButterflyBrush.js
│   ├── drawing/
│   │   ├── strokeManager.js
│   │   ├── pathUtils.js
│   │   └── renderQueue.js
│   ├── three/
│   │   ├── threeApp.js
│   │   ├── particleBrush.js
│   │   └── effects.js
│   └── utils/
│       ├── math.js
│       ├── coordinate.js
│       └── debug.js
└── README.md
```

第一版可以只实现：

```txt
src/
├── main.js
├── config.js
├── hand/handTracker.js
├── hand/gestureDetector.js
├── ui/materialMenu.js
├── brushes/FlowerBrush.js
└── drawing/strokeManager.js
```

---

## 4. 关键交互定义

### 4.1 手部关键点

MediaPipe hand landmarks 中需要使用以下点：

```js
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
```

核心输入：

```js
indexTip = landmarks[8]
thumbTip = landmarks[4]
wrist = landmarks[0]
middleMCP = landmarks[9]
```

---

### 4.2 坐标映射

MediaPipe 输出一般是归一化坐标：

```js
x in [0, 1]
y in [0, 1]
```

映射到画布：

```js
screenX = (1 - x) * canvasWidth   // 镜像修正
screenY = y * canvasHeight
```

必须提供配置项：

```js
MIRROR_CAMERA = true
```

如果用户感觉左右相反，可以关闭镜像。

---

### 4.3 坐标平滑

使用指数滑动平均：

```js
smoothed.x = alpha * current.x + (1 - alpha) * previous.x
smoothed.y = alpha * current.y + (1 - alpha) * previous.y
```

建议：

```js
alpha = 0.25
```

---

### 4.4 捏合识别

不能直接用像素距离做固定阈值。应该用手掌尺度归一化。

```js
pinchDistance = distance(indexTip, thumbTip)
handScale = distance(wrist, middleMCP)
pinchRatio = pinchDistance / handScale
isPinching = pinchRatio < PINCH_THRESHOLD
```

建议初始参数：

```js
PINCH_THRESHOLD = 0.45
PINCH_RELEASE_THRESHOLD = 0.60
```

使用双阈值避免状态抖动：

```txt
非捏合 → pinchRatio < 0.45 → 进入捏合
捏合中 → pinchRatio > 0.60 → 退出捏合
```

---

### 4.5 按钮选择逻辑

屏幕上方按钮区域：

```js
materials = [
  { id: "pearl", label: "珍珠" },
  { id: "flower", label: "小花" },
  { id: "grass", label: "小草" },
  { id: "vine", label: "藤蔓" },
  { id: "branch", label: "花枝" },
  { id: "butterfly", label: "蝴蝶" }
]
```

按钮触发方式：

第一版采用 hover 停留：

```txt
食指进入按钮区域
持续停留 300ms
选中该素材
```

增强版可改成：

```txt
食指进入按钮区域 + 轻捏一下
选中该素材
```

防误触参数：

```js
BUTTON_HOVER_SELECT_MS = 300
BUTTON_SELECT_COOLDOWN_MS = 800
```

---

### 4.6 轨迹生成逻辑

每次捏合开始，创建一条新 stroke。

```txt
pinch start → createStroke()
pinch move  → addPoint()
pinch end   → finishStroke()
```

不是每一帧都生成素材，而是按距离采样：

```js
if (distance(currentPoint, lastGeneratedPoint) > spacing) {
  brush.emit(currentPoint, tangent, pressureLikeValue)
}
```

建议间距：

```js
BRUSH_SPACING = {
  pearl: 12,
  flower: 32,
  grass: 16,
  vine: 18,
  branch: 26,
  butterfly: 80
}
```

---

## 5. Brush 设计

所有 brush 继承同一接口：

```js
class BrushBase {
  constructor(config) {}
  beginStroke(point) {}
  emit(point, tangent, context) {}
  endStroke() {}
  draw(p) {}
  reset() {}
}
```

每个 brush 内部保存自己的元素数组：

```js
this.elements = []
```

元素结构示例：

```js
{
  x,
  y,
  angle,
  scale,
  opacity,
  age,
  color,
  seed
}
```

---

## 6. 各素材第一版实现标准

### 6.1 珍珠 PearlBrush

第一版：

- 沿轨迹生成白色/淡粉色圆点
- 每个圆点带小高光
- 大小略随机

生成规则：

```js
radius = random(5, 10)
color = nearWhite
highlight = small white circle offset to upper-left
```

增强版：

- 画出珠串感
- 珍珠之间有轻微重叠
- 加入阴影和边缘透明度

---

### 6.2 小花 FlowerBrush

第一版必须优先做好。

第一版：

- 沿轨迹每隔 28–40px 生成一朵程序化小花
- 每朵花包含 5–7 个花瓣
- 花心为浅黄色或淡粉色
- 花瓣颜色以白色和淡粉色为主

程序化画法：

```txt
保存当前坐标系
translate(x, y)
rotate(angle)
for each petal:
    rotate(2π / petalCount)
    ellipse(...)
draw center circle
恢复坐标系
```

增强版：

- 花瓣随机层级
- 花朵大小随机
- 颜色轻微变化
- 曲线方向决定花朵朝向
- 部分花朵带小叶片

---

### 6.3 小草 GrassBrush

第一版：

- 沿轨迹生成短草叶
- 每个点生成 2–5 根草
- 草叶方向围绕轨迹切线/法线随机偏移
- 使用曲线或三角叶片

增强版：

- 草叶高低错落
- 添加细线叶脉
- 密度随手速变化

---

### 6.4 藤蔓 VineBrush

第一版：

- 捏合移动时画绿色曲线
- 每隔一定距离生成叶片
- 叶片沿曲线切线方向旋转

增强版：

- 使用贝塞尔曲线平滑轨迹
- 添加卷曲须
- 添加小花点缀
- 藤蔓末端有生长动画

---

### 6.5 花枝 BranchBrush

第一版：

- 轨迹为主枝
- 每隔一定距离生成小分支
- 分支末端生成花苞或小花

增强版：

- 分支方向根据轨迹方向自动确定
- 花苞有大小层次
- 主枝有粗细变化
- 可模拟“生长”动画

---

### 6.6 蝴蝶 ButterflyBrush

第一版：

- 不要密集生成蝴蝶
- 沿轨迹每隔较大距离生成一只蝴蝶
- 蝴蝶有轻微上下浮动
- 翅膀用两个椭圆或 PNG 实现

增强版：

- 蝴蝶不是贴死在轨迹上，而是围绕轨迹飞行
- 加入翅膀扇动
- 加入拖尾粒子
- 蝴蝶朝向沿轨迹切线变化

---

## 7. 第一版 MVP 任务清单

Codex 按以下顺序实现，不要跳步。

### Task 1：创建项目

- 使用 Vite 创建 vanilla JS 项目
- 安装 p5.js 和 MediaPipe tasks-vision
- 保证 `npm install` 和 `npm run dev` 可运行

验收：

- 浏览器打开后显示空画布
- 控制台没有报错

---

### Task 2：接入摄像头

- 请求 webcam 权限
- 把视频作为隐藏 video 元素
- 可选在 debug 模式下显示摄像头画面

验收：

- 页面可以正常请求摄像头
- 摄像头画面可作为输入传给 MediaPipe

---

### Task 3：接入 MediaPipe Hand Landmarker

- 初始化 Hand Landmarker
- runningMode 使用 VIDEO
- 每帧检测手部 landmarks
- 只使用第一只手
- 输出 indexTip、thumbTip、wrist、middleMCP

验收：

- 控制台能稳定输出手部关键点
- 没有手时不会报错

---

### Task 4：实现食指光标

- 将 indexTip 映射到 canvas 坐标
- 做镜像修正
- 做平滑
- 在画布上画出一个圆形光标

验收：

- 食指移动时，屏幕光标跟随
- 左右方向符合直觉
- 光标不明显抖动

---

### Task 5：实现素材菜单

- 顶部显示 6 个按钮
- hover 时按钮高亮
- hover 停留 300ms 后选中
- 选中按钮显示 active 状态

验收：

- 食指移动到按钮上可以选中素材
- 不会频繁误切换

---

### Task 6：实现捏合检测

- 用 indexTip 与 thumbTip 的归一化距离判断捏合
- 使用双阈值
- 在 HUD 中显示当前 pinchRatio 和 isPinching

验收：

- 食指和拇指靠近时进入绘制状态
- 松开时停止绘制
- 状态不会快速闪烁

---

### Task 7：实现 StrokeManager

- pinch start 创建 stroke
- pinch move 追加点
- pinch end 结束 stroke
- 支持多个 stroke 保留在画面上
- 支持清空画布

验收：

- 捏合移动可以留下轨迹
- 松开后轨迹保留

---

### Task 8：实现 FlowerBrush

- 先只实现小花 brush
- 沿轨迹按距离生成小花
- 小花方向根据轨迹切线旋转
- 每朵花随机大小和花瓣数

验收：

- 选择“小花”后，捏合移动生成花朵曲线
- 花朵不会过密
- 松开后停止生成

---

### Task 9：实现其他 brush 的第一版

- PearlBrush
- GrassBrush
- VineBrush
- BranchBrush
- ButterflyBrush

验收：

- 每个按钮对应一种可识别的视觉效果
- 视觉可以简单，但不能全部一样

---

## 8. 增强版任务清单

### Task E1：改进交互稳定性

- 食指坐标平滑参数可配置
- pinchRatio 加滑动平均
- 按钮选择加入 cooldown
- 手丢失时保持最后状态 200ms，避免瞬断

---

### Task E2：轨迹平滑

实现路径工具函数：

```js
resamplePath(points, spacing)
smoothPath(points, windowSize)
computeTangent(points, i)
```

增强所有 brush 的轨迹效果。

---

### Task E3：素材图层管理

引入图层：

```txt
background layer
stroke layer
live preview layer
ui layer
debug layer
```

目的：

- 已完成作品不需要每帧重绘所有复杂元素
- 提升性能
- 方便保存截图

---

### Task E4：UI 工具栏

添加：

- 清空
- 撤销上一笔
- 保存 PNG
- debug on/off
- 镜像 on/off
- brush size
- density

---

### Task E5：美术增强

每个 brush 添加：

- 随机旋转
- 随机大小
- 透明度变化
- 生长动画
- 粒子拖尾
- fallback 图形

---

## 9. 高级版任务清单

高级版建议在第一版和增强版稳定后新建分支实现：

```txt
branch: feature/three-version
```

### Task A1：Three.js 基础场景

- 创建 scene / camera / renderer
- 使用透明背景或纯色背景
- 支持 resize
- 添加基础光源
- 添加 EffectComposer 可选后处理

---

### Task A2：手势坐标映射到 3D

将 2D 手势位置映射到 3D 平面：

```js
x3d = map(screenX, 0, width, -worldW / 2, worldW / 2)
y3d = map(screenY, 0, height, worldH / 2, -worldH / 2)
z3d = 0
```

可选使用 pinchRatio 或 hand world landmarks 控制 z 深度。

---

### Task A3：3D Brush

实现：

```js
class ThreeBrushBase {
  beginStroke(point3D) {}
  emit(point3D, tangent3D, context) {}
  update(dt) {}
  render(scene) {}
  dispose() {}
}
```

---

### Task A4：粒子系统

实现两种方式：

第一版：

- THREE.Points
- BufferGeometry
- PointsMaterial

增强版：

- InstancedMesh
- 每个粒子作为小圆片、小花瓣、小叶片
- 用 instanceMatrix 控制位置、旋转、缩放

---

### Task A5：高级视觉效果

可选逐项实现：

- 珍珠：小球 + 高光材质
- 小花：多片花瓣 mesh
- 小草：细长曲面或 line
- 藤蔓：TubeGeometry + leaf instances
- 花枝：曲线骨架 + 分支
- 蝴蝶：两个翅膀 mesh + 扇动动画
- 透明立方体：EdgesGeometry + 粒子边框
- Bloom：发光效果
- Depth of field：景深
- Wind dispersion：握拳或松开后粒子散开

---

## 10. 状态机设计

全局状态：

```js
appState = {
  selectedMaterial: "flower",
  handVisible: false,
  indexPoint: null,
  thumbPoint: null,
  pinchRatio: null,
  isPinching: false,
  previousPinching: false,
  activeStroke: null,
  strokes: [],
  hoveredButtonId: null,
  hoverStartTime: null,
  lastButtonSelectTime: 0,
  debug: true,
  mirror: true
}
```

每帧更新顺序：

```txt
1. 获取摄像头 frame
2. MediaPipe 检测手部 landmarks
3. 提取关键点
4. 坐标映射
5. 平滑
6. 更新 pinch 状态
7. 更新按钮 hover / selected
8. 如果不在菜单区域且正在捏合，更新绘制
9. 渲染画面
10. 渲染 UI / HUD
```

注意：

- 当食指在顶部菜单区域时，不应该同时绘制
- 菜单区和绘图区要分离
- 可设置 `DRAWING_TOP_MARGIN = 90`

---

## 11. 关键参数

```js
export const CONFIG = {
  mirrorCamera: true,

  smoothingAlpha: 0.25,

  pinchEnterThreshold: 0.45,
  pinchReleaseThreshold: 0.60,
  pinchSmoothingAlpha: 0.35,

  buttonHoverSelectMs: 300,
  buttonSelectCooldownMs: 800,

  drawingTopMargin: 90,

  brushSpacing: {
    pearl: 12,
    flower: 34,
    grass: 16,
    vine: 18,
    branch: 28,
    butterfly: 85
  },

  maxStrokePoints: 5000,
  maxElementsPerBrush: 3000,

  debug: true
}
```

---

## 12. 性能要求

必须满足：

- 普通笔记本摄像头下交互流畅
- 目标 FPS：30+
- 没有手时 CPU 占用应下降
- 单个 brush 元素数量需要有限制
- 图像素材预加载
- 不要在每帧创建大量临时对象
- 不要在 draw loop 中频繁 new 大数组
- 已完成 stroke 尽量缓存到离屏画布

---

## 13. 代码规范

Codex 实现时必须遵守：

1. 模块化，不要把所有代码写在一个文件里
2. 所有 magic number 放入 `config.js`
3. 所有 hand landmark index 放入常量文件
4. 每个 brush 单独文件
5. 每个函数只做一件事
6. 不要提前引入 React
7. 不要第一版就上 TypeScript，除非项目已经稳定
8. 不要第一版就上 Three.js
9. 不要依赖 TouchDesigner
10. 所有异步初始化必须有错误处理
11. 摄像头权限失败时显示明确提示
12. MediaPipe 模型加载失败时显示明确提示

---

## 14. 第一版验收标准

第一版完成时，必须达到以下状态：

- `npm install` 成功
- `npm run dev` 成功
- 浏览器打开页面后请求摄像头
- 能检测到手
- 食指光标跟随手指移动
- 顶部 6 个按钮可被食指 hover 选中
- 当前选中素材有明显 active 状态
- 食指和拇指捏合后进入绘制状态
- 松开后停止绘制
- 选择“小花”后，可以沿手指路径生成花朵曲线
- 其他 5 个素材至少有可区分的占位 brush
- 支持清空画布
- 无明显控制台报错
- README 中说明如何运行

---

## 15. 增强版验收标准

增强版完成时，必须达到：

- 坐标稳定，不明显抖动
- 捏合识别稳定，不频繁误触发
- 素材按钮不误切
- 所有 6 种素材都有明确风格
- 轨迹曲线自然
- 素材密度合理
- 可撤销上一笔
- 可保存 PNG
- 可开关 debug 面板
- 可以长时间运行 5 分钟不明显卡顿

---

## 16. 高级版验收标准

高级版完成时，必须达到：

- Three.js 场景正常运行
- 手势可以控制 3D 绘制位置
- 至少 3 种素材有 3D 或粒子效果
- 蝴蝶有动态飞行动画
- 藤蔓或花枝有生长感
- 支持发光或粒子拖尾
- 不影响第一版 p5.js fallback
- 高级视觉可以单独开关

---

## 17. 建议 Codex 首次执行命令

请先执行：

```bash
npm create vite@latest gesture-flora-drawing -- --template vanilla
cd gesture-flora-drawing
npm install
npm install p5 @mediapipe/tasks-vision
npm run dev
```

然后按 Task 1 到 Task 9 逐步实现。

不要同时实现增强版和高级版。

---

## 18. 第一轮实现提示词

可以直接把下面这段给 Codex：

```txt
请根据 agent.md 实现第一版 MVP。技术栈使用 Vite + vanilla JavaScript + p5.js + MediaPipe Hand Landmarker。请先完成项目初始化、摄像头接入、手部关键点检测、食指光标、顶部素材菜单、捏合检测、StrokeManager 和 FlowerBrush。不要实现 Three.js，不要引入 React，不要一次性做复杂美术。实现后确保 npm install 和 npm run dev 可运行，并在 README 中写清楚运行方式。
```

---

## 19. 第二轮实现提示词

第一版跑通后，再给 Codex：

```txt
现在在已有第一版基础上实现增强版。请优化手势稳定性、加入坐标平滑、pinch 双阈值、按钮 cooldown、轨迹平滑、清空画布、撤销上一笔、保存 PNG、debug 面板，并补全 PearlBrush、GrassBrush、VineBrush、BranchBrush、ButterflyBrush 的第一版视觉效果。保持模块化结构，不要引入 Three.js。
```

---

## 20. 第三轮实现提示词

增强版稳定后，再给 Codex：

```txt
现在新建 Three.js 高级视觉分支。保留 p5.js 版本作为 fallback，不要破坏现有功能。请实现 Three.js 场景、手势 2D 到 3D 坐标映射、基础粒子系统、至少 FlowerBrush、VineBrush、ButterflyBrush 的 3D/粒子版本，并加入可开关的 bloom 或发光效果。注意性能，优先使用 InstancedMesh 或 BufferGeometry。
```

---

## 21. 不要做的事情

Codex 不要做以下事情：

- 不要一开始就改成 React 项目
- 不要一开始就做 Three.js 全功能
- 不要用 TouchDesigner
- 不要把所有逻辑塞进 `main.js`
- 不要用固定像素阈值判断捏合
- 不要每帧无限制生成素材
- 不要忽略摄像头权限错误
- 不要忽略模型加载失败
- 不要让菜单区域和绘制区域互相冲突
- 不要在没有手时继续执行高成本绘制逻辑

---

## 22. 最重要的实现原则

第一优先级：交互稳定  
第二优先级：代码结构清楚  
第三优先级：视觉好看  
第四优先级：高级效果  

先完成“能选中、能捏合、能画出花朵曲线”，再扩展其他素材和高级视觉。
