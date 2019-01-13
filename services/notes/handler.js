'use strict';

// import uuid from "uuid";
// import * as dynamoDbLib from "../../libs/dynamodb-lib";
// import { success, failure } from "../../libs/response-lib";

var uuid = require("uuid");

var AWS = require("aws-sdk");

function call(action, params) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient();

  return dynamoDb[action](params).promise();
}

function success(body) {
  return buildResponse(200, body);
}

function failure(body) {
  return buildResponse(500, body);
}

function buildResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    },
    body: JSON.stringify(body)
  };
}


module.exports.main = (event, context, callback) => {
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);
};

// export async function main(event, context, callback) {
//   const response = {
//     statusCode: 200,
//     headers: {
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Credentials': true,
//     },
//     body: JSON.stringify({
//       message: 'Go Serverless v1.0! Your function executed successfully!',
//       input: event,
//     }),
//   };
//
//   callback(null, response);
// };

module.exports.getNote = async (event, context, callback) => {
  const params = {
    TableName: process.env.tableName,
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      noteId: event.pathParameters.id
    }
  };

  try {
    const result = await dynamoDbLib.call("get", params);
    if (result.Item) {
      callback(null,success(result.Item));
    } else {
      callback(failure({ status: false, error: "Item not found." }));
    }
  } catch (e) {
    callback(failure({ status: false }));
  }
}

// export async function getNote(event, context) {
//   const params = {
//     TableName: process.env.tableName,
//     // 'Key' defines the partition key and sort key of the item to be retrieved
//     // - 'userId': Identity Pool identity id of the authenticated user
//     // - 'noteId': path parameter
//     Key: {
//       userId: event.requestContext.identity.cognitoIdentityId,
//       noteId: event.pathParameters.id
//     }
//   };
//
//   try {
//     const result = await dynamoDbLib.call("get", params);
//     if (result.Item) {
//       // Return the retrieved item
//       return success(result.Item);
//     } else {
//       return failure({ status: false, error: "Item not found." });
//     }
//   } catch (e) {
//     return failure({ status: false });
//   }
// }

module.exports.listNotes = async (event, context, callback) => {
  const params = {
    TableName: process.env.tableName,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": event.requestContext.identity.cognitoIdentityId
    }
  };

  try {
    const result = await dynamoDbLib.call("query", params);
    callback(null, success(result.Items));
  } catch (e) {
    callback(failure({ status: false }));
  }
}

// export async function listNotes(event, context) {
//   const params = {
//     TableName: process.env.tableName,
//     // 'KeyConditionExpression' defines the condition for the query
//     // - 'userId = :userId': only return items with matching 'userId'
//     //   partition key
//     // 'ExpressionAttributeValues' defines the value in the condition
//     // - ':userId': defines 'userId' to be Identity Pool identity id
//     //   of the authenticated user
//     KeyConditionExpression: "userId = :userId",
//     ExpressionAttributeValues: {
//       ":userId": event.requestContext.identity.cognitoIdentityId
//     }
//   };
//
//   try {
//     const result = await dynamoDbLib.call("query", params);
//     // Return the matching list of items in response body
//     return success(result.Items);
//   } catch (e) {
//     return failure({ status: false });
//   }
// }

module.exports.createNote = async (event, context, callback) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.tableName,
    Item: {
      userId: event.requestContext.identity.cognitoIdentityId,
      noteId: uuid.v1(),
      content: data.content,
      attachment: data.attachment,
      createdAt: Date.now()
    }
  };

  try {
    await dynamoDbLib.call("put", params);
    callback(null, success(params.Item));
  } catch (e) {
    callback(failure({ status: false }));
  }
}

// export async function createNote(event, context) {
//   const data = JSON.parse(event.body);
//   const params = {
//     TableName: process.env.tableName,
//     Item: {
//       userId: event.requestContext.identity.cognitoIdentityId,
//       noteId: uuid.v1(),
//       content: data.content,
//       attachment: data.attachment,
//       createdAt: Date.now()
//     }
//   };
//
//   try {
//     await dynamoDbLib.call("put", params);
//     return success(params.Item);
//   } catch (e) {
//     return failure({ status: false });
//   }
// }

module.exports.updateNote = async (event, context, callback) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.tableName,
    // 'Key' defines the partition key and sort key of the item to be updated
    // - 'userId': Identity Pool identity id of the authenticated user
    // - 'noteId': path parameter
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      noteId: event.pathParameters.id
    },
    // 'UpdateExpression' defines the attributes to be updated
    // 'ExpressionAttributeValues' defines the value in the update expression
    UpdateExpression: "SET content = :content, attachment = :attachment",
    ExpressionAttributeValues: {
      ":attachment": data.attachment || null,
      ":content": data.content || null
    },
    ReturnValues: "ALL_NEW"
  };

  try {
    const result = await dynamoDbLib.call("update", params);
    callback(null, success({ status: true }));
  } catch (e) {
    callback(failure({ status: false }));
  }
}

// export async function updateNote(event, context) {
//   const data = JSON.parse(event.body);
//   const params = {
//     TableName: process.env.tableName,
//     // 'Key' defines the partition key and sort key of the item to be updated
//     // - 'userId': Identity Pool identity id of the authenticated user
//     // - 'noteId': path parameter
//     Key: {
//       userId: event.requestContext.identity.cognitoIdentityId,
//       noteId: event.pathParameters.id
//     },
//     // 'UpdateExpression' defines the attributes to be updated
//     // 'ExpressionAttributeValues' defines the value in the update expression
//     UpdateExpression: "SET content = :content, attachment = :attachment",
//     ExpressionAttributeValues: {
//       ":attachment": data.attachment || null,
//       ":content": data.content || null
//     },
//     ReturnValues: "ALL_NEW"
//   };
//
//   try {
//     const result = await dynamoDbLib.call("update", params);
//     return success({ status: true });
//   } catch (e) {
//     return failure({ status: false });
//   }
// }

module.exports.deleteNote = async (event, context, callback) => {
  const params = {
    TableName: process.env.tableName,
    // 'Key' defines the partition key and sort key of the item to be removed
    // - 'userId': Identity Pool identity id of the authenticated user
    // - 'noteId': path parameter
    Key: {
      userId: event.requestContext.identity.cognitoIdentityId,
      noteId: event.pathParameters.id
    }
  };

  try {
    const result = await dynamoDbLib.call("delete", params);
    callback(null, success({ status: true }));
  } catch (e) {
    callback(failure({ status: false }));
  }
}

// export async function deleteNote(event, context) {
//   const params = {
//     TableName: process.env.tableName,
//     // 'Key' defines the partition key and sort key of the item to be removed
//     // - 'userId': Identity Pool identity id of the authenticated user
//     // - 'noteId': path parameter
//     Key: {
//       userId: event.requestContext.identity.cognitoIdentityId,
//       noteId: event.pathParameters.id
//     }
//   };
//
//   try {
//     const result = await dynamoDbLib.call("delete", params);
//     return success({ status: true });
//   } catch (e) {
//     return failure({ status: false });
//   }
// }
