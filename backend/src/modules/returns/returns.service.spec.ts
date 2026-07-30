import { BadGatewayException } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { ReturnStatus } from '../../core/entities/return-request.entity';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../core/entities/order.entity';

jest.mock('../../config/razorpay.config', () => ({
  __esModule: true,
  default: {
    payments: {
      refund: jest.fn(),
    },
  },
}));

import razorpayInstance from '../../config/razorpay.config';

const flushAsyncNotifications = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('ReturnsService.processRefund', () => {
  const returnId = 'return-1';
  const customerId = 'cust-1';

  let service: ReturnsService;
  let returnRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let orderRepo: { save: jest.Mock };
  let userRepo: { findOne: jest.Mock };
  let notificationsService: {
    sendCustomerNotification: jest.Mock;
    sendReturnStatusWhatsApp: jest.Mock;
    sendReturnStatusEmail: jest.Mock;
    sendReturnStatusWhatsAppToSeller: jest.Mock;
    sendReturnStatusEmailToSeller: jest.Mock;
    sendSellerNotification: jest.Mock;
  };
  let returnRequest: Record<string, unknown>;
  let order: Record<string, unknown>;
  let seller: Record<string, unknown>;
  let shop: Record<string, unknown>;

  beforeEach(() => {
    seller = {
      id: 'seller-1',
      name: 'Test Seller',
      phone: '9876598765',
      email: 'seller@example.com',
    };
    shop = {
      id: 'shop-1',
      name: 'Test Shop',
      owner: seller,
    };
    order = {
      id: 'order-1',
      orderNumber: 'LK-1001',
      paymentMethod: PaymentMethod.RAZORPAY,
      paymentStatus: PaymentStatus.PAID,
      razorpayPaymentId: 'pay_test_123',
      status: OrderStatus.DELIVERED,
      shop,
    };

    returnRequest = {
      id: returnId,
      customerId,
      status: ReturnStatus.APPROVED,
      refundAmount: 450,
      order,
    };

    returnRepo = {
      findOne: jest.fn(async () => ({ ...returnRequest, order: { ...order } })),
      save: jest.fn(async (entity) => entity),
    };
    orderRepo = {
      save: jest.fn(async (entity) => entity),
    };
    userRepo = {
      findOne: jest.fn(async () => ({
        id: customerId,
        name: 'Test Customer',
        phone: '9876512345',
        email: 'test@example.com',
      })),
    };
    notificationsService = {
      sendCustomerNotification: jest.fn().mockResolvedValue(undefined),
      sendReturnStatusWhatsApp: jest.fn().mockResolvedValue(undefined),
      sendReturnStatusEmail: jest.fn().mockResolvedValue(undefined),
      sendReturnStatusWhatsAppToSeller: jest.fn().mockResolvedValue(undefined),
      sendReturnStatusEmailToSeller: jest.fn().mockResolvedValue(undefined),
      sendSellerNotification: jest.fn().mockResolvedValue(undefined),
    };

    service = new ReturnsService(
      returnRepo as any,
      orderRepo as any,
      {} as any,
      {} as any,
      {} as any,
      userRepo as any,
      {} as any,
      notificationsService as any,
    );

    jest.clearAllMocks();
    (razorpayInstance.payments.refund as jest.Mock).mockResolvedValue({ id: 'rfnd_test' });
  });

  it('processes Razorpay refund from approved status', async () => {
    const result = await service.processRefund(returnId);
    await flushAsyncNotifications();

    expect(razorpayInstance.payments.refund).toHaveBeenCalledWith('pay_test_123', {
      amount: 45000,
      notes: {
        returnRequestId: returnId,
        orderId: 'order-1',
        orderNumber: 'LK-1001',
      },
    });
    expect(orderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: OrderStatus.RETURNED,
        paymentStatus: PaymentStatus.REFUNDED,
      }),
    );
    expect(returnRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReturnStatus.REFUNDED }),
    );
    expect(result).toEqual({ message: 'Refund processed successfully' });
    expect(notificationsService.sendReturnStatusWhatsApp).toHaveBeenCalled();
    expect(notificationsService.sendReturnStatusEmail).toHaveBeenCalled();
    expect(notificationsService.sendReturnStatusWhatsAppToSeller).toHaveBeenCalledWith(
      '9876598765',
      'Test Shop',
      'LK-1001',
      'refunded',
      '450',
    );
    expect(notificationsService.sendReturnStatusEmailToSeller).toHaveBeenCalledWith(
      'seller@example.com',
      'Test Shop',
      'LK-1001',
      'refunded',
      '450',
    );
    expect(notificationsService.sendSellerNotification).toHaveBeenCalledWith(
      'seller-1',
      'Return refunded',
      'Order #LK-1001 at Test Shop: refunded',
    );
  });

  it('processes Razorpay refund from picked_up status', async () => {
    returnRequest.status = ReturnStatus.PICKED_UP;
    returnRepo.findOne.mockResolvedValue({
      ...returnRequest,
      order: { ...order },
    });

    await service.processRefund(returnId);

    expect(razorpayInstance.payments.refund).toHaveBeenCalled();
    expect(returnRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReturnStatus.REFUNDED }),
    );
  });

  it('does not update DB when Razorpay refund fails', async () => {
    (razorpayInstance.payments.refund as jest.Mock).mockRejectedValue({
      error: { description: 'Insufficient balance' },
    });

    await expect(service.processRefund(returnId)).rejects.toBeInstanceOf(BadGatewayException);
    expect(orderRepo.save).not.toHaveBeenCalled();
    expect(returnRepo.save).not.toHaveBeenCalled();
    expect(notificationsService.sendReturnStatusWhatsApp).not.toHaveBeenCalled();
    expect(notificationsService.sendCustomerNotification).not.toHaveBeenCalled();
  });

  it('skips Razorpay for COD orders and marks refunded in DB', async () => {
    order.paymentMethod = PaymentMethod.COD;
    order.paymentStatus = PaymentStatus.PAID;
    order.razorpayPaymentId = null;
    returnRepo.findOne.mockResolvedValue({
      ...returnRequest,
      order: { ...order },
    });

    await service.processRefund(returnId);

    expect(razorpayInstance.payments.refund).not.toHaveBeenCalled();
    expect(orderRepo.save).toHaveBeenCalled();
    expect(returnRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReturnStatus.REFUNDED }),
    );
  });
});

