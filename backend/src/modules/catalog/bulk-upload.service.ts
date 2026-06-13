import { Injectable } from '@nestjs/common';

@Injectable()
export class BulkUploadService {
  async uploadProducts(file: any, shopId: string) {
    return { message: 'Bulk upload coming soon' };
  }
  async downloadTemplate() {
    return Buffer.from('name,price,stock\nSample Product,100,10');
  }
}
