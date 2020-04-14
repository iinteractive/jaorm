const Schema = require("../../lib/schema");

describe("Test the resultset with() functionality by making sure that we", function test_resultset_with() {
  const { assert, fixtures, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("get the expected result from a simple automatic relation", async () => {
    const user_rs = schema.rs("user").with(["user_prefs"]);
    const users = await user_rs.all();

    assert.strictEqual(
      users.length,
      fixtures.table_data.user.length,
      "Same number of users as in fixtures"
    );
    const first_user = users[0];
    assert.strictEqual(
      first_user.username(),
      "fred",
      "Got the proper first user"
    );
    const fred_prefs = first_user.user_pref();
    assert.strictEqual(
      fred_prefs.font(),
      "comic sans",
      "Got Fred's preferred font"
    );
  });

  it("get the expected result from a simple automatic relation and make it into a normal object", async () => {
    const user_rs = schema.rs("user").with(["user_prefs"]);
    const fred = await user_rs.first();
    const fred_object = fred.to_object();
    assert.strictEqual(
      fred_object.user_pref.theme,
      "dark",
      "Got Fred's preferred theme"
    );
  });

  it("get the expected result from a chained automatic relation", async () => {
    const user_rs = schema.rs("user").with(["user_role:role"]);
    const fred = await user_rs.first();
    assert.strictEqual(
      fred.user_role().user_id(),
      fred.id(),
      "We got the correct row in the middle object"
    );
    assert.strictEqual(
      fred.role().to_object().name,
      "Free User",
      "Fred isn't paying any hard earned money for this!"
    );
    assert.strictEqual(
      fred.user_role().role_id(),
      fred.role().id(),
      "The link object is correct on the other side as well"
    );
  });

  it("Get proper results from a one-to-many relationship", async () => {
    const user_rs = schema
      .rs("user")
      .where({ id: 5 })
      .with(["sent_messages", "received_messages"]);
    const users = await user_rs.all();
    const jimmy = users[0];
    assert.strictEqual(
      jimmy.sent_messages().length,
      3,
      "Jimmy has sent three messages"
    );
    assert.strictEqual(
      jimmy.received_messages().length,
      2,
      "Jimmy has received two messages"
    );
  });
});
