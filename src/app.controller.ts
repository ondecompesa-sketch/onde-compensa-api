import { Controller, Get, Post, UploadedFile, UseInterceptors, Body, Query, Delete, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import { ReceiptService } from './receipt.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly receiptService: ReceiptService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string, // <--- Recebe o ID do usuário
  ) {
    // Passamos o userId para o processamento
    return this.appService.processReceipt(file, userId);
  }

  @Get('receipts')
  getReceipts(@Query('userId') userId: string) { // <--- Recebe o ID na busca
    return this.receiptService.findAll(userId);
  }

  @Get('search')
  search(@Query('q') query: string, @Query('userId') userId: string) {
    return this.receiptService.search(query, userId);
  }

  @Delete('receipts/:id')
  delete(@Param('id') id: string) {
    return this.receiptService.delete(id);
  }

  @Delete('cleanup')
  cleanup() {
    return this.receiptService.cleanup();
  }
}