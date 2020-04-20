const Schema = require("../../lib/schema");
const ResultSet = require("../../lib/resultset");

describe("Test result sets by making sure that we", function test_resultset_basics() {
  const { assert, fixtures, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("get the first result from a call to first()", async () => {
    const user_rs = schema.rs("user");
    const user = await user_rs.first();
    assert.strictEqual(user.id(), 1, "Gets the first result");
  });

  it("get a null from a call to first() when there is nothing there to get", async () => {
    const user_rs = schema.rs("user");
    const user = await user_rs.where({ username: "not_a_real_user" }).first();
    assert.strictEqual(user, null, "No result, so we get a null");
  });

  it("get exactly one result from only_one(), and throws otherwise", async () => {
    const fred = await schema
      .rs("user")
      .where({ username: "fred" })
      .only_one();
    assert.strictEqual(fred.username(), "fred", "Got Fred!");

    try {
      await schema
        .rs("user")
        .where({ password: "a" })
        .only_one();
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "Error: A call to only_one() for user yielded multiple results."
      );
    }

    try {
      await schema
        .rs("user")
        .where({ password: "no_such_password" })
        .only_one();
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "Error: A call to only_one() for user yielded no result."
      );
    }
  });

  it("get one result from one()", async () => {
    const fred = await schema
      .rs("user")
      .where({ username: "fred" })
      .one();
    assert.strictEqual(fred.username(), "fred", "Got Fred!");
  });

  it("get a null when there is no result from one()", async () => {
    const freddddddddd = await schema
      .rs("user")
      .where({ username: "freddddddddd" })
      .one();
    assert.strictEqual(freddddddddd, null, "No such user as freddddddddd!");
  });

  it("throw an exception when one() returns multiple results", async () => {
    try {
      await schema
        .rs("user")
        .where({ password: "a" })
        .one();
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "Error: A call to one() for user yielded multiple results."
      );
    }
  });

  it("get a null when there is no result from none()", async () => {
    const freddddddddd = await schema
      .rs("user")
      .where({ username: "freddddddddd" })
      .none();
    assert.strictEqual(freddddddddd, null, "No such user as freddddddddd!");
  });

  it("throw an exception when none() returns any results", async () => {
    try {
      await schema
        .rs("user")
        .where({ username: "billy" })
        .none();
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "Error: A call to none() for user yielded results."
      );
    }
  });
});
