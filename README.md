# JAORM - Just Another Object Relational Mapper

JAORM is an introspecting ORM tool for Node.js. It can use any database supported by its engine (currently knex, with future plans to make them swappable). JAORM requires no setup or extra code in its simplest case, but is easily extensible through subclassing to do whatever you might need it to do. Let's dive in!

## Quick start

### Setup

```javascript
const Jaorm = require('jaorm');

// Standard Knex.js configuration block
const database_config = {
  client: "pg",
  connection: {
      host: "127.0.0.1",
      user: "jaorm",
      password: "jaorm",
      database: "jaorm"
  }
};

const jaorm = new Jaorm(database_config);
await jaorm.initialize();
```

### Simple queries

```javascript
// Fetch everything from a table
const users = await jaorm.rs('users').all();
```

```javascript
// Adding a parameter to search for
const active_users = await jaorm.rs('users').where({ active: true }).all();
```

```javascript
// Building a more complicated query before executing
const check_for_root_user =
    await jaorm.rs('users')
      .where({ active: true })
      .where({ email: 'root@localhost' })
      .first();
```

```javascript
// Getting the first result from a query
const user =
  await jaorm.rs('users')
  .where({ username: 'bob' })
  .first();
```

```javascript
// Running a query where you expect exactly one result
const user =
  await jaorm.rs('users')
  .where({ username: 'bob' })
  .only_one(); // throws an exception if the result count is not exactly 1
```

```javascript
// Running a query where you expect either exactly one result, or nothing
const user =
  await jaorm.rs('users')
  .where({ username: 'bob' })
  .one(); // throws an exception if the result count is > 1; null if no results
```

```javascript
// Running a query where you expect exactly zero results
const user =
  await jaorm.rs('users')
  .where({ username: 'mr_bigglesworth' })
  .none(); // throws an exception if the result count is > 0, null if 0
```

```javascript
// Reusing resultsets at multiple points in the chain
const unread_messages =
  await jaorm.rs('messages')
    .where({ read: false });

const unread_msgs_from_bob =
  await unread_messages
    .where({ recipient_id: 1, sender_id: 3 })
    .all();
const unread_msgs_from_me =
  await unread_messages
    .where({ sender_id: 1 })
    .all();
const number_of_unreads_in_system =
  await unread_messages.count();
```

```javascript
// Override a search parameter without modifying the original
// resultset object
const active_user_rs =
  jaorm.rs('users')
    .where({ active: true });

const inactive_users =
  await active_user_rs
    .where({ active: false })
    .all();
const active_users = await active_user_rs.all();
```

### Slightly more complex queries

```javascript
// Use SQL LIKE
const users = await jaorm.rs("user")
  .where({ password: { like: "1234%" } }).all();
```

```javascript
// greater than
const users = await jaorm.rs("user").where({ id: { ">" : 4 } }).all();
```

```javascript
// greater than or equal to
const users = await jaorm.rs("user").where({ id: { ">=": 3 } }).all();
```

```javascript
// less than
const users = await jaorm.rs("user").where({ id: { "<": 2 } }).all();
```

```javascript
// less than or equal to
const users = await jaorm.rs("user").where({ id: { "<=": 4 } }).all();
```

```javascript
// is not equal
const users = await jaorm.rs("user").where({ id: { "!=": 3 } }).all();
```

```javascript
// in
const users = await jaorm.rs("user").where({ id: { in: [ 3, 5, 13 ] } }).all();
```

```javascript
// not in
const users = await jaorm.rs("user")
  .where({ password: { "not in": [ 1, 43 ]} }).all();
```

### Using relations

```javascript
// Get a simple one to one relation
const user =
  await jaorm.rs('users')
  .with([ 'user_pref' ])
  .where({ username: 'bob' })
  .first();
const theme = user.user_pref().theme();
```

```javascript
// Get a list of users, with their roles
const users_with_roles =
  await jaorm.rs('users')
    .with(['user_role:role'])
    .all();
const usernames_and_roles =
  users_with_roles.map(u => {
    return { username: u.username(), role: u.role().name() }
  });
```

```javascript
// Named relations don't have to be table names.
// (see the test library/data for how this maps)
const user_with_messages =
  await jaorm.rs('users')
    .with([ 'sent_messages' ])
    .all();
```

### Creating new rows

```javascript
// Insert a new row and get a Result object back
const new_user =
  await jaorm.rs('user')
    .create({ username: 'bob', role: 'project manager' });
console.log(new_user.username()); // prints 'bob'
```

```javascript
// Create a row that's just like another, plus any changes passed in
const bob = await jaorm.rs('user').where({ username: bob }).first();
const sue = await bob.clone({ username: 'sue', role: 'director' });
```

### Updating existing data

```javascript
// Update a Result object's value and replace it with a new copy
let bob = await jaorm.rs('user').where({ username: 'bob' }).first();
bob = await bob.role('senior project manager');
```

```javascript
// Update several of a Result object's values and replace it with a new copy
let bob = await jaorm.rs('user').where({ username: 'bob' }).first();
bob = await bob.update({ role: 'senior project manager', password: "qwerty" });
```

```javascript
// Update lots of things at once
const promoted =
  await jaorm.rs('user')
    .where({ role: 'intern' })
    .update_all({ role: 'senior intern' });
```

### Deleting rows

```javascript
// Remove one row
const bob = await jaorm.rs('user').where({ username: 'bob' }).first();
await bob.destroy(); // "delete" is a reserved word, so we use destroy
```

```javascript
// Remove a lot of rows
await jaorm.rs('user').where({ status: 'banned' }).destroy_all();
```

### Raw SQL
```javascript
// Note: this won't give you proper Result objects, but sometimes worth it
const res = await jaorm.raw("SELECT * FROM users");
```

```javascript
// This WILL give you proper result objects, but is limited to the WHERE clause
// The key of the hash is ignored.
const first_user = await jaorm.rs("user")
  .where({ _: { raw: "id = 1" }})
  .first();
```

&copy; 2020 Infinity Interactive
