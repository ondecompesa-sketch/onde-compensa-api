import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  // Busca todas as cidades de um Estado
  async getCities(stateId: string) {
    // CORREÇÃO: city -> cities (Plural)
    return this.prisma.cities.findMany({
      where: { stateId },
      orderBy: { name: 'asc' }, 
    });
  }

  // Busca todos os bairros (distritos) de uma Cidade
  async getDistricts(cityId: string) {
    // CORREÇÃO: district -> districts (Plural)
    return this.prisma.districts.findMany({
      where: { cityId },
      orderBy: { name: 'asc' },
    });
  }
}