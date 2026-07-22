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

describe('ReturnsService.processRefund', () => {
  const returnId = 'return-1';
  const customerId = 'cust-1';

  let service: ReturnsService;
  let returnRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let orderRepo: { save: jest.Mock };
  let notificationsService: { sendCustomerNotification: jest.Mock };
  let returnRequest: Record<string, unknown>;
  let order: Record<string, unknown>;

  beforeEach(() => {
    order = {
      id: 'order-1',
      orderNumber: 'LK-1001',
      paymentMethod: PaymentMethod.RAZORPAY,
      paymentStatus: PaymentStatus.PAID,
      razorpayPaymentId: 'pay_test_123',
      status: OrderStatus.DELIVERED,
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
    notificationsService = {
      sendCustomerNotification: jest.fn().mockResolvedValue(undefined),
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
    (razorpayInstance.payments.refund as jest.Mock).mockResolvedValue({ id: 'rfnd_test' });
  });

  it('processes Razorpay refund from approved status', async () => {
    const result = await service.processRefund(returnId);

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
