// utils/emailUtils.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: false, // Gmail 通常使用 TLS (587)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * 發送重設密碼 Email
 * @param {string} toEmail - 收件者 email
 * @param {string} resetLink - 前端用的重設密碼連結
 */
exports.sendResetPasswordEmail = async (toEmail, resetLink) => {
  const mailOptions = {
    from: `"Everforest_森森不息露營活動平台" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "🔐 密碼重設通知",
    html: `
        <div style="
      font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
      line-height: 1.8;
      border: 1px solid #d8e4dc;
      border-radius: 16px;
      padding: 32px;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f2fdf6;
      text-align: center;
      color: #2c3e50;
    ">
      <img src="https://i.postimg.cc/pXqnm9rf/everforest-logo.png" alt="Everforest Logo" style="max-width: 140px; margin-bottom: 24px;" />

      <h2 style="color: #28a745; margin-bottom: 16px;">🌿 密碼重設通知</h2>

      <p style="text-align: left;">親愛的用戶您好 🌱，</p>
      <p style="text-align: left;">我們收到了您重設密碼的請求，請點擊下方按鈕前往設定新密碼：</p>

      <p style="margin: 28px 0;">
        <a href="${resetLink}" style="
          display: inline-block;
          padding: 14px 24px;
          background-color: #28a745;
          color: #fff;
          font-weight: bold;
          text-decoration: none;
          border-radius: 8px;
          font-size: 16px;
        " onmouseover="this.style.backgroundColor='#218838'" onmouseout="this.style.backgroundColor='#28a745'">
          🔐 立即重設密碼
        </a>
      </p>

      <p style="text-align: left; font-size: 13px; color: #999;">
        若按鈕無法點擊，您也可以將以下連結複製至瀏覽器開啟：<br />
        <a href="${resetLink}" style="color: #28a745; word-break: break-all;">若上述按鈕無法點擊，請點我</a>
      </p>

      <p style="text-align: left;">若您並未發出此請求，請放心忽略此封信 💤</p>

      <p style="font-size: 13px; color: #888; text-align: left;">
        此連結將於 <strong>15 分鐘</strong> 後失效，請儘快完成操作。
      </p>

      <p style="text-align: left; font-size: 12px; color: #bbb; margin-top: 32px;">
        🌲 森森不息團隊 🌲 敬上
      </p>

      <p style="font-size: 11px; color: #ccc; margin-top: 40px;">
        © 2025 森森不息 | 本郵件由系統自動發送，請勿直接回覆。
      </p>
    </div>
    `,
    // html: `
    //   <p>您好，</p>
    //   <p>您請求了密碼重設，請點擊以下連結：</p>
    //   <p><a href="${resetLink}">${resetLink}</a></p>
    //   <p>此連結將在 <strong>15 分鐘</strong> 後失效。</p>
    // `,
  };

  await transporter
    .sendMail(mailOptions)
    .then((info) => {
      console.warn("Email 寄出成功：", info.response);
    })
    .catch((error) => {
      console.error("Email 寄送失敗：", error);
    });
};

/**
 * 寄送訂單成功通知信
 */
