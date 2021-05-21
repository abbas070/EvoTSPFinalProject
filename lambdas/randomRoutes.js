const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const randomBytes = require('crypto').randomBytes;
exports.handler = (event, context, callback) => {
    const requestBody = JSON.parse(event.body);
    const runId = requestBody.runId;
    getDistanceInfo().then(dbResults => {
        const { distances, cities } = dbResults.Item;
        const routes = cities.map(cities => cities.index);
        const routeId = toUrlString(randomBytes(16));
        shuffle(routes);
        const len = calcLength(routes, distances);
        const partitionKey = runId + '#' + requestBody.generation;
        addRoutes(partitionKey, routeId, routes, len)
            .then(() => {
                callback(null, {
                    statusCode: 201,
                    body: JSON.stringify({ routeId: routeId, length: len }),
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            })
            .catch(err => {
                errorResponse(err.message, context.awsRequestId, callback);
            });
    }).catch(err => {
        errorResponse(err.message, context.awsRequestId, callback);
    });
};
function getDistanceInfo() {
    return ddb.get({
        TableName: 'distance_data',
        Key: { region: 'Minnesota' }
    }).promise();
}
//Reference https://javascript.info/task/shuffle
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
function calcLength(routes, distance) {
    let distances = 0;
    for (let i = 0; i < routes.length - 1; i++) {
        const now = routes[i];
        const next= routes[i + 1];
        distances= distances+ distance[now][next];
    }
    distances += distance[routes.length - 1][0]
    return distances;
}
function addRoutes(partitionKey, routeId, route, length) {
    return ddb.put({
        TableName: 'routes',
        Item: {
            runGen: partitionKey,
            routeId: routeId,
            route: route,
            len: length
        },
    }).promise();
}
function toUrlString(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
function errorResponse(errorMessage, awsRequestId, callback) {
    callback(null, {
        statusCode: 500,
        body: JSON.stringify({
            Error: errorMessage,
            Reference: awsRequestId,
        }),
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    });
}
