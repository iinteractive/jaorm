const Schema = require("../../lib/schema");

describe("Test the resultset count() functionality by making sure that we", function test_resultset_count() {
  const { assert, fixtures, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("get all the results from a call to count()", async () => {
    const user_rs = schema.rs("user");
    const count = await user_rs.count();
    assert.strictEqual(
      count,
      fixtures.table_data.user.length,
      "Same number of users from count() as in fixtures"
    );
  });

  it("get a single result when we're specific about a query", async () => {
    const username = "fred";

    const user_rs = schema.rs("user").where({ username });
    const count = await user_rs.count();
    assert.strictEqual(count, 1, "Just got the one result");
  });

  it("get the proper count we set the parameters before the query", async () => {
    const password = "a";

    const user_rs = schema.rs("user").where({ password });
    const count = await user_rs.count();
    assert.strictEqual(count, 2, "Got two results");
  });

  it("get no result when we set conflicting parameters", async () => {
    const username = "annie";
    const password = "123";

    const user_rs = schema.rs("user").where({ username, password });
    const count = await user_rs.count();
    assert.strictEqual(count, 0, "Got no results");
  });
});
