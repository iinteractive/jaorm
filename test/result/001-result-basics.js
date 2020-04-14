const Schema = require("../../lib/schema");

describe("Test result objects by making sure that we", function test_result_basics() {
  const { assert, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
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

  // FIXME: These two need to be able to chain properly:

  it("get a plain object from to_object()", async () => {
    const user_rs = schema.rs("user");
    // FIXME
    // const user = await user_rs.first().to_object();
    const user_result = await user_rs.first();
    const user = user_result.to_object();
    assert.strictEqual(user.id, 1, "id is correct");
    assert.strictEqual(user.username, "fred", "username is correct");
    assert.strictEqual(user.password, "1234", "password is correct");
    assert.isNotNull(user.date_created, "date_created exists");
  });

  it("get a JSON string from to_json_string()", async () => {
    const user_rs = schema.rs("user");
    // FIXME
    // const user_string = await user_rs.first().to_json_string();
    const user_result = await user_rs.first();
    const user_string = user_result.to_json_string();
    const user = JSON.parse(user_string);
    assert.strictEqual(user.id, 1, "id is correct");
    assert.strictEqual(user.username, "fred", "username is correct");
    assert.strictEqual(user.password, "1234", "password is correct");
    assert.isNotNull(user.date_created, "date_created exists");
  });
});
