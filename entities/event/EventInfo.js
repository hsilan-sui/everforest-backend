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
      type: "enum",
      enum: ["draft", "published", "archived"],
      default: "draft",
      nullable: false,
    },
    status: {
      type: "enum",
      enum: ["preparing", "registering", "expired", "full"],
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
  },
});
