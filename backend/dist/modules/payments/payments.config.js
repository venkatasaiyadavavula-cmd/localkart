"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPaymentsEnabled = isPaymentsEnabled;
exports.assertPaymentsEnabled = assertPaymentsEnabled;
const common_1 = require("@nestjs/common");
function isPaymentsEnabled() {
    return process.env.PAYMENTS_ENABLED === 'true';
}
function assertPaymentsEnabled() {
    if (!isPaymentsEnabled()) {
        throw new common_1.ServiceUnavailableException('Payment gateway not available');
    }
}
//# sourceMappingURL=payments.config.js.map