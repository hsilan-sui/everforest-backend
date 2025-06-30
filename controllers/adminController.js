const { dataSource } = require("../db/data-source");

// const { isUndefined, isNotValidString, isValidPassword } = require("../utils/validUtils");
const appError = require("../utils/appError");
const logger = require("../utils/logger")("Admin");

const { sendEventReviewResultEmail } = require("../utils/emailUtils");

const { processEventCheck } = require("../services/ai/eventCheckProcessor");

const { formatReviewResultHTML } = require("../utils/reviewFormatter");

const {
  sendUnpublishReviewResultEmail,
  sendEventCancelledNoticeEmail,
} = require("../utils/emailUtils");

const adminController = {
  async getAdminData(req, res, next) {
    try {
      const MemberInfo = dataSource.getRepository("MemberInfo");

      const admin = await MemberInfo.findOne({
        where: { id: req.user.id },
        select: ["id", "email", "username", "role", "firstname", "lastname"],
      });

      if (!admin || admin.role !== "admin") {
        return next(appError(403, "你沒有權限存取此資源"));
      }

      res.status(200).json({
        status: "success",
        data: {
          id: admin.id,
          email: admin.email,
          username: admin.username,
          role: admin.role,
          firstname: admin.firstname,
          lastname: admin.lastname,
        },
      });
    } catch (err) {
      logger.error("取得 admin 資料失敗", err);
      next(err);
    }
  },
  //取得活動(依據狀態分:active=all 或 active=pending｜active=
  async getAdminEvents(req, res, next) {
    const eventRepo = dataSource.getRepository("EventInfo");
    const {
      active = "all",
      page = "1",
      limit = "10",
      sort_by = "created_at",
      order = "DESC",
    } = req.query;

    const validStatus = [
      "draft",
      "rejected",
      "pending",
      "published",
      "unpublish_pending",
      "archived",
      "all",
    ];
    const validSortFields = [
      "created_at",
      "start_time",
      "end_time",
      "registration_open_time",
      "registration_close_time",
      "title",
      "updated_at",
    ];
    const validOrderTypes = ["ASC", "DESC"];

    if (!validStatus.includes(active)) {
      return next(appError(400, "無效的狀態"));
    }
    if (!validSortFields.includes(sort_by)) {
      return next(appError(400, "無效的排序欄位"));
    }
    if (!validOrderTypes.includes(order.toUpperCase())) {
      return next(appError(400, "排序順序必須是 ASC 或 DESC"));
    }

    const currentPage = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (currentPage - 1) * pageSize;

    // 組 where 條件
    let whereCondition = {};
    if (active === "rejected") {
      whereCondition = { active: "draft", is_rejected: true };
    } else if (active === "draft") {
      whereCondition = { active: "draft", is_rejected: false };
    } else if (active !== "all") {
      whereCondition = { active };
    } else if (active === "unpublish_pending") {
      //待審核下架
      whereCondition = { active: "unpublish_pending" };
    }

    try {
      const [data, total] = await eventRepo.findAndCount({
        where: whereCondition,
        relations: [
          "eventPhotoBox",
          "eventPlanBox",
          "eventPlanBox.eventPlanAddonBox",
          "eventPlanBox.eventPlanContentBox",
        ],
        order: { [sort_by]: order.toUpperCase() },
        skip,
        take: pageSize,
      });

      // 狀態標籤函式
      const getActiveStatusLabel = (event) => {
        if (event.active === "draft" && event.is_rejected) return "已退回";
        if (event.active === "draft") return "草稿";
        if (event.active === "pending") return "待審核";
        if (event.active === "published") return "已上架";
        if (event.active === "archived") return "已結束";
        return event.active;
      };

      const data_lists = data.map((event) => {
        const cover = event.eventPhotoBox?.find((p) => p.type === "cover")?.photo_url ?? null;
        const photo_count = event.eventPhotoBox?.length ?? 0;
        const max_price = event.eventPlanBox?.length
          ? Math.max(...event.eventPlanBox.map((p) => p.price ?? 0))
          : null;

        return {
          id: event.id,
          title: event.title,
          cover_photo_url: cover,
          photo_count,
          start_date: event.start_time,
          end_date: event.end_time,
          max_participants: event.max_participants,
          max_price,
          active_status: getActiveStatusLabel(event),
        };
      });

      res.status(200).json({
        status: "success",
        total_data: total,
        current_page: currentPage,
        page_size: pageSize,
        total_page: Math.ceil(total / pageSize),
        data_lists,
      });
    } catch (error) {
      console.error("[getAdminEvents] 錯誤：", error);
      next(appError(500, "查詢活動失敗"));
    }
  },
  // @route GET /api/admin/events/:id
  // @desc 取得指定活動（完整內容）
  async getAdminEventById(req, res, next) {
    const eventRepo = dataSource.getRepository("EventInfo");
    const { id } = req.params;

    try {
      const event = await eventRepo.findOne({
        where: { id },
        relations: [
          "eventPhotoBox",
          "eventPlanBox",
          "eventPlanBox.eventPlanAddonBox",
          "eventPlanBox.eventPlanContentBox",
        ],
      });

      if (!event) {
        return next(appError(404, "找不到該活動"));
      }

      // 統一狀態標籤
      const getActiveStatusLabel = (event) => {
        if (event.active === "draft" && event.is_rejected) return "已退回";
        if (event.active === "draft") return "草稿";
        if (event.active === "pending") return "待審核";
        if (event.active === "published") return "已上架";
        if (event.active === "archived") return "已結束";
        return event.active;
      };

      res.status(200).json({
        status: "success",
        active_status: getActiveStatusLabel(event),
        data: {
          ...event,
        },
      });
    } catch (error) {
      console.error("[getAdminEventById] 錯誤：", error);
      next(appError(500, "查詢活動失敗"));
    }
  },
  //  審核通過活動並上架活動
  async approveEvent(req, res, next) {
    const { id } = req.params;
    const eventRepo = dataSource.getRepository("EventInfo");
    //const hostRepo = dataSource.getRepository("HostInfo");

    try {
      // 撈活動 + 主辦方（使用 relations 自動 join HostInfo）
      const event = await eventRepo.findOne({
        where: { id },
        relations: ["hostBox"], // 關聯主辦方資料
      });

      if (!event) return next(appError(404, "找不到該活動"));

      if (event.active !== "pending") {
        return next(appError(400, "僅可審核狀態為『待審核』的活動"));
      }

      if (!event.hostBox || !event.hostBox.email) {
        return next(appError(404, "找不到主辦方或主辦方缺少 Email"));
      }

      // 找出主辦方資料以取得 Email
      // const host = await hostRepo.findOne({ where: { id: event.event.host_info_id } });
      // console.log("host email", host.email);
      // if (!host || !host.email) {
      //   return next(appError(400, "無法取得主辦方信箱，請確認活動主辦方資料"));
      // }

      if (event.active !== "pending") {
        return next(appError(400, "僅可審核狀態為『待審核』的活動"));
      }

      // 更新活動狀態
      event.active = "published";
      event.is_rejected = false;
      await eventRepo.save(event);

      // 寄送審核成功通知信
      await sendEventReviewResultEmail({
        toEmail: [event.hostBox.email, "hsilanyu@gmail.com"], //host.email
        eventTitle: event.title,
        isApproved: true,
      });
      // console.warn("✅ 審核成功，主辦方資料：", event.hostBox);
      console.warn("活動審核信件寄出成功：");
      res.status(200).json({
        status: "success",
        message: "活動已通過審核並成功上架",
      });
    } catch (error) {
      console.error("[approveEvent] 錯誤：", error);
      next(appError(500, "活動審核有誤"));
    }
  },
  //退件活動
  // PATCH /api/admin/events/:id/reject
  // PATCH /api/admin/events/:id/reject
  async rejectEvent(req, res, next) {
    try {
      const eventId = req.params.id;
      const { reason = "請依據平台規範修正活動資訊後，再重新將活動送出審核。" } = req.body;

      const eventRepo = dataSource.getRepository("EventInfo");

      const event = await eventRepo.findOne({
        where: { id: eventId },
        relations: ["hostBox"], // 只載入 host，不需要 member
      });

      if (!event) return next(appError(404, "找不到該活動"));
      if (event.active !== "pending") {
        return next(appError(400, "只有待審核的活動才能退回"));
      }

      event.active = "draft";
      event.is_rejected = true;
      event.updated_at = new Date();
      await eventRepo.save(event);

      await sendEventReviewResultEmail({
        toEmail: [event.hostBox.email, "hsilanyu@gmail.com"],
        eventTitle: event.title,
        isApproved: false, // 這裡設為 false 表示是退回審核
        reason: reason, // 可自定義理由
      });

      res.status(200).json({ message: "活動審核『不通過』，已退回活動並通知主辦方" });
    } catch (err) {
      next(err);
    }
  },

  //   //// AI 自動審核活動，根據結果決定是否上架並寄信通知主辦方
  //   async aiReviewEvent(req, res, next) {
  //     const eventId = req.params.id;

  //     if (!eventId) {
  //       return next(appError(400, "缺少活動 ID"));
  //     }

  //     const eventRepo = dataSource.getRepository("EventInfo");

  //     try {
  //       const event = await eventRepo.findOne({
  //         where: { id: eventId },
  //         relations: [
  //           "hostBox",
  //           "eventNoticeBox",
  //           "eventPhotoBox",
  //           "eventPlanBox",
  //           "eventPlanBox.eventPlanContentBox",
  //           "eventPlanBox.eventPlanAddonBox",
  //         ],
  //       });

  //       if (!event) {
  //         return next(appError(404, "找不到對應的活動"));
  //       }

  //       if (event.active !== "pending") {
  //         return next(appError(400, "僅可審核狀態為『待審核』的活動"));
  //       }

  //       if (!event.hostBox || !event.hostBox.email) {
  //         return next(appError(404, "找不到主辦方或主辦方缺少 Email"));
  //       }

  //       // 呼叫檢查處理邏輯
  //       console.warn(`[AI Check] 活動名稱：「${event.title}」`);
  //       console.warn(`檢查的活動資料是: ${event}`);
  //       const result = await processEventCheck(event);

  //       //提取審查的結果和回饋
  //       const { success, feedback, sensitiveCheck, regulatoryCheck, imageCheck, imageRiskSummary } = result;

  //        // === 若通過審核 ===
  //       if(success) {
  //         event.active = "published";
  //         event.is_rejected = false;

  //         await eventRepo.save(event);

  //         // 立即查回來印出
  // const after = await eventRepo.findOne({ where: { id: event.id } });
  // console.log("儲存後的 active 狀態：", after.active);

  //         await sendEventReviewResultEmail({
  //           toEmail: [event.hostBox.email, "hsilanyu@gmail.com"],
  //           eventTitle: event.title,
  //           isApproved: true,
  //         });

  //         return res.status(200).json({
  //           status: "success",
  //           message: "AI 審核通過，活動已自動上架並通知主辦方",
  //           data: {
  //             success, feedback, sensitiveCheck, regulatoryCheck, imageCheck, imageRiskSummary
  //           }
  //         });

  //       }

  //       // === 若未通過審核 ===
  //     event.active = "draft";
  //     event.is_rejected = true;

  //     await eventRepo.save(event);

  //     // 審核失敗理由彙整（內含 function call 各檢查結果）
  //     const reason = `
  //       ### ❌ AI 活動審查未通過的原因：

  //       - 敏感詞檢查：${sensitiveCheck.pass ? "✅ 通過" : "❌ 未通過"}
  //       - 法規檢查：${regulatoryCheck.pass ? "✅ 通過" : "❌ 未通過"}
  //       - 圖片描述審查：${imageCheck.pass ? "✅ 通過" : "❌ 未通過"}
  //       - 圖片風險分析：${imageRiskSummary.hasRisk ? "❌ 發現風險" : "✅ 無風險"}

  //       ### GPT 回饋建議：
  //       ${feedback}
  //           `.trim();

  //     await sendEventReviewResultEmail({
  //       toEmail: [event.hostBox.email, "hsilanyu@gmail.com"],
  //       eventTitle: event.title,
  //       isApproved: false,
  //       reason,
  //     });

  //     // 審核失敗理由彙整（內含 function call 各檢查結果）

  //       // Optional: 儲存審查紀錄
  //       // event.aiCheckResult = result;
  //       // await eventRepo.save(event);

  //       //res.json(result);

  //       // 更新狀態與寄信

  //       // res.status(200).json({
  //       //   status: "success",
  //       //   data: result,
  //       // });
  //       return res.status(200).json({
  //         status: "fail",
  //         message: "AI 審核未通過，已通知主辦方修改內容",
  //         data: {
  //           success, feedback, sensitiveCheck, regulatoryCheck, imageCheck, imageRiskSummary
  //         }
  //       });
  //     } catch (error) {
  //       console.error("AI 活動審查失敗:", error);
  //       next(appError(500, "AI 活動審查失敗"));
  //     }
  //   },
  async aiReviewEvent(req, res, next) {
    const eventId = req.params.id;

    if (!eventId) {
      return next(appError(400, "缺少活動 ID"));
    }

    const eventRepo = dataSource.getRepository("EventInfo");

    try {
      const event = await eventRepo.findOne({
        where: { id: eventId },
        relations: [
          "hostBox",
          "eventNoticeBox",
          "eventPhotoBox",
          "eventPlanBox",
          "eventPlanBox.eventPlanContentBox",
          "eventPlanBox.eventPlanAddonBox",
        ],
      });

      if (!event) {
        return next(appError(404, "找不到對應的活動"));
      }

      if (event.active !== "pending") {
        return next(appError(400, "僅可審核狀態為『待審核』的活動"));
      }

      if (!event.hostBox || !event.hostBox.email) {
        return next(appError(404, "找不到主辦方或主辦方缺少 Email"));
      }

      // 執行 AI 檢查
      console.warn(`[AI Check] 活動名稱：「${event.title}」`);
      const result = await processEventCheck(event);
      const { success, feedback, sensitiveCheck, regulatoryCheck, imageCheck, imageRiskSummary } =
        result;

      // 根據結果產生 reason（無論通過與否）
      const reason = formatReviewResultHTML(result, success);

      // 更新活動狀態
      if (success) {
        event.active = "published";
        event.is_rejected = false;
      } else {
        event.active = "draft";
        event.is_rejected = true;
      }

      await eventRepo.save(event);

      // 寄出 email 通知主辦方
      await sendEventReviewResultEmail({
        toEmail: [event.hostBox.email, "hsilanyu@gmail.com"],
        eventTitle: event.title,
        isApproved: success,
        reason,
        isAiReview: true,
      });

      // 回應前端
      return res.status(200).json({
        status: success ? "success" : "fail",
        message: success
          ? "AI 審核通過，活動已自動上架並通知主辦方"
          : "AI 審核未通過，已通知主辦方修改內容",
        data: {
          success,
          feedback,
          sensitiveCheck,
          regulatoryCheck,
          imageCheck,
          imageRiskSummary,
        },
      });
    } catch (error) {
      console.error("AI 活動審查失敗:", error);
      next(appError(500, "AI 活動審查失敗"));
    }
  },
  //審核下架申請
  // async reviewUnpublish(req, res, next) {
  //   try {
  //     const { eventId } = req.params;
  //     const { isApprove, comment } = req.body;

  //     const eventRepo = dataSource.getRepository("EventInfo");

  //     // 取得活動資料（包含訂單與主辦方）
  //     const event = await eventRepo.findOne({
  //       where: { id: eventId },
  //       relations: ["orderBox", "hostBox"],
  //     });

  //     if (!event) return next(appError(404, "找不到活動"));

  //     // 僅允許處理正在申請下架的活動
  //     if (event.active !== "unpublish_pending") {
  //       return next(appError(400, "活動目前不在申請下架狀態"));
  //     }

  //     // // 紀錄審查備註
  //     event.unpublish_review_comment = comment || null;
  //     const hasOrder = event.orderBox.length > 0;

  //     if (isApprove) {
  //       if (hasOrder) {
  //         // 有報名 → 停止曝光、標示退款階段
  //         event.active = "draft"; // 停止曝光
  //         event.status = "refunding"; // 顯示退款中狀態
  //         event.unpublish_reason =
  //           comment || "審核通過下架，進入退款流程，請主辦方依序為消費者辦理退款";

  //         //發信寄給報名者：TODO
  //         for (const order of event.orderBox) {
  //           await sendEventCancelledNoticeEmail({
  //             toEmail: order.memberBox.email,
  //             eventId: event.id,
  //             eventTitle: event.title,
  //             startTime: event.start_time,
  //             endTime: event.end_time,
  //             reason: comment || "主辦方提出取消申請，平台已通過審核",
  //             refundInfo: "退款將依原付款方式退回，請耐心等候 3–5 個工作天。",
  //           });
  //         }
  //       } else {
  //         // 無人報名 → 可直接下架
  //         event.active = "archived";
  //         event.status = "cancelled"; // 活動取消
  //         event.archived_at = new Date();
  //         event.unpublish_reason = comment || "通過下架，活動已停辦";
  //       }
  //     } else {
  //       // 駁回申請 → 恢復上架
  //       event.active = "published";
  //       event.status = "registering";
  //       event.unpublish_reason = comment || "已退回下架申請";
  //     }

  //     // await eventRepo.save(event);
  //     await eventRepo.update(event.id, {
  //       unpublish_review_comment: comment || null,
  //       unpublish_reason: isApprove
  //         ? hasOrder
  //           ? comment || "審核通過下架，進入退款流程"
  //           : comment || "通過下架，活動已停辦"
  //         : comment || "已退回下架申請",
  //       active: isApprove
  //         ? hasOrder ? "draft" : "archived"
  //         : "published",
  //       status: isApprove
  //         ? hasOrder ? "refunding" : "cancelled"
  //         : "registering",
  //       archived_at: isApprove && !hasOrder ? new Date() : null,
  //     });

  //     // TODO: 通知主辦方（寄信或站內信）
  //     // 取得主辦方 Email
  //     const toEmail = event.hostBox?.email;

  //     // 寄送下架結果通知
  //     if (toEmail) {
  //       await sendUnpublishReviewResultEmail({
  //         toEmail,
  //         eventId,
  //         eventTitle: event.title,
  //         isApproved: isApprove,
  //         reason: comment || "",
  //         note: event.unpublish_reason,
  //         note: event.unpublish_review_comment,
  //         startTime: event.start_time,
  //         endTime: event.end_time,
  //         registrationOpenTime: event.registration_open_time,
  //         registrationCloseTime: event.registration_close_time,
  //         hasOrder: event.orderBox.length > 0,
  //       });
  //     }

  //     res.status(200).json({
  //       status: "success",
  //       message: isApprove
  //         ? hasOrder
  //           ? "下架審核通過，活動進入退款處理"
  //           : "下架審核通過，活動已下架"
  //         : "下架申請已退回，活動仍維持上架",
  //     });
  //   } catch (err) {
  //     next(err);
  //   }
  // },
  /**
 * 審核主辦方的活動下架申請
 * 
 * 管理員可根據主辦方申請理由進行審核，若活動已有人報名則轉入退款流程；
 * 若尚無報名者，則直接封存活動。若審核未通過，活動會恢復上架。

 *
 * @example
 * PATCH /api/admin/events/:eventId/unpublish-review
 * {
 *   "isApprove": true,
 *   "comment": "理由合理，進入退款程序"
 * }
 */

  // 審核下架申請
  async reviewUnpublish(req, res, next) {
    try {
      const { eventId } = req.params;
      const { isApprove, comment } = req.body;

      const eventRepo = dataSource.getRepository("EventInfo");

      // 重新取得最新活動資料（包含訂單與主辦方）
      const event = await eventRepo.findOne({
        where: { id: eventId },
        relations: ["orderBox", "hostBox"],
      });

      if (!event) return next(appError(404, "找不到活動"));
      if (event.active !== "unpublish_pending") {
        return next(appError(400, "活動目前不在申請下架狀態"));
      }

      // 開始根據審核結果修改欄位
      const hasOrder = event.orderBox.length > 0;
      event.unpublish_review_comment = comment || null;

      if (isApprove) {
        if (hasOrder) {
          event.active = "draft";
          event.status = "refunding";

          // 寄信通知所有報名者
          for (const order of event.orderBox) {
            await sendEventCancelledNoticeEmail({
              toEmail: order.memberBox.email,
              eventId: event.id,
              eventTitle: event.title,
              startTime: event.start_time,
              endTime: event.end_time,
              reason: event.unpublish_reason, // 使用主辦方的原始理由
              refundInfo: "退款將依原付款方式退回，請耐心等候 3–5 個工作天。",
            });
          }
        } else {
          event.active = "archived";
          event.status = "cancelled";
          event.archived_at = new Date();
        }
      } else {
        // 審核不通過，恢復上架
        event.active = "published";
        event.status = "registering";
      }

      // 儲存修改後的完整資料（包含 updated_at）
      await eventRepo.save(event);

      // 通知主辦方
      const toEmail = event.hostBox?.email;
      if (toEmail) {
        await sendUnpublishReviewResultEmail({
          toEmail,
          eventId,
          eventTitle: event.title,
          isApproved: isApprove,
          reason: event.unpublish_reason, // 主辦方原始理由
          note: event.unpublish_review_comment, // 審核補充說明
          startTime: event.start_time,
          endTime: event.end_time,
          registrationOpenTime: event.registration_open_time,
          registrationCloseTime: event.registration_close_time,
          hasOrder,
        });
      }

      res.status(200).json({
        status: "success",
        message: isApprove
          ? hasOrder
            ? "下架審核通過，活動進入退款處理"
            : "下架審核通過，活動已下架"
          : "下架申請已退回，活動仍維持上架",
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
