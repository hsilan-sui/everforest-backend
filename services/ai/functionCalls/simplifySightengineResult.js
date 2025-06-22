// 簡化 Sightengine API 的原始回傳結果，僅保留與風險有關的欄位
// 方便傳給 GPT 做進一步審查彙總

// 簡化結果，避免整包傳進 GPT
const simplifySightengineResult = (result) => ({
  nudity: result.nudity,
  violence: result.violence,
  weapon: result.weapon,
  offensive: result["offensive-2.0"] || result.offensive,
  gore: result["gore-2.0"] || result.gore,
  scam: result.scam,
  alcohol: result.alcohol,
  drugs: result.recreational_drug,
  tobacco: result.tobacco,
  gambling: result.gambling,
});

module.exports = {
  simplifySightengineResult,
};
