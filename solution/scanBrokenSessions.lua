--[[
    scan keys, get values and filter by values

    parameter:
        KEYS[1] - cursor for SCAN

    return:
        cursor for next SCAN
        array of broken sessions - session key, customer id
        number of scanned sessions
 ]]--

local brokenSessions = {}

local cursor = KEYS[1];

local scanResult = redis.call('SCAN', cursor, 'MATCH', 'session:*', 'COUNT', 100);

local newCursor, sessionKeys = unpack(scanResult);

if #sessionKeys > 0
then
    local sessionValues = redis.call('MGET', unpack(sessionKeys))

    for i, sessionKey in ipairs(sessionKeys)
    do
        local sessionValue = sessionValues[i];

        local _, _, customerId = string.find(sessionValue, 's:11:"id_customer";i:(%d+);')
        local _, _, quoteId = string.find(sessionValue, 's:8:"id_quote";i:(%d+);')

        if customerId and not quoteId
        then
            table.insert(brokenSessions, {sessionKey, customerId})
        end
    end
end

return {newCursor, {
    brokenSessions,
    #sessionKeys
}};
