const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Tag",
  tableName: "TAG",
  columns: {
    id: {},
    name: {},
    description: {},
    level: {},
    created_at: {},
  },
});
