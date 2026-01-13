import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fetch from 'cross-fetch'; // <--- A solução mágica

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_KEY?.trim();

    console.log('🔌 Conectando ao Supabase...');

    if (!url || !key) {
      throw new Error('❌ ERRO CRÍTICO: Faltam variáveis no .env');
    }

    // Configura o cliente para usar o fetch estável (HTTP/1.1)
    this.supabase = createClient(url, key, {
      auth: {
        persistSession: false
      },
      global: {
        fetch: fetch as any, // <--- Aqui forçamos a troca do motor
      }
    });
  }

  async uploadFile(file: Express.Multer.File) {
    const fileName = `${Date.now()}_${file.originalname.replace(/\s/g, '')}`;

    console.log('📤 Enviando arquivo:', fileName);

    const { data, error } = await this.supabase.storage
      .from('notas-fiscais')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('❌ Erro no Supabase:', error);
      throw new Error('Falha no upload: ' + error.message);
    }

    const { data: publicUrlData } = this.supabase.storage
      .from('notas-fiscais')
      .getPublicUrl(fileName);

    return { publicUrl: publicUrlData.publicUrl };
  }
}