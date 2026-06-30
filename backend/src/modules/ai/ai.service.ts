import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async extractProductFromImage(file: any) {
    return { name: '', price: 0, description: '' };
  }
  async generateDescription(name: string, category: string) {
    return { description: `High quality ${name} available at your local store.` };
  }
  async removeBackground(file: any) {
    return file;
  }
  async sendWeeklyEarnings() {
    return { sent: 0 };
  }
  async processProductImages(files: any[]) {
    return {
      products: [],
      suggestedName: '',
      suggestedPrice: 0,
      suggestedUnit: '',
      suggestedDescription: '',
      suggestedCategory: '',
      confidence: 0,
    };
  }
  async manualStockCheck() {
    return { checked: 0 };
  }
}
