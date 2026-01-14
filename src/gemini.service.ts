import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    // Usamos o ConfigService para garantir que pegue a variável no Render
    const key = this.configService.get<string>('GEMINI_API_KEY');
    console.log('🔑 Gemini Service Iniciado. Chave final:', key?.slice(-4));
    this.genAI = new GoogleGenerativeAI(key || '');
  }

  async extractReceiptData(fileBuffer: Buffer, mimeType: string) {
    // USANDO O SEU MODELO QUE FUNCIONA
    const model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    console.log('🤖 Enviando imagem para o Gemini...');

    // SEU PROMPT EXATO (Com as categorias)
    const prompt = `
      Analise esta nota fiscal brasileira.
      Retorne APENAS um JSON válido (sem markdown, sem \`\`\`json) com a seguinte estrutura:
      {
        "market_name": "String",
        "market_cnpj": "String",
        "date": "YYYY-MM-DD",
        "total_amount": Number,
        "items": [
          {
            "product_name": "String",
            "quantity": Number,
            "unit_price": Number,
            "total_price": Number,
            "unit_measure": "String (UN, KG, L, etc)",
            "category": "String"
          }
        ]
      }

      Regra para "category": Classifique cada item em UMA destas opções:
      - Açougue (Carnes, frangos, peixes)
      - Hortifruti (Frutas, legumes, verduras)
      - Bebidas (Sucos, refrigerantes, cervejas, água)
      - Limpeza (Sabão, detergente, água sanitária)
      - Higiene (Shampoo, sabonete, papel higiênico)
      - Mercearia (Arroz, feijão, macarrão, óleo, biscoitos)
      - Padaria (Pães, bolos, salgados)
      - Laticínios (Leite, queijo, iogurte, manteiga)
      - Outros (Se não se encaixar em nenhuma acima)
    `;

    const imagePart = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: mimeType,
      },
    };

    try {
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      
      // Limpeza extra para garantir que venha só o JSON puro
      let text = response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Garante que pega só o objeto JSON caso venha texto antes/depois
      const firstBracket = text.indexOf('{');
      const lastBracket = text.lastIndexOf('}');
      if (firstBracket !== -1 && lastBracket !== -1) {
        text = text.substring(firstBracket, lastBracket + 1);
      }
      
      console.log('✅ SUCESSO! JSON Recebido!');
      return JSON.parse(text);

    } catch (error) {
      console.error('❌ Erro Fatal no Gemini:', error);
      // Retorno de emergência para não travar o app
      return {
        market_name: "Erro Leitura",
        market_cnpj: null,
        total_amount: 0,
        items: []
      };
    }
  }
}