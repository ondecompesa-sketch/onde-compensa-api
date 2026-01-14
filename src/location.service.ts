import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  // Busca todas as cidades de um Estado (Ex: RJ = 33)
  async getCities(stateId: string) {
    return this.prisma.city.findMany({
      where: { stateId },
      orderBy: { name: 'asc' }, // Ordem alfabética
    });
  }

  // Busca todos os bairros (distritos) de uma Cidade
  async getDistricts(cityId: string) {
    return this.prisma.district.findMany({
      where: { cityId },
      orderBy: { name: 'asc' },
    });
  }
}