# JAORM - Just Another Object Relational Mapper

JAORM is an introspecting ORM tool for Node.js. It can use any database supported by its engine (currently knex, with future plans to make them swappable). JAORM requires no setup or extra code in its simplest case, but is easily extensible through subclassing to do whatever you might need it to do. Let's dive in!

## Quick start

### Setup

```
const Jaorm = require('jaorm');

// Standard Knex.js configuration block
const database_config = {
  client: "pg",
  connection:: {
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

```
// Fetch everything from a table
const users = await jaorm.rs('users').all();
```

```
// Adding a parameter to search for
const active_users = await jaorm.rs('users').where({ active: true }).all();
```

```
// Building a more complicated query before executing
const check_for_root_user = await jaorm.rs('users').where({ active: true }).where({ email: 'root@localhost' }).first();
```

```
// Reusing resultsets at multiple points in the chain
const unread_messages = await jaorm.rs('messages').where({ read: false });

const unread_msgs_from_bob = await unread_messages.where({ recipient_id: 1, sender_id: 3 }).all();
const unread_msgs_from_me = await unread_messages.where({ sender_id: 1 }).all();
const number_of_unreads_in_system = await unread_messages.count();
```

```
// Override a search parameter without modifying the original resultset object
const active_user_rs = jaorm.rs('users').where({ active: true });

const inactive_users = await active_user_rs.where({ active: false }).all();
const active_users = await active_user_rs.all();
```

### Using relations

```
// Get a simple one to one relation
const user = await jaorm.rs('users').with([ 'user_pref' ]).where({ username: 'bob' }).first();
const theme = user.user_pref().theme();
```

```
// Get a list of users, with their roles
const users_with_roles = await jaorm.rs('users').with(['user_role:role']).all();
const usernames_and_roles = users_with_roles.map(u => { return { username: u.username(), role: u.role().name() }});
```

```
// Named relations don't have to be table names (see the test library/data for how this maps)
const user_with_messages = await jaorm.rs('users').with([ 'sent_messages' ]).all();
```

### Creating new rows

```
// Insert a new row and get a Result object back
const new_user = await jaorm.rs('user').create({ username: 'bob', role: 'project manager' });
console.log(new_user.username()); // prints 'bob'
```

```
// Create a row that's just like another, plus any changes passed in
const bob = await jaorm.rs('user').where({ username: bob }).first();
const sue = await bob.clone({ username: 'sue', role: 'director' });
```

### Updating existing data

```
// Update the Result object in place and apply it
let bob = await jaorm.rs('user').where({ username: 'bob' }).first();
bob.role('senior project manager');
bob = await bob.update(); // replace it with a new copy
```

```
// Update lots of things at once
const promoted = await jaorm.rs('user').where({ role: 'intern' }).update_all({ role: 'senior intern' });
```

### Deleting rows

```
// Remove one row
const bob = await jaorm.rs('user').where({ username: 'bob' }).first();
await bob.destroy(); // "delete" is a reserved word, so we use destroy
```

```
// Remove a lot of rows
await jaorm.rs('user').where({ status: 'banned' }).destroy_all();
```
