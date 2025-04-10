const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
  name: "EventPlan",
  tableName: "EVENT_PLAN",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
      nullable: false,
    },
    event_id: {
      type: "uuid",
      nullable: false,
    },
    title: {
      type: "varchar",
      length: 100,
      nullable: false,
    },
    price: {
      type: "integer",
      nullable: false,
    },
    discounted_price: {
      type: "integer",
      nullable: true,
    },
    created_at: {
      type: "timestamptz",
      createDate: true,
    },
    updated_at: {
      type: "timestamptz",
      updateDate: true,
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
  },
});
