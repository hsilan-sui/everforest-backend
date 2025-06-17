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
    from: `"露營活動平台" <${process.env.EMAIL_USER}>`,
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
      <img src="https://i.postimg.cc/nLjKzHRQ/everforest-logo.png" alt="Everforest Logo" style="max-width: 140px; margin-bottom: 24px;" />

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
        🌲 森森不息團隊敬上
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
    <p>您好，</p>
    <p>您已成功預訂以下露營活動：</p>
    <ul>
      ${orderList
        .map(
          (order) => `
        <li>
          活動：${order.activityName}<br/>
          日期：${order.date}<br/>
          金額：${order.amount} 元
        </li>
      `
        )
        .join("")}
    </ul>
    <p>我們期待與您一同共度美好時光！</p>
  `;

  const mailOptions = {
    from: `"露營活動平台" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "森森不息 - 訂單成功通知",
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
    from: `"活動票券中心" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "您的活動票券資訊",
    html: `
      <p>親愛的會員您好，</p>
      <p>以下是您訂單 <b>${orderId}</b> 的票券資訊：</p>
      <p><b>票券代碼：</b>${ticketCode}</p>
      <p><b>活動名稱：</b>${eventTitle}</p>
      <p><img src="${qrImageUrl}" alt="QRCode" width="240"/></p>
      <p><a href="${qrImageUrl}">若無法顯示請點此開啟 QRCode</a></p>
    `,
  };

  await transporter
    .sendMail(mailOptions)
    .then((info) => console.warn("票券信件寄出成功：", info.response))
    .catch((error) => console.error("票券信件寄送失敗：", error));
};
