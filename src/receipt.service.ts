import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

  // Busca todas as notas de um usuário
  async findAll(userId: string) {
    if (!userId) return [];
    
    // CORREÇÃO: receipts (plural)
    return this.prisma.receipts.findMany({
      where: { user_id: userId },
      orderBy: { issue_date: 'desc' },
      include: {
        stores: true,
        // CORREÇÃO: receiptItems (CamelCase)
        receiptItems: {
          include: { products: true },
        },
      },
    });
  }

  // Busca produtos dentro das notas
  async search(query: string, userId: string) {
    if (!userId) return [];
    
    // CORREÇÃO: receiptItems (CamelCase)
    return this.prisma.receiptItems.findMany({
      where: {
        raw_name: { contains: query, mode: 'insensitive' },
        receipt: { user_id: userId } // receipt no singular aqui pois é o nome da relação dentro do item
      },
      include: {
        receipt: { include: { stores: true } },
        products: true
      },
      take: 20,
    });
  }

  async delete(id: string) {
    // CORREÇÃO: receipts (plural)
    return this.prisma.receipts.delete({ where: { id } });
  }

  async cleanup() {
    // CORREÇÃO: receipts (plural)
    return this.prisma.receipts.deleteMany({
      where: { status: 'ERROR' },
    });
  }
}