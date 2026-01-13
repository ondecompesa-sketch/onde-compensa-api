import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

  // 1. Salvar Nota
  async saveReceiptData(data: any, imageUrl: string) {
    console.log('💾 Tentando salvar nota...');

    const cnpj = data.market_cnpj?.replace(/\D/g, '') || null; 
    
    let store;
    if (cnpj) {
        store = await this.prisma.stores.upsert({
            where: { cnpj: cnpj },
            update: {}, 
            create: { name: data.market_name || 'Loja Desconhecida', cnpj: cnpj, raw_ocr_name: data.market_name },
        });
    } else {
        store = await this.prisma.stores.create({
            data: { name: data.market_name || 'Loja Sem CNPJ', raw_ocr_name: data.market_name }
        });
    }

    const receiptDate = data.date ? new Date(data.date) : new Date();

    // Verificação de Duplicidade
    const existingReceipt = await this.prisma.receipts.findFirst({
        where: {
            store_id: store.id,
            total_amount: data.total_amount,
            issue_date: receiptDate
        }
    });

    if (existingReceipt) {
        console.log('⚠️ Nota duplicada detectada! Retornando existente.');
        return { ...existingReceipt, isDuplicate: true };
    }

    // Cria a nota
    const receipt = await this.prisma.receipts.create({
      data: {
        store_id: store.id,
        total_amount: data.total_amount,
        issue_date: receiptDate,
        image_url: imageUrl,
        status: 'PROCESSED',
        raw_response: data, 
      },
    });

    // Salva os itens
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        
        // Tenta achar o produto existente
        let product = await this.prisma.products.findFirst({
            where: { normalized_name: item.product_name }
        });

        const novaCategoria = item.category || 'Outros';

        if (!product) {
            // PRODUTO NOVO: Cria já com a categoria certa
            product = await this.prisma.products.create({
                data: {
                    normalized_name: item.product_name,
                    category: novaCategoria
                }
            });
        } else {
            // --- A CORREÇÃO MÁGICA AQUI ---
            // PRODUTO EXISTENTE: Se for 'Outros', atualizamos!
            if (product.category === 'Outros' && novaCategoria !== 'Outros') {
                console.log(`🔄 Atualizando categoria de ${item.product_name}: Outros -> ${novaCategoria}`);
                product = await this.prisma.products.update({
                    where: { id: product.id },
                    data: { category: novaCategoria }
                });
            }
        }

        await this.prisma.receipt_items.create({
            data: {
                receipt_id: receipt.id,
                product_id: product.id,
                raw_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                unit_measure: item.unit_measure
            }
        });
      }
    }

    console.log(`✅ Nota salva com sucesso! ID: ${receipt.id}`);
    return { ...receipt, isDuplicate: false };
  }

  // 2. Faxina
  async cleanupGhostReceipts() {
    const result = await this.prisma.receipts.deleteMany({
      where: { receipt_items: { none: {} } },
    });
    return { count: result.count, message: `Faxina concluída! ${result.count} notas vazias apagadas.` };
  }

  // 3. Listagem (Agora trazendo a categoria do produto!)
  async getAllReceipts() {
    return this.prisma.receipts.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        stores: true,
        receipt_items: {
          include: { 
            products: true // <--- O SEGREDO: Traz a categoria (Bebidas, Limpeza...) junto!
          }
        }
      }
    });
  }

  // 4. Busca
  async searchProducts(query: string) {
    if (!query || query.length < 3) return [];
    return this.prisma.receipt_items.findMany({
      where: { raw_name: { contains: query, mode: 'insensitive' } },
      include: { receipts: { include: { stores: true } } },
      orderBy: { receipts: { issue_date: 'desc' } },
      take: 20
    });
  }

  // 5. Deletar
  async deleteReceipt(id: string) {
    await this.prisma.receipt_items.deleteMany({ where: { receipt_id: id } });
    return this.prisma.receipts.delete({ where: { id: id } });
  }
}