const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EventInfoPhoto",
  tableName: "EVENT_INFO_PHOTO",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      nullable: false,
      generated: "uuid",
    },
    event_info_id: {
      type: "uuid",
      nullable: false,
    },
    type: {
      type: "enum",
      enum: ["cover", "detail"],
      default: "detail", // 預設就是 detail
      nullable: false, //一定要有值，不能空
    },
    photo_url: {
      type: "varchar",
      length: 1024,
      nullable: false,
    },
    description: {
      type: "text",
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
    eventBox: {
      type: "many-to-one",
      target: "EventInfo",
      joinColumn: {
        name: "event_info_id",
      },
      inverseSide: "eventPhotoBox",
      onDelete: "CASCADE",
    },
  },
});
