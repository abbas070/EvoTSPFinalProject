const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
exports.handler = (event, context, callback) => {
  const queryStringParameters = event.queryStringParameters;
  const runId = queryStringParameters.runId;
  const generation = queryStringParameters.generation;
  const numToReturn = queryStringParameters.numToReturn;
  getBestRoutes(runId, generation, numToReturn)
    .then(dbResults => {
      const bestRoutes = dbResults.Items;
      console.log(bestRoutes);
      callback(null, {
        statusCode: 201,
        body: JSON.stringify(bestRoutes),
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    })
    .catch(err => {
      console.error(err);
      errorResponse(err.message, context.awsRequestId, callback);
    });
};
function getBestRoutes(runId, generation, numToReturn) {
  const runGen = runId + "#" + generation;
  return ddb.query({
    TableName: 'routes',
    IndexName: 'index',
    ProjectionExpression: "routeId, len",
    KeyConditionExpression: "runGen = :runGen",
    ExpressionAttributeValues: {
      ":runGen": runGen,
    },
    Limit: numToReturn
  }).promise();
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
