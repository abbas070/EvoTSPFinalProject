const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
exports.handler = (event, context, callback) => {
    getCityData()
        .then(dbResults => {
            callback(null, {
                statusCode: 201,
                body: JSON.stringify(dbResults.Item.cities),
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            });
        })
        .catch(err => {
            console.log(`Problem getting information from "city-data"`);
            console.error(err);
            errorResponse(err.message, context.awsRequestId, callback);
        });
}
function getCityData() {
    return ddb.get({
        TableName: 'distance_data',
        Key: { region: 'Minnesota' },
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
