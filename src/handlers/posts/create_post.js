const db = require("./db");
const { PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");

module.exports.handler = async (event) => {
  console.log(event);

  const response = { statusCode: 200 };
  try {
    const body = JSON.parse(event.body);

    // Generate post ID by using UUID generator.
    const crypto = require("crypto");
    const postId = crypto.randomUUID();


    // Get the data from request body
    const post_link = body.link;
    const post_thumbnail = body.thumbnail;
    const post_source = body.source;
    const post_meta_data = body.meta_data;
    const userId = event.requestContext.authorizer.principalId;

    const itemToBeStored = {
      postId: postId,
      userId: userId,
      link: post_link,
      thumbnail: post_thumbnail,
      source: post_source,
      meta_data: post_meta_data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const params = {
      TableName: process.env.DYNAMODB_POSTS_TABLE_NAME,
      Item: marshall(itemToBeStored, { removeUndefinedValues: true }),
    };
    const createResult = await db.send(new PutItemCommand(params));

    
    response.body = JSON.stringify({
        message: "Successfully created post.",
        createResult,
        post: itemToBeStored,
    });
    
  } catch (e) {
    console.error(e);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: "Failed to create post.",
      errorMsg: e.message,
      errorStack: e.stack,
    });
  }
  return response;
};