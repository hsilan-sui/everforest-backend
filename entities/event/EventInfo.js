const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EventInfo",
  tableName: "EVENT_INFO",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      nullable: false,
      generated: "uuid",
    },
    host_info_id: {
      type: "uuid",
      nullable: false,
    },
    title: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    address: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    description: {
      type: "text",
      nullable: false,
    },
    start_time: {
      type: "timestamptz",
      nullable: false,
    },
    end_time: {
      type: "timestamptz",
      nullable: false,
    },
    max_participants: {
      type: "integer",
      nullable: false,
    },
    cancel_policy: {
      type: "varchar",
      length: 120,
      nullable: false,
    },
    active: {
      //管理平台狀態（是否公開）
      type: "enum",
      enum: ["draft", "pending", "published", "unpublish_pending", "archived"],
      default: "draft",
      nullable: false,
    },
    is_rejected: {
      //新增
      type: "boolean",
      default: false,
      nullable: false,
    },
    unpublish_reason: {
      //主辦方下架理由
      type: "text",
      nullable: true,
    },
    unpublish_review_comment: {
      //審核-下架理由
      type: "text",
      nullable: true,
    },
    status: {
      //反映活動進度（報名開啟/關閉）
      type: "enum",
      enum: ["preparing", "registering", "expired", "full", "refunding", "cancelled", "finished"],
      default: "preparing",
      nullable: false,
    },
    registration_open_time: {
      type: "timestamptz",
      nullable: true,
    },
    registration_close_time: {
      type: "timestamptz",
      nullable: true,
    },
    latitude: {
      type: "double precision",
      nullable: true,
    },
    longitude: {
      type: "double precision",
      nullable: true,
    },
    total_signup: {
      type: "integer",
      nullable: false,
      default: 0,
    },
    created_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    updated_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    archived_at: {
      //下架時間
      type: "timestamptz",
      nullable: true,
    },
  },
  relations: {
    hostBox: {
      type: "many-to-one",
      target: "HostInfo",
      joinColumn: {
        name: "host_info_id",
      },
      inverseSide: "eventBox",
      onDelete: "CASCADE",
    },
    eventPhotoBox: {
      type: "one-to-many",
      target: "EventInfoPhoto",
      inverseSide: "eventBox",
    },
    eventNoticeBox: {
      type: "one-to-many",
      target: "EventNotice",
      inverseSide: "eventBox",
    },
    eventTagInfoBox: {
      type: "one-to-many",
      target: "EventTagInfo", // 中介實體
      inverseSide: "eventBox",
      cascade: true,
    },
    eventPlanBox: {
      type: "one-to-many",
      target: "EventPlan",
      inverseSide: "eventBox",
    },
    eventCommentBox: {
      type: "one-to-many",
      target: "EventComment",
      inverseSide: "eventBox",
    },

    orderBox: {
      type: "one-to-many",
      target: "OrderInfo",
      inverseSide: "eventBox", // <- 對應 OrderInfo 裡的欄位
    },
  },
});
