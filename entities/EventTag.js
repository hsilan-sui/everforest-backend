const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EventTag",
  tableName: "EVENT_TAG",
  columns: {
    event_id: {
      type: "uuid",
      primary: true,
    },
    tag_id: {
      type: "uuid",
      primary: true,
    },
  },
  relations: {
    event: {
      target: "Event",
      type: "many-to-one",
      joinColumn: {
        name: "event_id",
        referencedColumnName: "id",
      },
    },
    tag: {
      target: "Tag",
      type: "many-to-one",
      joinColumn: {
        name: "tag_id",
        referencedColumnName: "id",
      },
    },
  },
});
