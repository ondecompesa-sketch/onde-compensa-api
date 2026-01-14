import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  // Busca todas as cidades de um Estado
  async getCities(stateId: string) {
    // VOLTAMOS PARA O SINGULAR (Padrão do Prisma quando o Schema estiver certo)
    return this.prisma.city.findMany({
      where: { stateId },
      orderBy: { name: 'asc' }, 
    });
  }

  // Busca todos os bairros (distritos) de uma Cidade
  async getDistricts(cityId: string) {
    // VOLTAMOS PARA O SINGULAR
    return this.prisma.district.findMany({
      where: { cityId },
      orderBy: { name: 'asc' },
    });
  }
}