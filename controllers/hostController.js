const { dataSource } = require("../db/data-source");
const { generateAccessJWT, generateRefreshJWT } = require("../utils/jwtUtils.js");
const { isUndefined, isNotValidString } = require("../utils/validUtils");
const appError = require("../utils/appError");
const logger = require("../utils/logger")("Host");
const { Not } = require("typeorm");
const formidable = require("formidable");
const { uploadImageFile, ALLOWED_FILE_TYPES } = require("../utils/uploadImage");

const hostController = {
  /**
   * [GET] /api/v1/host/profile
   * 取得目前登入會員的主辦方資料
   */
  async getHostProfile(req, res, next) {
    const memberId = req.user.id; // 從 JWT middleware 解析出會員 ID

    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    try {
      const hostRepo = dataSource.getRepository("HostInfo");

      // 查詢主辦方資料，並帶出對應會員資料（memberBox 內含 role）
      const host = await hostRepo.findOne({
        where: { member_info_id: memberId },
        relations: {
          memberBox: true, // 關聯查詢 MemberInfo → 用來取得 role
        },
      });

      if (!host) {
        return next(appError(404, "尚未建立主辦方資料"));
      }

      return res.status(200).json({
        status: "success",
        message: "取得主辦方資料成功",
        data: {
          host_info: {
            id: host.id,
            member_id: host.member_info_id,
            role: host.memberBox.role, // 取出會員角色
            name: host.name,
            description: host.description,
            verification_status: host.verification_status,
            phone: host.phone,
            email: host.email,
            photo_url: host.photo_url,
            photo_background_url: host.photo_background_url,
            created_at: host.created_at,
            updated_at: host.updated_at,
          },
        },
      });
    } catch (error) {
      logger.error("取得主辦方資料錯誤", error);
      return next(appError(500, "伺服器錯誤，無法取得主辦方資料"));
    }
  },
  /**
   * [POST] /api/v1/host/profile
   * 建立主辦方資料，同時更新會員角色為 host，並重新簽發 JWT
   */
  async postHostProfile(req, res, next) {
    const memberId = req.user.id; //從middleware取出目前登入的會員uuid
    if (!memberId) {
      //401-未授權
      return next(appError(401, "請先登入會員"));
    }

    const { name, description, email, phone, photo_url, photo_background_url } = req.body;

    //驗證必填欄位
    if (
      isUndefined(name) ||
      isNotValidString(name) ||
      isUndefined(email) ||
      isNotValidString(email) ||
      isUndefined(phone) ||
      isNotValidString(phone) ||
      isUndefined(photo_url) ||
      isNotValidString(photo_url)
    ) {
      //400 - 發生錯誤(未寫必填欄位)
      return next(appError(400, "請填寫主辦方名稱、電話、Email、大頭貼等必填欄位"));
    }
    //改寫法 兩件事都要成立 創建主辦方資料 ＆＆ 角色更新為host
    const queryRunner = dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const hostRepo = queryRunner.manager.getRepository("HostInfo");

      const memberRepo = queryRunner.manager.getRepository("MemberInfo");

      const existHost = await hostRepo.findOneBy({ member_info_id: memberId });

      //取HostInfo若有這位會員id=> 已是主辦方
      if (existHost) {
        //409-資源重複
        await queryRunner.rollbackTransaction();
        return next(appError(409, "您已經創建過主辦方資料"));
      }

      //建立組好要存入HostInfo的一筆主辦方資料物件
      const newHost = hostRepo.create({
        member_info_id: memberId,
        name,
        description,
        email,
        phone,
        photo_url,
        photo_background_url, //允許null
      });

      //將主辦方資料存入資料庫
      const savedHost = await hostRepo.save(newHost);
      logger.info(`savedHost ${savedHost} `);

      if (!savedHost) {
        await queryRunner.rollbackTransaction();
        return next(appError(500, "伺服器錯誤"));
      }

      //先找出該名會員
      const existMember = await memberRepo.findOneBy({ id: memberId });

      if (!existMember) {
        //404-找不到此會員
        await queryRunner.rollbackTransaction();
        return next(appError(404, "找不到此會員"));
      }

      //如果該會員存在 就更新角色
      existMember.role = "host";
      const result = await memberRepo.save(existMember);

      //logger.info(`會員 ${memberId} 已成功升級為主辦方`);

      if (!result) {
        await queryRunner.rollbackTransaction();
        return next(appError(500, "伺服器錯誤"));
      }
      //成功 → 提交交易 到資料庫
      await queryRunner.commitTransaction();

      const newAccessToken = generateAccessJWT({
        id: memberId,
        username: existMember.username,
        email: existMember.email,
        role: "host",
      });

      const newRefreshToken = generateRefreshJWT({
        id: memberId,
        username: existMember.username,
        email: existMember.email,
        role: "host",
      });

      res.cookie("access_token", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 1000 * 60 * 15, // 15 分鐘
        path: "/",
      });

      res.cookie("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 天
        path: "/",
      });

      res.status(201).json({
        status: "success",
        message: "主辦方資料建立成功",
        data: {
          host_info: {
            memberId,
            role: existMember.role,
            name: savedHost.name,
            description: savedHost.description,
            email: savedHost.email,
            phone: savedHost.phone,
            photo_url: savedHost.photo_url,
            photo_background_url: savedHost.photo_background_url ?? null,
          },
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      //logger.error("建立主辦方錯誤", error);
      return next(error);
    } finally {
      await queryRunner.release();
    }
  },

  async patchHostProfile(req, res, next) {
    const memberId = req.user.id;
    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    const hostRepo = dataSource.getRepository("HostInfo");

    try {
      const existHost = await hostRepo.findOneBy({ member_info_id: memberId });

      if (!existHost) {
        return next(appError(404, "尚未建立主辦方資料"));
      }

      const { email, phone } = req.body;

      // 檢查 email 是否重複（排除自己的那筆）
      if (email && isNotValidString(email) === false && email !== existHost.email) {
        const emailExists = await hostRepo.findOne({
          where: { email },
          // 排除自己這筆資料
          // eslint-disable-next-line no-dupe-keys
          where: { email, member_info_id: Not(memberId) },
        });
        if (emailExists) {
          return next(appError(400, "此 Email 已被其他主辦方使用"));
        }
      }

      // 檢查 phone 是否重複（排除自己）
      if (phone && isNotValidString(phone) === false && phone !== existHost.phone) {
        const phoneExists = await hostRepo.findOne({
          where: { phone, member_info_id: Not(memberId) },
        });
        if (phoneExists) {
          return next(appError(400, "此電話已被其他主辦方使用"));
        }
      }

      // 更新欄位（僅限允許的）
      const allowedFields = [
        "name",
        "description",
        "email",
        "phone",
        "photo_url",
        "photo_background_url",
      ];

      allowedFields.forEach((field) => {
        if (field in req.body && isNotValidString(req.body[field]) === false) {
          existHost[field] = req.body[field];
        }
      });

      const updatedHost = await hostRepo.save(existHost);

      return res.status(200).json({
        status: "success",
        message: "主辦方資料更新成功",
        data: {
          host_info: {
            id: updatedHost.id,
            member_id: updatedHost.member_info_id,
            name: updatedHost.name,
            description: updatedHost.description,
            email: updatedHost.email,
            phone: updatedHost.phone,
            photo_url: updatedHost.photo_url,
            photo_background_url: updatedHost.photo_background_url,
            verification_status: updatedHost.verification_status,
            updated_at: updatedHost.updated_at,
          },
        },
      });
    } catch (err) {
      logger.error("主辦方資料更新錯誤", err);
      return next(appError(500, "伺服器錯誤，無法更新主辦方資料"));
    }
  },

  async editHostAvatar(req, res, next) {
    // 處理前端的檔案上傳請求
    const form = formidable.formidable({
      multiple: false,
    });

    // 解析來自前端的請求
    const [, files] = await form.parse(req);

    // 檢查是否有上傳檔案
    const imageFile = files.file?.[0];
    if (!imageFile) {
      return next(appError(400, "請上傳圖片"));
    }

    if (!ALLOWED_FILE_TYPES[imageFile.mimetype]) {
      return next(appError(400, "圖片格式錯誤，僅支援 JPG、PNG 格式"));
    }

    // 上傳圖片並獲取圖片 URL
    const imageUrl = await uploadImageFile(imageFile, "host-avatar");

    const hostRepo = dataSource.getRepository("HostInfo");
    const updateHost = await hostRepo.update(
      { member_info_id: req.user.id },
      { photo_url: imageUrl }
    );

    if (updateHost.affected === 0) {
      return next(appError(404, "主辦方資料不存在"));
    }

    return res.status(200).json({
      status: "success",
      message: "主辦方頭貼更新成功",
      data: {
        avatar_url: imageUrl,
      },
    });
  },

  async editHostCover(req, res, next) {
    // 處理前端的檔案上傳請求
    const form = formidable.formidable({
      multiple: false,
    });

    // 解析來自前端的請求
    const [, files] = await form.parse(req);

    // 檢查是否有上傳檔案
    const imageFile = files.file?.[0];
    if (!imageFile) {
      return next(appError(400, "請上傳圖片"));
    }

    if (!ALLOWED_FILE_TYPES[imageFile.mimetype]) {
      return next(appError(400, "圖片格式錯誤，僅支援 JPG、PNG 格式"));
    }

    // 上傳圖片並獲取圖片 URL
    const imageUrl = await uploadImageFile(imageFile, "host-cover");

    const hostRepo = dataSource.getRepository("HostInfo");
    const updateHost = await hostRepo.update(
      { member_info_id: req.user.id },
      { photo_background_url: imageUrl }
    );

    if (updateHost.affected === 0) {
      return next(appError(404, "主辦方資料不存在"));
    }

    return res.status(200).json({
      status: "success",
      message: "主辦方封面照更新成功",
      data: {
        cover_url: imageUrl,
      },
    });
  },

  async getHostEvents(req, res, next) {
    const memberId = req.user.id;
    const tagFilter = req.query.tag;

    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }

    try {
      const hostRepo = dataSource.getRepository("HostInfo");

      const host = await hostRepo.findOneBy({ member_info_id: memberId });
      if (!host) {
        return next(appError(404, "尚未建立主辦方資料"));
      }

      const eventRepo = dataSource.getRepository("EventInfo");
      const query = eventRepo
        .createQueryBuilder("event")
        .leftJoinAndSelect("event.eventTagInfoBox", "tagInfo")
        .leftJoinAndSelect("tagInfo.eventTagsBox", "tag")
        .leftJoinAndSelect("event.eventNoticeBox", "notice")
        .leftJoinAndSelect("event.eventPhotoBox", "photo")
        .leftJoinAndSelect("event.orderBox", "order")
        .where("event.host_info_id = :hostId", { hostId: host.id });

      if (tagFilter) {
        query.andWhere("tag.name = :tagName", { tagName: tagFilter });
      }

      const events = await query.orderBy("event.created_at", "DESC").getMany();
      const now = new Date();

      const formattedEvents = events.map((event) => {
        const totalSignups = event.orderBox?.length || 0; //已報名人數
        const paidCount = event.orderBox?.filter((o) => o.payment_status === "paid").length || 0; //已繳費人數
        const isRegistrationOpen =
          event.registration_open_time <= now &&
          event.registration_close_time >= now &&
          paidCount < event.max_participants;
        //是否能可報名
        const remainingSlots = event.max_participants - paidCount; //剩下人數
        //報名完成率（百分比）
        const signupRate =
          event.max_participants > 0 ? Math.round((paidCount / event.max_participants) * 100) : 0;
        return {
          event_id: event.id,
          active:
            event.active === "draft"
              ? "草稿"
              : event.active === "published"
                ? "已發佈"
                : event.active === "archived"
                  ? "已下架"
                  : event.active,
          publish_at: event.registration_open_time ?? null,
          title: event.title,
          address: event.address,
          latitude: event.latitude?.toString() ?? null,
          longtitude: event.longitude?.toString() ?? null,
          description: event.description,
          start_time: event.start_time,
          end_time: event.end_time,
          max_participants: event.max_participants,
          cancel_policy: event.cancel_policy,
          registration_open_time: event.registration_open_time,
          registration_close_time: event.registration_close_time,
          signup_total: totalSignups,
          paid_count: paidCount,
          is_registration_open: isRegistrationOpen,
          remaining_slots: remainingSlots,
          signup_rate: signupRate,
          tags: (event.eventTagInfoBox || [])
            .map((info) => info?.eventTagsBox?.name || null)
            .filter((name) => name !== null),

          notices: event.eventNoticeBox.map((notice) => ({
            type: notice.type,
            content: notice.content,
          })),
          photos: event.eventPhotoBox.map((photo) => ({
            id: photo.id,
            url: photo.photo_url,
            description: photo.description,
          })),
        };
      });

      return res.status(200).json({
        status: "success",
        message: "取得主辦方活動成功",
        data: {
          host_id: host.id,
          event: formattedEvents,
        },
      });
    } catch (error) {
      logger.error("主辦方取得活動留言失敗", error);
      return next(appError(500, "伺服器錯誤，無法取得主辦活動"));
    }
  },

  async getEventCommentsByHost(req, res, next) {
    const memberId = req.user.id;
    const eventId = req.params.eventid;

    if (!memberId) {
      return next(appError(401, "請先登入會員"));
    }
    if (!eventId) {
      return next(appError(400, "缺少活動 ID"));
    }

    try {
      const eventRepo = dataSource.getRepository("EventInfo");

      // 查詢活動並驗證主辦權限
      const event = await eventRepo.findOne({
        where: { id: eventId },
        relations: { hostBox: true },
      });

      if (!event) {
        return next(appError(404, "查無此活動"));
      }

      if (event.hostBox.member_info_id !== memberId) {
        return next(appError(403, "無權限查閱此活動的留言"));
      }

      // 查詢會員對該活動的留言
      const commentRepo = dataSource.getRepository("EventComment");

      const comments = await commentRepo.find({
        where: { event_info_id: eventId },
        relations: { memberBox: true },
        order: { created_at: "DESC" },
      });

      const formattedComments = comments.map((comment) => ({
        comment_id: comment.id,
        member_id: comment.member_info_id,
        member_name: comment.memberBox?.name || "匿名會員",
        rating: comment.rating,
        description: comment.description,
        created_at: comment.created_at,
      }));

      return res.status(200).json({
        status: "success",
        message: "取得活動留言成功",
        data: {
          event_info_id: eventId,
          event_title: event.title,
          comments: formattedComments,
        },
      });
    } catch (error) {
      logger.error("主辦方取得活動留言失敗", error);
      return next(appError(500, "伺服器錯誤，無法取得留言"));
    }
  },
};

module.exports = hostController;
