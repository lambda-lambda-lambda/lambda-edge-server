'use strict';

const chai = require('chai');
const exec = require('child_process').exec;
const path = require('path');

const expect = chai.expect;

describe('CLI', function() {
  describe('options', function() {

    // Override environment.
    before(function() {
      process.env.NODE_ENV = null;
    });

    after(function() {
      process.env.NODE_ENV = 'test';
    });

    describe('--handler', function() {
      describe('missing value', function() {
        it('should return error', function(done) {
          testOption(['--handler'], function(stdout) {
            expect(stdout).to.match(/error: option '--handler <path>' argument missing/);
            done();
          });
        });
      });
    });

    describe('--port', function() {
      describe('missing value', function() {
        it('should not return error', function(done) {
          testOption(['--port'], function(stdout) {
            expect(stdout).to.not.match(/error: option '--port <path>' argument missing/);
            done();
          });
        });
      });
    });
  });
});

/**
 * Test Commander options in child process.
 */
function testOption(vals, callback) {
  const file = path.resolve('server.js');
  const args = vals.join(' ');

  exec(`node '${file}' ${args}`, callback);
}
