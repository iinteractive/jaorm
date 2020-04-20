const Schema = require("../../lib/schema");
const Result = require("../../lib/result");

describe("Test result objects by making sure that we", function test_result_basics() {
  const { assert, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("fail if it doesn't have a supplied table name", () => {
    try {
      const fail = new Result(schema);
      throw new Error("We instantiated a Result without a table somehow");
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "Error: Result objects require a table name",
        "Failed to instantiate without a table name"
      );
    }
  });

  it("get all the accessors we expect", async () => {
    const user_rs = schema.rs("user");
    const user = await user_rs.first();
    assert.strictEqual(user.id(), 1, "id() gives us the correct answer");
    assert.strictEqual(
      user.username(),
      "fred",
      "username() gives us the correct answer"
    );
    assert.strictEqual(
      user.password(),
      "1234",
      "password() gives us the correct answer"
    );
    assert.isNotNull(user.date_created(), "date_created() gives us an answer");
  });

  it("get a plain object from to_object() for a Result with no relations", async () => {
    const meta_result = await schema
      .rs("meta")
      .where({ key: "disable_widgets" })
      .first();
    const meta_obj = meta_result.to_object();
    assert.strictEqual(meta_obj.key, "disable_widgets", "key is correct");
    assert.strictEqual(meta_obj.value, "yes", "value is correct");
  });

  it("get a plain object from to_object() for a Result with relations", async () => {
    const user_rs = schema.rs("user");
    const user_result = await user_rs.with(["user_prefs"]).first();
    const user = user_result.to_object();
    assert.strictEqual(user.id, 1, "id is correct");
    assert.strictEqual(user.username, "fred", "username is correct");
    assert.strictEqual(user.password, "1234", "password is correct");
    assert.isNotNull(user.date_created, "date_created exists");
  });

  it("get a JSON string from to_json_string()", async () => {
    const user_rs = schema.rs("user");
    const user_result = await user_rs.first();
    const user_string = user_result.to_json_string();
    const user = JSON.parse(user_string);
    assert.strictEqual(user.id, 1, "id is correct");
    assert.strictEqual(user.username, "fred", "username is correct");
    assert.strictEqual(user.password, "1234", "password is correct");
    assert.isNotNull(user.date_created, "date_created exists");
  });

  it("get the proper PK for a single-PK table when we check", async () => {
    const pks = schema.list_pks();

    const user = await schema.rs("user").first();
    assert.deepEqual(
      user.pk(),
      pks.user,
      "Got the proper PK for a table with a single PK"
    );
  });

  it("get the proper PK for a composite-PK table when we check", async () => {
    const pks = schema.list_pks();

    const flist_entry = await schema.rs("friend_list").first();
    assert.deepEqual(
      flist_entry.pks(),
      pks.friend_list,
      "Got the proper PK for a table with a composite PK"
    );
  });

  it("get the table name of the object via jaorm_table()", async () => {
    const fred = await schema
      .rs("user")
      .where({ username: "fred" })
      .first();

    assert.strictEqual(
      fred.jaorm_table(),
      "user",
      "Got the table name via jaorm_table()"
    );
  });
});
