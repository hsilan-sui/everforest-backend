/**
 * 萃取活動資料中所有文字內容，用於審查
 * @param {Object} eventData - 完整的活動資料物件
 * @returns {string} - 組合後的文字內容
 */
const extractTextFromEvent = (eventData) => {
  const textParts = [];

  //基本欄位
  if (eventData.title) textParts.push(`活動標題：${eventData.title}`);
  if (eventData.description) textParts.push(`活動描述：${eventData.description}`);
  if (eventData.cancel_policy) textParts.push(`取消政策：${eventData.cancel_policy}`);

  // 主辦方描述
  if (eventData.host?.name) textParts.push(`主辦方名稱：${eventData.host.name}`);
  if (eventData.host?.description) textParts.push(`主辦方介紹：${eventData.host.description}`);

  // 行前提醒
  if (Array.isArray(eventData.notices)) {
    eventData.notices.forEach((n, i) => {
      if (n.content) textParts.push(`行前提醒 ${i + 1}：${n.content}`);
    });
  }

  // 圖片描述（不處理圖片 URL）
  if (Array.isArray(eventData.photos)) {
    eventData.photos.forEach((p, i) => {
      if (p.description) textParts.push(`圖片 ${i + 1} 描述：${p.description}`);
    });
  }

  // 活動方案
  if (Array.isArray(eventData.plans)) {
    eventData.plans.forEach((plan, i) => {
      textParts.push(`方案 ${i + 1}：${plan.title}`);
      plan.eventPlanContentBox?.forEach((c, j) => {
        if (c.content) textParts.push(`方案 ${i + 1} - 條目 ${j + 1}：${c.content}`);
      });
      plan.eventPlanAddonBox?.forEach((a, j) => {
        if (a.name) textParts.push(`方案 ${i + 1} - 加購品 ${j + 1}：${a.name}`);
      });
    });
  }

  return textParts.join("\n");
};

module.exports = {
  extractTextFromEvent,
};
