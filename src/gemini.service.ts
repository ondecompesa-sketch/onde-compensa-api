import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    // Garante que a chave não seja undefined
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async extractReceiptData(imageBuffer: Buffer, mimeType: string) {
    // CORREÇÃO: Mudamos de 'gemini-1.5-flash' para 'gemini-1.5-pro'
    // O modelo Pro é mais robusto e evita o erro 404 de modelo não encontrado
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      Analise esta imagem de Nota Fiscal (NFC-e ou CF-e) brasileira.
      Extraia os dados e retorne APENAS um objeto JSON válido, sem markdown (sem \`\`\`json).
      
      Estrutura obrigatória:
      {
        "market": {
          "name": "Nome da Loja (limpo)",
          "cnpj": "XX.XXX.XXX/XXXX-XX (apenas números e pontuação)",
          "address": "Endereço completo"
        },
        "date": "YYYY-MM-DDTHH:mm:ss (Data de emissão ISO)",
        "total": 0.00 (Número float, troque vírgula por ponto),
        "items": [
          {
            "description": "Nome do produto exato como na nota",
            "quantity": 1.000 (Número float),
            "unit": "UN/KG/L (Unidade de medida)",
            "unitPrice": 0.00 (Preço unitário float),
            "totalPrice": 0.00 (Preço total float),
            "code": "Código do produto ou EAN",
            "category": "Categoria sugerida (ex: Bebidas, Açougue, Limpeza, etc)"
          }
        ]
      }

      Regras Importantes:
      1. Se não encontrar o CNPJ, tente ler do QR Code ou cabeçalho.
      2. Converta todas as vírgulas de valores monetários para pontos (Ex: 10,50 vira 10.50).
      3. Categorize os produtos automaticamente baseado no nome.
      4. NÃO invente dados. Se não estiver legível, deixe null.
    `;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: mimeType,
          },
        },
      ]);

      const response = await result.response;
      let text = response.text();

      // --- LIMPEZA CIRÚRGICA DO JSON ---
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const firstBracket = text.indexOf('{');
      const lastBracket = text.lastIndexOf('}');
      if (firstBracket !== -1 && lastBracket !== -1) {
        text = text.substring(firstBracket, lastBracket + 1);
      }
      // ----------------------------------

      const data = JSON.parse(text);
      return data;

    } catch (error) {
      console.error("Erro ao processar imagem no Gemini:", error);
      // Retorna estrutura vazia para não derrubar o servidor
      return {
        market: { name: "Erro de Leitura", cnpj: null, address: null },
        date: new Date().toISOString(),
        total: 0,
        items: []
      };
    }
  }
}