const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "HostInfo",
  tableName: "HOST_INFO",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
      nullable: false,
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
      default: "invalid",
    },
    photo_url: {
      type: "varchar",
      length: 1024,
      nullable: false,
    },
    photo_background_url: {
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
    MemberInfo: {
      type: "one-to-one",
      target: "MemberInfo",
      joinColumn: {
        name: "member_info_id", // FK 欄位名稱
      },
      onDelete: "CASCADE",
      nullable: false,
      inverseSide: "HostInfo", // 對應 MemberInfo 的欄位名（重要！）
    },
  },
});
