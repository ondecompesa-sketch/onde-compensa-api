/**
 * Script de Geração de Base Oficial IBGE - Rio de Janeiro (UF 33)
 * Autor: OndeCompensa (Gerado via Gemini)
 * Objetivo: Criar JSON hierárquico Estado -> Municípios -> Distritos
 */

const fs = require('fs');
const path = require('path');

// CONFIGURAÇÕES
const UF_ALVO = 33; // Rio de Janeiro
const ARQUIVO_SAIDA = 'rj_ibge_completo.json';
const BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades';

// Delay para não sobrecarregar a API do IBGE (Boas práticas)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchComRetry(url, tentativas = 3) {
    for (let i = 0; i < tentativas; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn(`⚠️ Tentativa ${i + 1} falhou para ${url}: ${error.message}`);
            if (i === tentativas - 1) throw error;
            await delay(1000); // Espera 1s antes de tentar de novo
        }
    }
}

async function gerarBaseIBGE() {
    console.log('🚀 Iniciando geração da base IBGE para UF:', UF_ALVO);
    console.time('Tempo Total');

    try {
        // 1. Buscar dados do Estado
        console.log('📥 Buscando informações do Estado...');
        // A API de estados retorna um array, pegamos o primeiro filtro ou buscamos direto
        const estados = await fetchComRetry(`${BASE_URL}/estados/${UF_ALVO}`);
        // A API retorna um objeto único se passarmos o ID, ou array se não passarmos.
        // O endpoint /estados/33 retorna o objeto direto.
        const dadosEstado = {
            nome: estados.nome,
            uf: estados.sigla,
            codigo_ibge: `${estados.id}`,
            municipios: []
        };

        // 2. Buscar Municípios
        console.log(`📥 Buscando municípios de ${dadosEstado.nome}...`);
        const municipiosIBGE = await fetchComRetry(`${BASE_URL}/estados/${UF_ALVO}/municipios`);
        
        console.log(`✅ Encontrados ${municipiosIBGE.length} municípios.`);
        
        // 3. Iterar sobre municípios para buscar distritos
        // Usamos for...of para manter a ordem e controlar o fluxo (não bombardear a API com Promise.all total)
        let contador = 0;
        
        for (const municipio of municipiosIBGE) {
            contador++;
            process.stdout.write(`\r🔄 Processando município ${contador}/${municipiosIBGE.length}: ${municipio.nome}           `);

            const distritosIBGE = await fetchComRetry(`${BASE_URL}/municipios/${municipio.id}/distritos`);

            // Mapear distritos para o formato desejado
            const bairrosFormatados = distritosIBGE.map(distrito => ({
                nome: distrito.nome,
                codigo_ibge: `${distrito.id}`
            }));

            // Adicionar ao array do estado
            dadosEstado.municipios.push({
                nome: municipio.nome,
                codigo_ibge: `${municipio.id}`,
                bairros: bairrosFormatados // Aqui entra a ressalva sobre "Bairros" vs "Distritos"
            });

            // Pequeno delay para ser gentil com a API pública
            await delay(50); 
        }

        console.log('\n\n✨ Processamento concluído!');

        // 4. Salvar arquivo JSON
        const estruturaFinal = {
            estado: dadosEstado
        };

        const caminhoArquivo = path.join(__dirname, ARQUIVO_SAIDA);
        fs.writeFileSync(caminhoArquivo, JSON.stringify(estruturaFinal, null, 2), 'utf-8');

        console.log(`💾 Arquivo salvo com sucesso em: ${caminhoArquivo}`);
        console.timeEnd('Tempo Total');

    } catch (error) {
        console.error('\n❌ Erro fatal na execução do script:', error.message);
    }
}

// Executar
gerarBaseIBGE();