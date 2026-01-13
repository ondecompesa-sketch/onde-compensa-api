// src/check-models.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Carrega o .env
dotenv.config();

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  
  if (!key) {
    console.error('❌ Nenhuma chave encontrada no .env!');
    return;
  }

  console.log('🔑 Usando chave final:', key.slice(-4));
  console.log('📡 Conectando ao Google para listar modelos...');

  const genAI = new GoogleGenerativeAI(key);

  try {
    // Busca a lista de modelos disponíveis
    const modelResponse = await genAI.getGenerativeModel({ model: 'gemini-pro' }).apiKey; // Apenas para instanciar, o list vem do client geralmente, mas na SDK nova é diferente.
    // Correção: A SDK Node usa o método listModels no getGenerativeModel? Não, é direto no gerenciador.
    // Vamos usar a abordagem direta da documentação:
    
    // Hack para acessar a lista (a SDK Node simplificada foca em getModel)
    // Vamos testar um modelo básico para ver se o erro muda, mas o ideal é ver o erro de permissão.
    
    // Vamos tentar instanciar o modelo "gemini-pro" e ver se ele responde a um 'oi' simples.
    // Se falhar, vamos pegar o erro detalhado.
    
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Oi, você está vivo?');
    console.log('✅ SUCESSO! O modelo gemini-pro respondeu:', result.response.text());

  } catch (error: any) {
    console.error('❌ ERRO AO TESTAR MODELO:');
    console.error(error.message);
    
    if (error.response) {
        console.error('Detalhes:', JSON.stringify(error.response, null, 2));
    }
  }
}

listModels();