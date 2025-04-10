const { EntitySchema } = require("typeorm");

/**
 * 活動資料表
 */
module.exports = new EntitySchema({
  name: "Event",
  tableName: "EVENT",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
      nullable: false,
    },
    host_id: {
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
      length: 20,
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
      enum: ["registering", "closed", "full"],
      nullable: true,
    },
    registration_open_time: {
      type: "timestamptz",
      nullable: true,
    },
    registration_close_time: {
      type: "timestamptz",
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
    Host: {
      target: "Host",
      type: "many-to-one",
      //只有多的一端才有資格設置外鍵（joinColumn），也就是
      joinColumn: {
        name: "host_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "events_host_id_fk",
      },
    },
    EventTag: {
      target: "EventTag",
      type: "one-to-many",
      inverseSide: "event",
    },
  },
});
