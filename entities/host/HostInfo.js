const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "HostInfo",
  tableName: "HOST_INFO",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      nullable: false,
      generated: "uuid",
    },
    member_info_id: {
      type: "uuid",
      nullable: false,
    },
    name: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    description: {
      type: "text",
      nullable: true,
    },
    email: {
      type: "varchar",
      length: 256,
      nullable: false,
      unique: true,
    },
    phone: {
      type: "varchar",
      length: 72,
      nullable: false,
      unique: true,
    },
    verification_status: {
      type: "enum",
      enum: ["invalid", "valid"],
      default: "invalid", //未認證
    },
    photo_url: {
      //主辦方大頭照
      type: "varchar",
      length: 1024,
      nullable: false,
    },
    photo_background_url: {
      //主辦方背景圖
      type: "varchar",
      length: 1024,
      nullable: true,
    },
    created_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    updated_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
  relations: {
    /*
    relations 裡的 key（例如現在memberBox）
    是你在 JavaScript / TypeORM 中存取關聯時用的「變數名稱」，
    ！！！他不是資料表名稱、不是orm Entity 名稱、也不是資料庫欄位名稱！！！
    這層的key是關聯的變數名稱，小寫命名慣例 & 作為 inverseSide 用*/
    memberBox: {
      type: "one-to-one",
      target: "MemberInfo",
      joinColumn: {
        name: "member_info_id", // FK 欄位名稱
      },
      onDelete: "CASCADE",
      nullable: false,
      inverseSide: "hostBox", // 對應 MemberInfo中定義的關聯變數名（重要！）
    },
  },
});