describe('ReturnsService.adminUpdateReturnStatus', () => {
  let service: ReturnsService;
  let returnRepo: { findOne: jest.Mock; save: jest.Mock };
  let orderRepo: { save: jest.Mock };
  let notificationsService: {
    sendCustomerNotification: jest.Mock;
    sendReturnStatusWhatsApp: jest.Mock;
    sendReturnStatusEmail: jest.Mock;
    sendReturnStatusWhatsAppToSeller: jest.Mock;
    sendReturnStatusEmailToSeller: jest.Mock;
    sendSellerNotification: jest.Mock;
  };

  const seller = {
    id: 'seller-1',
    name: 'Test Seller',
    phone: '9876598765',
    email: 'seller@example.com',
    password: 'secret',
  };
  const customer = {
    id: 'cust-1',
    name: 'Test Customer',
    phone: '9876512345',
    email: 'test@example.com',
    password: 'secret',
  };
  const shop = { id: 'shop-1', name: 'Test Shop', owner: seller };
  const order = {
    id: 'order-1',
    orderNumber: 'LK-1001',
    status: OrderStatus.RETURN_REQUESTED,
    shop,
  };

  beforeEach(() => {
    returnRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (entity) => entity),
    };
    orderRepo = {
      save: jest.fn(async (entity) => entity),
    };
    notificationsService = {
      sendCustomerNotification: jest.fn().mockResolvedValue(undefined),
      sendReturnStatusWhatsApp: jest.fn().mockResolvedValue(undefined),
      sendReturnStatusEmail: jest.fn().mockResolvedValue(undefined),
      sendReturnStatusWhatsAppToSeller: jest.fn().mockResolvedValue(undefined),
      sendReturnStatusEmailToSeller: jest.fn().mockResolvedValue(undefined),
      sendSellerNotification: jest.fn().mockResolvedValue(undefined),
    };

    service = new ReturnsService(
      returnRepo as any,
      orderRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      notificationsService as any,
    );

    jest.clearAllMocks();
  });

  it('notifies customer and seller when admin approves return', async () => {
    returnRepo.findOne.mockResolvedValue({
      id: 'return-1',
      status: ReturnStatus.PENDING,
      order,
      customer,
    });

    await service.adminUpdateReturnStatus('return-1', { status: ReturnStatus.APPROVED });
    await flushAsyncNotifications();

    expect(notificationsService.sendReturnStatusWhatsApp).toHaveBeenCalledWith(
      '9876512345',
      'Test Customer',
      'LK-1001',
      'approved',
      undefined,
    );
    expect(notificationsService.sendReturnStatusWhatsAppToSeller).toHaveBeenCalledWith(
      '9876598765',
      'Test Shop',
      'LK-1001',
      'approved',
      undefined,
    );
    expect(notificationsService.sendSellerNotification).toHaveBeenCalledWith(
      'seller-1',
      'Return approved',
      'Order #LK-1001 at Test Shop: approved',
    );
  });

  it('notifies customer and seller when admin rejects return', async () => {
    returnRepo.findOne.mockResolvedValue({
      id: 'return-1',
      status: ReturnStatus.PENDING,
      order: { ...order },
      customer,
    });

    await service.adminUpdateReturnStatus('return-1', {
      status: ReturnStatus.REJECTED,
      notes: 'Evidence insufficient',
    });
    await flushAsyncNotifications();

    expect(notificationsService.sendReturnStatusWhatsApp).toHaveBeenCalledWith(
      '9876512345',
      'Test Customer',
      'LK-1001',
      'rejected',
      'Evidence insufficient',
    );
    expect(notificationsService.sendReturnStatusWhatsAppToSeller).toHaveBeenCalledWith(
      '9876598765',
      'Test Shop',
      'LK-1001',
      'rejected',
      'Evidence insufficient',
    );
    expect(notificationsService.sendSellerNotification).toHaveBeenCalledWith(
      'seller-1',
      'Return rejected',
      'Order #LK-1001 at Test Shop: rejected',
    );
    expect(orderRepo.save).toHaveBeenCalled();
  });
});
