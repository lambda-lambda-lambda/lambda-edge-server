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
