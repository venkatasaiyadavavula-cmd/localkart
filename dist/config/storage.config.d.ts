import * as AWS from 'aws-sdk';
export declare const s3Client: AWS.S3;
export declare const BUCKET_NAME: string;
export declare const getSignedUploadUrl: (key: string, contentType: string, expiresIn?: number) => Promise<string>;
export declare const getSignedViewUrl: (key: string, expiresIn?: number) => Promise<string>;
