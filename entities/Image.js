const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Image", // Entity 名稱
  tableName: "images_圖片多型關聯",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    owner_id: {
      type: "uuid",
      nullable: false,
      comment: "可以是 user_id、host_id 或 event_id，代表上傳圖片的對象",
    },
    owner_type: {
      type: "enum",
      enum: ["user", "host", "event"],
      nullable: false,
      comment: "user host event",
    },
    image_url: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    description: {
      type: "text",
      nullable: true,
    },
    image_type: {
      type: "enum",
      enum: ["profile", "cover", "detail"],
      nullable: true,
      comment: "圖片類型：頭像、封面、詳情",
    },
    sort_order: {
      type: "int",
      default: 0,
      comment: "排序用，數字越小越前面",
    },
    updated_at: {
      type: "timestamptz",
      updateDate: true, // TypeORM 自動更新時間戳
    },
  },
});
