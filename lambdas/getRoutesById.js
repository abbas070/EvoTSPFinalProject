const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
exports.handler = (event, context, callback) => {
  const iRouteId = event.pathParameters.routeId;
  
  getRouteById(iRouteId)
    .then(dbResults => {
      callback(null, {
        statusCode: 201,
        body: JSON.stringify(dbResults.Item),
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    })
    .catch(err => {
      console.error(err);
      errorResponse(err.message, context.awsRequestId, callback);
    });
}
function getRouteById(iRouteId) {
  return ddb.get({
    TableName: 'routes',
    Key: {"routeId": iRouteId},
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
