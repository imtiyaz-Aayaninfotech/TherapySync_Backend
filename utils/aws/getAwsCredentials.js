require('dotenv').config();
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');

const secretsManagerClient = new SecretsManagerClient({
  region: process.env.AWS_REGION,
});

const getAwsCredentials = async () => {
  try {
    const command = new GetSecretValueCommand({
      SecretId: process.env.AWS_SECRET_NAME || 'therapy-secret',
    });
    const data = await secretsManagerClient.send(command);

    if (data.SecretString) {
      const secret = JSON.parse(data.SecretString);
      return {
        accessKeyId: secret.AWS_ACCESS_KEY_ID,
        secretAccessKey: secret.AWS_SECRET_ACCESS_KEY,
      };
    }

    throw new Error('SecretString not found');
  } catch (error) {
    console.warn('⚠️ Falling back to .env AWS credentials');
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }
};

module.exports = getAwsCredentials;
