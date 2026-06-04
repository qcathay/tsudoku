# T 數獨 · T Sudoku Pro

一個功能完整、多檔案架構的精美數獨網頁遊戲。

## ✨ 功能特色

| 功能 | 說明 |
|------|------|
| 🎮 三種難度 | 簡單 / 中等（唯一解）/ 困難（唯一解驗證） |
| 🌙 深色/淺色主題 | 一鍵切換，自動記憶偏好(Deleted) |
| ✨ Three.js 粒子背景 | 動態金色粒子 + 網格線 |
| ⏱ LED 數碼計時器 | Share Tech Mono 字型，發光效果 |
| ✏️ 候選數字模式 | 專業 Pencil Marks 標記 |
| 🔊 電話按鍵音效 | DTMF 雙音頻，Web Audio API |
| 🟢🔴 輸入反饋聲 | 正確：上升和弦 / 錯誤：蜂鳴聲 |
| 🎬 解題動畫 | 自動逐格填入答案動畫 |
| 💡 提示系統 | 智能提示正確格 |
| 🏳 放棄此局 | 確認對話框 + 睇答案選項 |
| 🏆 排行榜 | localStorage 記錄最佳時間 Top 5 |
| 🎉 完成慶祝 | Emoji 飄落效果（2秒） |
| 💾 自動儲存 | 重新整理唔會消失進度 |
| 📱 響應式設計 | 手機同電腦完美適配 |

## 📁 檔案結構

```
t-sudoku-pro/
├── index.html          # 主頁面
├── README.md           # 說明文件
├── css/
│   └── style.css       # 全部樣式（主題/動畫/佈局）
└── js/
    ├── engine.js       # 數獨邏輯（生成/驗證/解題）
    ├── audio.js        # 音效引擎（Web Audio API）
    ├── ui.js           # UI層（Three.js/渲染/動畫）
    └── main.js         # 遊戲控制器（狀態/事件/存儲）
```

## 🚀 使用方法

### 本地運行
直接用瀏覽器打開 `index.html` 即可，無需安裝或伺服器。

### 部署到 GitHub Pages
1. 上傳至 GitHub Repository
2. Settings → Pages → Source 選 `main` branch，根目錄 `/`
3. 儲存後透過 `https://<用戶名>.github.io/<repo名>` 訪問

## 🛠 技術棧

- **純 HTML / CSS / JavaScript**（零框架依賴）
- **Three.js r128**（3D 粒子背景，CDN 引入）
- **Web Audio API**（所有音效程序生成，無音效檔案）
- **Google Fonts**（Playfair Display / JetBrains Mono / Share Tech Mono）
- **localStorage**（進度 + 排行榜本地儲存）

## 🎹 鍵盤控制

| 按鍵 | 功能 |
|------|------|
| `1`–`9` | 填入數字 |
| `0` / `Backspace` / `Delete` | 清除格子 |
| `↑ ↓ ← →` | 移動選格 |

## 📜 授權

MIT License — 自由使用、修改、分發。
