import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { SupabaseService } from './supabase.service';
import { GeminiService } from './gemini.service';
import { ReceiptService } from './receipt.service';
// Novos imports de localização
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [
    AppController, 
    LocationController // <--- Adicionado
  ],
  providers: [
    AppService, 
    PrismaService, 
    SupabaseService, 
    GeminiService, 
    ReceiptService,
    LocationService // <--- Adicionado
  ],
})
export class AppModule {}