# [Programming for Cloud Computing]: EvoTSP Final Project

- [Overview: Purpose](#purpose)
- [Overview: Solution](#solution)
- [Instructions](#instructions)
- [Technical Details](#technicaldetails)
    - [API details:](#apidetails)
        - [/best](#best)
        - [/city-data](#citydata)
        - [/mutateroute](#mutateroute)
        - [/routes](#routes)
        - [/{routeId}](#routeid)
    - [Lambdas](#lambdas)
        - [getBestRoutes()](#getbestroutes)
        - [getRoutesById()](#getroutesbyid)
        - [randomRoutes()](#randomroutes)
        - [mutateRoutes()](#mutateroutes)
        - [getCityData()](#getcitydata)
    - [IAM Roles](#iamroles)
    - [DynamoDB Table Structures:](#tables)
        - [distance_data](#distancedata)
        - [routes](#routes)
- [Leaflet](#leaflet)
- [Appendix](#appendix)
    - [Lambda functions](#lambdas)
        - [getBestRoutes()](#getbestroutes())
        - [getRoutesById()](#getroutesbyid())
        - [randomRoutes()](#randomroutes())
        - [mutateRoutes()](#mutateroutes())
        - [getCityData()](#getcitydata())
    - [Application components:](#application)
        - [Javascript](#javascript)
        - [HTML](#html)


<h1 id="purpose">Overview: Purpose </h1>

In general, the `Travelling Salesman Problem`, or TSP, asks to find the shortest possible route that visits n number of cities exactly once and returns to the starting point. The
purpose of the problem is to find the shortest possible route to minimize the distance traveled. It is a classic optimization problem within the field of operational research, but which also has many possible implications in computer science.

The following application is meant to solve Travelling Salesman Problem using
evolutionary computations. As for key components of this project, we were using
Amazon Web Services infrastructure and features, including Lambdas.

<h1 id="solution">Overview: Solution </h1>

At the very beginning, the application creates a starter population. The general solution
would be to choose a first location as the starting and ending points, create
permutations of other locations, and then return the shortest permutation. Before an
application starts computations, a user may select a specific population size. One of the
Lambdas in AWS, getBestRoutes(), helps us to find the best routes of the initial
population, which serve as “parents.” Another Lambda, mutateRoutes(), creates
children of parent’s routes to find a new best route. Through repeating this process, the
best route gets selected and then is displayed on the map.

<h1 id="instructions">Instructions on how to use:</h1>

By default, our application already has some of the necessary variables, with which a
user may start evolving routes and creating a map. One of the default variables is the
population size which is 100 and refers to the initial population. Another default variable
is noted as “number of parents to keep” that is initially 20. The last default variable of
also 20, is “how many generations to run?”and limits our preferred number generations.
A user may press the “Run evolution” button to start map generating best routes. Once
the best route is selected, a pop up message will appear, together with a final route
shown on the map, and specific details at the bottom of the web application. For
illustration, please refer to the videos below.

![Alt Text](https://media.giphy.com/media/7DXkUpjx1ehSVx00M6/giphy.gif)

Continuation:

![Alt Text](https://media.giphy.com/media/dQfASsna48eAGLYN6N/giphy.gif)

<h1 id="technicaldetails">Technical details:</h1>

## API details:

<IMG id="myImage" src="img/api.PNG">

### **`/best`**

Best resource contains the GET method, is connected to getBestRoutes() lambda
function, and will return the number of shortest routes.

### **`/city-data`**

City-data resource also takes the GET request and is connected to the getCityData()
lambda function. This delivers city data for the preferred location, which in our case is
the state of Minnesota.

### **`/mutateroute`**

Mutateroute resource contains the POST method and connects us to the main part of
the application, the mutateRoutes() lambda.

### **`/routes`**
Routes resource includes the GET method and establishes a connection between our
API Gateway and the randomRoutes() lambda function.

### **`/{routeId}`**
RouteId is a sub-resource that goes under /routes resource, has a GET method, and
will return a route ID

## Lambdas:

<IMG id="myImage" src="img/awslambda.png" >


There were used five AWS Lambdas for this project:

### **`getBestRoutes()`**

Takes GET method and outputs the number of shortest routes. In general, it generate K
best values using a query with “#” marker to create the partition key for the query.

### **`getRoutesById`**

This lambda takes the requested routeId path and matches it with routeId from “routes”
DynamoDB table. It also returns other information relevant to the database, including
distance, route, and ID.

### **`randomRoutes()`**

The purpose of randomRoutes() lambda is to generate random routes that are taken
from the “distance_table” DynamoDB table (Minnesota JSON) and calculate the
distance of those routes.

### **`mutateRoutes()`**

This lambda is the main part of the project and consists of many functions, which as a
result generate new child routes by mutating existing parent routes. It takes a parent
route specified by a routeId and generates several child routes. An overview of this
lambda is to extract routeId and numChildren using a POST request from the body, get
the city-distance data, receive details of the route with the given routeId, record them to
database, and return children. The shortest route will be at the beginning of an array
because they are sorted by length.

### **`getCityData()`**

getCityData() responds to GET requests and returns the cities component of the
city-distance data object from the “Minnesota” region. The outputs will be
necessary to illustrate routes on the map.

<h1 id="iamroles">IAM roles: </h1>

<IMG id="myImage" src="img/awsiam.png" >


With IAM roles, we are able to give permission for AWS to access our lambda functions.
For this project, we have used EvoTSPLambda role 2 write and 2 read permissions
within access of DynamoDB tables and indexes.

<h1 id="tables">DynamnoDB Table Structures: </h1>

### **`distance_data`**

This table includes the region(String) as a partition key (no secondary index or sorting)
that holds the state name, cities that hold information on city objects such as
coordinates, and distances that hold information about length between cities.

### **`routes`**

Routes table include the routeId(String) as a partition key, with an index that has
runGen(String) as a secondary index, and len(Number) as sorting. Because routeId is
presumably unique for every route, we want to efficiently access elements in the
database, and thus we are using length to get the best routes with the shortest length.

<h1 id="leaflet">Leaflet </h1>

`Leaflet` is a JavaScript library for interactive maps that allows us to illustrate our desired
maps. For this project, we have used mapBox as a tile provider, and the purpose of
leaflet was to illustrate performing and final routes on the map while computations are
running.

<h1 id="appendix">Appendix </h1>

<h2 id="lambdas">Lambda functions: </h2>

<h3 id="getBestRoutes()"> - getBestRoutes() </h3>


```js
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
```

<h3 id="getroutesbyid()">- getRoutesById() </h3>

```js
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

```

<h3 id="randomroutes()">- randomRoutes() </h3>

```js
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

```

<h3 id="mutateroutes()">- mutateRoutes() </h3>

```js
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const randomBytes = require('crypto').randomBytes;

/*
 * Parts of this are already in working order, and
 * other parts (marked by "FILL THIS IN") need to be
 * done by you.
 *
 * For reference, here's a list of all the functions that
 * you need to complete:
 * - `getDistanceData()`
 * - `getRouteById()`
 * - `generateChildren()`
 * - `addOneToGen()`
 * - `recordChildren()`
 * - `returnChildren`
 * - `computeDistance`
 */

// This will be called in response to a POST request.
// The routeId of the "parent" route will be
// provided in the body, along with the number
// of "children" (mutations) to make.
// Each child will be entered into the database,
// and we'll return an array of JSON objects
// that contain the "child" IDs and the length
// of those routes. To reduce computation on the
// client end, we'll also sort these by length,
// so the "shortest" route will be at the front
// of the return array.
//
// Since all we'll get is the routeId, we'll need
// to first get the full details of the route from
// the DB. This will include the generation, and
// we'll need to add one to that to create the
// generation of all the children.
exports.handler = (event, context, callback) => {
    const requestBody = JSON.parse(event.body);
    const routeId = requestBody.routeId;
    const numChildren = requestBody.numChildren;
    let lengthStoreThreshold = requestBody.lengthStoreThreshold;
    if (lengthStoreThreshold == null) {
        lengthStoreThreshold = Infinity;
    }

    // Batch writes in DynamoDB are restricted to at most 25 writes.
    // Because of that, I'm limiting this Lambda to only only handle
    // at most 25 mutations so that I can write them all to the DB
    // in a single batch write.
    //
    // If that irks you, you could create a function that creates
    // and stores a batch of at most 25, and then call it multiple
    // times to create the requested number of children.
    if (numChildren > 25) {
        errorResponse("You can't generate more than 25 mutations at a time", context.awsRequestId, callback);
        return;
    }

    // Promise.all makes these two requests in parallel, and only returns
    // it's promise when both of them are complete. That is then sent
    // into a `.then()` chain that passes the results of each previous
    // step as the argument to the next step.
    Promise.all([getDistanceData(), getRouteById(routeId)])
        .then(([distanceData, parentRoute]) => generateChildren(distanceData.Item, parentRoute.Item, numChildren))
        .then(children => recordChildren(children, lengthStoreThreshold))
        .then(children => returnChildren(callback, children))
        .catch(err => {
            console.log("Problem mutating given parent route");
            console.error(err);
            errorResponse(err.message, context.awsRequestId, callback);
        });
};

// Get the city-distance object for the region 'Minnesota'.
function getDistanceData() {
    return ddb.get({
        TableName: 'distance_data',
        Key: { region: 'Minnesota' }
    }).promise();
}

// Get the full info for the route with the given ID.
function getRouteById(routeId) {
    return ddb.get({
        TableName: 'routes',
        Key: {
            "routeId": routeId
        },
    }).promise();
}

// Generate an array of new routes, each of which is a mutation
// of the given `parentRoute`. You essentially need to call
// `generateChild` repeatedly (`numChildren` times) and return
// the array of the resulting children. `generateChild` does
// most of the heavy lifting here, and this function should
// be quite short.
function generateChildren(distanceData, parentRoute, numChildren) {
    let children = [];

    for (let i = 0; i < numChildren; i++){
        children.push(generateChild(distanceData, parentRoute));
    }
    return children;
}

// This is complete and you shouldn't need to change it. You
// will need to implement `computeDistance()` and `addOneToGen()`
// to get it to work, though.
function generateChild(distanceData, parentRoute) {
    const oldPath = parentRoute.route;
    const numCities = oldPath.length;
    // These are a pair of random indices into the path s.t.
    // 0<=i<j<=N and j-i>2. The second condition ensures that the
    // length of the "middle section" has length at least 2, so that
    // reversing it actually changes the route.
    const [i, j] = genSwapPoints(numCities);
    // The new "mutated" path is the old path with the "middle section"
    // (`slice(i, j)`) reversed. This implements a very simple TSP mutation
    // technique known as 2-opt (https://en.wikipedia.org/wiki/2-opt).
    const newPath =
        oldPath.slice(0, i)
            .concat(oldPath.slice(i, j).reverse(),
                oldPath.slice(j));
    const len = computeDistance(distanceData.distances, newPath);
    const child = {
        routeId: newId(),
        runGen: addOneToGen(parentRoute.runGen),
        route: newPath,
        len: len,
    };
    return child;
}

// Generate a pair of random indices into the path s.t.
// 0<=i<j<=N and j-i>2. The second condition ensures that the
// length of the "middle section" has length at least 2, so that
// reversing it actually changes the route.
function genSwapPoints(numCities) {
    let i = 0;
    let j = 0;
    while (j-i < 2) {
        i = Math.floor(Math.random() * numCities);
        j = Math.floor(Math.random() * (numCities+1));
    }
    return [i, j];
}

// Take a runId-generation string (`oldRunGen`) and
// return a new runId-generation string
// that has the generation component incremented by
// one. If, for example, we are given 'XYZ#17', we
// should return 'XYZ#18'.
function addOneToGen(oldRunGen) {
    
    const runId = oldRunGen.substring(0, oldRunGen.indexOf("#"));
    const genStr = oldRunGen.substring(oldRunGen.indexOf("#") + 1, oldRunGen.length);
    
    const inc =  Number(genStr) + 1;
    return runId + '#' + inc;
}

// Write all the children whose length
// is less than `lengthStoreThreshold` to the database. We only
// write new routes that are shorter than the threshold as a
// way of reducing the write load on the database, which makes
// it (much) less likely that we'll have writes fail because we've
// exceeded our default (free) provisioning.
function recordChildren(children, lengthStoreThreshold) {
    
    const childrenToWrite
        = children.filter(child => child.len < lengthStoreThreshold);
    
     let child ={};
    child.RequestItems={};
    child.RequestItems.routes =[];
    
    for (let i = 0; i < childrenToWrite.length; i++){
    
        child.RequestItems['routes'].push({
            PutRequest: { Item: childrenToWrite[i] },
        });
    }
    
    ddb.batchWrite(child, function(err, data) {
        if (err) console.log(err);
        else console.log(data);
    });
    return childrenToWrite;
}

// Take the children that were good (short) enough to be written
// to the database.
//
//   * You should "simplify" each child, converting it to a new
//     JSON object that only contains the `routeId` and `len` fields.
//   * You should sort the simplified children by length, so the
//     shortest is at the front of the array.
//   * Use `callback` to "return" that array of children as the
//     the result of this Lambda call, with status code 201 and
//     the 'Access-Control-Allow-Origin' line.
function returnChildren(callback, children) {
    let shCh = [];
    let simCh = {};
    
    for (let i = 0; i < children.length; i++) {
        
        simCh.routeId = children[i].routeId;
        simCh.len = children[i].len;
        shCh.push(simCh);
    }
    shCh.sort((x, y) => { 
        return x.len - y.len 
        
    });
    callback(null, {
            statusCode: 201,
            body: JSON.stringify(shCh),
            headers: {
                'Access-Control-Allow-Origin': '*'
        }
    });
}

function computeDistance(distances, route) {
    let totalLength = 0;
    for (let i = 0; i < route.length; i++){
        if (i == route.length-1){
            totalLength = totalLength + distances[route[i]][route[0]];
        } else {
            totalLength = totalLength + distances[route[i]][route[i+1]];
        }
    } return totalLength;
}

function newId() {
    return toUrlString(randomBytes(16));
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
```

<h3 id="getcitydata()">- getCityData() </h3>

```js
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
```

<h2 id="application">Application components: </h2>

<h3 id="javascript">- Javascript </h3>

```js
(function evoTSPwrapper($) {
    const baseUrl =
      "https://zt4vy88ww7.execute-api.us-east-1.amazonaws.com/prod";
  
    /*
     * This is organized into sections:
     *  - Declaration of some global variables
     *  - The `runEvolution` function and helpers
     *  - The `runGeneration` function and helpers
     *  - The Ajax calls
     *  - The functions that update the HTML over time
     *  - The functions that keep track of the best route
     *  - The functions that initialize the map and plot the best route
     */
  
    // Will be populated by `populateCityData`
    var cityData;
  
    // No routes worse than this length will be stored in the
    // database or returned by methods that create new
    // routes.
    var lengthStoreThreshold = Infinity;
  
    // `best` stores what we know about the best route we've
    // seen so far. Here this is set to to "initial"
    // values, and then then these values are updated as better
    // routes are discovered.
    var best = {
      runID: "", // The ID of the best current path
      bestPath: [], // The array of indices of best current path
      len: Infinity, // The length of the best current path
      coords: [], // The coordinates of the best current path
      lRoute: [[], []], // best route as lat-long data
    };
  
    ////////////////////////////////////////////////////////////
    // BEGINNING OF RUN EVOLUTION //////////////////////////////////
    ////////////////////////////////////////////////////////////
  
    // This runs the evolutionary process.
    function runEvolution() {
      // Generate a new runId and set the current generation to 0
      const runId = generateUID(16);
      const initialGeneration = 0;
      $("#runId-text-field").val(runId);
      $("#current-generation").text(initialGeneration);
  
      // `async.series` takes an array of (asynchronous) functions, and
      // calls them one at a time, waiting until the promise generated by
      // one has been resolved before starting the next one. This is similar
      // to a big chain of f().then().then()... calls, but (I think) cleaner.
      //
      // cb in this (and down below in runGeneration) is short for "callback".
      // Each of the functions in the series takes a callback as its last
      // (sometimes only) argument. That needs to be either passed in to a
      // nested async tool (like `asyn.timesSeries` below) or called after
      // the other work is done (like the `cb()` call in the last function).
      async.series([
        initializePopulation, // create the initial population
        runAllGenerations,    // Run the specified number of generations
        showAllDoneAlert,     // Show an "All done" alert.
      ]);
  
      function initializePopulation(cb) {
        const populationSize = parseInt($("#population-size-text-field").val());
        console.log(
          `Initializing pop for runId = ${runId} with pop size ${populationSize}, generation = ${initialGeneration}`
        );
        $("#new-route-list").text("");
        async.times(
          populationSize,
          (counter, rr_cb) => randomRoute(runId, initialGeneration, rr_cb),
          cb
        );
      }
  
      function runAllGenerations(cb) {
        // get # of generations
        const numGenerations = parseInt($("#num-generations").val());
  
        // `async.timesSeries` runs the given function the specified number
        // of times. Unlike `async.times`, which does all the calls in
        // "parallel", `async.timesSeries` makes sure that each call is
        // done before the next call starts.
        async.timesSeries(
          numGenerations,
          runGeneration,
          cb
        );
      }
  
      function showAllDoneAlert(cb) {
        alert("All done! (but there could still be some GUI updates)");
        cb();
      }
  
      // Generate a unique ID; lifted from https://stackoverflow.com/a/63363662
      function generateUID(length) {
        return window
          .btoa(
            Array.from(window.crypto.getRandomValues(new Uint8Array(length * 2)))
              .map((b) => String.fromCharCode(b))
              .join("")
          )
          .replace(/[+/]/g, "")
          .substring(0, length);
      }
    }
  
    function randomRoute(runId, generation, cb) {
  
      $.ajax({
        method: 'POST',
        url: baseUrl + '/routes',
        data: JSON.stringify({
          runId: runId,
          generation: generation
        }),
        contentType: 'application/json',
  
        success: (aRoute) => cb(null, aRoute),
        error: function ajaxError(jqXHR, textStatus, errorThrown) {
          console.error(
            'Error: ',
            textStatus,
            ', Details: ',
            errorThrown);
          console.error('Response: ', jqXHR.responseText);
          alert('Error:\n' + jqXHR.responseText);
        }
      })
    }
  
    ////////////////////////////////////////////////////////////
    // END OF RUN EVOLUTION ////////////////////////////////////
    ////////////////////////////////////////////////////////////
  
    ////////////////////////////////////////////////////////////
    // BEGIN OF RUN GENERATION /////////////////////////////////
    ////////////////////////////////////////////////////////////
  
    // This runs a single generation, getting the best routes from the
    // specified generation, and using them to make a population of
    // new routes for the next generation via mutation.
    function runGeneration(generation, cb) {
      const popSize = parseInt($("#population-size-text-field").val());
      console.log(`Running generation ${generation}`);
  
      // `async.waterfall` is sorta like `async.series`, except here the value(s)
      // returned by one function in the array is passed on as the argument(s)
      // to the _next_ function in the array. This essentially "pipes" the functions
      // together, taking the output of one and making it the input of the next.
      //
      // The callbacks (cb) are key to this communication. Each function needs to
      // call `cb(…)` as it's way of saying "I'm done, and here are the values to
      // pass on to the next function". If one function returns three values,
      // like `cb(null, x, y, z)`, then those three values will be the arguments
      // to the next function in the sequence.
      //
      // The convention with these callbacks is that the _first_ argument is an
      // error if there is one, and the remaining arguments are the return values
      // if the function was successful. So `cb(err)` would return the error `err`,
      // while `cb(null, "This", "and", "that", 47)` says there's no error (the `null`
      // in the first argument) and that there are four values to return (three
      // strings and a number).
      //
      // Not everything here has value to pass on or wants a value. Several are
      // just there to insert print statements for logging/debugging purposes.
      // If they don't have any values to pass on, they just call `cb()`.
      //
      // `async.constant` lets us insert one or more specific values into the
      // pipeline, which then become the input(s) to the next item in the
      // waterfall. Here we'll inserting the current generation number so it will
      // be the argument to the next function.
      async.waterfall(
        [
          wait5seconds,
          updateGenerationHTMLcomponents,
          async.constant(generation), // Insert generation into the pipeline
          (gen, log_cb) => logValue("generation", gen, log_cb), // log generation
          getBestRoutes, // These will be passed on as the parents in the next steps
          (parents, log_cb) => logValue("parents", parents, log_cb), // log parents
          displayBestRoutes,    // display the parents on the web page
          updateThresholdLimit, // update the threshold limit to reduce DB writes
          generateChildren,
          (children, log_cb) => logValue("children", children, log_cb),
          displayChildren,      // display the children in the "Current generation" div
          updateBestRoute
        ],
        cb
      );
  
      // Log the given value with the specified label. To work in the
      // waterfall, this has to pass the value on to the next function, which we do with
      // `log_cb(null, value)` call at the end.
      function logValue(label, value, log_cb) {
        console.log(`In waterfall: ${label} = ${JSON.stringify(value)}`);
        log_cb(null, value);
      }
  
      // Wait 5 seconds before moving on. This is really just a hack to
      // help make sure that the DynamoDB table has reached eventual
      // consistency.
      function wait5seconds(wait_cb) {
        console.log(`Starting sleep at ${Date.now()}`);
        setTimeout(function () {
          console.log(`Done sleeping gen ${generation} at ${Date.now()}`);
          wait_cb(); // Call wait_cb() after the message to "move on" through the waterfall
        }, 5000);
      }
  
      // Reset a few of the page components that should "start over" at each
      // new generation.
      function updateGenerationHTMLcomponents(reset_cb) {
        $("#new-route-list").text("");
        $("#current-generation").text(generation + 1);
        reset_cb();
      }
  
      // Given an array of "parent" routes, generate `numChildren` mutations
      // of each parent route. `numChildren` is computed so that the total
      // number of children will be (roughly) the same as the requested
      // population size. If, for example, the population size is 100 and
      // the number of parents is 20, then `numChildren` will be 5.
      function generateChildren(parents, genChildren_cb) {
        const numChildren = Math.floor(popSize / parents.length);
        // `async.each` runs the provided function once (in "parallel") for
        // each of the values in the array of parents.
        async.concat( // each(
          parents,
          (parent, makeChildren_cb) => {
            makeChildren(parent, numChildren, generation, makeChildren_cb);
          },
          genChildren_cb
        );
      }
  
      // We keep track of the "best worst" route we've gotten back from the
      // database, and store its length in the "global" `lengthStoreThreshold`
      // declared up near the top. The idea is that if we've seen K routes at
      // least as good as this, we don't need to be writing _worse_ routes into
      // the database. This saves over half the DB writes, and doesn't seem to
      // hurt the performance of the EC search, at least for this simple problem. 
      function updateThresholdLimit(bestRoutes, utl_cb) {
        if (bestRoutes.length == 0) {
          const errorMessage = 'We got no best routes back. We probably overwhelmed the write capacity for the database.';
          alert(errorMessage);
          throw new Error(errorMessage);
        }
        // We can just take the last route as the "worst" because the
        // Lambda/DynamoDB combo gives us the routes in sorted order by
        // length.
        lengthStoreThreshold = bestRoutes[bestRoutes.length - 1].len;
        $("#current-threshold").text(lengthStoreThreshold);
        utl_cb(null, bestRoutes);
      }
    }
  
    ////////////////////////////////////////////////////////////
    // END OF RUN GENERATION ///////////////////////////////////
    ////////////////////////////////////////////////////////////
  
    ////////////////////////////////////////////////////////////
    // START OF AJAX CALLS /////////////////////////////////////
    ////////////////////////////////////////////////////////////
  
    // These are the various functions that will make Ajax HTTP
    // calls to your various Lambdas.
  
    // This should get the best routes in the specified generation,
    // which will be used (elsewhere) as parents. 
    //
    // MAKE SURE YOU USE 
    //
    //    (bestRoutes) => callback(null, bestRoutes),
    //
    // as the `success` callback function in your Ajax call. That will
    // ensure that the best routes that you get from the HTTP call will
    // be passed along in the `runGeneration` waterfall. 
    function getBestRoutes(generation, callback) {
      const runId = $('#runId-text-field').val();
      const numToReturn = $('#num-parents').val();
      const url = baseUrl + `/best?runId=${runId}&generation=${generation}&numToReturn=${numToReturn}`;
  
      $.ajax({
        method: 'GET',
        url: url,
        contentType: 'application/json',
  
        success: (bestRoutes) => callback(null, bestRoutes),
        error: function ajaxError(jqXHR, textStatus, errorThrown) {
          console.error(
            'Error when getting the best routes: ',
            textStatus,
            ', Details: ',
            errorThrown
          );
          console.error('Response: ', jqXHR.responseText);
          alert('Error: \n' + jqXHR.responseText);
        }
      })
    }
  
    // Create the specified number of children by mutating the given
    // parent that many times. Each child should have their generation
    // set to ONE MORE THAN THE GIVEN GENERATION. This is crucial, or
    // every route will end up in the same generation.
    //
    // MAKE SURE YOU USE
    //
    //   children => cb(null, children)
    //
    // as the `success` callback function in your Ajax call to make sure
    // the children pass down through the `runGeneration` waterfall.
    function makeChildren(parent, numChildren, generation, cb) {
  
      $.ajax({
        method: 'POST',
        url: baseUrl + '/mutateroute',
        data: JSON.stringify({
          routeId: parent.routeId,
          lengthStoreThreshold: lengthStoreThreshold,
          numChildren: numChildren
        }),
  
        contentType: 'application/json',
  
        success: (children) => cb(null, children),
        error: function ajaxError(jqXHR, textStatus, errorThrown) {
  
          console.error(
            'Error when making the children: ',
            textStatus,
            ', Details: ',
            errorThrown
          );
          console.error('Response: ', jqXHR.responseText);
          alert('An error occurred when making the children \n' + jqXHR.responseText);
        }
      })
    }
  
    // Get the full details of the specified route. You should largely
    // have this done from the previous exercise. Make sure you pass
    // `callback` as the `success` callback function in the Ajax call.
    function getRouteById(routeId, callback) {
      
      $.ajax({
        method: 'GET',
        url: baseUrl + '/routes' + '/' + routeId,
        contentType: 'application/json',
  
        success: (route) => callback(route),
  
        error: function ajaxError(jqXHR, textStatus, errorThrown) {
          console.error(
            'Error getting the details of the route by ID',
            textStatus,
            ', Details: ',
            errorThrown
          );
          console.error('Response: ', jqXHR.responseText);
          alert('An error occurred when getting the details for the route: \n' + jqXHR.responseText);
        }
      })
    }
  
    // Get city data (names, locations, etc.) from your new Lambda that returns
    // that information. Make sure you pass `callback` as the `success` callback
    // function in the Ajax call.
    function fetchCityData(callback) {
  
      $.ajax(
        {
          method: 'GET',
          url: baseUrl + '/city-data',
          contentType: 'application/json',
  
          success: (cityData) => callback(cityData),
  
          error: function ajaxError(jqXHR, textStatus, errorThrown) {
            console.error(
              'Error getting city data',
              textStatus,
              ', Details: ',
              errorThrown
            );
            console.error('Response: ', jqXHR.responseText);
            alert('An error occurred when getting the city data: \n' + jqXHR.responseText);
          }
        })
    }
  
    ////////////////////////////////////////////////////////////
    // START OF HTML DISPLAY ///////////////////////////////////
    ////////////////////////////////////////////////////////////
  
    // The next few functions handle displaying different values
    // in the HTML of the web app.
  
    // Display the details of the best path.
    function displayBestPath() {
      $("#best-length").text(best.len);
      $("#best-path").text(JSON.stringify(best.bestPath));
      $("#best-routeId").text(best.routeId);
      $("#best-route-cities").text("");
      best.bestPath.forEach((index) => {
        const cityName = cityData[index].properties.name;
        $("#best-route-cities").append(`<li>${cityName}</li>`);
      });
    }
    
    // Display all the children. This just uses a `forEach`
    // to call `displayRoute` on each child route.
    function displayChildren(children, dc_cb) {
      $('#new-route-list').text('');
      children.forEach(child => displayRoute(child));
      dc_cb(null, children);
    }
  
    // Display a new (child) route (ID and length)
    function displayRoute(result) {
  
      console.log(result);
      let routeId = result.routeId;
      let length = result.len;
      $('#new-route-list').append(`<li>Route generated:${routeId} with length: ${length}.</li>`);
    }
  
    // Display the best routes (length and IDs)
    //
    // MAKE SURE YOU END THIS with
    //
    //    dbp_cb(null, bestRoutes);
    //
    // so the array of best routes is pass along through
    // the waterfall in `runGeneration`.
    function displayBestRoutes(bestRoutes, dbp_cb) {
      bestRoutes.forEach(route => {
        const Id = route.routeId;
        const length = route.len;
        $('#best-route-list')
        .append(`<li>Route ID: ${Id} <br>
                 Length: ${length} </li>`);
      });
  
      dbp_cb(null, bestRoutes);
    }
  
    ////////////////////////////////////////////////////////////
    // END OF HTML DISPLAY /////////////////////////////////////
    ////////////////////////////////////////////////////////////
  
    ////////////////////////////////////////////////////////////
    // START OF TRACKING BEST ROUTE ////////////////////////////
    ////////////////////////////////////////////////////////////
  
    // The next few functions keep track of the best route we've seen
    // so far.
    function updateBestRoute(children, ubr_cb) {
  
      children.forEach(child => {
        if (child.len < best.len) {
          updateBest(child.routeId);
        }
      });
      ubr_cb(null, children);
    }
  
    // This is called whenever a route _might_ be the new best
    // route. It will get the full route details from the appropriate
    // Lambda, and then plot it if it's still the best. (Because of
    // asynchrony it's possible that it's no longer the best by the
    // time we get the details back from the Lambda.)
    function updateBest(routeId) {
      getRouteById(routeId, processNewRoute);
  
      function processNewRoute(route) {
        // We need to check that this route is _still_ the
        // best route. Thanks to asynchrony, we might have
        // updated `best` to an even better route between
        // when we called `getRouteById` and when it returned
        // and called `processNewRoute`. The `route == ""`
        // check is just in case we our attempt to get
        // the route with the given idea fails, possibly due
        // to the eventual consistency property of the DB.
        if (best.len > route.len && route == "") {
          console.log(`Getting route ${routeId} failed; trying again.`);
          updateBest(routeId);
          return;
        }
        
        if (best.len > route.len) {
          console.log(`Updating Best Route for ${routeId}`);
          best.routeId = routeId;
          best.len = route.len;
          best.bestPath = route.route;
          displayBestPath(); // Display the best route on the HTML page
          best.bestPath[route.route.length] = route.route[0]; // Loop Back
          updateMapCoordinates(best.bestPath);
          mapCurrentBestRoute();
        }
      }
    }
  
    ////////////////////////////////////////////////////////////
    // END OF TRACKING BEST ROUTE //////////////////////////////
    ////////////////////////////////////////////////////////////
  
    ////////////////////////////////////////////////////////////
    // START OF MAPPING TOOLS //////////////////////////////////
    ////////////////////////////////////////////////////////////
  
    // The next few functions handle the mapping of the best route.
  
    // Uses the data in the `best` global variable to draw the current
    // best route on the Leaflet map.
    function mapCurrentBestRoute() {
      var lineStyle = {
        dashArray: [10, 20],
        weight: 5,
        color: "#0000FF",
      };
  
      var fillStyle = {
        weight: 5,
        color: "#FFFFFF",
      };
  
      if (best.lRoute[0].length == 0) {
        // Initialize first time around
        best.lRoute[0] = L.polyline(best.coords, fillStyle).addTo(mymap);
        best.lRoute[1] = L.polyline(best.coords, lineStyle).addTo(mymap);
      } else {
        best.lRoute[0] = best.lRoute[0].setLatLngs(best.coords);
        best.lRoute[1] = best.lRoute[1].setLatLngs(best.coords);
      }
    }
  
    function initializeMap(cities) {
      cityData = [];
      for (let i = 0; i < cities.length; i++) {
        const city = cities[i];
        const cityName = city.cityName;
        var geojsonFeature = {
          type: "Feature",
          properties: {
            name: "",
            show_on_map: true,
            popupContent: "CITY",
          },
          geometry: {
            type: "Point",
            coordinates: [0, 0],
          },
        };
        geojsonFeature.properties.name = cityName;
        geojsonFeature.properties.popupContent = cityName;
        geojsonFeature.geometry.coordinates[0] = city.location[1];
        geojsonFeature.geometry.coordinates[1] = city.location[0];
        cityData[i] = geojsonFeature;
      }
  
      var layerProcessing = {
        pointToLayer: circleConvert,
        onEachFeature: onEachFeature,
      };
  
      L.geoJSON(cityData, layerProcessing).addTo(mymap);
  
      function onEachFeature(feature, layer) {
        if (feature.properties && feature.properties.popupContent) {
          layer.bindPopup(feature.properties.popupContent);
        }
      }
  
      function circleConvert(feature, latlng) {
        return new L.CircleMarker(latlng, { radius: 5, color: "#FF0000" });
      }
    }
  
    // This updates the `coords` field of the best route when we find
    // a new best path. The main thing this does is reverse the order of
    // the coordinates because of the mismatch between tbe GeoJSON order
    // and the Leaflet order. 
    function updateMapCoordinates(path) {
      function swap(arr) {
        return [arr[1], arr[0]];
      }
      for (var i = 0; i < path.length; i++) {
        best.coords[i] = swap(cityData[path[i]].geometry.coordinates);
      }
      best.coords[i] = best.coords[0]; // End where we started
    }
  
    ////////////////////////////////////////////////////////////
    // END OF MAPPING TOOLS ////////////////////////////////////
    ////////////////////////////////////////////////////////////
  
    $(function onDocReady() {
      // These set you up with some reasonable defaults.
      $("#population-size-text-field").val(100);
      $("#num-parents").val(20);
      $("#num-generations").val(20);
      $("#run-evolution").click(runEvolution);
      // Get all the city data (names, etc.) once up
      // front to be used in the mapping throughout.
      fetchCityData(initializeMap);
    });
  })(jQuery);
  
```




