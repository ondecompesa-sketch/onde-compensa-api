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

    // 2. Gemini
    // Envia o arquivo Buffer e o MimeType corretamente
    const receiptData = await this.geminiService.extractReceiptData(file.buffer, file.mimetype);

    // --- BLINDAGEM CONTRA ERROS ---
    // Se o Gemini não achou 'market', criamos um objeto vazio para não dar erro
    const market = receiptData.market || {};
    
    // Se não tem CNPJ, usamos 'UNKNOWN'
    const cnpjToUse = market.cnpj || 'UNKNOWN';
    
    // Se não tem Nome, usamos 'Mercado Desconhecido'
    const nameToUse = market.name || 'Mercado Desconhecido';
    
    // Se não tem Endereço, deixamos vazio
    const addressToUse = market.address || '';
    // -----------------------------

    // 3. Salvar Store
    const store = await this.prisma.store.upsert({
      where: { cnpj: cnpjToUse },
      update: {}, // Se já existe, não faz nada
      create: {
        name: nameToUse,
        cnpj: cnpjToUse,
        address: addressToUse,
      },
    });

    // 4. Salvar Recibo
    const receipt = await this.prisma.receipt.create({
      data: {
        image_url: publicUrl,
        status: 'PROCESSED',
        total_amount: receiptData.total || 0, // Proteção se o total vier nulo
        issue_date: receiptData.date ? new Date(receiptData.date) : new Date(), // Proteção se a data vier nula
        store_id: store.id,
        user_id: userId,
      },
    });

    // 5. Salvar Itens
    // Proteção: Se receiptData.items for nulo, usa array vazio []
    const items = receiptData.items || [];

    for (const item of items) {
      // Proteção para itens sem código
      const codeToUse = item.code || `GENERIC_${Math.random().toString(36).substring(7)}`;

      const product = await this.prisma.product.upsert({ 
        where: { code: codeToUse },
        update: {},
        create: {
          name: item.description || 'Produto Sem Nome',
          code: codeToUse,
          category: item.category || 'Outros',
        },
      });

      await this.prisma.receiptItem.create({
        data: {
          receipt_id: receipt.id,
          product_id: product.id,
          quantity: item.quantity || 1,
          unit_price: item.unitPrice || 0,
          total_price: item.totalPrice || 0,
          raw_name: item.description || 'Item',
          unit_measure: item.unit || 'UN',
        },
      });
    }

    return { message: 'Nota processada com sucesso!', data: receiptData };
  }
}