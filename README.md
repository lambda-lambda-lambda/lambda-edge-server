# lambda-edge-server

[![npm version](https://badge.fury.io/js/lambda-edge-server.svg)](https://badge.fury.io/js/lambda-edge-server) [![](https://img.shields.io/npm/dm/lambda-edge-server.svg)](https://www.npmjs.com/package/lambda-edge-server) [![Build Status](https://api.travis-ci.com/lambda-lambda-lambda/lambda-edge-server.svg?branch=master)](https://app.travis-ci.com/github/lambda-lambda-lambda/lambda-edge-server)

AWS [CloudFront Lambda@Edge](https://docs.aws.amazon.com/lambda/latest/dg/lambda-edge.html) function handler emulator.

Provides a translation layer between [Node.js](https://nodejs.org) HTTP server and [Lambda](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-generating-http-responses.html) function response format.  The goal is simplify local testing without the need for complex dependencies.

## Dependencies

- [Node.js](https://nodejs.org)

## Lambda function handlers

The following `origin-request/origin-response` format is currently supported.

### Synchronous example

```javascript
/**
 * @see AWS::Serverless::Function
 */
exports.handler = function(event, context, callback) {
  const response = {
    status: '200',
    statusDescription: 'OK',
    headers: {
      'cache-control': [{
        key: 'Cache-Control',
        value: 'max-age=0'
      }],
      'content-type': [{
        key: 'Content-Type',
        value: 'text/html'
      }]
    },
    body: 'Success',
  };

  callback(null, response);
};
```

### Asynchronous example

```javascript
/**
 * @see AWS::Serverless::Function
 */
exports.handler = async function(event) {
  const response = {
    status: '200',
    statusDescription: 'OK',
    headers: {
      'cache-control': [{
        key: 'Cache-Control',
        value: 'max-age=0'
      }],
      'content-type': [{
        key: 'Content-Type',
        value: 'text/html'
      }]
    },
    body: 'Success',
  };

  return response;
};
```

## Developers

### CLI options

Launch [HTTP server instance](http://localhost:3000), run the function:

    $ npm start ./path/to/script.js

Run [ESLint](https://eslint.org/) on project sources:

    $ npm run lint

Run [Mocha](https://mochajs.org) integration tests:

    $ npm run test

## References

- [Example origin request](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#example-origin-request)
- [Example origin-response](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-event-structure.html#lambda-event-structure-response)

## Contributions

If you fix a bug, or have a code you want to contribute, please send a pull-request with your changes. (Note: Before committing your code please ensure that you are following the [Node.js style guide](https://github.com/felixge/node-style-guide))

## Versioning

This package is maintained under the [Semantic Versioning](https://semver.org) guidelines.

## License and Warranty

This package is distributed in the hope that it will be useful, but without any warranty; without even the implied warranty of merchantability or fitness for a particular purpose.

_lambda-edge-server_ is provided under the terms of the [MIT license](http://www.opensource.org/licenses/mit-license.php)

[AWS](https://aws.amazon.com) is a registered trademark of Amazon Web Services, Inc.

## Author

[Marc S. Brooks](https://github.com/nuxy)
