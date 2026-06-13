"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
let AiService = class AiService {
    async extractProductFromImage(file) {
        return { name: '', price: 0, description: '' };
    }
    async generateDescription(name, category) {
        return { description: `High quality ${name} available at your local store.` };
    }
    async removeBackground(file) {
        return file;
    }
    async sendWeeklyEarnings() {
        return { sent: 0 };
    }
    async processProductImages(files) {
        return {
            products: [],
            suggestedName: '',
            suggestedPrice: 0,
            suggestedUnit: '',
            suggestedDescription: '',
            suggestedCategory: '',
            confidence: 0,
        };
    }
    async manualStockCheck() {
        return { checked: 0 };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)()
], AiService);
//# sourceMappingURL=ai.service.js.map