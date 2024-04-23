#!/usr/bin/env node

/**
 *  lambda-edge-server
 *  AWS CloudFront Lambda@Edge handler function emulator.
 *
 *  Copyright 2023-2024, Marc S. Brooks (https://mbrooks.info)
 *  Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */

'use strict';

const {Command} = require('commander');
const fs        = require('fs');
const http      = require('http');
const url       = require('url');

const SERVER_PORT = 3000;

// Process CLI options.
const program = new Command();

program
  .usage('[options]')

  .option('--handler <path>', 'Lambda@Edge handler script.')
  .option('--port <number>', 'HTTP server port number.', SERVER_PORT)
  .option('--silent', 'Disable logging events to STDOUT')

  .action(function(opts) {
    const errors = [];

    try {
      const script = process.cwd() + '/' + opts.handler;

      // Validate option values.
      if (opts.handler && !fs.existsSync(script) || !opts.handler) {
        errors.push("  option '--handler <path>' allows path Lambda@Edge handler script");
      }

      if (opts.port && !/^[0-9]{2,5}$/.test(opts.port)) {
        errors.push("  option '--port <number>' allows up to 5 numeric characters");
      }

      if (errors.length) {
        console.error('error: Invalid script arguments');

        throw new Error(errors.join('\n'));
      }

      const {handler} = require(script);

      if (isValidFunc(handler)) {
        return initServer(handler, opts.port, !opts.silent);
      }

      throw new Error('error: Invalid handler method');

    } catch (err) {
      if (err instanceof Error) {
        console.error(`${err.message}\n`);
      }

      this.outputHelp();
    }
  });

// Skip Commander options during testing.
if (process.env.NODE_ENV === 'test') {
  const {handler} = require(process.env.TEST_HANDLER);

  module.exports = initServer(handler, SERVER_PORT);
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
 * @param {Boolean} logEvents
 *   Log events to STDOUT (default: true).
 *
 * @return {Object}
 *
 * @see https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html
 */
function initServer(handler, port, logEvents = true) {
  const server = http.createServer(function(req, res) {
    let body = '';

    req.on('data', function(data) {
      body += data;
    });

    req.on('end', function() {
      const path  = url.parse(req.url).pathname;
      const query = url.parse(req.url).query;

      if (body) {
        body = encodeBody(body);
      }

      // Simulate AWS origin-request event.
      const event = {
        Records: [
          {
            cf: {
              request: {
                clientIp: res.socket?.remoteAddress,
                headers: formatHeaders(req.headers).toEdge(),
                method: req.method,
                querystring: query,
                uri: path,
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

        log(Date.now(), req.method, path, JSON.stringify(event));

      } catch (err) {
        this.emit('error', Error('Malformed handler method. Exiting..'));
      }
    });
  });

  // Log event to STDOUT.
  const log = function() {
    if (logEvents) {
      console.log(...arguments);
    }
  };

  // Start HTTP server; increment port if used.
  return server
    .listen(port, () => {
      log(`HTTP server started. Listening on port ${port}`);
    })
    .on('error', function(err) {
      if (err.code === 'EADDRINUSE') {
        this.close();

        log(`Port ${port} in use. Trying another port.`);

        initServer(handler, port + 1);
      }
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
