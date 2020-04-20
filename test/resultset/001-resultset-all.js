const Schema = require("../../lib/schema");
const ResultSet = require("../../lib/resultset");

describe("Test result sets by making sure that we", function test_resultset_basics() {
  const { assert, fixtures, test_db_config, schema_options } = this;
  let schema = null;
  let no_cache_schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
    no_cache_schema = new Schema(test_db_config);
    await no_cache_schema.initialize();
  });

  it("fail if it doesn't have a supplied schema", () => {
    try {
      const fail = new ResultSet();
      throw new Error("We instantiated a ResultSet without a table somehow");
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "Error: ResultSet requires the schema object",
        "Failed to instantiate without a table name"
      );
    }
  });

  it("fail if it doesn't have a supplied table name", () => {
    try {
      const fail = new ResultSet(schema);
      throw new Error("We instantiated a Result without a table somehow");
    } catch (err) {
      assert.strictEqual(
        err.toString(),
        "Error: ResultSet objects require a table name",
        "Failed to instantiate without a table name"
      );
    }
  });

  it("get all the results from a call to all()", async () => {
    const user_rs = schema.rs("user");
    const users = await user_rs.all();
    assert.strictEqual(
      users.length,
      fixtures.table_data.user.length,
      "Same number of users from all() as in fixtures"
    );
  });

  it("get a single result when we're specific about a query", async () => {
    const username = "fred";

    const user_rs = schema.rs("user");
    const users = await user_rs.where({ username }).all();
    assert.strictEqual(users.length, 1, "Just got the one result");
    const user = users[0];
    assert.strictEqual(
      user.username(),
      username,
      "Accessor gives us the correct answer"
    );
  });

  it("get a single result when we set the parameters before the query", async () => {
    const username = "robert";

    const user_rs = schema.rs("user");
    user_rs.where({ username });
    const users = await user_rs.all();
    assert.strictEqual(users.length, 1, "Just got the one result");
    const user = users[0];
    assert.strictEqual(
      user.username(),
      username,
      "Accessor gives us the correct answer"
    );
  });

  it("get the correct result when we set parameters in multiple stages", async () => {
    const username = "annie";
    const password = "12345";

    const user_rs = schema.rs("user");
    const new_user_rs = user_rs.where({ username });
    const users = await new_user_rs.where({ password }).all();
    assert.strictEqual(users.length, 1, "Just got the one result");
    const user = users[0];
    assert.strictEqual(
      user.username(),
      username,
      "Accessor gives us the correct answer"
    );
  });

  it("get the correct result when we chain a bunch of stages", async () => {
    const sender_id = 1;
    const recipient_id = 4;
    const message = "I hate the new layout, I can not find anything!";

    const message_rs = schema.rs("message");
    const messages = await message_rs
      .where({ sender_id })
      .where({ recipient_id })
      .where({ message })
      .all();
    assert.strictEqual(messages.length, 1, "Just got the one result");
    const message_row = messages[0];
    assert.strictEqual(
      message_row.sender_id(),
      sender_id,
      "Accessor gives us the correct answer"
    );
  });

  it("get the correct result when we chain a bunch of stages, including a boolean true", async () => {
    const sender_id = 1;
    const recipient_id = 4;
    const read = true;
    const message = "I hate the new layout, I can not find anything!";

    const message_rs = schema.rs("message");
    const messages = await message_rs
      .where({ sender_id })
      .where({ recipient_id })
      .where({ read })
      .where({ message })
      .all();
    assert.strictEqual(messages.length, 1, "Just got the one result");
    const message_row = messages[0];
    assert.strictEqual(
      message_row.sender_id(),
      sender_id,
      "Accessor gives us the correct answer"
    );
  });

  it("get the correct result when we chain a bunch of stages, including a boolean false", async () => {
    const sender_id = 2;
    const recipient_id = 5;
    const read = false;
    const message =
      "I am not going to warn you again. Stop flaming other users or you will be banned.";

    const message_rs = schema.rs("message");
    const messages = await message_rs
      .where({ sender_id })
      .where({ recipient_id })
      .where({ read })
      .where({ message })
      .all();
    assert.strictEqual(messages.length, 1, "Just got the one result");
    const message_row = messages[0];
    assert.strictEqual(
      message_row.sender_id(),
      sender_id,
      "Accessor gives us the correct answer"
    );
  });

  it("get no result when we set conflicting parameters", async () => {
    const username = "annie";
    const password = "123";

    const user_rs = schema
      .rs("user")
      .where({ username })
      .where({ password });
    const users = await user_rs.all();
    assert.strictEqual(users.length, 0, "Got no results");
  });

  it("get a result when we set conflicting parameters and then blank one", async () => {
    const username = "annie";
    const password = "123";

    const user_rs = schema
      .rs("user")
      .where({ username })
      .where({ password });
    const users = await user_rs.all();
    assert.strictEqual(users.length, 0, "Got no results");

    const new_user_rs = user_rs.where({ password: undefined });
    const new_users = await new_user_rs.all();
    assert.strictEqual(new_users.length, 1, "Got one result");
    assert.strictEqual(
      new_users[0].username(),
      "annie",
      "Got the correct result"
    );
  });

  it("grab results where at least one of the entries will have a null to inflate", async () => {
    const news_rs = schema.rs("news");
    const news_posts = await news_rs.all();

    assert.strictEqual(
      news_posts.length,
      fixtures.table_data.news.length,
      "Retrieved everything that we put in without incident"
    );
  });

  it("get the cached results from a call to results()", async () => {
    const message_rs = schema.rs("message");
    const messages = await message_rs.all();
    assert.deepEqual(
      messages,
      message_rs.results(),
      "results() gives us the cached query results"
    );
  });

  it("get an empty from a call to results() if caching isn't turned on", async () => {
    const message_rs = no_cache_schema.rs("message");
    const messages = await message_rs.all();
    assert.strictEqual(
      message_rs.results().length,
      0,
      "results() gives us nothing if we didn't turn caching on"
    );
  });

  it("get a proper list of ordinary objects from the resultset", async () => {
    const user_role_rs = schema.rs("user_role");
    const user_roles = await user_role_rs.all();
    const user_role_objects = user_role_rs.to_objects();

    for (const ur_obj of user_role_objects) {
      delete ur_obj.date_created;
    }
    assert.deepEqual(
      user_role_objects,
      [
        { user_id: 1, role_id: 4 },
        { user_id: 2, role_id: 2 },
        { user_id: 3, role_id: 1 },
        { user_id: 4, role_id: 3 },
        { user_id: 5, role_id: 4 }
      ],
      "Got a normal object list from to_objects()"
    );
  });

  it("blank out driver options by passing in a null", async () => {
    const user_rs = schema.rs("user");
    user_rs._driver_options = { foo: "bar" };

    const new_rs = user_rs.where({ username: "fred" }, null);
    assert.deepEqual(
      user_rs._driver_options,
      { foo: "bar" },
      "driver options on the original RS stayed"
    );
    assert.deepEqual(
      new_rs._driver_options,
      {},
      "driver options got blanked out"
    );
  });

  it("blank out search parameters by passing in a null", async () => {
    const user_rs = schema.rs("user");

    const fred_rs = user_rs.where({ username: "fred" });
    const non_fred_rs = user_rs.where(null);
    assert.deepEqual(
      fred_rs._attributes,
      { username: "fred" },
      "search parameters on the original RS stayed"
    );
    assert.deepEqual(
      non_fred_rs._attributes,
      {},
      "search parameters got blanked out"
    );
  });
});
