const { S3 } = require('@aws-sdk/client-s3');
const getAwsCredentials = require('./getAwsCredentials');


const deleteFromS3 = async (url) => {
  try {
    if (!url) return;

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;

    // ✅ Extract the key after ".amazonaws.com/"
    const urlObj = new URL(url);
    const key = urlObj.pathname.substring(1); // Remove leading slash

    const credentials = await getAwsCredentials();
    const s3 = new S3({ region, credentials });

    await s3.deleteObject({
      Bucket: bucketName,
      Key: key,
    });

    console.log('✅ Deleted from S3:', key);
  } catch (err) {
    console.error('⚠️ S3 Delete Error:', err.message);
  }
};

module.exports = deleteFromS3;
