const appError = require("../utils/appError");

/**
 * 驗證活動是否還在有效時間內，可進行提交審核pending。
 * 規則：
 * - 活動開始時間start_time已過，不允許送審
 * - 若有設定報名截止時間register_time_close，超過也不允許送審（可選）
 */

const validateEventSubmissionTime = (event) => {
  const now = new Date();

  if (new Date(event.start_time) < now) {
    throw appError(400, "活動開始時間已過期，無法再提交審核");
  }

  //如果這個活動有設定報名截止時間，而且那個時間已經過了 → 就丟出錯誤，不允許送審
  if (event.registration_close_time && new Date(event.registration_close_time) < now) {
    throw appError(400, "報名已截止，無法再提交審核");
  }

  // 通過驗證
  return true;
};

module.exports = { validateEventSubmissionTime };
