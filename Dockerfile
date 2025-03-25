# 這裡是部署用的Dockerfile

# # 使用指定 Node.js 版本（確保一致性）
FROM node:20.11.1

# # 設定容器內的工作目錄 /app
# WORKDIR /app

# # 複製 package 檔案並安裝依賴(提高快取命中率)
# COPY package*.json ./

# # 安裝 npm 套件
# RUN npm install

# # 複製所有原始碼|把剩下的程式碼都複製進去
# COPY . .

# # 開放埠口 | 開放 3000 port（可選）
# EXPOSE ${PORT}

# # 啟動應用程式 |設定預設執行指令
# CMD ["node", "bin/www.js"]