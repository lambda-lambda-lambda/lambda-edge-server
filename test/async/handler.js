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
