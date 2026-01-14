import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed do IBGE...');

  // 1. Ler o arquivo JSON gerado
  const caminhoArquivo = path.join(__dirname, '../rj_ibge_completo.json');
  
  if (!fs.existsSync(caminhoArquivo)) {
    console.error('❌ Erro: Arquivo rj_ibge_completo.json não encontrado na raiz!');
    process.exit(1);
  }

  const dadosRaw = fs.readFileSync(caminhoArquivo, 'utf-8');
  const dados = JSON.parse(dadosRaw);
  const estado = dados.estado;

  console.log(`📍 Processando Estado: ${estado.nome} (${estado.uf})...`);

  // 2. Criar ou Atualizar Estado (RJ)
  await prisma.state.upsert({
    where: { id: estado.codigo_ibge },
    update: {},
    create: {
      id: estado.codigo_ibge,
      name: estado.nome,
      uf: estado.uf,
    },
  });

  // 3. Processar Municípios e Distritos
  let totalCidades = 0;
  let totalBairros = 0;

  for (const municipio of estado.municipios) {
    // Cria Cidade
    await prisma.city.upsert({
      where: { id: municipio.codigo_ibge },
      update: {},
      create: {
        id: municipio.codigo_ibge,
        name: municipio.nome,
        stateId: estado.codigo_ibge,
      },
    });
    totalCidades++;

    // Cria Distritos (Bairros)
    for (const bairro of municipio.bairros) {
      await prisma.district.upsert({
        where: { id: bairro.codigo_ibge },
        update: {},
        create: {
          id: bairro.codigo_ibge,
          name: bairro.nome,
          cityId: municipio.codigo_ibge,
        },
      });
      totalBairros++;
    }
    
    // Feedback visual a cada 10 cidades para não poluir o log
    if (totalCidades % 10 === 0) console.log(`   Processed ${totalCidades} cities...`);
  }

  console.log(`\n✅ Seed Concluído!`);
  console.log(`🏙️  Cidades: ${totalCidades}`);
  console.log(`🏡 Bairros/Distritos: ${totalBairros}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });