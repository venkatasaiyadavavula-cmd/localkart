import { ProductCategoryType, ProductStatus } from '../../core/entities/product.entity';
import { productUpdateRequiresReapproval } from './product-reapproval.util';

const baseProduct = {
  name: 'Rice 1kg',
  description: 'Good rice',
  price: 100,
  mrp: 120,
  categoryType: ProductCategoryType.GROCERIES,
  categoryId: undefined as string | undefined,
  images: ['https://cdn/img1.jpg'],
};

describe('productUpdateRequiresReapproval', () => {
  it('returns false for videos-only payload', () => {
    expect(
      productUpdateRequiresReapproval(
        { videos: ['https://cdn/v.mp4'] },
        baseProduct,
      ),
    ).toBe(false);
  });

  it('returns false when re-review fields are present but unchanged', () => {
    expect(
      productUpdateRequiresReapproval(
        {
          name: baseProduct.name,
          price: baseProduct.price,
          images: [...baseProduct.images],
          videos: ['https://cdn/v.mp4'],
        },
        baseProduct,
      ),
    ).toBe(false);
  });

  it('returns true when price changes', () => {
    expect(productUpdateRequiresReapproval({ price: 99 }, baseProduct)).toBe(true);
  });

  it('returns true when images change', () => {
    expect(
      productUpdateRequiresReapproval(
        { images: ['https://cdn/img1.jpg', 'https://cdn/img2.jpg'] },
        baseProduct,
      ),
    ).toBe(true);
  });

  it('returns true for mixed videos + price change', () => {
    expect(
      productUpdateRequiresReapproval(
        { videos: ['https://cdn/v.mp4'], price: 50 },
        baseProduct,
      ),
    ).toBe(true);
  });
});
