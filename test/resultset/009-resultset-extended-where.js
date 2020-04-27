const Schema = require("../../lib/schema");
const ResultSet = require("../../lib/resultset");

describe("Test the extended where() on resultsets by making sure that we", function test_resultset_extended_where() {
  const { assert, fixtures, test_db_config, schema_options } = this;
  let schema = null;
  let no_cache_schema = null;
  let user_count = 0;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
    user_count = await schema.rs("user").count();
  });

  it("get a single result when we give a specific LIKE", async () => {
    const users = await schema
      .rs("user")
      .where({ username: { like: "fre%" } })
      .all();
    assert.strictEqual(users.length, 1, "Just got the one result");
    const user = users[0];
    assert.strictEqual(
      user.username(),
      "fred",
      "Accessor gives us the correct username"
    );
  });

  it("get a the correct number of results from a specific LIKE", async () => {
    const user_rs = schema.rs("user").where({ password: { like: "123%" } });
    const users = await user_rs.all();
    assert.strictEqual(users.length, 3, "Got three results");
  });

  it("get the correct result when we set multiple LIKEs", async () => {
    const user_rs = schema.rs("user");
    const new_user_rs = user_rs.where({ username: { like: "an%" } });
    const users = await new_user_rs.where({ password: { like: "12%" } }).all();
    assert.strictEqual(users.length, 1, "Just got the one result");
    const user = users[0];
    assert.strictEqual(
      user.username(),
      "annie",
      "Accessor gives us the correct answer"
    );
  });

  it("get a the correct number of results from a less than", async () => {
    const user_rs = schema.rs("user").where({ id: { "<": 5 } });
    const users = await user_rs.all();
    assert.strictEqual(users.length, 4, "Got four results");
  });

  it("get a the correct number of results from a less than or equal to", async () => {
    const users = await schema.rs("user").all({ id: { "<=": 5 } });
    assert.strictEqual(users.length, 5, "Got four results");
  });

  it("get a the correct number of results from a greater than", async () => {
    const users = await schema.rs("user").all({ id: { ">": 5 } });
    assert.strictEqual(
      users.length,
      user_count - 5,
      "Got the proper number of results"
    );
  });

  it("get a the correct number of results from a greater than or equal to", async () => {
    const users = await schema.rs("user").all({ id: { ">=": 5 } });
    assert.strictEqual(
      users.length,
      user_count - 4,
      "Got the proper number of results"
    );
  });

  it("get a the correct number of results from a not equal to", async () => {
    const user_rs = schema.rs("user").where({ id: { "!=": 5 } });
    const users = await user_rs.all();
    assert.strictEqual(
      users.length,
      user_count - 1,
      "Got the proper number of results"
    );
  });

  it("get a the correct number of results from an in", async () => {
    const user_rs = schema.rs("user").where({ id: { in: [4, 5, 3] } });
    const users = await user_rs.all();
    assert.strictEqual(users.length, 3, "Got three results");
  });

  it("get an exception when pass a non-array to in", async () => {
    try {
      const user_rs = schema.rs("user").where({ id: { in: 3 } });
      await user_rs.all();
      throw new Error("We did not get an exception from a non-array in value");
    } catch (err) {
      assert.strictEqual(err.toString(), "Error: 'in' requires an array");
    }
  });

  it("get a the correct number of results from a not in", async () => {
    const user_rs = schema.rs("user").where({ id: { "not in": [5, 3] } });
    const users = await user_rs.all();
    assert.strictEqual(
      users.length,
      user_count - 2,
      "Got the proper number of results"
    );
  });

  it("get an exception when pass a non-array to not in", async () => {
    try {
      const user_rs = schema.rs("user").where({ id: { "not in": 5 } });
      await user_rs.all();
      throw new Error(
        "We did not get an exception from a non-array not in value"
      );
    } catch (err) {
      assert.strictEqual(err.toString(), "Error: 'in' requires an array");
    }
  });
});
