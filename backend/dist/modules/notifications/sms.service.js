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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
let SmsService = SmsService_1 = class SmsService {
    logger = new common_1.Logger(SmsService_1.name);
    fast2smsApiKey = null;
    constructor() {
        if (process.env.FAST2SMS_API_KEY) {
            this.fast2smsApiKey = process.env.FAST2SMS_API_KEY;
            this.logger.log('Fast2SMS configured successfully.');
        }
        else {
            this.logger.warn('Fast2SMS API key not configured. SMS will be logged only.');
        }
    }
    async sendSms(to, message) {
        try {
            if (this.fast2smsApiKey) {
                const phone = this.formatPhoneNumber(to);
                const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                    method: 'POST',
                    headers: {
                        'authorization': this.fast2smsApiKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        route: 'q',
                        message: message,
                        language: 'english',
                        flash: 0,
                        numbers: phone,
                    }),
                });
                const data = await response.json();
                if (data.return === true) {
                    this.logger.log(`SMS sent to ${to}`);
                    return true;
                }
                else {
                    this.logger.error(`Fast2SMS error: ${JSON.stringify(data)}`);
                    return false;
                }
            }
            else {
                this.logger.log(`[MOCK SMS] To: ${to} - ${message}`);
                return true;
            }
        }
        catch (error) {
            this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
            return false;
        }
    }
    formatPhoneNumber(phone) {
        if (phone.startsWith('+91'))
            return phone.replace('+91', '');
        if (phone.startsWith('+'))
            return phone.slice(3);
        if (phone.length === 10)
            return phone;
        return phone;
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SmsService);
//# sourceMappingURL=sms.service.js.map