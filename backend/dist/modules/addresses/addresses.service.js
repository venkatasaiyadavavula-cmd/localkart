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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const saved_address_entity_1 = require("../../core/entities/saved-address.entity");
let AddressesService = class AddressesService {
    addressRepo;
    constructor(addressRepo) {
        this.addressRepo = addressRepo;
    }
    async getAddresses(userId) {
        return this.addressRepo.find({
            where: { userId },
            order: { isDefault: 'DESC', createdAt: 'DESC' },
        });
    }
    async addAddress(userId, dto) {
        if (dto.isDefault) {
            await this.addressRepo.update({ userId }, { isDefault: false });
        }
        const count = await this.addressRepo.count({ where: { userId } });
        if (count >= 10) {
            throw new common_1.BadRequestException('Maximum 10 addresses allowed');
        }
        const address = this.addressRepo.create({ ...dto, userId });
        return this.addressRepo.save(address);
    }
    async updateAddress(userId, id, dto) {
        const address = await this.addressRepo.findOne({ where: { id, userId } });
        if (!address)
            throw new common_1.NotFoundException('Address not found');
        if (dto.isDefault) {
            await this.addressRepo.update({ userId }, { isDefault: false });
        }
        await this.addressRepo.update(id, dto);
        return this.addressRepo.findOne({ where: { id } });
    }
    async deleteAddress(userId, id) {
        const address = await this.addressRepo.findOne({ where: { id, userId } });
        if (!address)
            throw new common_1.NotFoundException('Address not found');
        await this.addressRepo.remove(address);
        return { message: 'Address deleted' };
    }
    async setDefault(userId, id) {
        await this.addressRepo.update({ userId }, { isDefault: false });
        await this.addressRepo.update({ id, userId }, { isDefault: true });
        return { message: 'Default address updated' };
    }
};
exports.AddressesService = AddressesService;
exports.AddressesService = AddressesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(saved_address_entity_1.SavedAddress)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AddressesService);
//# sourceMappingURL=addresses.service.js.map