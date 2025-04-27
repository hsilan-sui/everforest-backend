const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EventComment",
  tableName: "EVENT_COMMENT",
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
    member_info_id: {
      type: "uuid",
      nullable: false,
    },
    rating: {
      type: "int",
      nullable: false,
    },
    description: {
      type: "text",
      nullable: false,
    },
    created_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
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
      inverseSide: "eventCommentBox",
      onDelete: "CASCADE",
    },
    memberBox: {
      type: "many-to-one",
      target: "MemberInfo",
      joinColumn: {
        name: "member_info_id",
      },
      inverseSide: "eventCommentBox",
      onDelete: "CASCADE",
    },
  },
});
