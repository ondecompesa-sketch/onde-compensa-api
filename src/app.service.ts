import { Injectable } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { SupabaseService } from './supabase.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async processReceipt(file: Express.Multer.File, userId: string) {
    // 1. Upload
    const publicUrl = await this.supabaseService.uploadFile(file);

    // 2. Gemini
    const receiptData = await this.geminiService.extractReceiptData(publicUrl);

    // 3. Salvar Store
    // CORREÇÃO: stores (Plural, seguindo o padrão do Prisma quando usa @@map("stores"))
    const store = await this.prisma.stores.upsert({
      where: { cnpj: receiptData.market.cnpj || 'UNKNOWN' },
      update: {},
      create: {
        name: receiptData.market.name,
        cnpj: receiptData.market.cnpj || 'UNKNOWN',
        address: receiptData.market.address,
      },
    });

    // 4. Salvar Recibo
    // CORREÇÃO: receipts (Plural)
    const receipt = await this.prisma.receipts.create({
      data: {
        image_url: publicUrl,
        status: 'PROCESSED',
        total_amount: receiptData.total,
        issue_date: new Date(receiptData.date),
        store_id: store.id,
        user_id: userId,
      },
    });

    // 5. Salvar Itens
    for (const item of receiptData.items) {
      const product = await this.prisma.products.upsert({ // products (Plural tb por garantia)
        where: { code: item.code || 'UNKNOWN' },
        update: {},
        create: {
          name: item.description,
          code: item.code || 'UNKNOWN',
          category: item.category,
        },
      });

      // CORREÇÃO: receipt_items (Snake case, conforme o erro pediu)
      await this.prisma.receipt_items.create({
        data: {
          receipt_id: receipt.id,
          product_id: product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          raw_name: item.description,
          unit_measure: item.unit,
        },
      });
    }

    return { message: 'Nota processada com sucesso!', data: receiptData };
  }
}