##開發用的 (部署時再來寫部署的版本)
# 使用指定 Node.js 版本
FROM node:20.11.1

# 設定工作目錄
WORKDIR /app

# 複製 package 檔案並安裝依賴
COPY package*.json ./
RUN npm install

# 複製所有原始碼
COPY . .

# 開放埠口
EXPOSE ${PORT}

# 啟動應用程式
CMD ["node", "bin/www.js"]