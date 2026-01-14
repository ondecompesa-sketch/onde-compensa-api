import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    if (!userId) return [];
    
    // Tente 'receipts' (plural) pois o erro anterior pediu isso.
    // Se der erro de novo dizendo que 'receipts' não existe, mude para 'receipt' (singular).
    return this.prisma.receipts.findMany({
      where: { user_id: userId },
      orderBy: { issue_date: 'desc' },
      include: {
        store: true, // <--- CORREÇÃO: Singular (store), pois no schema é 'store Store?'
        receipt_items: { // <--- CORREÇÃO: Com underline, pois no schema é 'receipt_items'
          include: { products: true },
        },
      },
    });
  }

  async search(query: string, userId: string) {
    if (!userId) return [];
    
    // Aqui provavelmente é 'receiptItem' (Singular) pois o model é ReceiptItem
    // Mas se o seu Prisma gerou diferente, olhe o erro. Vou tentar o padrão Singular.
    return this.prisma.receiptItem.findMany({
      where: {
        raw_name: { contains: query, mode: 'insensitive' },
        receipt: { user_id: userId } 
      },
      include: {
        receipt: { include: { store: true } }, // <--- CORREÇÃO: Singular (store)
        products: true
      },
      take: 20,
    });
  }

  async delete(id: string) {
    return this.prisma.receipts.delete({ where: { id } });
  }

  async cleanup() {
    return this.prisma.receipts.deleteMany({
      where: { status: 'ERROR' },
    });
  }
}