#!/usr/bin/env node

/**
 *  lambda-edge-server
 *  AWS CloudFront Lambda@Edge handler function emulator.
 *
 *  Copyright 2023, Marc S. Brooks (https://mbrooks.info)
 *  Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */

'use strict';

const {Command} = require('commander');
const fs        = require('fs');
const http      = require('http');
const url       = require('url');

// Process CLI options.
const program = new Command();

program
  .usage('[options]')
  .option('--handler <path>', 'Lambda@Edge handler script.')
  .option('--port <number>', 'HTTP server port number.', 3000)
  .action(function(name) {
    const script = process.cwd() + '/' + name.handler;

    if (fs.existsSync(script)) {
      const {handler} = require(script);

      if (isValidFunc(handler)) {
        initServer(handler, name.port);
      } else {
        throw new Error('Invalid handler method');
      }
    } else {
      this.outputHelp();
    }
  });

// Skip Commander options during testing.
if (process.env.NODE_ENV === 'test') {
  const {handler} = require(process.env.TEST_HANDLER);

  module.exports = initServer(handler, 3000);
} else {
  program.parse();
}

/**
 * Init Lambda@Edge emulator environment.
 *
 * @param {Function} handler
 *   Lambda function method.
 *
 * @param {Function} port
 *   HTTP server port number.
 *
 * @return {Object}
 *
 * @see https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html
 */
function initServer(handler, port) {
  return http.createServer(function(req, res) {
    let body;

    req.on('data', function(data) {
      body += data;
    });

    req.on('end', function() {
      if (body) {
        body = encodeBody(body);
      }

      // Simulate AWS origin-request event.
      const event = {
        Records: [
          {
            cf: {
              request: {
                clientIp: res.socket.remoteAddress,
                headers: formatHeaders(req.headers).toEdge(),
                method: req.method,
                querystring: url.parse(req.url).query,
                uri: url.parse(req.url).pathname,
                body: {
                  data: body
                }
              }
            }
          }
        ]
      };

      // .. and callback() application handler.
      const callback = function(request, response) {
        let {body, bodyEncoding, headers, status} = response;

        if (headers) {
          headers = formatHeaders(response.headers).toNode();
          headers.map(header => res.setHeader(header.key, header.value));
        }

        // Override Edge required media encoding.
        if (bodyEncoding === 'base64') {
          body = Buffer.from(body, 'base64');
        }

        if (status) {
          res.statusCode = status;
        }

        res.end(body);
      };

      try {

        // Run lambda-lambda-lambda
        if (isAsyncFunc(handler) || isPromise(handler)) {

          // Asynchronous handling.
          handler(event)
            .then(function(response) {
              callback(null, response);
            });
        } else {

          // Synchronous handling.
          handler(event, null, callback);
        }
      } catch (err) {
        this.emit('error', Error('Malformed handler method. Exiting..'));
      }
    });
  }).listen(port, () => {
    console.log(`HTTP server started. Listening on port ${port}`);
  });
}

/**
 * Return base64 encoded body as string.
 *
 * @param {String} str
 *   Body data as string.
 *
 * @return {String}
 */
function encodeBody(str) {
  return Buffer.from(str).toString('base64');
}

/**
 * Return converted headers (lambda/node).
 *
 * @param {Object} obj
 *   Node request headers object.
 *
 * @return {Object}
 */
function formatHeaders(obj) {
  return {

    // Request format.
    toEdge: function() {
      Object.keys(obj).forEach(function(key) {
        obj[key] = [{
          key,
          value: obj[key]
        }];
      });
      return obj;
    },

    // Response format.
    toNode: function() {
      return Object.keys(obj).map(function(key) {
        return {
          key,
          value: obj[key][0].value
        };
      });
    }
  };
}

/**
 * Check if value is an async function.
 *
 * @param {AsyncFunction} func
 *   Async function.
 *
 * @return {Boolean}
 */
function isAsyncFunc(value) {
  return (value && (value[Symbol.toStringTag] === 'AsyncFunction'));
}

/**
 * Check if object is Promise.
 *
 * @param {Object} obj
 *   Promise object.
 *
 * @return {Boolean}
 */
function isPromise(obj) {
  return (obj && (obj[Symbol.toStringTag] === 'Promise' || typeof obj.then === 'function'));
}

/**
 * Check if valid handler function.
 *
 * @param {Function} value
 *   Handler function.
 *
 * @return {Boolean}
 */
function isValidFunc(value) {
  return (typeof value === 'function' && value.length >= 1 && value.length <= 3);
}
