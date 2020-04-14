const Schema = require("../../lib/schema");

describe("Test result objects' ability to update by making sure that we", function test_result_update() {
  const { assert, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("updates only one result at a time when used locally", async () => {
    const user_rs = schema.rs("user");
    const users_with_bad_passwords = await user_rs
      .where({ password: "a" })
      .all();

    assert.strictEqual(
      users_with_bad_passwords.length,
      2,
      "Found two people who need to change their passwords"
    );

    let [first_one] = users_with_bad_passwords;

    first_one = await first_one.password("entropy9");
    const users_with_bad_passwords_again = await user_rs
      .where({ password: "a" })
      .all();

    assert.strictEqual(
      users_with_bad_passwords_again.length,
      1,
      "Now only one person who needs to change their passwords"
    );

    await first_one.password("a");
    const users_with_bad_passwords_back_to_normal = await user_rs
      .where({ password: "a" })
      .all();

    assert.strictEqual(
      users_with_bad_passwords_back_to_normal.length,
      2,
      "Everything is back to how it was"
    );
  });
});
