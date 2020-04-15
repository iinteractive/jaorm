const Schema = require("../../lib/schema");

describe("Test result objects' ability to delete by making sure that we", function test_result_delete() {
  const { assert, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("updates only one result at a time when used locally", async () => {
    const user_rs = schema.rs("user");
    const starting_user_count = await schema.rs("user").count();

    // Create a user to delete
    const new_user = await user_rs.create({
      username: "frank",
      password: "abcd"
    });

    const new_user_count = await schema.rs("user").count();
    assert.strictEqual(
      new_user_count,
      starting_user_count + 1,
      "We have one more user than we did"
    );

    const nothing = await new_user.destroy();
    assert.strictEqual(nothing, null, "We get null back from a deletion.");

    const final_user_count = await schema.rs("user").count();
    assert.strictEqual(
      final_user_count,
      starting_user_count,
      "We ended with the same number we started with"
    );
  });
});
