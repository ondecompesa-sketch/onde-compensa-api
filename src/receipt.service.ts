import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReceiptService {
  constructor(private prisma: PrismaService) {}

  // Agora filtra pelo userId
  async findAll(userId: string) {
    if (!userId) return []; // Se não tiver ID, não devolve nada (Segurança)
    
    return this.prisma.receipt.findMany({
      where: { user_id: userId }, // <--- O Filtro Mágico
      orderBy: { issue_date: 'desc' },
      include: {
        stores: true,
        receipt_items: {
          include: { products: true },
        },
      },
    });
  }

  async search(query: string, userId: string) {
    if (!userId) return [];
    
    return this.prisma.receipt_item.findMany({
      where: {
        raw_name: { contains: query, mode: 'insensitive' },
        receipts: { user_id: userId } // Busca só nas notas desse usuário
      },
      include: {
        receipts: { include: { stores: true } },
        products: true
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