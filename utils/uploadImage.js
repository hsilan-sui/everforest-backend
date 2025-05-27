const firebaseAdmin = require("firebase-admin");
const config = require("../config/index");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// 處理 firebase 上傳
// 初始化
if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(config.get("secret.firebase.serviceAccount")),
    storageBucket: config.get("secret.firebase.storageBucket"),
  });
}

// 取得 Firebase Storage 中的預設儲存桶物件
const bucket = firebaseAdmin.storage().bucket();

// 定義不同檔案類型的大小限制
const FILE_SIZE_LIMITS = {
  "member-avatar": 2 * 1024 * 1024, // 2MB
  "host-avatar": 2 * 1024 * 1024, // 2MB
  "host-cover": 4 * 1024 * 1024, // 4MB
  "event-cover": 4 * 1024 * 1024,
  "event-detail": 4 * 1024 * 1024,
};

//支援的 MIME 類型
const ALLOWED_FILE_TYPES = {
  "image/jpeg": true,
  "image/png": true,
  "image/jpg": true,
};

// 對應資料夾設定/定義傳遞標籤，在 firebase 做資料夾分類
const folderMapping = {
  "member-avatar": "member/avatars", // 會員頭像
  "host-avatar": "host/avatars", // 主辦方頭像
  "host-cover": "host/covers", // 主辦方封面照
  "event-cover": "event/covers", // 活動封面照
  "event-detail": "event/details", // 活動詳情照
};

//上傳圖片主函式
const uploadImageFile = async (file, imageType) => {
  if (!ALLOWED_FILE_TYPES[file.mimetype]) {
    throw new Error("不支援的檔案類型，僅支援 JPG、PNG 格式");
  }

  // 根據 imageType 設置檔案大小限制
  const maxFileSize = FILE_SIZE_LIMITS[imageType] || 2 * 1024 * 1024; // 預設為 2MB

  if (file.size > maxFileSize) {
    throw new Error(`檔案太大，請選擇小於 ${maxFileSize / (1024 * 1024)} MB 的圖片`);
  }

  // 根據 imageType 選擇對應資料夾，若無對應則使用 'others'
  const folder = folderMapping[imageType] || "others";

  // 取得檔案的擴展名
  const ext = path.extname(file.originalFilename);
  const remoteFilePath = `${folder}/${uuidv4()}${ext}`;

  // 上傳檔案到 Firebase Storage
  await bucket.upload(file.filepath, { destination: remoteFilePath });

  // 獲取檔案的讀取 URL
  const [imageUrl] = await bucket.file(remoteFilePath).getSignedUrl({
    action: "read",
    expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
  });

  return imageUrl;
};

module.exports = {
  uploadImageFile,
  ALLOWED_FILE_TYPES,
};
