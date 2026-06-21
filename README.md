# 交互生长 Gesture Flora

一个基于摄像头手势识别的网页交互绘画作品。用户通过食指移动选择素材，通过食指和拇指捏合在空中绘制轨迹，画面会沿轨迹生成珍珠、小花、小草、藤蔓、花枝和蝴蝶等视觉元素。

项目使用 `p5.js` 作为 2D 绘制基础，使用 MediaPipe Hand Landmarker 进行手势识别，并加入可开关的 Three.js 透明 3D 叠层，用于珍珠高光、藤蔓生长、花枝分叉和蝴蝶动态飞行等展示效果。

## 在线体验

GitHub Pages:

```text
https://taecson.github.io/gesture-flora/
```

打开页面后允许浏览器使用摄像头即可体验。摄像头画面和手势识别都在本地浏览器中完成，不会上传到服务器。

## 功能特点

- 摄像头输入与 MediaPipe 手部关键点检测
- 食指指尖光标与轨迹平滑
- 食指悬停或点击选择顶部素材
- 食指和拇指捏合后绘制，松开停止
- 6 种素材：珍珠 / 小花 / 小草 / 藤蔓 / 花枝 / 蝴蝶
- 草更密、藤蔓更连续，并根据手速影响生成密度
- 已完成笔画缓存到离屏图层，提升长时间运行性能
- 顶部素材栏和右侧工具栏自动淡出，靠近或移动时重新出现
- 支持清空、撤销、保存 PNG、镜像、鼠标测试、全屏
- 可隐藏调试面板，适合展示模式
- 可开关 Three.js 透明 3D 叠层
- 3D 珍珠高光和空间深度
- 3D 藤蔓沿曲线生长
- 3D 花枝分叉结构、花苞和花朵层次
- 3D 蝴蝶沿轨迹生成、扇动翅膀、盘旋和散开
- 3D 自动性能降级，低性能设备会自动减少对象数量或关闭 3D 层

## 技术栈

- Vite
- JavaScript
- p5.js
- Three.js
- MediaPipe Tasks Vision / Hand Landmarker
- GitHub Pages / GitHub Actions

## 本地运行

需要安装 Node.js。项目本身不依赖 Python。

```bash
npm install
npm run dev
```

打开终端输出的本地地址，例如：

```text
http://localhost:5173
```

浏览器会请求摄像头权限。摄像头权限通常只在 `https://` 或 `localhost` 下可用，因此不建议直接双击 `index.html` 运行。

## 构建

```bash
npm run build
```

构建结果会输出到：

```text
dist/
```

可以通过下面命令本地预览构建结果：

```bash
npm run preview
```

## GitHub Pages 部署

项目已经包含：

```text
vite.config.js
.github/workflows/deploy.yml
```

推送到 `main` 分支后，GitHub Actions 会自动执行：

1. 安装依赖
2. 构建 `dist`
3. 发布到 GitHub Pages

部署完成后访问：

```text
https://taecson.github.io/gesture-flora/
```

## 使用说明

1. 打开网页并允许摄像头权限。
2. 将食指移动到顶部素材按钮附近，停留或点击选择素材。
3. 食指和拇指捏合后移动手指开始绘制。
4. 松开捏合后结束当前笔画。
5. 可以使用右侧工具栏清空、撤销、保存、切换 3D、全屏或打开调试。

如果没有摄像头，也可以打开“鼠标测试”，按住鼠标拖动来测试绘制效果。

## 隐私说明

本项目的摄像头画面只在浏览器本地用于手势识别。GitHub Pages 只托管静态网页文件，不接收、存储或处理摄像头视频。

## 目录结构

```text
src/
├── brushes/      # 2D 素材笔刷
├── drawing/      # 笔画管理和离屏缓存
├── hand/         # 摄像头和手势识别
├── input/        # 鼠标测试输入
├── three/        # Three.js 透明 3D 叠层
├── ui/           # 素材栏、工具栏、调试面板
└── utils/        # 通用工具函数
```

## 备注

本项目适合在支持 WebGL、摄像头权限和现代 JavaScript 的桌面浏览器中运行。推荐使用 Chrome、Edge 或 Safari 的较新版本。
