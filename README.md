# 交互生长

基于电脑摄像头的手势绘画原型。第一版使用 Vite、vanilla JavaScript、p5.js 和 MediaPipe Hand Landmarker，实现食指选择素材、捏合绘制轨迹，并提供 6 种程序化素材 brush。

## 运行

```bash
npm install
npm run dev
```

打开终端输出的本地地址后，浏览器会请求摄像头权限。MediaPipe 的 wasm 与 hand landmarker 模型已经放在 `public/vendor/mediapipe/` 下，页面运行时会优先读取本地资源。

## Python 约定

第一版项目本身不依赖 Python。后续如果加入脚本，请使用本机 conda 环境：

```bash
conda run -n base python your_script.py
```

也可以通过项目脚本确认当前 conda Python：

```bash
npm run check:conda
```

## 第一版功能

- 摄像头输入与 MediaPipe 手部关键点检测
- 食指指尖光标与坐标平滑
- 顶部素材菜单：珍珠 / 小花 / 小草 / 藤蔓 / 花枝 / 蝴蝶
- 食指 hover 停留 300ms 选择素材
- 食指和拇指捏合后绘制，松开停止
- 捏合比例使用手掌尺度归一化，并使用双阈值防抖
- 支持清空画布、撤销上一笔、保存 PNG、debug 显示、镜像开关
- 小花为第一版主 brush，其余素材提供可区分的占位视觉
