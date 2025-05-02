const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EventNotice",
  tableName: "EVENT_NOTICE",
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
      type: "varchar",
      length: 20,
      default: "行前提醒",
      nullable: false,
    },
    content: {
      type: "text",
      nullable: false,
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
    eventBox: {
      type: "many-to-one",
      target: "EventInfo",
      joinColumn: {
        name: "event_info_id",
      },
      inverseSide: "eventNoticeBox",
      onDelete: "CASCADE",
    },
  },
});
