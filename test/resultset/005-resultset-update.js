const Schema = require("../../lib/schema");

describe("Test the resultset update_all() functionality by making sure that we", function test_resultset_update_all() {
  const { assert, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("get the expected result from a simple update", async () => {
    const user_rs = schema.rs("user");
    const no_of_users_with_bad_passwords = await user_rs
      .where({ password: "a" })
      .count();

    assert.strictEqual(
      no_of_users_with_bad_passwords,
      2,
      "Found two people who need to change their passwords"
    );

    const updateds = await user_rs
      .where({ password: "a" })
      .update_all({ password: "aa" });

    assert.strictEqual(updateds.length, 2, "Updated two entries");
    const no_of_users_still_with_bad_passwords = await user_rs
      .where({ password: "aa" })
      .count();

    assert.strictEqual(
      no_of_users_still_with_bad_passwords,
      no_of_users_with_bad_passwords,
      "Those two changed their passwords, but they're still awful"
    );

    // Put it all back
    await user_rs.where({ password: "aa" }).update_all({ password: "a" });
  });
});
