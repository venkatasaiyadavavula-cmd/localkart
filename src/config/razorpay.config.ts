import Razorpay from 'razorpay';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

const razorpayInstance = new Razorpay({
  key_id: configService.get('RAZORPAY_KEY_ID') || 'test_key_id',
  key_secret: configService.get('RAZORPAY_KEY_SECRET') || 'test_key_secret',
});

export default razorpayInstance;
