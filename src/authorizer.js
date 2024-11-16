'use strict';

const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
    const token = event.authorizationToken;
    const secret = process.env.JWT_SECRET;

    try {
        const decoded = jwt.verify(token, secret);
        return generatePolicy(decoded.sub, 'Allow', event.methodArn);
    } catch (err) {
        return generatePolicy('user', 'Deny', event.methodArn);
    }
};

const generatePolicy = (principalId, effect, resource) => {
    const authResponse = {};
    authResponse.principalId = principalId;

    if (effect && resource) {
        const policyDocument = {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        };
        authResponse.policyDocument = policyDocument;
    }

    return authResponse;
};