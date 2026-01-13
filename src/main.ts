import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilita CORS para o frontend (página HTML) conseguir chamar o backend
  app.enableCors();
  
  await app.listen(3000);
}
bootstrap();