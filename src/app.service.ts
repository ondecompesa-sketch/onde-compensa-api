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
    // 1. Upload (Pega o Link para salvar no banco)
    const { publicUrl } = await this.supabaseService.uploadFile(file);

    // 2. Gemini (CORREÇÃO AQUI)
    // O Gemini quer o arquivo cru (buffer) e o tipo dele, não o link.
    const receiptData = await this.geminiService.extractReceiptData(file.buffer, file.mimetype);

    // 3. Salvar Store (SINGULAR)
    const store = await this.prisma.store.upsert({
      where: { cnpj: receiptData.market.cnpj || 'UNKNOWN' },
      update: {},
      create: {
        name: receiptData.market.name,
        cnpj: receiptData.market.cnpj || 'UNKNOWN',
        address: receiptData.market.address,
      },
    });

    // 4. Salvar Recibo (SINGULAR)
    const receipt = await this.prisma.receipt.create({
      data: {
        image_url: publicUrl, // Aqui usamos o link que veio do Supabase
        status: 'PROCESSED',
        total_amount: receiptData.total,
        issue_date: new Date(receiptData.date),
        store_id: store.id,
        user_id: userId,
      },
    });

    // 5. Salvar Itens
    for (const item of receiptData.items) {
      // Product (SINGULAR)
      const product = await this.prisma.product.upsert({ 
        where: { code: item.code || 'UNKNOWN' },
        update: {},
        create: {
          name: item.description,
          code: item.code || 'UNKNOWN',
          category: item.category,
        },
      });

      // ReceiptItem (SINGULAR)
      await this.prisma.receiptItem.create({
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