'use strict';
const db = require("./db");
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


module.exports.handler = async (event) => {
  const response = { statusCode: 200 };

  try {
    const body = JSON.parse(event.body);
    const { username, password } = body;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate a unique user ID
    const userId = crypto.randomUUID();

    // Prepare the user item
    const userItem = {
      userId: { S: userId },
      username: { S: username },
      password: { S: hashedPassword },
      created_at: { S: new Date().toISOString() }
    };

    // Store the user in the database
    const params = {
      TableName: process.env.DYNAMODB_USER_TABLE_NAME,
      Item: userItem
    };

    const {Item} = await db.send(new PutItemCommand(params));

    if (!Item) {
        response.statusCode = 401;
        response.body = JSON.stringify({ message: 'Something went wrong' });
        return response;
    }

    response.body = JSON.stringify({
      message: 'User created successfully',
      userId
    });

  } catch (error) {
    console.error(error);
    response.statusCode = 500;
    response.body = JSON.stringify({
      message: 'Internal server error',
      error: error.message
    });
  }

  return response;
};
