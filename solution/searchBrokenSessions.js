import * as redis from 'redis';
import config from './config.js';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

await searchBrokenSessions();

async function searchBrokenSessions()
{
    const brokenSessions = await requestRedisBrokenSessions();

    console.log(`Broken sessions (${brokenSessions.length}): ${JSON.stringify(brokenSessions)}`);
}

async function requestRedisBrokenSessions()
{
    const redisClient = await redis.createClient(Object.assign(config, {
        scripts: {
            scanBrokenSessions: redis.defineScript({
                NUMBER_OF_KEYS: 1,
                SCRIPT: await readFile('solution/scanBrokenSessions.lua'),
                transformArguments: key => [key],
            }),
        },
    })).connect();

    console.time('request time');

    const brokenSessions = await requestClientBrokenSessions(redisClient);

    console.timeEnd('request time');

    await redisClient.quit();

    return brokenSessions;
}

async function requestClientBrokenSessions(client)
{
    const TOTAL_LIMIT = Infinity;       // set if needed for testing
    const DELAY_BETWEEN_SCANS = 50;     // milliseconds, to not overload redis-server

    let totalScannedSessionsCount = 0;
    let totalBrokenSessions = [];

    for await (const [brokenSessions, scannedSessionsCount] of scanBrokenSessionsGenerator(client))
    {
        totalBrokenSessions = totalBrokenSessions.concat(brokenSessions);

        totalScannedSessionsCount += scannedSessionsCount;

        console.log(`total scanned sessions count: ${totalScannedSessionsCount}, total broken sessions count: ${totalBrokenSessions.length}`);

        if (totalScannedSessionsCount >= TOTAL_LIMIT) break;

        await delay(DELAY_BETWEEN_SCANS);
    }

    return totalBrokenSessions;
}

async function* scanBrokenSessionsGenerator(client)
{
    let cursor = '0';

    do {
        const [newCursor, result] = await client.scanBrokenSessions(cursor);

        cursor = newCursor;

        yield result;
    }
    while (cursor !== '0');
}
