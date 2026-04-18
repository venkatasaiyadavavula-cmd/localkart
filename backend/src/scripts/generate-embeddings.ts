import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs-node';
import { DataSource } from 'typeorm';
import { Product } from '../core/entities/product.entity';
import * as Jimp from 'jimp';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'localkart',
  entities: [Product],
  synchronize: false,
});

async function downloadImage(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

async function generateEmbeddings() {
  console.log('🚀 Starting embedding generation...');
  await AppDataSource.initialize();
  const productRepo = AppDataSource.getRepository(Product);

  // Find products without embeddings
  const products = await productRepo.find({
    where: { image_embedding: null },
    take: 100, // Process in batches
  });

  if (products.length === 0) {
    console.log('✅ No products need embeddings');
    await AppDataSource.destroy();
    return;
  }

  console.log(`📦 Processing ${products.length} products...`);

  // Load MobileNet model
  const model = await mobilenet.load();
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  let successCount = 0;
  let failCount = 0;

  for (const product of products) {
    const imageUrl = product.images?.[0];
    if (!imageUrl) {
      console.log(`⏭️  Skipping ${product.name} - No image`);
      continue;
    }

    const tempFile = path.join(tempDir, `${product.id}.jpg`);

    try {
      // Download image
      await downloadImage(imageUrl, tempFile);

      // Read and decode image
      const image = await Jimp.read(tempFile);
      const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
      const tensor = tf.node.decodeImage(buffer) as tf.Tensor3D;

      // Generate embedding
      const embedding = model.infer(tensor, true) as tf.Tensor;
      const embeddingArray = Array.from(embedding.dataSync());

      // Update database
      await productRepo.update(
        { id: product.id },
        { image_embedding: () => `'${JSON.stringify(embeddingArray)}'::vector` }
      );

      console.log(`✅ ${product.name} (${embeddingArray.length} dims)`);
      successCount++;

      // Cleanup
      tensor.dispose();
      fs.unlinkSync(tempFile);
    } catch (error: any) {
      console.error(`❌ ${product.name}: ${error.message}`);
      failCount++;
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  }

  // Cleanup temp directory
  fs.rmdirSync(tempDir, { recursive: true });

  console.log(`\n📊 Summary: ${successCount} succeeded, ${failCount} failed`);
  await AppDataSource.destroy();
}

generateEmbeddings().catch(console.error);
