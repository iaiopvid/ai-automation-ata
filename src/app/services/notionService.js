import { Client } from '@notionhq/client';
const { markdownToBlocks } = require('@tryfabric/martian');

// Inicializa o cliente do Notion com a chave de integração
let notion;

// Verifica se a chave de API está definida
if (!process.env.NOTION_API_KEY) {
  console.warn('[Notion Service] NOTION_API_KEY não está definida nas variáveis de ambiente');
} else {
  notion = new Client({ auth: process.env.NOTION_API_KEY });
}

/**
 * Cria uma página no Notion
 * @param {string} parentId - ID do banco de dados pai
 * @param {string} title - Título da página
 * @param {Object} properties - Propriedades adicionais da página
 * @param {Array} children - Blocos filhos da página
 * @returns {Promise<Object>} - Página criada
 * @throws {Error} Lança erro se parâmetros forem inválidos ou se a criação falhar
 */
export async function createNotionPage(parentId, title, markdownContent) {
  // Verifica se o cliente do Notion está inicializado
  if (!notion) {
    console.warn('Cliente do Notion não inicializado. NOTION_API_KEY não está definida. A operação será ignorada.');
    return null;
  }

  // Validação de campos obrigatórios
  if (!parentId || !title) {
    throw new Error('Campos obrigatórios ausentes: parentId e title.');
  }

  // Validação do ID do Notion
  if (!validateNotionId(parentId)) {
    throw new Error('parentId inválido.');
  }

  const blocos = markdownToBlocks(markdownContent, {
    // Opções opcionais: Ative callouts com emojis (ex: > 📘 Note: Texto)
    enableEmojiCallouts: true,
    // Desabilite truncamento para limites do Notion (pode causar erros se o conteúdo for muito grande)
    notionLimits: { truncate: false }
  });

  try {
    // Formata os blocos de conteúdo
    // const formattedChildren = formatContentBlocks(children);

    // Cria a estrutura da página
    const pageData = {
      parent: { page_id: parentId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
      children: blocos,
    };

    // Cria a página no Notion
    const response = await notion.pages.create(pageData);
    
    console.log('Página criada com sucesso:', response.id);
    return response;
    
  } catch (error) {
    console.error('[Notion Error] Falha ao criar página no Notion:', error.message || error);
    
    // Re-throw o erro para que possa ser tratado pelo código que chama a função
    throw new Error(`Falha ao criar página no Notion: ${error.message || error}`);
  }
}

/**
 * Gera um arquivo JSON compatível com o Notion para importação
 * @param {string} parentId - ID do banco de dados pai
 * @param {string} title - Título da página
 * @param {Object} properties - Propriedades adicionais da página
 * @param {Array} children - Blocos filhos da página
 * @returns {Object} - Objeto formatado para importação no Notion
 * @throws {Error} Lança erro se parâmetros forem inválidos
 */
export function generateNotionFile(parentId, title, properties = {}, children = []) {
  // Validação de campos obrigatórios
  if (!parentId || !title) {
    throw new Error('Campos obrigatórios ausentes: parentId e title.');
  }

  // Validação do ID do Notion
  if (!validateNotionId(parentId)) {
    throw new Error('ID do banco de dados inválido.');
  }

  // Formata os blocos de conteúdo
  const formattedChildren = formatContentBlocks(children);

  // Estrutura base do arquivo JSON para importação no Notion
  const notionFile = {
    parent: { database_id: parentId },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: title,
            },
          },
        ],
      },
      ...properties,
    },
    children: formattedChildren,
  };

  return notionFile;
}

/**
 * Valida se um ID do Notion é válido
 * @param {string} id - ID a ser validado
 * @returns {boolean} - True se válido, false caso contrário
 * @throws {Error} Lança erro se o ID for inválido
 */
export function validateNotionId(id) {
  // Verifica se o ID foi fornecido e é uma string
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Remove hífens para normalizar o ID
  const normalizedId = id.replace(/-/g, '');
  
  // IDs do Notion geralmente têm 32 caracteres hexadecimais
  const hexRegex = /^[a-f0-9]{32}$/i;
  
  return hexRegex.test(normalizedId);
}

/**
 * Formata blocos de conteúdo para uma página do Notion
 * @param {Array} contentBlocks - Array de blocos de conteúdo
 * @returns {Array} - Blocos formatados para o Notion
 */
export function formatContentBlocks(contentBlocks = []) {
  // Verifica se contentBlocks é um array
  if (!Array.isArray(contentBlocks)) {
    console.warn('contentBlocks deve ser um array. Convertendo para array vazio.');
    return [];
  }

  return contentBlocks.map((block, index) => {
    try {
      // Se o bloco já estiver no formato do Notion, retorna como está
      if (block && typeof block === 'object' && block.object && block.type) {
        return block;
      }
      
      // Caso contrário, tenta converter texto simples em parágrafo
      if (typeof block === 'string' && block.trim() !== '') {
        return {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: block,
                },
              },
            ],
          },
        };
      }
      
      // Se for um objeto mas não no formato correto, tenta extrair texto
      if (typeof block === 'object' && block !== null) {
        const textContent = block.text || block.content || JSON.stringify(block);
        return {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: textContent,
                },
              },
            ],
          },
        };
      }
      
      // Para outros tipos, converte para string
      return {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: String(block),
              },
            },
          ],
        },
      };
      
    } catch (error) {
      console.warn(`Erro ao formatar bloco ${index}:`, error.message);
      // Retorna um bloco de parágrafo vazio em caso de erro
      return {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: `[Erro ao processar bloco ${index}]`,
              },
            },
          ],
        },
      };
    }
  }).filter(block => block !== null && block !== undefined);
}

/**
 * Função auxiliar para criar diferentes tipos de blocos
 * @param {string} type - Tipo do bloco (paragraph, heading_1, heading_2, etc.)
 * @param {string} content - Conteúdo do bloco
 * @param {Object} options - Opções adicionais (cor, formatação, etc.)
 * @returns {Object} - Bloco formatado para o Notion
 */
export function createNotionBlock(type = 'paragraph', content = '', options = {}) {
  const baseBlock = {
    object: 'block',
    type: type,
  };

  // Configurações específicas para cada tipo de bloco
  switch (type) {
    case 'paragraph':
    case 'heading_1':
    case 'heading_2':
    case 'heading_3':
      baseBlock[type] = {
        rich_text: [
          {
            type: 'text',
            text: {
              content: content,
            },
            annotations: {
              bold: options.bold || false,
              italic: options.italic || false,
              strikethrough: options.strikethrough || false,
              underline: options.underline || false,
              code: options.code || false,
              color: options.color || 'default',
            },
          },
        ],
      };
      break;
      
    case 'bulleted_list_item':
    case 'numbered_list_item':
      baseBlock[type] = {
        rich_text: [
          {
            type: 'text',
            text: {
              content: content,
            },
          },
        ],
      };
      break;
      
    case 'code':
      baseBlock[type] = {
        rich_text: [
          {
            type: 'text',
            text: {
              content: content,
            },
          },
        ],
        language: options.language || 'javascript',
      };
      break;
      
    default:
      // Para tipos não suportados, cria um parágrafo
      baseBlock.type = 'paragraph';
      baseBlock.paragraph = {
        rich_text: [
          {
            type: 'text',
            text: {
              content: content,
            },
          },
        ],
      };
  }

  return baseBlock;
}