exports.sendOrderSuccessEmail = async (toEmail, orderList = []) => {
  const htmlContent = `
<div style="
  font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
  line-height: 1.8;
  border: 1px solid #d8e4dc;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  margin: 0 auto;
  background-color: #fff0f5;
  text-align: center;
  color: #2c3e50;
">
  <img src="https://i.postimg.cc/pXqnm9rf/everforest-logo.png" alt="Everforest Logo" style="max-width: 140px; margin-bottom: 24px;" />

  <h2 style="color: #28a745; margin-bottom: 16px;">🌿 訂單成立通知</h2>

  <p style="text-align: left;">親愛的用戶您好 🌱，</p>
  <p style="text-align: left;">✅ 您已成功預訂以下露營活動：</p>

  <div style="display: inline-block; text-align: left; margin: 16px auto; border: 1px solid #d8e4dc;
  border-radius: 16px; padding: 16px;">
    <ul style="padding-left: 20px; margin: 0;">
      ${orderList
        .map(
          (order) => `
      <li style="margin-bottom: 12px;">
        <strong>🌲 活動：</strong>${order.activityName}<br />
        <strong>📅 日期：</strong>${order.date}<br />
        <strong>💰 金額：</strong>${order.amount} 元
      </li>
      `
        )
        .join("")}
    </ul>
  </div>

  <p style="text-align: left;">我們期待與您共度一段美好的自然時光！🧭</p>

  <p style="font-size: 13px; color: #888; text-align: left; margin-top: 32px;">
    💌 若您對訂單有任何疑問，請聯絡客服信箱：<a href="mailto:service@everforest.tw" style="color: #28a745;">service@everforest.tw</a>
  </p>

  <p style="font-size: 12px; color: #bbb; text-align: left; margin-top: 24px;">
    🌳 森森不息團隊敬上 🌳
  </p>

  <p style="font-size: 11px; color: #ccc; margin-top: 40px;">
    © 2025 森森不息 | 本郵件由系統自動發送，請勿直接回覆。
  </p>
</div>
  `;
  // const htmlContent = `
  //   <p>您好，</p>
  //   <p>您已成功預訂以下露營活動：</p>
  //   <ul>
  //     ${orderList
  //       .map(
  //         (order) => `
  //       <li>
  //         活動：${order.activityName}<br/>
  //         日期：${order.date}<br/>
  //         金額：${order.amount} 元
  //       </li>
  //     `
  //       )
  //       .join("")}
  //   </ul>
  //   <p>我們期待與您一同共度美好時光！</p>
  // `;

  const mailOptions = {
    from: `"Everforest_森森不息露營活動平台" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "🔔 露營訂單中心 - 訂單成功通知",
    html: htmlContent,
  };

  await transporter
    .sendMail(mailOptions)
    .then((info) => console.warn("訂單通知信寄出成功：", info.response))
    .catch((error) => console.error("訂單通知信寄送失敗：", error));
};

/**
 * 寄送訂單票券(QRCODE)
 */
exports.sendTicketEmail = async ({ toEmail, orderId, ticketCode, eventTitle, qrImageUrl }) => {
  const mailOptions = {
    from: `"Everforest_森森不息露營活動平台" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "💌 露營活動票券中心-您的活動票券資訊",
    html: `
    <div style="
      font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
      line-height: 1.8;
      border: 1px solid #eaf4ff;
      border-radius: 16px;
      padding: 32px;
      max-width: 600px;
      margin: 0 auto;
      background-color: #eaf4ff;
      text-align: center;
      color: #5a2b43;
    ">
      <img src="https://i.postimg.cc/pXqnm9rf/everforest-logo.png" alt="Everforest Logo" style="max-width: 140px; margin-bottom: 24px;" />

      <h2 style="color: #e75480; margin-bottom: 16px;">🎟️ 您的露營票券已送達！</h2>

      <p style="text-align: left;">親愛的會員您好 🌟，</p>
      <p style="text-align: left;">
        以下是您訂單 <strong>🧾 ${orderId}</strong> 的票券資訊，請妥善保存：
      </p>

      <ul style="text-align: left; padding-left: 20px; margin-top: 16px;">
        <li><strong>🔐 票券代碼：</strong>${ticketCode}</li>
        <li><strong>🏕️ 活動名稱：</strong>${eventTitle}</li>
      </ul>

      <p style="margin: 24px 0;">📷 請攜帶以下 QRCode 入場：</p>
      <img src="${qrImageUrl}" alt="QRCode" style="max-width: 240px; border-radius: 12px; box-shadow: 0 0 8px rgba(0,0,0,0.1);" />

      <p style="font-size: 13px; color: #888; margin-top: 8px;">
        📎 <a href="${qrImageUrl}" style="color: #d63384;">無法顯示時請點我開啟 QRCode</a>
      </p>

      <p style="text-align: left; font-size: 13px; color: #999; margin-top: 24px;">
        若有任何問題，歡迎來信 <a href="mailto:service@everforest.tw" style="color: #e75480;">service@everforest.tw</a>
      </p>

      <p style="text-align: left; font-size: 12px; color: #bbb; margin-top: 28px;">
        🌷 森森不息票券中心 🌷 敬上
      </p>

      <p style="font-size: 11px; color: #ccc; margin-top: 40px;">
        © 2025 森森不息 | 本郵件由系統自動發送，請勿直接回覆。
      </p>
    </div>
    `,
    // html: `
    //   <p>親愛的會員您好，</p>
    //   <p>以下是您訂單 <b>${orderId}</b> 的票券資訊：</p>
    //   <p><b>票券代碼：</b>${ticketCode}</p>
    //   <p><b>活動名稱：</b>${eventTitle}</p>
    //   <p><img src="${qrImageUrl}" alt="QRCode" width="240"/></p>
    //   <p><a href="${qrImageUrl}">若無法顯示請點此開啟 QRCode</a></p>
    // `,
  };

  await transporter
    .sendMail(mailOptions)
    .then((info) => console.warn("票券信件寄出成功：", info.response))
    .catch((error) => console.error("票券信件寄送失敗：", error));
};

