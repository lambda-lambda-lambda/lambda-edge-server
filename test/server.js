'use strict';

const chai       = require('chai');
const chaiHttp   = require('chai-http');
const resetCache = require('resnap')();

chai.use(chaiHttp);

const {expect, request} = chai;

describe('Handler method', function() {
  describe('async', function() {
    let agent, result;

    before(async function() {
      resetCache();

      process.env.TEST_HANDLER = './test/async/handler.js';

      const server = require('../server');
      agent = request.agent(server);

      result = await agent.get('/');
    });

    after(function() {
      agent.close();
    });

    it('should return status', function() {
      expect(result.status).to.be.an('number');
      expect(result.status).to.equal(200);
    });

    it('should return ok', function() {
      expect(result.ok).to.be.an('boolean');
      expect(result.ok).to.be.true;
    });

    it('should return body', function() {
      expect(result.text).to.be.an('string');
      expect(result.text).to.equal('Success');
    });
  });

  describe('sync', function() {
    let agent, result;

    before(async function() {
      resetCache();

      process.env.TEST_HANDLER = './test/sync/handler.js';

      const server = require('../server');
      agent = request.agent(server);

      result = await agent.get('/');
    });

    after(function() {
      agent.close();
    });

    it('should return status', function() {
      expect(result.status).to.be.an('number');
      expect(result.status).to.equal(200);
    });

    it('should return ok', function() {
      expect(result.ok).to.be.an('boolean');
      expect(result.ok).to.be.true;
    });

    it('should return body', function() {
      expect(result.text).to.be.an('string');
      expect(result.text).to.equal('Success');
    });
  });
});
