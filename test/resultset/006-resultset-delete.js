const Schema = require("../../lib/schema");

describe("Test the resultset destroy_all() functionality by making sure that we", function test_resultset_destroy_all() {
  const { assert, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("get the expected result from a simple delete", async () => {
    const user_rs = schema.rs("user");
    const starting_user_count = await schema.rs("user").count();

    // Create a user to delete
    const new_user = await user_rs.create({
      username: "jimbo",
      password: "no_whammies"
    });

    const new_user_count = await schema.rs("user").count();
    assert.strictEqual(
      new_user_count,
      starting_user_count + 1,
      "We have one more user than we did"
    );

    const nothing = await schema.rs("user").destroy_all({ username: "jimbo" });
    assert.strictEqual(nothing, null, "We get null back from a deletion.");

    const final_user_count = await schema.rs("user").count();
    assert.strictEqual(
      final_user_count,
      starting_user_count,
      "We ended with the same number we started with"
    );
  });

  it("fail when trying to delete a row that doesn't have a primary key", async () => {
    const user_pref = await schema
      .rs("user_prefs")
      .where({ font: "comic sans" })
      .first();
    try {
      await user_pref.destroy();
      throw new Error("We destroyed a row in place that doesn't have a PK!");
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "Error: You can't use a single object destroy() without a primary key on the table. Please use rs.destroy_all().",
        "got the proper error message"
      );
    }
  });
});