/**
 * 寄送活動審核結果通知信
 */
exports.sendEventReviewResultEmail = async ({
  toEmail,
  eventTitle,
  isApproved,
  isAiReview = false,
  reason = "",
}) => {
  const subject = isApproved ? "🎉 活動審核通過通知" : "📝 活動審核退回通知";

  const statusMessage = `
  <p>您提交的活動 <strong>「${eventTitle}」</strong> ${
    isApproved ? "已通過審核，現在已上架至平台了🎊。" : "未通過審核，請根據以下建議修正後重新提交："
  }</p>

  ${
    isAiReview && reason
      ? `
      <hr style="margin: 24px 0; border: none; border-top: 1px dashed #ccc;" />
      <p style="font-weight: bold;">🤖 以下為 AI 審核回饋：</p>
      <div style="margin-top: 12px;">${reason}</div>
      <p style="font-size: 13px; color: #888; margin-top: 24px;">
        📡 <em>本次審核由 Everforest AI 系統自動執行，內容僅供參考，請依照建議優化您的活動內容。</em>
      </p>
      `
      : ""
  }
`;

  // const statusMessage = isApproved
  //   ? `<p>您提交的活動 <strong>「${eventTitle}」</strong> 已通過審核，現在已上架至平台了🎊。</p>

  //   `
  //   : `<p>您提交的活動 <strong>「${eventTitle}」</strong> 未通過審核，請根據以下建議修正後重新提交：</p>
  //      <p style="color: #e74c3c; padding: 12px; background: #fff2f0; border-radius: 8px;">${reason}</p>`;

  const mailOptions = {
    from: `"Everforest_森森不息露營活動平台" <${process.env.EMAIL_USER}>`,
    to: toEmail, //toEmail
    subject,
    html: `
    <div style="
      font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
      line-height: 1.8;
      border: 1px solid #eaf4ff;
      border-radius: 16px;
      padding: 32px;
      max-width: 600px;
      margin: 0 auto;
      background-color: ${isApproved ? "#f0fff4" : "#fff0f0"};
      text-align: center;
      color: #2c3e50;
    ">
      <img src="https://i.postimg.cc/pXqnm9rf/everforest-logo.png" alt="Everforest Logo" style="max-width: 140px; margin-bottom: 24px;" />
      <h2 style="color: ${isApproved ? "#28a745" : "#d63384"}; margin-bottom: 16px;">
        ${isApproved ? "✅🌟🤩🤩 您主辦的露營活動已通過審核！" : "❌⚠️👻👻 您主辦的露營活動審核未通過"}
      </h2>

      ${statusMessage}

      <p style="text-align: left;">若有任何疑問，請來信 <a href="mailto:service@everforest.tw">service@everforest.tw</a></p>

      <p style="text-align: left; font-size: 12px; color: #bbb; margin-top: 24px;">
        森森不息團隊敬上
      </p>

      <p style="font-size: 11px; color: #ccc; margin-top: 40px;">
        © 2025 Everforest | 本郵件由系統自動發送，請勿直接回覆。
      </p>
    </div>
    `,
  };

  await transporter
    .sendMail(mailOptions)
    .then((info) => console.warn("活動審核信件寄出成功：", info.response))
    .catch((error) => console.error("活動審核信件寄送失敗：", error));
};
