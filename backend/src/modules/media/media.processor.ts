import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import ffmpeg = require('fluent-ffmpeg');
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

@Processor('media')
export class MediaProcessor {
  private readonly logger = new Logger(MediaProcessor.name);

  @Process('transcode')
  async handleTranscode(job: Job) {
    const { userId, key, originalName } = job.data;
    this.logger.log(`Starting video transcode for ${key}`);

    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `${uuidv4()}-input.mp4`);
    const outputPath = path.join(tempDir, `${uuidv4()}-output`);

    try {
      // Download from S3
      await this.downloadFromS3(key, inputPath);
      job.progress(20);

      // Transcode video
      await this.transcodeVideo(inputPath, outputPath);
      job.progress(70);

      // Upload transcoded versions
      const outputs = await this.uploadTranscodedFiles(outputPath, userId, key);
      job.progress(90);

      // Clean up temp files
      fs.unlinkSync(inputPath);
      this.cleanupTempFiles(outputPath);

      job.progress(100);
      this.logger.log(`Video transcode completed for ${key}`);

      return {
        originalKey: key,
        outputs,
        processedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Transcode failed for ${key}: ${error.message}`);
      // Clean up on error
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      this.cleanupTempFiles(outputPath);
      throw error;
    }
  }

  private async downloadFromS3(key: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destPath);
      s3.getObject({ Bucket: BUCKET_NAME, Key: key })
        .createReadStream()
        .pipe(file)
        .on('error', reject)
        .on('finish', resolve);
    });
  }

  private async transcodeVideo(inputPath: string, outputDir: string): Promise<void> {
    fs.mkdirSync(outputDir, { recursive: true });

    const resolutions = [
      { name: '1080p', size: '1920x1080', bitrate: '4000k' },
      { name: '720p', size: '1280x720', bitrate: '2500k' },
      { name: '480p', size: '854x480', bitrate: '1000k' },
    ];

    const promises = resolutions.map(res => {
      return new Promise<void>((resolve, reject) => {
        const outputFile = path.join(outputDir, `${res.name}.mp4`);
        ffmpeg(inputPath)
          .outputOptions([
            '-c:v libx264',
            `-b:v ${res.bitrate}`,
            '-c:a aac',
            '-b:a 128k',
            '-vf scale=' + res.size,
            '-preset fast',
            '-movflags +faststart',
          ])
          .output(outputFile)
          .on('end', () => resolve())
          .on('error', reject)
          .run();
      });
    });

    await Promise.all(promises);
  }

  private async uploadTranscodedFiles(outputDir: string, userId: string, originalKey: string) {
    const baseKey = originalKey.replace(/\.[^/.]+$/, '');
    const files = fs.readdirSync(outputDir);
    const outputs = [];

    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const resolution = path.basename(file, '.mp4');
      const key = `videos/${userId}/${baseKey}_${resolution}.mp4`;

      await s3.putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fs.createReadStream(filePath),
        ContentType: 'video/mp4',
        ACL: 'public-read',
      }).promise();

      outputs.push({
        resolution,
        key,
        url: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
      });
    }

    return outputs;
  }

  private cleanupTempFiles(dir: string) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(f => fs.unlinkSync(path.join(dir, f)));
        fs.rmdirSync(dir);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}
