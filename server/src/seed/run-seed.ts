import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function run() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const seeder = app.get(SeedService);
  try {
    await seeder.seed();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
  await app.close();
}

run();
