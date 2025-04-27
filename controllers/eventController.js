const { dataSource } = require("../db/data-source");
//const { generateAccessJWT } = require("../utils/jwtUtils.js");
const { In } = require("typeorm"); // ← 一定要引入！
const {
  isUndefined,
  isNotValidString,
  isValidDate,
  isNotValidInteger,
} = require("../utils/validUtils");
const appError = require("../utils/appError");
const logger = require("../utils/logger")("Event");

const eventController = {
  /**
   *   * @description 創建活動 (創建活動表單 第一段)
   */
  async createEvent(req, res, next) {
    //取得會員id
    const memberId = req.user.id; // 從 JWT middleware 解析出會員 ID
    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    //透過會員的id => 從資料庫查 HostInfo 查member_info_id ＝> 取得主辦方資料
    const hostRepo = dataSource.getRepository("HostInfo");
    const host = await hostRepo.findOne({
      where: { member_info_id: memberId },
    });

    if (!host) {
      return next(appError(404, "尚未建立主辦方資料"));
    }

    //將主辦方id存起來
    const hostId = host.id;

    //--------- 存取前端建立一筆露營活動的請求資料 -----------
    const {
      title,
      address,
      description,
      start_time,
      end_time,
      max_participants,
      cancel_policy,
      registration_open_time,
      registration_close_time,
      latitude,
      longitude,
    } = req.body;

    //驗證必填欄位 isUndefined, isNotValidString
    if (
      isUndefined(title) ||
      isNotValidString(title) ||
      isUndefined(address) ||
      isNotValidString(address) ||
      isUndefined(description) ||
      isNotValidString(description) ||
      isUndefined(start_time) ||
      !isValidDate(start_time) ||
      isUndefined(end_time) ||
      !isValidDate(end_time) ||
      isUndefined(max_participants) ||
      isNotValidInteger(max_participants) ||
      isUndefined(cancel_policy) ||
      isNotValidString(cancel_policy)
    ) {
      return next(appError(400, "請填寫必填欄位"));
    }

    //啟動transaction(交易）
    //=== 啟動一個資料庫交易，確保整個「建立活動」過程是原子性的（要嘛全部成功，要嘛全部失敗）===
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //
      const eventRepo = queryRunner.manager.getRepository("EventInfo");

      //檢查是否已有同樣 title + start_time 的活動
      const existEvent = await eventRepo.findOne({
        where: {
          host_info_id: hostId,
          title,
          start_time,
        },
      });

      if (existEvent) {
        await queryRunner.rollbackTransaction();
        return next(appError(409, "該活動已存在，請勿重複建立"));
      }

      //用 eventRepo.create() 建立一個新的活動實體，還沒真的寫進資料庫
      //可以先在記憶體裡組好一筆完整的活動資料，確保欄位格式正確
      const newEvent = eventRepo.create({
        host_info_id: hostId,
        title,
        address,
        description,
        start_time,
        end_time,
        max_participants,
        cancel_policy,
        registration_open_time: registration_open_time || null,
        registration_close_time: registration_close_time || null,
        latitude: latitude || null,
        longitude: longitude || null,
      });

      //用 .save() 儲存到資料庫 => 將剛剛組好的活動資料正式寫入 EventInfo 表格
      const savedEvent = await eventRepo.save(newEvent);

      if (!savedEvent) {
        throw new Error("活動儲存失敗"); // 人為拋出錯誤進入 catch 區
      }

      //提交 Transaction（commit）
      //確定剛剛所有操作都成功後，提交整個交易
      await queryRunner.commitTransaction();

      return res.status(201).json({
        status: "success",
        message: "活動建立成功",
        data: {
          event: {
            id: savedEvent.id,
            host_info_id: savedEvent.host_info_id,
            title: savedEvent.title,
            address: savedEvent.address,
            description: savedEvent.description,
            start_time: savedEvent.start_time,
            end_time: savedEvent.end_time,
            max_participants: savedEvent.max_participants,
            cancel_policy: savedEvent.cancel_policy,
            registration_open_time: savedEvent.registration_open_time || null,
            registration_close_time: savedEvent.registration_close_time || null,
            latitude: savedEvent.latitude || null,
            longitude: savedEvent.longitude || null,
            status: savedEvent.status,
            active: savedEvent.active,
            created_at: savedEvent.created_at,
            updated_at: savedEvent.updated_at,
          },
        },
      });
    } catch (err) {
      //發生錯誤 → 回滾資料庫交易（Rollback）
      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackErr) {
        logger.error("rollbackTransaction 出錯:", rollbackErr);
      }
      logger.error("建立活動失敗:", err);
      return next(appError(500, "伺服器錯誤，無法建立活動"));
    } finally {
      //最後一定要釋放資料庫連線
      await queryRunner.release();
    }
  },

  /**
   * ###### =====> 這裡是先暫時做 <======= 看效果
   *   * @description 創建活動 (創建活動表單 第二段)
   *
   */
  async updateNoticesTags(req, res, next) {
    //取得會員id
    const memberId = req.user.id; // 從 JWT middleware 解析出會員 ID
    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    //取得event_info_id
    const { eventId } = req.params;

    //// 預設空陣列，避免 undefined
    const { notices = [], tagIds = [] } = req.body;

    //必須要帶eventId
    if (!eventId) {
      return next(appError(400, "缺少 eventId"));
    }

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //創建活動typeorm entity物件
      const eventRepo = queryRunner.manager.getRepository("EventInfo");
      //創建行前提醒 entity物件
      const eventNoticeRepo = queryRunner.manager.getRepository("EventNotice");
      //創建活動標籤 entity物件
      const eventTagInfoRepo = queryRunner.manager.getRepository("EventTagInfo");

      const eventTagRepo = queryRunner.manager.getRepository("EventTag");

      //檢查活動是否存在
      const existEvent = await eventRepo.findOne({
        where: { id: eventId },
      });

      if (!existEvent) {
        await queryRunner.rollbackTransaction();
        return next(appError(404, "該活動不存在"));
      }
      // 先刪除原有行前提醒 刪除舊的 notices
      await eventNoticeRepo.delete({ event_info_id: eventId });

      //// 逐筆新增新的 notices
      if (notices.length > 0) {
        const newNotices = notices.map((notice) => ({
          event_info_id: eventId,
          type: notice.type || "行前提醒",
          content: notice.content,
        }));

        await eventNoticeRepo.save(newNotices);
      }

      // 先刪除原有的標籤 刪除舊的 tags
      await eventTagInfoRepo.delete({ event_info_id: eventId });

      // 逐筆新增新的標籤連結 // 批次新增新的 tag 連結
      if (tagIds.length > 0) {
        const newTagLinks = tagIds.map((tagId) =>
          eventTagInfoRepo.create({
            event_info_id: eventId,
            event_tag_id: tagId,
          })
        );
        await eventTagInfoRepo.save(newTagLinks);
      }

      // 查詢 tag 詳細資料 (必須是最後新增完再查)
      let selectedTags = [];
      if (tagIds.length > 0) {
        selectedTags = await eventTagRepo.find({
          //   where: { id: tagIds }, // TypeORM find 不能直接 where array
          where: {
            id: In(tagIds), // 正確的用法=> 陣列
          },
          select: ["id", "name", "description", "level"],
        });
      }

      // 一切成功，提交交易
      await queryRunner.commitTransaction();

      return res.status(200).json({
        status: "success",
        message: "行前提醒與標籤更新成功",
        data: {
          event_id: eventId,
          notices_updated: notices.length,
          tags_updated: tagIds.length,
          notices,
          tags: selectedTags,
        },
      });
    } catch (error) {
      console.error("updateNoticesTags 錯誤：", error); // ⭐ 加這行！！
      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackErr) {
        logger.error("rollbackTransaction 出錯", rollbackErr);
      }
      logger.error("更新行前提醒與標籤失敗", error);
      return next(appError(500, "伺服器錯誤，請稍後再試"));
    } finally {
      await queryRunner.release();
    }
  },
};

module.exports = eventController;
