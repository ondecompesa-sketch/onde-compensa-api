import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    if (!userId) return [];
    
    // VOLTOU PARA SINGULAR (Padrão correto)
    return this.prisma.receipt.findMany({
      where: { user_id: userId },
      orderBy: { issue_date: 'desc' },
      include: {
        store: true, // Singular (Nome da relação no Schema)
        receipt_items: { // Esse fica assim mesmo, é o nome do array de itens no Schema
          include: { products: true }, // products é o nome da tabela no map, mas o prisma gera 'product' se o model for Product. 
          // Vamos tentar 'product' aqui se der erro, mas geralmente relations usam o nome do campo. 
          // No seu schema: product Product? -> então é 'product'.
        },
      },
    });
  }

  async search(query: string, userId: string) {
    if (!userId) return [];
    
    // VOLTOU PARA SINGULAR (Model ReceiptItem -> prisma.receiptItem)
    return this.prisma.receiptItem.findMany({
      where: {
        raw_name: { contains: query, mode: 'insensitive' },
        receipt: { user_id: userId } // Singular (Relação com a nota)
      },
      include: {
        receipt: { include: { store: true } }, // Singular
        product: true // Singular (Relação com produto)
      },
      take: 20,
    });
  }

  async delete(id: string) {
    return this.prisma.receipt.delete({ where: { id } });
  }

  async cleanup() {
    return this.prisma.receipt.deleteMany({
      where: { status: 'ERROR' },
    });
  }
}