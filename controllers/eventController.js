const { dataSource } = require("../db/data-source");
//const { generateAccessJWT } = require("../utils/jwtUtils.js");
const { In, Not } = require("typeorm"); // ← 一定要引入！
const {
  isUndefined,
  isNotValidString,
  isValidDate,
  isNotValidInteger,
} = require("../utils/validUtils");
const appError = require("../utils/appError");

const formidable = require("formidable");
const logger = require("../utils/logger")("Event");

const { uploadImageFile, ALLOWED_FILE_TYPES } = require("../utils/uploadImage");
const { getLatLngByAddress } = require("../utils/geocode");
const { validateEventSubmissionTime } = require("../utils/validEventUtils");

const eventController = {
  /**
   * @description [主辦方]建立一筆露營活動
   *
   * 流程：
   * 1. 驗證使用者是否已登入（JWT）
   * 2. 檢查使用者是否為已建立主辦方身份（HostInfo）
   * 3. 驗證前端送出的必填欄位資料格式
   * 4. 啟動資料庫交易
   * 5. 檢查是否已有同名同起始時間的活動（避免重複）
   * 6. 建立活動記錄並儲存到資料庫
   * 7. 成功則提交交易，失敗則回滾並回傳錯誤
   */
  async createEvent(req, res, next) {
    // 從 JWT middleware 解析使用者 ID
    const memberId = req.user.id; // 從 JWT middleware 解析出會員 ID

    //防呆
    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    //透過會員的id => 從資料庫查 HostInfo 查member_info_id ＝> 取得主辦方資料
    // 查詢使用者是否已建立主辦方資料（HostInfo）
    const hostRepo = dataSource.getRepository("HostInfo");
    const host = await hostRepo.findOne({
      where: { member_info_id: memberId },
    });

    //防呆
    if (!host) {
      return next(appError(403, "尚未建立主辦方資料"));
    }

    //將主辦方id存起來
    const hostId = host.id;

    //--------- 存取前端建立一筆露營活動的請求資料 -----------
    // 從請求中解構前端送來的活動欄位
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
    } = req.body;

    // 先透過地址換經緯度
    const latlng = await getLatLngByAddress(address);

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
    //=== 啟動一個資料庫交易，確保整個「建立活動」（要嘛全部成功，要嘛全部失敗）===
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    //這裡又包一層try catch ==> createEvent() 裡面使用了 TypeORM 的 transaction（交易）機制，而交易需要手動處理 rollback 與 release，不能只靠外部 errorAsync 捕捉錯誤
    //這裡的try catch 是單就 ==>
    // 1.在發生錯誤時，先 rollback 資料庫交易 ==>
    // 2.最後必須無論成功或失敗都 release 資源
    try {
      //
      const eventRepo = queryRunner.manager.getRepository("EventInfo");

      //檢查是否已有同樣 title + start_time 的活動
      // 檢查是否已存在相同主辦方 + 相同標題 + 相同起始時間的活動
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
        latitude: latlng ? latlng.latitude : null,
        longitude: latlng ? latlng.longitude : null,
      });

      //用 .save() 儲存到資料庫 => 將剛剛組好的活動資料正式寫入 EventInfo 表格
      const savedEvent = await eventRepo.save(newEvent);

      if (!savedEvent) {
        throw new Error("活動儲存失敗"); // 人為拋出錯誤進入 catch 區
      }

      //提交 Transaction（commit）
      //確定剛剛所有操作都成功後，提交整個交易
      await queryRunner.commitTransaction();

      // 回傳成功結果
      return res.status(201).json({
        status: "success",
        message: "露營活動建立成功",
        data: {
          event: {
            id: savedEvent.id,
            host_info_id: savedEvent.host_info_id,
            title: savedEvent.title,
            address: savedEvent.address,
            // description: savedEvent.description,
            // start_time: savedEvent.start_time,
            // end_time: savedEvent.end_time,
            // max_participants: savedEvent.max_participants,
            // cancel_policy: savedEvent.cancel_policy,
            // registration_open_time: savedEvent.registration_open_time || null,
            // registration_close_time: savedEvent.registration_close_time || null,
            latitude: savedEvent.latitude || null,
            longitude: savedEvent.longitude || null,
            status: savedEvent.status,
            active: savedEvent.active,
            // created_at: savedEvent.created_at,
            // updated_at: savedEvent.updated_at,
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
      return next(appError(500, "伺服器錯誤，請稍後再試"));
    } finally {
      //最後一定要釋放資料庫連線
      await queryRunner.release();
    }
  },
  /**
   * @description [主辦方]更新一筆露營活動（部分欄位 PATCH）
   */
  async patchEvent(req, res, next) {
    const memberId = req.user.id;
    const { eventId } = req.params;

    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    const hostRepo = dataSource.getRepository("HostInfo");
    const host = await hostRepo.findOne({
      where: { member_info_id: memberId },
    });

    if (!host) {
      return next(appError(403, "尚未建立主辦方資料"));
    }

    const hostId = host.id;

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

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const eventRepo = queryRunner.manager.getRepository("EventInfo");

      const event = await eventRepo.findOne({
        where: { id: eventId, host_info_id: hostId },
      });

      if (!event) {
        await queryRunner.rollbackTransaction();
        return next(appError(404, "找不到活動"));
      }

      // 如果有提供 title 和 start_time，才進行重複檢查
      if (title && start_time) {
        const duplicateEvent = await eventRepo.findOne({
          where: {
            host_info_id: hostId,
            title,
            start_time,
            id: Not(eventId), // 排除自己
          },
        });
        if (duplicateEvent) {
          await queryRunner.rollbackTransaction();
          return next(appError(409, "已有同名活動於相同起始時間"));
        }
      }

      // 只更新有傳進來的欄位
      if (title !== undefined) event.title = title;
      if (address !== undefined) event.address = address;
      if (description !== undefined) event.description = description;
      if (start_time !== undefined) event.start_time = start_time;
      if (end_time !== undefined) event.end_time = end_time;
      if (max_participants !== undefined) event.max_participants = max_participants;
      if (cancel_policy !== undefined) event.cancel_policy = cancel_policy;
      if (registration_open_time !== undefined)
        event.registration_open_time = registration_open_time;
      if (registration_close_time !== undefined)
        event.registration_close_time = registration_close_time;
      if (latitude !== undefined) event.latitude = latitude;
      if (longitude !== undefined) event.longitude = longitude;

      const updated = await eventRepo.save(event);
      if (!updated) throw new Error("活動更新失敗");

      await queryRunner.commitTransaction();

      return res.status(200).json({
        status: "success",
        message: "活動更新成功",
        data: {
          event: updated,
        },
      });
    } catch (err) {
      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackErr) {
        logger.error("rollbackTransaction 出錯:", rollbackErr);
      }
      logger.error("patchEvent 更新失敗:", err);
      return next(appError(500, "伺服器錯誤，請稍後再試"));
    } finally {
      await queryRunner.release();
    }
  },

  /**
   * @description 取得主辦方自己的活動詳情（包含草稿、未上架等）
   */
  async getHostOwnedEvent(req, res, next) {
    const { eventId } = req.params;
    const memberId = req.user.id;

    if (!eventId) return next(appError(400, "缺少活動 ID"));

    const hostRepo = dataSource.getRepository("HostInfo");
    const eventRepo = dataSource.getRepository("EventInfo");

    try {
      const host = await hostRepo.findOne({
        where: { member_info_id: memberId },
      });

      if (!host) return next(appError(403, "尚未建立主辦方資料"));

      const event = await eventRepo.findOne({
        where: {
          id: eventId,
          hostBox: { id: host.id }, // 正確比對 HostInfo.id
        },
        relations: [
          "hostBox",
          "eventPhotoBox",
          "eventNoticeBox",
          "eventPlanBox",
          "eventTagInfoBox",
          "eventTagInfoBox.eventTagsBox",
          "eventPlanBox.eventPlanContentBox",
          "eventPlanBox.eventPlanAddonBox",
          "eventCommentBox",
        ],
      });

      if (!event) return next(appError(404, "找不到該活動"));

      //這裡來做資料命名簡潔 讓前端一目了然
      const {
        hostBox,
        eventPhotoBox,
        eventNoticeBox,
        eventPlanBox,
        eventTagInfoBox,
        eventCommentBox,
        ...rest
      } = event;

      const formattedEvent = {
        ...rest,
        host: hostBox,
        photos: eventPhotoBox,
        notices: eventNoticeBox,
        plans: eventPlanBox,
        tags: eventTagInfoBox.map((tagInfo) => ({
          id: tagInfo.eventTagsBox.id,
          name: tagInfo.eventTagsBox.name,
          description: tagInfo.eventTagsBox.description,
          level: tagInfo.eventTagsBox.level,
        })),
        comments: eventCommentBox,
      };

      return res.status(200).json({
        status: "success",
        message: "取得主辦活動詳情成功",
        data: formattedEvent,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @description 更新活動的行前提醒與標籤（
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

    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    //必須要帶eventId
    if (!eventId) {
      return next(appError(400, "尚未建立活動"));
    }

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const hostRepo = queryRunner.manager.getRepository("HostInfo");
      const eventRepo = queryRunner.manager.getRepository("EventInfo");
      const eventNoticeRepo = queryRunner.manager.getRepository("EventNotice");
      const eventTagInfoRepo = queryRunner.manager.getRepository("EventTagInfo");
      const eventTagRepo = queryRunner.manager.getRepository("EventTag");

      // 查詢主辦方身份
      const host = await hostRepo.findOne({ where: { member_info_id: memberId } });
      if (!host) {
        await queryRunner.rollbackTransaction();
        return next(appError(403, "尚未建立主辦方資料"));
      }

      // 查詢活動是否存在，且是否屬於此主辦方
      const existEvent = await eventRepo.findOne({
        where: { id: eventId, host_info_id: host.id },
      });

      if (!existEvent) {
        await queryRunner.rollbackTransaction();
        return next(appError(403, "權限異常或活動不存在"));
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
      await queryRunner.rollbackTransaction();
      logger.error("更新行前提醒與標籤失敗", error);
      return next(appError(500, "伺服器錯誤，請稍後再試"));
    } finally {
      await queryRunner.release();
    }
  },

  /**
   * @description 上傳活動圖片（封面圖或詳情圖）
   * POST /api/v1/events/:eventId/images?type=cover|detail
   */
  async uploadEventPhotos(req, res, next) {
    const memberId = req.user.id; // 從 JWT middleware 解析出會員 ID
    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }
    const hostRepo = dataSource.getRepository("HostInfo");
    const eventRepo = dataSource.getRepository("EventInfo");
    // 查詢使用者對應的主辦方身份
    const host = await hostRepo.findOne({ where: { member_info_id: memberId } });
    if (!host) {
      return next(appError(403, "尚未建立主辦方資料"));
    }

    const { eventId } = req.params; // 取得活動 ID
    if (!eventId) {
      return next(appError(400, "請提供活動 ID"));
    }

    // 檢查該活動是否屬於這位主辦方
    const event = await eventRepo.findOne({
      where: {
        id: eventId,
        host_info_id: host.id,
      },
    });

    if (!event) {
      return next(appError(403, "尚未建立主辦方資料"));
    }

    const { type } = req.query; // 取得圖片類型（cover 或 detail）
    if (!["cover", "detail"].includes(type)) {
      return next(appError(400, "圖片類型錯誤，type 必須是 cover 或 detail"));
    }

    const eventPhotoRepo = dataSource.getRepository("EventInfoPhoto");

    const form = formidable.formidable({ multiples: true, maxFiles: 3 }); //  支援多檔案

    const [fields, files] = await form.parse(req); // 先 parse req，才能拿到 files

    const imageFiles = files.file || []; // 取得 files
    const descriptions = fields.descriptions || [];

    const imageArray = Array.isArray(imageFiles) ? imageFiles : [imageFiles];
    const descArray = Array.isArray(descriptions) ? descriptions : [descriptions];
    if (imageArray.length === 0) {
      return next(appError(400, "請至少上傳一張圖片"));
    }
    // 限制上傳的圖片數量
    //const limit = type === "cover" ? 3 : 6;
    const limit = 3; // 封面圖與詳情圖皆限制為 3 張
    if (imageArray.length > limit) {
      return next(
        appError(400, `最多只能上傳 ${limit} 張${type === "cover" ? "封面圖" : "詳情圖"}`)
      );
    }

    //這裡做detail description的驗證ß
    if (type === "detail") {
      const nonEmptyDescriptions = descArray.filter(
        (d) => typeof d === "string" && d.trim() !== ""
      );
      if (nonEmptyDescriptions.length === 0) {
        return next(appError(400, "請至少提供一筆詳情圖片描述"));
      }
    }

    const uploadedPhotos = [];

    for (let i = 0; i < imageArray.length; i++) {
      const imageFile = imageArray[i];
      const description = descArray[i] || null;

      if (!ALLOWED_FILE_TYPES[imageFile.mimetype]) {
        return next(appError(400, "圖片格式錯誤，僅支援 JPG、PNG"));
      }
      //決定上傳至 Firebase 的哪個目錄
      const firebaseType = type === "cover" ? "event-cover" : "event-detail";
      const imageUrl = await uploadImageFile(imageFile, firebaseType);

      const photoRecord = eventPhotoRepo.create({
        event_info_id: eventId,
        photo_url: imageUrl,
        type,
        description: type === "detail" ? description : null,
      });

      const saved = await eventPhotoRepo.save(photoRecord);

      uploadedPhotos.push({
        imageId: saved.id,
        event_info_id: saved.event_info_id,
        imageUrl: saved.photo_url,
        type: saved.type,
        description: saved.description,
      });
    }

    return res.status(201).json({
      status: "success",
      message: `${type === "cover" ? "封面圖" : "詳情圖"}上傳成功`,
      data: uploadedPhotos,
    });
  },

  /**
   *
   * @description 新增活動方案
   * @param {string} eventId - 活動 ID
   * @param {Array} plans - 活動方案資料
   * @param {string} plans[].title - 方案名稱
   * @param {number} plans[].price - 原價
   * @param {number} plans[].discounted_price - 折扣價
   * @param {Array} plans[].contents - 方案內容
   * @param {Array} plans[].addons - 加購品
   * @param {string} plans[].addons[].name - 加購品名稱
   * @param {number} plans[].addons[].price - 加購品價格

   */
  async createEventPlans(req, res, next) {
    const memberId = req.user.id;
    const { eventId } = req.params;
    const { plans = [] } = req.body;

    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    if (!eventId || !plans.length) {
      return next(appError(400, "缺少活動 ID 或方案資料"));
    }

    if (plans.length > 3) {
      return next(appError(400, "最多只能建立三個活動方案"));
    }

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const eventRepo = queryRunner.manager.getRepository("EventInfo");
      const planRepo = queryRunner.manager.getRepository("EventPlan");
      const contentRepo = queryRunner.manager.getRepository("EventPlanContent");
      const addonRepo = queryRunner.manager.getRepository("EventPlanAddon");
      const hostRepo = queryRunner.manager.getRepository("HostInfo");

      // 查詢該會員對應的主辦方
      const host = await hostRepo.findOne({ where: { member_info_id: memberId } });
      if (!host) {
        await queryRunner.rollbackTransaction();
        return next(appError(403, "尚未建立主辦方資料"));
      }

      // 查詢活動
      const event = await eventRepo.findOne({ where: { id: eventId } });
      if (!event) {
        await queryRunner.rollbackTransaction();
        return next(appError(404, "找不到對應的活動"));
      }

      // 驗證活動是否屬於該主辦方
      if (event.host_info_id !== host.id) {
        await queryRunner.rollbackTransaction();
        return next(appError(403, "無權限建立此活動的方案"));
      }

      const createdPlans = [];

      for (const plan of plans) {
        const {
          title,
          price,
          discounted_price,
          contents = [],
          addons = [],
          people_capacity,
        } = plan;

        const newPlan = planRepo.create({
          event_info_id: eventId,
          title,
          price,
          discounted_price: discounted_price || null,
          people_capacity: people_capacity || null,
        });

        const savedPlan = await planRepo.save(newPlan);

        // 建立內容
        const newContents = contents.map((c) =>
          contentRepo.create({
            event_plan_id: savedPlan.id,
            content: c,
          })
        );
        await contentRepo.save(newContents);

        // 建立加購品
        const newAddons = addons.map((a) =>
          addonRepo.create({
            event_plan_id: savedPlan.id,
            name: a.name,
            price: a.price,
          })
        );
        await addonRepo.save(newAddons);

        createdPlans.push({
          id: savedPlan.id,
          title: savedPlan.title,
          price: savedPlan.price,
          discounted_price: savedPlan.discounted_price,
          people_capacity: savedPlan.people_capacity,
          contents: newContents.map((c) => c.content),
          addons: newAddons.map((a) => ({ name: a.name, price: a.price })),
        });
      }

      await queryRunner.commitTransaction();

      return res.status(201).json({
        status: "success",
        message: "活動方案建立成功",
        data: {
          event_info_id: eventId,
          plans: createdPlans,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("createEventPlans 錯誤：", error);
      return next(appError(500, "伺服器錯誤，請稍後再試"));
    } finally {
      await queryRunner.release();
    }
  },

  /**
   *
   * @description 取得活動方案（含內容與加購）詳情

   */
  async getEventPlans(req, res, next) {
    const memberId = req.user?.id;
    const { eventId } = req.params;
    if (!eventId) {
      return next(appError(400, "缺少活動 ID"));
    }

    const eventRepo = dataSource.getRepository("EventInfo");
    const hostRepo = dataSource.getRepository("HostInfo");
    const planRepo = dataSource.getRepository("EventPlan");

    // 先確認活動是否存在
    const event = await eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      return next(appError(404, "找不到對應的活動"));
    }

    // 查詢主辦方身份
    const host = await hostRepo.findOne({ where: { member_info_id: memberId } });
    if (!host || event.host_info_id !== host.id) {
      return next(appError(403, "尚未建立主辦方資料"));
    }

    // 查詢活動方案，直接連同 contents 和 addons 關聯資料
    const plans = await planRepo.find({
      where: { event_info_id: eventId },
      relations: ["eventPlanContentBox", "eventPlanAddonBox"],
    });

    // 整理成需要的格式
    const planDetails = plans.map((plan) => ({
      id: plan.id,
      title: plan.title,
      price: plan.price,
      discounted_price: plan.discounted_price,
      contents: Array.isArray(plan.eventPlanContentBox)
        ? plan.eventPlanContentBox.map((c) => c.content)
        : [],
      addons: Array.isArray(plan.eventPlanAddonBox)
        ? plan.eventPlanAddonBox.map((a) => ({ name: a.name, price: a.price }))
        : [],
    }));

    return res.status(200).json({
      status: "success",
      message: "取得活動方案成功",
      data: {
        event_info_id: eventId,
        plans: planDetails,
      },
    });
  },
  /**
   * @description 更新活動方案（支援有 id 更新、無 id 新增）
   *
   * 前端傳入 plans 陣列：
   * - 有 id：更新該筆方案（並清除並重建 contents 和 addons）
   * - 無 id：新增新的方案及其 contents 和 addons
   *
   * 全程使用資料庫 Transaction，確保資料一致性。
   */
  async updateEventPlans(req, res, next) {
    const memberId = req.user?.id;
    // 從 URL 參數與 body 中取得 eventId 與 plans
    const { eventId } = req.params;
    const { plans = [] } = req.body;

    // 驗證基本輸入
    if (!eventId || !plans.length) {
      return next(appError(400, "缺少活動 ID 或方案資料"));
    }

    // 初始化各資料表 Repository
    const planRepo = dataSource.getRepository("EventPlan");
    const contentRepo = dataSource.getRepository("EventPlanContent");
    const addonRepo = dataSource.getRepository("EventPlanAddon");
    const eventRepo = dataSource.getRepository("EventInfo");
    const hostRepo = dataSource.getRepository("HostInfo");

    // 建立 QueryRunner，啟動資料庫 Transaction
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查詢活動是否存在
      const event = await eventRepo.findOne({ where: { id: eventId } });
      if (!event) {
        throw appError(404, "找不到對應的活動");
      }

      // 查詢會員主辦方身份
      const host = await hostRepo.findOne({ where: { member_info_id: memberId } });
      if (!host || event.host_info_id !== host.id) {
        throw appError(403, "無權限更新此活動的方案");
      }

      // 開始處理每一筆傳入的 plans
      for (const planData of plans) {
        const { id, title, price, discounted_price, contents = [], addons = [] } = planData;
        let plan;

        if (id) {
          // 有 id：表示要更新既有方案
          plan = await planRepo.findOne({ where: { id, event_info_id: eventId } });
          if (!plan) {
            throw appError(404, `找不到要更新的方案 ID：${id}`);
          }

          // 更新方案基本資訊
          plan.title = title;
          plan.price = price;
          plan.discounted_price = discounted_price;
          await planRepo.save(plan);

          // 清空舊的 contents 和 addons
          await contentRepo.delete({ event_plan_id: id });
          await addonRepo.delete({ event_plan_id: id });
        } else {
          // 沒有 id：表示新增新的方案
          plan = planRepo.create({
            event_info_id: eventId,
            title,
            price,
            discounted_price,
          });
          plan = await planRepo.save(plan); // 儲存後取得新 ID
        }

        // 建立並儲存新的 contents
        if (contents.length > 0) {
          const contentEntities = contents.map((contentStr) =>
            contentRepo.create({
              event_plan_id: plan.id,
              content: contentStr,
            })
          );
          await contentRepo.save(contentEntities);
        }

        // 建立並儲存新的 addons
        if (addons.length > 0) {
          const addonEntities = addons.map((addonObj) =>
            addonRepo.create({
              event_plan_id: plan.id,
              name: addonObj.name,
              price: addonObj.price,
            })
          );
          await addonRepo.save(addonEntities);
        }
      }

      // 全部處理完成，提交 Transaction
      await queryRunner.commitTransaction();

      // 成功回應
      return res.status(200).json({
        status: "success",
        message: "更新活動方案成功",
      });
    } catch (err) {
      // 若過程中出錯，回滾 Transaction
      await queryRunner.rollbackTransaction();
      next(err);
    } finally {
      // 最後釋放 QueryRunner 資源
      await queryRunner.release();
    }
  },
  //deleteEventPlan 控制器（刪除方案＋關聯內容＋加購）
  async deleteEventPlan(req, res, next) {
    const { eventId, planId } = req.params;
    const memberId = req.user?.id;

    // 初始化 Repositories
    const eventRepo = dataSource.getRepository("EventInfo");
    const planRepo = dataSource.getRepository("EventPlan");
    const contentRepo = dataSource.getRepository("EventPlanContent");
    const addonRepo = dataSource.getRepository("EventPlanAddon");
    const hostRepo = dataSource.getRepository("HostInfo");

    // 使用 QueryRunner 開啟 Transaction
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 驗證活動是否存在
      const event = await eventRepo.findOne({ where: { id: eventId } });
      if (!event) throw appError(404, "找不到該活動");

      // 驗證主辦方是否為本人
      const host = await hostRepo.findOne({ where: { member_info_id: memberId } });
      if (!host || event.host_info_id !== host.id) {
        throw appError(403, "無權限刪除此活動的方案");
      }

      // 確認方案是否存在且屬於該活動
      const plan = await planRepo.findOne({ where: { id: planId, event_info_id: eventId } });
      if (!plan) throw appError(404, "找不到指定的活動方案");

      // 刪除所有 contents
      await contentRepo.delete({ event_plan_id: planId });

      // 刪除所有 addons
      await addonRepo.delete({ event_plan_id: planId });

      // 刪除主方案
      await planRepo.delete({ id: planId });

      // 成功提交
      await queryRunner.commitTransaction();

      return res.status(200).json({
        status: "success",
        message: "成功刪除活動方案",
      });
    } catch (err) {
      // 發生錯誤則回滾
      await queryRunner.rollbackTransaction();
      next(err);
    } finally {
      // 最後釋放資源
      await queryRunner.release();
    }
  },
  /**
   * @description 主辦方將活動從草稿(draft)狀態提交活動審核(pending)
   * /**
   * 提交活動送審：狀態從 draft ➝ pending
   * 僅限已建立主辦方的會員提交自己的草稿活動
   */
  async submitEvent(req, res, next) {
    const memberId = req.user?.id;
    const { eventId } = req.params;

    if (!eventId) {
      return next(appError(400, "缺少活動 ID"));
    }

    const eventRepo = dataSource.getRepository("EventInfo");
    const hostRepo = dataSource.getRepository("HostInfo");

    const event = await eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      return next(appError(404, "找不到對應的活動"));
    }

    const host = await hostRepo.findOne({ where: { member_info_id: memberId } });
    if (!host || event.host_info_id !== host.id) {
      return next(appError(403, "尚未建立主辦方資料"));
    }

    if (event.active === "published") {
      return next(appError(400, "該活動已經上架"));
    }

    if (event.status === "archived") {
      return next(appError(400, "該活動已下架"));
    }

    if (event.active !== "draft") {
      return next(appError(400, "只有草稿狀態的活動才可以提交審核"));
    }

    //使用日期防呆過期的活動不能再送審
    try {
      validateEventSubmissionTime(event);
    } catch (error) {
      return next(error);
    }

    // 檢查是否已填寫完整資訊
    if (!event.title || !event.start_time || !event.end_time) {
      return next(appError(400, "請先建立完整活動詳情（含標題與時間）後再提交"));
    }

    // 成功送審，狀態轉為 pending，清除退件狀態
    event.active = "pending";
    event.is_rejected = false;
    await eventRepo.save(event);

    return res.status(200).json({
      status: "success",
      message: "活動已提交審核，請等待審核結果",
      data: {
        eventId: event.id,
        status: event.active,
      },
    });
  },

  /// ================== 給前臺 =======================
  /**
   * @description 取得公開活動詳情（只限已上架活動 published）
   */
  async getPublicEvent(req, res, next) {
    const { eventId } = req.params;

    if (!eventId) {
      return next(appError(400, "缺少活動 ID"));
    }

    const eventRepo = dataSource.getRepository("EventInfo");

    const event = await eventRepo.findOne({
      where: { id: eventId, active: "published" },
      relations: [
        "hostBox",
        "eventPhotoBox",
        "eventNoticeBox",
        "eventPlanBox",
        "eventPlanBox.eventPlanContentBox",
        "eventPlanBox.eventPlanAddonBox",
        "eventCommentBox",
        "eventTagInfoBox",
        "eventTagInfoBox.eventTagsBox",
      ],
    });

    if (!event) {
      return next(appError(404, "活動不存在或尚未上架"));
    }
    const {
      hostBox,
      eventPhotoBox,
      eventNoticeBox,
      eventPlanBox,
      eventTagInfoBox,
      eventCommentBox,
      ...rest
    } = event;

    const formattedEvent = {
      ...rest,
      host: hostBox,
      photos: eventPhotoBox,
      notices: eventNoticeBox,
      plans: eventPlanBox,
      tags: eventTagInfoBox.map((tagInfo) => ({
        id: tagInfo.eventTagsBox.id,
        name: tagInfo.eventTagsBox.name,
        description: tagInfo.eventTagsBox.description,
        level: tagInfo.eventTagsBox.level,
      })),
      comments: eventCommentBox,
    };

    return res.status(200).json({
      status: "success",
      message: "取得公開活動詳情成功",
      data: formattedEvent,
    });
  },

  async getEvents(req, res, next) {
    const {
      start_time: startTime,
      end_time: endTime,
      location,
      min_price: minPrice,
      max_price: maxPrice,
      people,
      page,
      per,
      sort,
      level,
      tag,
    } = req.query;

    // 分頁與排序設定
    const currentPage = page ? parseInt(page) : 1;
    const perPage = per ? parseInt(per) : 10;
    const sortOrder = (sort || "asc").toUpperCase();

    let sortField = "created_at";

    // 如果有 minPrice 或 maxPrice，則排序依據 price
    if (minPrice || maxPrice) {
      sortField = "price";
    }

    // 使用 QueryBuilder 來處理關聯查詢
    const eventRepo = dataSource.getRepository("EventInfo");
    const queryBuilder = eventRepo
      .createQueryBuilder("event")
      .leftJoinAndSelect("event.eventPlanBox", "eventPlanBox")
      .leftJoinAndSelect(
        "event.eventPhotoBox",
        "eventPhotoBox",
        "eventPhotoBox.type = :photoType",
        {
          photoType: "cover",
        }
      )
      .leftJoinAndSelect("event.eventTagInfoBox", "eventTagInfoBox")
      .leftJoinAndSelect("eventTagInfoBox.eventTagsBox", "eventTagsBox")
      .where("event.active = :active", { active: "published" });

    // 處理 startTime 和 endTime 篩選
    if (startTime && endTime) {
      const isStartTimeValid = !isNaN(Date.parse(startTime));
      const isEndTimeValid = !isNaN(Date.parse(endTime));
      if (!isStartTimeValid || !isEndTimeValid) {
        return next(appError(400, "參數格式錯誤，請確認填寫正確"));
      }
      queryBuilder.andWhere("event.start_time <= :endTime AND event.end_time >= :startTime", {
        startTime,
        endTime,
      });
    } else {
      if (startTime) {
        const isStartTimeValid = !isNaN(Date.parse(startTime));
        if (!isStartTimeValid) {
          return next(appError(400, "參數格式錯誤，請確認填寫正確"));
        }
        queryBuilder.andWhere("event.end_time >= :startTime", { startTime });
      }
      if (endTime) {
        const isEndTimeValid = !isNaN(Date.parse(endTime));
        if (!isEndTimeValid) {
          return next(appError(400, "參數格式錯誤，請確認填寫正確"));
        }
        queryBuilder.andWhere("event.start_time <= :endTime", { endTime });
      }
    }

    // 處理人數篩選
    if (people && !isNaN(parseInt(people))) {
      const parsedPeople = parseInt(people);
      queryBuilder.andWhere("eventPlanBox.people_capacity >= :people", {
        people: parsedPeople,
      });
    }

    // 處理 location 篩選
    if (location) {
      queryBuilder.andWhere("event.address LIKE :location", {
        location: `%${location}%`,
      });
    }

    // 處理 minPrice 和 maxPrice 篩選
    if (minPrice && !isNaN(parseInt(minPrice))) {
      const parsedMinPrice = parseInt(minPrice);
      queryBuilder.andWhere("eventPlanBox.price >= :minPrice AND eventPlanBox.price IS NOT NULL", {
        minPrice: parsedMinPrice,
      });
    }

    if (maxPrice && !isNaN(parseInt(maxPrice))) {
      const parsedMaxPrice = parseInt(maxPrice);
      queryBuilder.andWhere("eventPlanBox.price <= :maxPrice AND eventPlanBox.price IS NOT NULL", {
        maxPrice: parsedMaxPrice,
      });
    }

    if (sortField === "price") {
      queryBuilder.addOrderBy("eventPlanBox.price", sortOrder);
    } else {
      queryBuilder.addOrderBy(`event.${sortField}`, sortOrder);
    }

    if (level) {
      queryBuilder.andWhere("eventTagsBox.level = :level", { level });
    }

    if (tag) {
      const tagList = Array.isArray(tag) ? tag : tag.split(",");
      queryBuilder.andWhere("eventTagsBox.name IN (:...tagList)", { tagList });
    }

    // 分頁
    queryBuilder.skip((currentPage - 1) * perPage).take(perPage);

    // 查詢
    const [events, total] = await queryBuilder.getManyAndCount();

    // 計算總頁數
    const totalPages = Math.ceil(total / perPage);

    return res.status(200).json({
      status: "success",
      message: "取得活動成功",
      data: {
        pagination: {
          page: currentPage,
          per: perPage,
          total: total,
          total_pages: totalPages,
          ...(events.length > 0 && { sort: sortField }), // 如果有活動資料，才顯示 sort
        },
        events: events.map((event) => ({
          id: event.id,
          title: event.title,
          start_time: event.start_time,
          end_time: event.end_time,
          address: event ? event.address : "",
          plans: event.eventPlanBox.map((plan) => ({
            title: plan.title,
            price: plan.price,
            people_capacity: plan.people_capacity,
          })),
          photos: event.eventPhotoBox?.map((photo) => photo.photo_url) || [],
          tags: event.eventTagInfoBox?.map((tagInfo) => tagInfo.eventTagsBox?.name) || [],
          levels: event.eventTagInfoBox?.map((tagInfo) => tagInfo.eventTagsBox?.level) || [],
        })),
      },
    });
  },

  async recommendEvents(req, res) {
    const eventRepo = dataSource.getRepository("EventInfo");
    const events = await eventRepo.find({
      relations: ["eventPhotoBox"],
      where: { active: "published" },
    });

    const extractCity = (address) => {
      if (!address) return null;
      const match = address.match(/(.+?[縣市])/);
      if (match) {
        return match[1].slice(0, -1);
      }
      return null;
    };

    const groupedEvents = {};

    events.forEach((event) => {
      const city = extractCity(event.address) || "其他";

      if (!groupedEvents[city]) {
        groupedEvents[city] = [];
      }

      groupedEvents[city].push({
        id: event.id,
        title: event.title,
        description: event.description,
        photos: event.eventPhotoBox?.map((photo) => photo.photo_url) || [],
      });
    });

    return res.status(200).json({
      status: "success",
      message: "取得推薦活動成功",
      data: groupedEvents,
    });
  },

  async getLiveMapEvents(req, res) {
    const eventRepo = dataSource.getRepository("EventInfo");

    const events = await eventRepo.find({
      where: { active: "published" },
      select: [
        "id",
        "title",
        "latitude",
        "longitude",
        "status",
        "start_time",
        "end_time",
        "address",
      ],
    });

    return res.status(200).json({
      status: "success",
      message: "取得動態地圖成功",
      data: { events },
    });
  },
  //會員新增留言
  async postEventComment(req, res, next) {
    const memberId = req.user.id;
    const eventId = req.params.eventId;
    const { rating, description } = req.body;

    if (!memberId) return next(appError(401, "請先登入會員"));
    if (!eventId || rating === null || !description) {
      return next(appError(400, "缺少必要欄位"));
    }
    if (rating < 1 || rating > 5) {
      return next(appError(400, "評分請介於 1 到 5 之間"));
    }

    try {
      const event = await dataSource.getRepository("EventInfo").findOne({
        where: { id: eventId },
        relations: { hostBox: true },
      });
      if (!event) return next(appError(404, "查無此活動"));

      const commentRepo = dataSource.getRepository("EventComment");
      const hasCommented = await commentRepo.findOneBy({
        event_info_id: eventId,
        member_info_id: memberId,
      });
      if (hasCommented) {
        return next(appError(409, "您已對此活動發表過評論"));
      }

      const newComment = commentRepo.create({
        event_info_id: eventId,
        member_info_id: memberId,
        rating,
        description,
      });
      await commentRepo.save(newComment);

      return res.status(201).json({
        status: "success",
        message: "評論成功",
        data: {
          comment_id: newComment.id,
          event_id: eventId,
          event_title: event.title,
          member_id: memberId,
          rating: newComment.rating,
          description: newComment.description,
          created_at: newComment.created_at,
        },
      });
    } catch (error) {
      logger.error("新增評論失敗", error);
      return next(appError(500, "伺服器錯誤，無法新增評論"));
    }
  },
  //匿名在可看到留言，不需登入
  async getEventComment(req, res, next) {
    const eventId = req.params.eventId;

    if (!eventId) {
      return next(appError(400, "缺少活動 ID"));
    }

    try {
      // 1. 確認活動存在並取 title
      const event = await dataSource.getRepository("EventInfo").findOne({
        where: { id: eventId },
        select: ["id", "title"],
      });
      if (!event) {
        return next(appError(404, "查無此活動"));
      }

      const comments = await dataSource.getRepository("EventComment").find({
        where: { event_info_id: eventId },
        relations: { memberBox: true },
        order: { created_at: "DESC" },
      });

      const formatted = comments.map((c) => ({
        comment_id: c.id,
        member_id: c.member_info_id,
        member_name: c.memberBox?.name || "匿名會員",
        rating: c.rating,
        description: c.description,
        created_at: c.created_at,
      }));

      // 4. 回傳
      return res.status(200).json({
        message: "取得活動評論成功",
        status: true,
        data: {
          event_id: event.id,
          title: event.title,
          comments: formatted,
        },
      });
    } catch {
      return next(appError(500, "伺服器錯誤，無法取得評論"));
    }
  },

  async postEventFavorite(req, res, next) {
    const memberId = req.user?.id;
    const eventInfoId = req.params.eventId;
    const { event_plan_id } = req.body;

    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }
    if (!eventInfoId || !event_plan_id) {
      return next(appError(400, "缺少必要欄位 eventId 或 planId"));
    }

    try {
      const plan = await dataSource.getRepository("EventPlan").findOne({
        where: { id: event_plan_id },
        relations: ["eventBox"],
      });
      if (!plan) {
        return next(appError(404, "找不到該方案"));
      }
      if (plan.eventBox.id !== eventInfoId) {
        return next(appError(400, "此方案不屬於指定活動"));
      }

      const favRepo = dataSource.getRepository("EventFavorite");
      const exists = await favRepo.findOneBy({
        member_info_id: memberId,
        event_info_id: eventInfoId,
        event_plan_id: event_plan_id,
      });
      if (exists) {
        return next(appError(409, "此活動方案已加入最愛"));
      }

      const favorite = favRepo.create({
        member_info_id: memberId,
        event_info_id: eventInfoId,
        event_plan_id: event_plan_id,
      });
      await favRepo.save(favorite);

      return res.status(201).json({
        status: true,
        message: "已成功加入我的最愛",
        data: {
          favorite_id: favorite.id,
          event_Info_id: eventInfoId,
          event_Plan_Id: event_plan_id,
          member_Info_id: memberId,
          created_at: favorite.created_at,
        },
      });
    } catch {
      return next(appError(500, "伺服器錯誤，無法新增收藏"));
    }
  },

  async getEventFavorites(req, res, next) {
    const memberId = req.user?.id;

    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    try {
      const favRepo = dataSource.getRepository("EventFavorite");

      const favorites = await favRepo.find({
        where: { member_info_id: memberId },
        relations: ["eventBox", "eventPlanBox"],
        order: { created_at: "DESC" },
      });

      const result = favorites.map((fav) => ({
        favorite_id: fav.id,
        event_info: {
          id: fav.eventBox.id,
          title: fav.eventBox.title,
        },
        event_plan: {
          id: fav.eventPlanBox.id,
          title: fav.eventPlanBox.title,
          price: fav.eventPlanBox.price,
          discounted_price: fav.eventPlanBox.discounted_price,
        },
      }));

      return res.status(200).json({
        status: "success",
        message: "成功取得我的最愛",
        data: {
          favorites: result,
        },
      });
    } catch {
      return next(appError(500, "伺服器錯誤，無法取得我的最愛清單"));
    }
  },

  async deleteEventFavorite(req, res, next) {
    const memberId = req.user?.id;
    const eventInfoId = req.params.eventId;
    const { event_plan_id } = req.body;

    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    if (!eventInfoId || !event_plan_id) {
      return next(appError(400, "缺少必要欄位 eventId 或 event_plan_id"));
    }

    try {
      const favRepo = dataSource.getRepository("EventFavorite");

      const result = await favRepo.delete({
        member_info_id: memberId,
        event_info_id: eventInfoId,
        event_plan_id: event_plan_id,
      });

      if (result.affected === 0) {
        return next(appError(404, "找不到對應的收藏紀錄"));
      }

      return res.status(200).json({
        status: "success",
        message: "已成功取消我的最愛",
        data: {
          event_info_id: eventInfoId,
          event_plan_id: event_plan_id,
          member_info_id: memberId,
        },
      });
    } catch {
      return next(appError(500, "取消收藏失敗"));
    }
  },
};

module.exports = eventController;
