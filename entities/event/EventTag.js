const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EventTag",
  tableName: "EVENT_TAG",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      nullable: false,
      generated: "uuid",
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
      nullable: true,
    },
    created_at: {
      type: "timestamptz",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
});
