const { S3 } = require('@aws-sdk/client-s3');
const getAwsCredentials = require('./getAwsCredentials');

const createS3Client = async () => {
  const credentials = await getAwsCredentials();
  return new S3({
    region: process.env.AWS_REGION,
    credentials,
  });
};

module.exports = createS3Client;
