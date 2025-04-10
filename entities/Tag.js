const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "Tag",
  tableName: "TAG",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
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
    level: {
      type: "varchar",
      length: 20,
    },
    created_at: {
      type: "timestamptz",
      createDate: true,
    },
  },
  relations: {
    EventTag: {
      target: "EventTag",
      type: "one-to-many",
      inverseSide: "tag",
    },
  },
});
