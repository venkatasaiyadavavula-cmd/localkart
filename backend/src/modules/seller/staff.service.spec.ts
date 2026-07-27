import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffMember, StaffRole, StaffStatus } from '../../core/entities/staff-member.entity';
import { Shop } from '../../core/entities/shop.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('StaffService.updateStaff', () => {
  let service: StaffService;
  const staffRepo = { findOne: jest.fn(), save: jest.fn() };
  const shopRepo = { findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        { provide: getRepositoryToken(StaffMember), useValue: staffRepo },
        { provide: getRepositoryToken(Shop), useValue: shopRepo },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    service = module.get(StaffService);
    jest.clearAllMocks();
    shopRepo.findOne.mockResolvedValue({ id: 'shop-1', ownerId: 'owner-1' });
    staffRepo.findOne.mockResolvedValue({
      id: 'staff-1',
      shopId: 'shop-1',
      name: 'Worker',
      staffId: 'lk-abc-1234',
      role: StaffRole.EMPLOYEE,
      status: StaffStatus.ACTIVE,
      passwordHash: '$2b$10$hashedsecretvalue',
    });
    staffRepo.save.mockImplementation(async (s) => s);
  });

  it('does not return passwordHash in the response', async () => {
    const result = await service.updateStaff('owner-1', 'staff-1', { note: 'Updated' });
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.staffId).toBe('lk-abc-1234');
    expect(result.permissions).toBeDefined();
  });
});

describe('StaffService.staffLogin', () => {
  let service: StaffService;
  const staffRepo = { findOne: jest.fn(), save: jest.fn() };
  const shopRepo = { findOne: jest.fn() };
  const jwtService = { sign: jest.fn().mockReturnValue('staff-jwt') };

  const activeStaff = {
    id: 'staff-1',
    staffId: 'sai_7032',
    shopId: 'shop-1',
    name: 'Sai',
    role: StaffRole.EMPLOYEE,
    status: StaffStatus.ACTIVE,
    passwordHash: 'hash',
    shop: { name: 'Local Shop' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        { provide: getRepositoryToken(StaffMember), useValue: staffRepo },
        { provide: getRepositoryToken(Shop), useValue: shopRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(StaffService);
    jest.clearAllMocks();
    staffRepo.findOne.mockResolvedValue(activeStaff);
    staffRepo.save.mockImplementation(async (s) => s);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('logs in with or without leading @ on the login ID', async () => {
    const withAt = await service.staffLogin('@sai_7032', 'correct-pass');
    const withoutAt = await service.staffLogin('sai_7032', 'correct-pass');

    expect(withAt.token).toBe('staff-jwt');
    expect(withoutAt.token).toBe('staff-jwt');
    expect(staffRepo.findOne).toHaveBeenCalledWith({
      where: { staffId: 'sai_7032' },
      relations: ['shop'],
    });
  });

  it('returns invalid password when credentials do not match', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    const promise = service.staffLogin('sai_7032', 'wrong');
    await expect(promise).rejects.toThrow(UnauthorizedException);
    await expect(promise).rejects.toThrow(/Invalid password/i);
  });

  it('returns inactive message when account is not active', async () => {
    staffRepo.findOne.mockResolvedValue({
      ...activeStaff,
      status: StaffStatus.INACTIVE,
    });
    const promise = service.staffLogin('sai_7032', 'pass');
    await expect(promise).rejects.toThrow(UnauthorizedException);
    await expect(promise).rejects.toThrow(/inactive/i);
  });

  it('returns not recognized when login ID does not exist', async () => {
    staffRepo.findOne.mockResolvedValue(null);
    const promise = service.staffLogin('@unknown_id', 'pass');
    await expect(promise).rejects.toThrow(UnauthorizedException);
    await expect(promise).rejects.toThrow(/not recognized/i);
  });
});
