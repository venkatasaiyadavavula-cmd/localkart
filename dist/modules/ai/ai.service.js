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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const Jimp = __importStar(require("jimp"));
const Tesseract = __importStar(require("tesseract.js"));
let AiService = AiService_1 = class AiService {
    logger = new common_1.Logger(AiService_1.name);
    async processProductImages(files) {
        const extractedTexts = [];
        for (const file of files) {
            try {
                const image = await Jimp.read(file.buffer);
                const processedBuffer = await image
                    .resize(1024, Jimp.AUTO)
                    .greyscale()
                    .contrast(0.5)
                    .normalize()
                    .getBufferAsync(Jimp.MIME_JPEG);
                const { data: { text } } = await Tesseract.recognize(processedBuffer, 'eng+tel', {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            this.logger.debug(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                        }
                    },
                });
                if (text && text.trim()) {
                    extractedTexts.push(text);
                }
            }
            catch (error) {
                this.logger.error(`Failed to process image: ${error.message}`);
            }
        }
        const combinedText = extractedTexts.join('\n');
        return this.parseProductInfo(combinedText);
    }
    parseProductInfo(text) {
        const lines = text.split('\n').filter((l) => l.trim());
        let productName = lines[0] || 'Unknown Product';
        const priceMatch = text.match(/(?:₹|Rs\.?)\s*(\d+(?:\.\d{1,2})?)/i);
        const estimatedPrice = priceMatch ? parseFloat(priceMatch[1]) : null;
        const weightMatch = text.match(/(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|L|pcs|pack))/i);
        const suggestedUnit = weightMatch ? weightMatch[1] : null;
        if (estimatedPrice) {
            productName = productName.replace(new RegExp(`₹?\\s*${estimatedPrice}`, 'i'), '').trim();
        }
        if (suggestedUnit) {
            productName = productName.replace(new RegExp(suggestedUnit, 'i'), '').trim();
        }
        return {
            suggestedName: productName.substring(0, 100),
            suggestedPrice: estimatedPrice,
            suggestedUnit,
            rawText: text.substring(0, 500),
        };
    }
    async removeBackground(imageBuffer) {
        try {
            const { removeBackground } = await Promise.resolve().then(() => __importStar(require('@imgly/background-removal-node')));
            const blob = await removeBackground(imageBuffer);
            const arrayBuffer = await blob.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }
        catch (error) {
            this.logger.error(`Background removal failed: ${error.message}`);
            return imageBuffer;
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)()
], AiService);
//# sourceMappingURL=ai.service.js.map