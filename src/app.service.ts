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
    const { publicUrl } = await this.supabaseService.uploadFile(file);

    // 2. Gemini
    const receiptData = await this.geminiService.extractReceiptData(file.buffer, file.mimetype);
    console.log("Dados do Gemini:", JSON.stringify(receiptData));

    // --- MAPEAMENTO (Do seu JSON para o Banco) ---
    // Seu prompt retorna "market_name", "market_cnpj", etc.
    const cnpjToUse = receiptData.market_cnpj || 'UNKNOWN';
    const nameToUse = receiptData.market_name || 'Mercado Desconhecido';
    
    // Tratamento de data e total
    const dateToUse = receiptData.date ? new Date(receiptData.date) : new Date();
    const totalToUse = receiptData.total_amount || 0;
    // ---------------------------------------------

    // 3. Salvar Store
    const store = await this.prisma.store.upsert({
      where: { cnpj: cnpjToUse },
      update: {},
      create: {
        name: nameToUse,
        cnpj: cnpjToUse,
        address: 'Endereço não lido', // Seu prompt novo não pede endereço, deixamos padrão
      },
    });

    // 4. Salvar Recibo
    const receipt = await this.prisma.receipt.create({
      data: {
        image_url: publicUrl,
        status: 'PROCESSED',
        total_amount: totalToUse,
        issue_date: dateToUse,
        store_id: store.id,
        user_id: userId,
      },
    });

    // 5. Salvar Itens
    const items = receiptData.items || [];

    for (const item of items) {
      const codeToUse = `GENERIC_${Math.random().toString(36).substring(7)}`; // Geramos código pois seu prompt não pede

      const product = await this.prisma.product.upsert({ 
        where: { code: codeToUse },
        update: {},
        create: {
          name: item.product_name || 'Produto', // Mapeado de product_name
          code: codeToUse,
          category: item.category || 'Outros',
        },
      });

      await this.prisma.receiptItem.create({
        data: {
          receipt_id: receipt.id,
          product_id: product.id,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          raw_name: item.product_name || 'Item',
          unit_measure: item.unit_measure || 'UN',
        },
      });
    }

    return { message: 'Nota processada com sucesso!', data: receiptData };
  }
}