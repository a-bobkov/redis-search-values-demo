import * as redis from 'redis';
import config from './config.js';

await initRedisDatabase();

async function initRedisDatabase()
{
    const redisClient = await redis.createClient(config).connect();

    await redisClient.flushDb();

    await setInitialEntries(redisClient);

    await redisClient.quit();
}

async function setInitialEntries(client)
{
    const validEntries = Array.from(Array(500), (value, idx) =>
        [`session:id_valid_${idx}`, `s:11:"id_customer";i:${idx};s:8:"id_quote";i:${idx};`]
    );

    await client.mSet(Object.fromEntries(validEntries));

    const brokenEntries = Array.from(Array(5), (value, idx) =>
        [`session:id_broken_${idx}`, `s:11:"id_customer";i:${idx};`]
    );

    await client.mSet(Object.fromEntries(brokenEntries));
}
