"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderNumber = generateOrderNumber;
exports.generateOtp = generateOtp;
function generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `LK${timestamp}${random}`;
}
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
//# sourceMappingURL=helpers.js.map