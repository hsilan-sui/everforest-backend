const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EventTagInfo",
  tableName: "EVENT_TAG_INFO",
  columns: {
    event_info_id: {
      type: "uuid",
      primary: true,
    },
    event_tag_id: {
      type: "uuid",
      primary: true,
    },
  },
  relations: {
    eventBox: {
      type: "many-to-one",
      target: "EventInfo",
      joinColumn: {
        name: "event_info_id",
      },
      onDelete: "CASCADE",
    },
    eventTagBox: {
      type: "many-to-many",
      target: "EventTag",
      joinColumn: {
        name: "event_tag_id",
      },
      onDelete: "CASCADE",
    },
  },
});
