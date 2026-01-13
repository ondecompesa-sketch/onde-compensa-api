import { Controller, Post, Get, Delete, Param, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseService } from './supabase.service';
import { GeminiService } from './gemini.service';
import { ReceiptService } from './receipt.service';

@Controller()
export class AppController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly geminiService: GeminiService,
    private readonly receiptService: ReceiptService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) return { message: 'Nenhum arquivo enviado!' };

    console.log('🚀 Iniciando processamento...');
    const uploadResult = await this.supabaseService.uploadFile(file);
    const finalUrl = uploadResult.publicUrl;

    console.log('🧠 Perguntando para o Gemini...');
    const receiptData = await this.geminiService.extractReceiptData(file.buffer, file.mimetype);

    if (receiptData) {
      try {
        const result = await this.receiptService.saveReceiptData(receiptData, finalUrl);
        
        // Verifica se voltou como duplicada
        if (result.isDuplicate) {
            return {
                message: '⚠️ Atenção: Esta nota fiscal já foi enviada anteriormente!',
                status: 'DUPLICATE',
                url: finalUrl,
                data: receiptData
            };
        }

        return {
            message: 'Nota processada e salva com sucesso!',
            status: 'DONE',
            url: finalUrl,
            db_id: result.id,
            data: receiptData
        };
      } catch (error: any) {
          console.error('Erro:', error);
          return { message: 'Erro ao salvar.', error: error.message };
      }
    }
    return { message: 'Falha ao ler nota fiscal.' };
  }

  @Delete('cleanup')
  async cleanup() {
    return this.receiptService.cleanupGhostReceipts();
  }

  @Get('receipts')
  async listReceipts() {
    return this.receiptService.getAllReceipts();
  }

  @Get('search')
  async search(@Query('q') query: string) {
    return this.receiptService.searchProducts(query);
  }

  // NOVA ROTA: Deletar nota específica por ID
  @Delete('receipts/:id')
  async deleteOne(@Param('id') id: string) {
    return this.receiptService.deleteReceipt(id);
  }
}