const { S3 } = require('@aws-sdk/client-s3');
const getAwsCredentials = require('./getAwsCredentials');

const uploadSingleImage = async (file) => {
  const credentials = await getAwsCredentials();
  const s3 = new S3({
    region: process.env.AWS_REGION,
    credentials,
  });

  const key = `${Date.now()}-${file.originalname}`;

  await s3.putObject({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

module.exports = uploadSingleImage;
