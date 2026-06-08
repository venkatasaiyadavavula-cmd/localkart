"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MediaProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const ffmpeg = __importStar(require("fluent-ffmpeg"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const AWS = __importStar(require("aws-sdk"));
const uuid_1 = require("uuid");
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
let MediaProcessor = MediaProcessor_1 = class MediaProcessor {
    logger = new common_1.Logger(MediaProcessor_1.name);
    async handleTranscode(job) {
        const { userId, key, originalName } = job.data;
        this.logger.log(`Starting video transcode for ${key}`);
        const tempDir = os.tmpdir();
        const inputPath = path.join(tempDir, `${(0, uuid_1.v4)()}-input.mp4`);
        const outputPath = path.join(tempDir, `${(0, uuid_1.v4)()}-output`);
        try {
            await this.downloadFromS3(key, inputPath);
            job.progress(20);
            await this.transcodeVideo(inputPath, outputPath);
            job.progress(70);
            const outputs = await this.uploadTranscodedFiles(outputPath, userId, key);
            job.progress(90);
            fs.unlinkSync(inputPath);
            this.cleanupTempFiles(outputPath);
            job.progress(100);
            this.logger.log(`Video transcode completed for ${key}`);
            return {
                originalKey: key,
                outputs,
                processedAt: new Date(),
            };
        }
        catch (error) {
            this.logger.error(`Transcode failed for ${key}: ${error.message}`);
            if (fs.existsSync(inputPath))
                fs.unlinkSync(inputPath);
            this.cleanupTempFiles(outputPath);
            throw error;
        }
    }
    async downloadFromS3(key, destPath) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(destPath);
            s3.getObject({ Bucket: BUCKET_NAME, Key: key })
                .createReadStream()
                .pipe(file)
                .on('error', reject)
                .on('finish', resolve);
        });
    }
    async transcodeVideo(inputPath, outputDir) {
        fs.mkdirSync(outputDir, { recursive: true });
        const resolutions = [
            { name: '1080p', size: '1920x1080', bitrate: '4000k' },
            { name: '720p', size: '1280x720', bitrate: '2500k' },
            { name: '480p', size: '854x480', bitrate: '1000k' },
        ];
        const promises = resolutions.map(res => {
            return new Promise((resolve, reject) => {
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
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            });
        });
        await Promise.all(promises);
    }
    async uploadTranscodedFiles(outputDir, userId, originalKey) {
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
    cleanupTempFiles(dir) {
        try {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                files.forEach(f => fs.unlinkSync(path.join(dir, f)));
                fs.rmdirSync(dir);
            }
        }
        catch (e) {
        }
    }
};
exports.MediaProcessor = MediaProcessor;
__decorate([
    (0, bull_1.Process)('transcode'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MediaProcessor.prototype, "handleTranscode", null);
exports.MediaProcessor = MediaProcessor = MediaProcessor_1 = __decorate([
    (0, bull_1.Processor)('media')
], MediaProcessor);
//# sourceMappingURL=media.processor.js.map