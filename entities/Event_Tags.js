const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Event_Tags",
  tableName: "EVENT_TAGS",
  columns: {
    id: {},
    name: {},
    description: {},
    level: {},
    created_at: {},
  },
});
