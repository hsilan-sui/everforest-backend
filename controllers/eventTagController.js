const { dataSource } = require("../db/data-source");
const { isUndefined, isNotValidString } = require("../utils/validUtils");
const appError = require("../utils/appError");
const logger = require("../utils/logger")("EventTag");

const eventTagController = {
  /**
   * @description 創建活動標籤
   */
  async createEventTag(req, res, next) {
    const { name } = req.body;

    if (isUndefined(name) || isNotValidString(name)) {
      return next(appError(400, "請提供有效的活動標籤名稱"));
    }

    const eventTagRepo = dataSource.getRepository("EventTag");

    // 新增檢查：名稱是否重複
    const existTag = await eventTagRepo.findOne({ where: { name } });
    if (existTag) {
      return next(appError(409, "已有相同名稱的活動標籤，請勿重複建立"));
    }

    const newEventTag = eventTagRepo.create({ name });
    await eventTagRepo.save(newEventTag);

    res.status(201).json({
      status: "success",
      data: {
        eventTag: newEventTag,
      },
    });
  },

  /**
   * @description 獲取所有活動標籤
   */
  async getEventTags(req, res, _next) {
    const eventTagRepo = dataSource.getRepository("EventTag");
    const eventTags = await eventTagRepo.find();

    res.status(200).json({
      status: "success",
      data: {
        eventTags,
      },
    });
  },

  /**
   * @description 刪除活動標籤（包含關聯表）
   */
  async deleteEventTag(req, res, next) {
    const { tagId } = req.params;

    if (isUndefined(tagId)) {
      return next(appError(400, "請提供有效的活動標籤 ID"));
    }

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const eventTagRepo = queryRunner.manager.getRepository("EventTag");
      const eventTagInfoRepo = queryRunner.manager.getRepository("EventTagInfo");

      // 先刪除 EVENT_TAG_INFO 中的關聯
      await eventTagInfoRepo.delete({ event_tag_id: tagId });

      // 再刪除 EVENT_TAG 主表
      const deleteResult = await eventTagRepo.delete(tagId);

      if (deleteResult.affected === 0) {
        await queryRunner.rollbackTransaction();
        return next(appError(404, "找不到該活動標籤"));
      }

      await queryRunner.commitTransaction();

      res.status(200).json({
        status: "success",
        message: "刪除成功",
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      logger.error("刪除活動標籤失敗", error);
      return next(appError(500, "伺服器錯誤，無法刪除活動標籤"));
    } finally {
      await queryRunner.release();
    }
  },
};

module.exports = eventTagController;
