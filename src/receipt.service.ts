import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    if (!userId) return [];
    
    return this.prisma.receipt.findMany({
      where: { user_id: userId },
      orderBy: { issue_date: 'desc' },
      include: {
        store: true, 
        receipt_items: { 
          // AQUI ESTAVA O ERRO: Era 'products', agora é 'product' (Singular, igual no schema)
          include: { product: true }, 
        },
      },
    });
  }

  async search(query: string, userId: string) {
    if (!userId) return [];
    
    return this.prisma.receiptItem.findMany({
      where: {
        raw_name: { contains: query, mode: 'insensitive' },
        receipt: { user_id: userId } 
      },
      include: {
        receipt: { include: { store: true } },
        product: true 
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