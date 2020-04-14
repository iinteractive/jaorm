const Schema = require("../../lib/schema");

describe("Test the baseline schema object by making sure that", function test_schema_primary_keys() {
  const { assert, fixtures, test_db_config, schema_options } = this;
  let schema = null;

  before("Instantiate the base object", async () => {
    schema = new Schema(test_db_config, schema_options);
    await schema.initialize();
  });

  it("we get the correct primary key info ", async () => {
    const pks = schema.list_pks();
    assert.strictEqual(
      Object.keys(pks).length,
      5,
      "Four tables have primary keys"
    );

    assert.strictEqual(pks.user[0], "id", "Got the PK for the user table");
    assert.strictEqual(
      pks.user.length,
      1,
      "Got the right number of PKs for the user table"
    );

    assert.strictEqual(pks.role[0], "id", "Got the PK for the role table");
    assert.strictEqual(
      pks.role.length,
      1,
      "Got the right number of PKs for the role table"
    );

    assert.strictEqual(pks.meta[0], "key", "Got the PK for the meta table");
    assert.strictEqual(
      pks.user.length,
      1,
      "Got the right number of PKs for the meta table"
    );

    assert.strictEqual(
      pks.message[0],
      "uuid",
      "Got the PK for the message table"
    );
    assert.strictEqual(
      pks.message.length,
      1,
      "Got the right number of PKs for the message table"
    );

    assert.notStrictEqual(
      pks.friend_list.indexOf("friend_id"),
      -1,
      "The friend_list table has friend_id as part of the composite PK"
    );
    assert.notStrictEqual(
      pks.friend_list.indexOf("user_id"),
      -1,
      "The friend_list table has friend_id as part of the composite PK"
    );
    assert.strictEqual(
      pks.friend_list.length,
      2,
      "Got the right number of PKs for the friend_list table"
    );
  });
});
