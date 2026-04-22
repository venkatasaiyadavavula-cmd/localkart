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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const Jimp = __importStar(require("jimp"));
const Tesseract = __importStar(require("tesseract.js"));
let AiController = class AiController {
    async scanProductFree(files) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('No images uploaded');
        }
        try {
            const extractedTexts = [];
            for (const file of files) {
                const image = await Jimp.read(file.buffer);
                await image
                    .resize(1024, Jimp.AUTO)
                    .greyscale()
                    .contrast(0.5)
                    .normalize()
                    .getBufferAsync(Jimp.MIME_JPEG);
                const { data: { text } } = await Tesseract.recognize(file.buffer, 'eng+tel', {
                    logger: m => console.log(m)
                });
                if (text && text.trim()) {
                    extractedTexts.push(text);
                }
            }
            const combinedText = extractedTexts.join('\n');
            const extractedData = this.parseProductInfo(combinedText);
            return {
                success: true,
                extractedText: combinedText,
                ...extractedData
            };
        }
        catch (error) {
            console.error('OCR Error:', error);
            throw new common_1.BadRequestException('Image processing failed. Please try with clearer images.');
        }
    }
    parseProductInfo(text) {
        const lines = text.split('\n').filter(l => l.trim());
        let productName = lines[0] || 'Unknown Product';
        const priceMatch = text.match(/(?:₹|Rs\.?)\s*(\d+(?:\.\d{1,2})?)/i);
        const estimatedPrice = priceMatch ? parseFloat(priceMatch[1]) : null;
        const weightMatch = text.match(/(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|L|pcs|pack))/i);
        return {
            suggestedName: productName.substring(0, 100),
            suggestedPrice: estimatedPrice,
            suggestedUnit: weightMatch ? weightMatch[1] : null,
            rawText: text.substring(0, 500)
        };
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('scan-product-free'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 5, { storage: (0, multer_1.memoryStorage)() })),
    __param(0, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "scanProductFree", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('api/ai')
], AiController);
//# sourceMappingURL=ai.controller.js.map