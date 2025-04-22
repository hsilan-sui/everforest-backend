/** @type {import('jest').Config} */
const config = {
  // 測試環境（Node.js 環境）
  testEnvironment: "node",

  // 針對哪些檔案執行測試
  testMatch: ["**/tests/**/*.(test|spec).[jt]s?(x)", "**/__tests__/**/*.[jt]s?(x)"],

  // 收集 coverage 資訊
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",

  // 清除 mock 記錄
  clearMocks: true,

  // 忽略 node_modules 中的測試檔案
  testPathIgnorePatterns: ["/node_modules/"],

  // coverage 結果中忽略的目錄
  coveragePathIgnorePatterns: ["/node_modules/"],

  // 可以加快測試速度
  transformIgnorePatterns: ["/node_modules/", "\\.pnp\\.[^\\/]+$"],

  // 假如你有其他 setup，可加入這邊
  // setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};

module.exports = config;
