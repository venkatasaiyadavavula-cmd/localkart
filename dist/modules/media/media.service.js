"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MediaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const uuid_1 = require("uuid");
const storage_config_1 = require("../../config/storage.config");
let MediaService = MediaService_1 = class MediaService {
    mediaQueue;
    logger = new common_1.Logger(MediaService_1.name);
    constructor(mediaQueue) {
        this.mediaQueue = mediaQueue;
    }
    async uploadFile(userId, file, type) {
        const extension = file.originalname.split('.').pop();
        const key = `uploads/${userId}/${(0, uuid_1.v4)()}.${extension}`;
        const uploadUrl = await (0, storage_config_1.getSignedUploadUrl)(key, file.mimetype);
        return {
            uploadUrl,
            key,
            publicUrl: `https://${storage_config_1.BUCKET_NAME}.s3.amazonaws.com/${key}`,
            fileType: file.mimetype,
        };
    }
    async uploadVideo(userId, file) {
        const extension = file.originalname.split('.').pop();
        const key = `videos/${userId}/${(0, uuid_1.v4)()}.${extension}`;
        const uploadUrl = await (0, storage_config_1.getSignedUploadUrl)(key, file.mimetype);
        const job = await this.mediaQueue.add('transcode', {
            userId,
            key,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });
        return {
            uploadUrl,
            key,
            jobId: job.id,
            status: 'pending',
            message: 'Video uploaded. Transcoding in progress.',
        };
    }
    async getSignedUrl(key) {
        return { url: await (0, storage_config_1.getSignedViewUrl)(key) };
    }
    async getVideoStatus(jobId) {
        const job = await this.mediaQueue.getJob(jobId);
        if (!job) {
            throw new common_1.BadRequestException('Job not found');
        }
        const state = await job.getState();
        const progress = job.progress();
        let result = null;
        if (state === 'completed') {
            result = job.returnvalue;
        }
        return {
            jobId,
            state,
            progress,
            result,
        };
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = MediaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('media')),
    __metadata("design:paramtypes", [Object])
], MediaService);
//# sourceMappingURL=media.service.js.map