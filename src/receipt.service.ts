import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    if (!userId) return [];
    
    // CORREÇÃO: receipts (plural)
    return this.prisma.receipts.findMany({
      where: { user_id: userId },
      orderBy: { issue_date: 'desc' },
      include: {
        store: true, // Aqui é o nome da RELAÇÃO (dentro do model Receipt), então fica 'store' (singular)
        receipt_items: { 
          include: { products: true },
        },
      },
    });
  }

  async search(query: string, userId: string) {
    if (!userId) return [];
    
    // CORREÇÃO: receipt_items (Snake case, conforme o erro pediu)
    return this.prisma.receipt_items.findMany({
      where: {
        raw_name: { contains: query, mode: 'insensitive' },
        receipt: { user_id: userId } 
      },
      include: {
        receipt: { include: { store: true } },
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