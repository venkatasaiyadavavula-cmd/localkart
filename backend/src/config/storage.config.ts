import * as AWS from 'aws-sdk';

export const s3Client = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1',
  // For Cloudflare R2, add endpoint override:
  // endpoint: process.env.R2_ENDPOINT,
  // s3ForcePathStyle: true,
});

export const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'localkart-media';

export const getSignedUploadUrl = (key: string, contentType: string, expiresIn = 300) => {
  return s3Client.getSignedUrlPromise('putObject', {
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Expires: expiresIn,
    ACL: 'public-read',
  });
};

export const getSignedViewUrl = (key: string, expiresIn = 3600) => {
  return s3Client.getSignedUrlPromise('getObject', {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn,
  });
};
