'use strict';
const db = require("./db");
const {GetItemCommand } = require('@aws-sdk/client-dynamodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


module.exports.handler = async (event) => {
  const response = { statusCode: 200 };

  try {
    const body = JSON.parse(event.body);
    const { username, password } = body;

    // Fetch user from the database
    const params = {
      TableName: process.env.DYNAMODB_USER_TABLE_NAME,
      Key: {
        username: { S: username }
      }
    };

    const { Item } = await db.send(new GetItemCommand(params));

    if (!Item) {
      response.statusCode = 401;
      response.body = JSON.stringify({ message: 'Invalid username or password' });
      return response;
    }

    // Verify password
    const storedPasswordHash = Item.password.S;
    const passwordMatch = await bcrypt.compare(password, storedPasswordHash);

    if (!passwordMatch) {
      response.statusCode = 401;
      response.body = JSON.stringify({ message: 'Invalid username or password' });
      return response;
    }

    // Generate JWT token
    const userId = Item.userId.S;
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '12h' });

    response.body = JSON.stringify({
      message: 'Login successful',
      token
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
