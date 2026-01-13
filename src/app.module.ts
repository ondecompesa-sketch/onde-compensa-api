import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { GeminiService } from './gemini.service';
import { SupabaseService } from './supabase.service';
import { PrismaService } from './prisma.service'; // <--- NOVO
import { ReceiptService } from './receipt.service'; // <--- NOVO

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [
    GeminiService, 
    SupabaseService, 
    PrismaService, // <--- NOVO
    ReceiptService // <--- NOVO
  ],
})
export class AppModule {}