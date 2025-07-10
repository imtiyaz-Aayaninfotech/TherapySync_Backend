const createS3Client = require('./s3Client');

const uploadToS3 = async (req, res, next) => {
  try {
    const s3 = await createS3Client();

    // Define allowed file groups dynamically
    const fileGroups = [
      'image',
      'colorPalletImages',
      'thumbnailImage',
      'contentImages',
      'video',
      'documents',
    ];

    const uploadResults = {};

    for (const group of fileGroups) {
      const files = req.files?.[group] || [];

      const uploaded = await Promise.all(
        files.map(async (file) => {
          const key = `${Date.now()}-${file.originalname}`;

          await s3.putObject({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          });

          return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        })
      );

      if (uploaded.length > 0) {
        uploadResults[group] = uploaded;
      }
    }

    req.s3Uploads = uploadResults;
    next();
  } catch (err) {
    console.error('S3 Upload Error:', err);
    return res.status(500).json({ success: false, message: 'S3 upload failed' });
  }
};

module.exports = uploadToS3;
