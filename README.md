## 🎞 Everforest 活動票務系統（Backend）

這是一個使用 **Node.js + Express + PostgreSQL** 建立的活動票務系統後端，支援使用者註冊、活動管理、購票功能與訂單系統，並整合 Cookie 驗證與 RESTful API 設計，透過 Docker 部署，方便開發與上線。

---

## 🛠 技術棒

- **Node.js + Express**：後端應用框架
- **PostgreSQL + TypeORM**：資料庫操作與同步
- **JWT + Cookie**：使用者身份驗證與授權
- **Docker + Docker Compose**：容器化部署
- **Husky + Commitlint + ESLint + Prettier**：Git hook 與程式碼風格檢查
- **Swagger**：自動化 API 文件產生

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 建立環境檔案

建立 `.env` 檔案（你可以參考 `.env.example`）：

```bash
npm run init:env
```

---

### 3. 啟動服務（Docker）

建議使用 Docker 開發模式啟動：

```bash
# 啟動開發環境
npm run docker:dev

# 查看 logs
npm run docker:logs:backend
```

Docker 啟動後，後端 API 將會運行於：

```
http://localhost:3000
```

---

## 📦 常用指令

| 指令                  | 說明                     |
| --------------------- | ------------------------ |
| `npm run docker:dev`  | 使用 Docker 啟動開發環境 |
| `npm run docker:stop` | 停止 Docker 服務         |
| `npm run docker:down` | 停止並移除容器           |
| `npm run init:schema` | 同步 TypeORM schema      |
| `npm run lint`        | 執行 ESLint              |
| `npm run lint:fix`    | 自動修復 Lint 問題       |

---

## 🧹 專案結構簡介

```
everforest-backend/
├── app.js                      # Express 入口主程式
├── bin/
│   └── www.js                  # HTTP server 啟動點
├── config/                     # 資料庫、環境變數與驗證等設定
├── controllers/                # 各 API 控制器（Auth、Event、Order 等）
├── db/
│   └── data-source.js          # TypeORM 資料來源設定
├── entities/                   # TypeORM Entity 資料模型
├── middlewares/                # 中介層（權限驗證、錯誤處理等）
├── migrations/                 # TypeORM 資料庫遷移檔案
├── routes/                     # 路由定義檔（分組管理 API）
├── utils/                      # 共用工具函式（Token、Logger 等）
├── swagger.js                  # Swagger API 文件設定
├── wait-for-postgres.js        # Docker 啟動時等待資料庫準備就緒
├── zeabur-template.yml         # Zeabur 部署設定樣板
├── docker-compose.yml          # Docker 容器編排設定
├── Dockerfile.dev              # 開發用 Dockerfile
├── .env.example                # 環境變數範本（建議複製為 .env 使用）
├── .husky/                     # Git commit hook 設定（Husky）
├── .github/                    # GitHub Actions 工作流程與 CI 設定
├── .eslintrc / .prettierrc     # Lint 與格式化規則
└── README.md                   # 專案說明文件

```

---

## 📚 API 文件

API 文件使用 Swagger 自動產生，啟動後可透過下列路徑存取：

> 📘 [點我開啟 Everforest API 文件](https://everforest-backend.zeabur.app/api-docs/)
> 或以下網址：

```
http://localhost:3000/api-docs
```

---

## ☁️ 部署環境

本後端服務已正式部署於 Zeabur，線上 API 可透過以下正式網址存取：

- [https://everforest-backend.zeabur.app/](https://everforest-backend.zeabur.app/)

- [點我開啟 Everforest API 文件](https://everforest-backend.zeabur.app/api-docs/)
