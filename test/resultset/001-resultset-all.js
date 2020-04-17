const Schema = require("../../lib/schema");

describe("Test result sets by making sure that we", function test_resultset_basics() {
  const { assert, fixtures, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
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

  it("gets the first result from a call to first()", async () => {
    const user_rs = schema.rs("user");
    const user = await user_rs.first();
    assert.strictEqual(user.id(), 1, "Gets the first result");
  });

  it("get a single result when we're specific about a query", async () => {
    const username = "fred";

    const user_rs = schema.rs("user");
    const users = await user_rs.search_parameters({ username }).all();
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
    user_rs.search_parameters({ username });
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
    const new_user_rs = user_rs.search_parameters({ username });
    const users = await new_user_rs.search_parameters({ password }).all();
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
      .search_parameters({ sender_id })
      .search_parameters({ recipient_id })
      .search_parameters({ message })
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
      .search_parameters({ sender_id })
      .search_parameters({ recipient_id })
      .search_parameters({ read })
      .search_parameters({ message })
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
      .search_parameters({ sender_id })
      .search_parameters({ recipient_id })
      .search_parameters({ read })
      .search_parameters({ message })
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
      .search_parameters({ username })
      .search_parameters({ password });
    const users = await user_rs.all();
    assert.strictEqual(users.length, 0, "Got no results");
  });

  it("get a result when we set conflicting parameters and then blank one", async () => {
    const username = "annie";
    const password = "123";

    const user_rs = schema
      .rs("user")
      .search_parameters({ username })
      .search_parameters({ password });
    const users = await user_rs.all();
    assert.strictEqual(users.length, 0, "Got no results");

    const new_user_rs = user_rs.search_parameters({ password: undefined });
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
});
