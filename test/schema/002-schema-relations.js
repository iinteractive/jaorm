const Schema = require("../../lib/schema");

describe("Test the schema object's relation builder by making sure that", function test_schema_relations() {
  const { assert, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("We get the automatic relations", () => {
    const { relations } = schema.schema_info();

    assert.deepEqual(relations.user.user_prefs, {
      table: "user_prefs",
      local: "user.id",
      foreign: "user_prefs.user_id",
      has_one: "user_pref",
      has_many: "user_prefs"
    });
    assert.deepEqual(relations.user_prefs.user, {
      table: "user",
      local: "user_prefs.user_id",
      foreign: "user.id",
      has_one: "user",
      has_many: "users"
    });
    assert.deepEqual(relations.user.user_role, {
      table: "user_role",
      local: "user.id",
      foreign: "user_role.user_id",
      has_one: "user_role",
      has_many: "user_roles"
    });
    assert.deepEqual(relations.role.user_role, {
      table: "user_role",
      local: "role.id",
      foreign: "user_role.role_id",
      has_one: "user_role",
      has_many: "user_roles"
    });
    assert.deepEqual(relations.user_role.user, {
      table: "user",
      local: "user_role.user_id",
      foreign: "user.id",
      has_one: "user",
      has_many: "users"
    });
    assert.deepEqual(relations.user_role.role, {
      table: "role",
      local: "user_role.role_id",
      foreign: "role.id",
      has_one: "role",
      has_many: "roles"
    });
  });

  it("we get the manual relations", () => {
    const { relations } = schema.schema_info();
    assert.deepEqual(relations.user.sent_messages, {
      table: "message",
      local: "user.id",
      foreign: "message.sender_id",
      has_one: null,
      has_many: "sent_messages"
    });
    assert.deepEqual(relations.user.received_messages, {
      table: "message",
      local: "user.id",
      foreign: "message.recipient_id",
      has_one: null,
      has_many: "received_messages"
    });
    assert.deepEqual(relations.message.sender, {
      table: "user",
      local: "message.sender_id",
      foreign: "user.id",
      has_one: "sender",
      has_many: null
    });
    assert.deepEqual(relations.message.recipient, {
      table: "user",
      local: "message.recipient_id",
      foreign: "user.id",
      has_one: "recipient",
      has_many: null
    });
  });
});
