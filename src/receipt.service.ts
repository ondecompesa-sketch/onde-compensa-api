import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    if (!userId) return [];
    
    // Plural: receipts
    return this.prisma.receipts.findMany({
      where: { user_id: userId },
      orderBy: { issue_date: 'desc' },
      include: {
        stores: true, // MUDANÇA: store -> stores (Plural, seguindo o padrão que o erro indicou)
        receipt_items: { 
          include: { products: true },
        },
      },
    });
  }

  async search(query: string, userId: string) {
    if (!userId) return [];
    
    // Plural: receipt_items
    return this.prisma.receipt_items.findMany({
      where: {
        raw_name: { contains: query, mode: 'insensitive' },
        receipts: { user_id: userId } // MUDANÇA: receipt -> receipts (Plural)
      },
      include: {
        receipts: { include: { stores: true } }, // MUDANÇA: receipt -> receipts E store -> stores
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