const { dataSource } = require("../db/data-source");
//const { generateAccessJWT } = require("../utils/jwtUtils.js");
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
};

module.exports = eventController;
