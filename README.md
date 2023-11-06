## Search in redis values server-side with a special lua-script

In the article proposed an approach to a maintenance task of searching in large amount of values stored in Redis.
A real use-case of applying the approach is described. A working example of code for Node.js is provided.
In the repository you can find full source code of the solution.

Andrey Bobkov, 2023, [https://github.com/a-bobkov](https://github.com/a-bobkov)

This is a published page of the [GitHub public Repository Redis-Search-Values-Demo](https://github.com/a-bobkov/redis-search-values-demo).

### 🙋  Context

Imagine, that you maintain a relatively big internet shop, working 24/7 and having many customers. There are about 37 millions shopping carts saved as PHP-session data. Everything was fine, but one day you discover a bug in the code of the shop. Due to that bug some sessions contain inconsistent data. How many? Good question... Anyway you don't want just to delete all existing sessions, because in that case all guest customers of the shop would be disappointed by the fact, that their shopping carts just disappeared.

So you have a question, what sessions are broken. It is not so easy to answer, because there are 37 million of sessions, taking more than 20 gigabytes and all the sessions are stored in Redis 6. You know, that Redis is a very popular key-value storage, it is very fast and reliable, but provides poor functionality to investigate stored values. In Redis you can not simply query data with a filter by stored values.

### 📍  Goal

So here we have a task of investigation of large amount of values stored in Redis. This is an important but not so simple real life maintenance task.

Furthermore, in the real life we always have limits. The main limit for the task is to not block the shop in any case - shop should serve customers 24/7. Another limit is that we expect to find the broken sessions in a reasonable time, preferably in an hour, because we care about our customers and don't want them to suffer many days while we are solving the problem.

Let's see, how we can do it!

### 🌱  Approach

In order to not block the shop by a long query, we can use a special SCAN command of Redis (see [Redis SCAN](https://redis.io/commands/scan/)). This command gives the possibility to search keys chunk by chunk, not blocking the server for a long time. That is a good thing, but not enough, because the command itself can not filter data by value, but only by key. Since we want the search to be finished in a reasonable time, we don't want to download from server all the data found by SCAN and filter them client-side. Also, we don't want to install any additional Redis modules or create secondary indices.

We decide to use programmability of Redis (see [Redis programmability](https://redis.io/docs/interact/programmability/)), making sort of a wrapper around the SCAN command. We will scan Redis-entries server-side, filtering the data by value on server with a special Lua-script (see [Redis Lua API reference](https://redis.io/docs/interact/programmability/lua-api/)), returning to the client only needed data of the broken sessions.

Let's implement it!

### 🌳  Solution

The implemented solution consists of:

 🟡  NodeJS-script [searchBrokenSessions.js](https://github.com/a-bobkov/redis-search-values-demo/blob/main/solution/searchBrokenSessions.js), that can be run locally;

 🔵  Lua-script [scanBrokenSessions.lua](https://github.com/a-bobkov/redis-search-values-demo/blob/main/solution/scanBrokenSessions.lua), that is instantiated on the Redis-server.

The NodeJS-script connects to a Redis-server, instantiates the Lua-script on it and runs the Lua-script continually until all sessions are scanned.  
The Lua-script scans sessions and analyses them, if a session broken or not, returning to the client only needed data of the broken sessions.

By the way, the NodeJS-script is an example of creating and using a JavaScript async generator.

### 🍊  Result

The solution with SCAN parameter `COUNT 5000` has scanned 37 million of sessions on a live remote server in 22 minutes and has found 604 broken sessions.

### 🔍  Example run

- clone the repository:
```shell
git clone https://github.com/a-bobkov/redis-search-values-demo.git
```

- install dependencies:
```shell
cd redis-search-values-demo && npm i
```

- run a local instance of Redis-server:
```shell
docker run -d -p 26379:6379 --name redis-search-values-demo-server redis:6.2.14-alpine
```

- create an example set of data in the Redis-database:
```shell
node solution/initRedisDatabase.js
```

- run the demo-script:
```shell
node solution/searchBrokenSessions.js
```

- see the example output:
```shell
$ node solution/searchBrokenSessions.js
total scanned sessions count: 100, total broken sessions count: 1
total scanned sessions count: 200, total broken sessions count: 1
total scanned sessions count: 300, total broken sessions count: 3
total scanned sessions count: 403, total broken sessions count: 4
total scanned sessions count: 503, total broken sessions count: 5
total scanned sessions count: 505, total broken sessions count: 5
request time: 349.041ms
Broken sessions (5): [["session:id_broken_2","2"],["session:id_broken_4","4"],["session:id_broken_1","1"],["session:id_broken_3","3"],["session:id_broken_0","0"]]
$
```

- remove the local instance of the Redis-server
```shell
docker rm --force redis-search-values-demo-server
```

- remove the repository
```shell
cd .. && rm -rf redis-search-values-demo
```

### 🍻  Feedback

To keep my motivation high, you may

[<img src="https://a-bobkov.github.io/coffee.png" width="250"/>](https://www.paypal.com/donate/?hosted_button_id=MYA8VXRL7Q4ZE)

⭐ the [GitHub public repository Redis-Search-Values-Demo](https://github.com/a-bobkov/redis-search-values-demo)

Your verbal opinion is appreciated via [Discussions](https://github.com/a-bobkov/redis-search-values-demo/discussions) and [Issues](https://github.com/a-bobkov/redis-search-values-demo/issues)

### 📒  Other investigations

If you are interested to see the list of my published investigations, you may find it here: [https://a-bobkov.github.io/](//a-bobkov.github.io/)
