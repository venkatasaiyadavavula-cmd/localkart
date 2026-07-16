import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { StaffService } from './staff.service';
import { StaffMember, StaffRole, StaffStatus } from '../../core/entities/staff-member.entity';
import { Shop } from '../../core/entities/shop.entity';

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
      role: StaffRole.WORKER,
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
