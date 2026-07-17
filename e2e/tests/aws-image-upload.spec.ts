/**
 * E2E: seller product image upload to real S3 bucket on production.
 */
import path from 'path';
import { test, expect } from '../qa-fixtures';
import { clearAuth, loginSeller, API } from '../helpers';
import { getAdminToken, authHeaders } from '../api-helpers';

const FIXTURE_IMAGE = path.join(__dirname, '../fixtures/test-product.png');

test('seller creates product with image — uploads to S3 and renders', async ({ page, request }) => {
  const productName = `AWS Img E2E ${Date.now()}`;
  let uploadedPublicUrl = '';

  await clearAuth(page);
  await loginSeller(page);

  await page.goto('/dashboard/products/new', { waitUntil: 'networkidle' });

  await page.locator('#name').fill(productName);
  await page.locator('#price').fill('149');
  await page.locator('#stock').fill('5');
  await page.locator('#description').fill('E2E image upload verification');
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: /groceries/i }).click();

  const fileInput = page.locator('input[type="file"][accept*="image"]').first();
  await fileInput.setInputFiles(FIXTURE_IMAGE);
  await expect(page.getByText('(1/5)')).toBeVisible();

  const uploadResponsePromise = page.waitForResponse(
    (r) => r.url().includes('/media/upload') && r.request().method() === 'POST',
    { timeout: 60_000 },
  );
  const createResponsePromise = page.waitForResponse(
    (r) => r.url().includes('/catalog/seller/products') && r.request().method() === 'POST',
    { timeout: 120_000 },
  );

  await page.getByRole('button', { name: /create product/i }).click();

  const uploadRes = await uploadResponsePromise;
  expect(uploadRes.ok(), `media upload failed: ${uploadRes.status()}`).toBeTruthy();
  const uploadBody = await uploadRes.json();
  const uploadData = uploadBody?.data ?? uploadBody;
  uploadedPublicUrl = uploadData?.publicUrl ?? '';
  const presignedUrl = uploadData?.uploadUrl ?? '';

  expect(presignedUrl).not.toContain('your_access_key');
  expect(presignedUrl).not.toMatch(/x-amz-acl/i);
  expect(presignedUrl).toMatch(/AKIA/);
  expect(uploadedPublicUrl).toMatch(/^https:\/\/localkart-media\.s3(\.[a-z0-9-]+)?\.amazonaws\.com\/uploads\//);

  const createRes = await createResponsePromise;
  expect(createRes.ok(), `create product failed: ${createRes.status()}`).toBeTruthy();
  const createBody = await createRes.json();
  const product = createBody?.data ?? createBody;
  const productId = product?.id as string;
  expect(productId).toBeTruthy();

  await expect(page).toHaveURL(/\/dashboard\/products/, { timeout: 30_000 });

  const cardOrText = page.getByText(productName, { exact: false }).first();
  await expect(cardOrText).toBeVisible({ timeout: 20_000 });

  const imageFile = uploadedPublicUrl.split('/').pop()!;
  const dashboardImg = page.locator(`img[src*="${imageFile}"]`).first();
  await expect(dashboardImg).toBeVisible({ timeout: 20_000 });

  const adminToken = await getAdminToken(request);
  const approveRes = await request.put(`${API}/admin/products/${productId}/approve`, {
    headers: authHeaders(adminToken),
  });
  expect(approveRes.ok(), `admin approve failed: ${approveRes.status()}`).toBeTruthy();

  const slug = product?.slug as string | undefined;
  expect(slug, 'product slug required for public page').toBeTruthy();

  await page.goto(`/browse/groceries/product/${slug}`, { waitUntil: 'networkidle' });
  const publicImg = page.locator(`img[src*="${imageFile}"]`).first();
  await expect(publicImg).toBeVisible({ timeout: 20_000 });

  console.log('UPLOADED_IMAGE_URL:', uploadedPublicUrl);
});
