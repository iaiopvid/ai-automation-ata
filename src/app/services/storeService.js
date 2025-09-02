// services/driveService.js

// Importa o cliente da API do Google Drive configurado para realizar as operações de upload.
import { drive } from '../../libs/google-drive.js';
// ID da pasta onde os arquivos devem ser salvos
// process.env.GOOGLE_PROJECT_ID
const PARENT_FOLDER_ID = process.env.PARENT_FOLDER_ID;

/**
 * Faz o upload de um arquivo para uma pasta específica no Google Drive.
 * @param {string} fileName O nome do arquivo a ser criado no Drive.
 * @param {Buffer | Stream} fileContent O conteúdo do arquivo.
 * @param {string} mimeType O tipo MIME do arquivo (ex: 'application/pdf').
 * @returns {Promise<Object>} Os metadados do arquivo criado no Drive.
 */
export async function UploadFileToDrive(
  fileName,
  fileContent,
  mimeType = "application/pdf"
) {
  try {
    const fileMetadata = {
      name: fileName,
      parents: [PARENT_FOLDER_ID],
    };

    const media = {
      mimeType,
      body: fileContent,
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id", // retorna o id do arquivo criado, que pode ser útil para outras partes do projeto (por exemplo, para armazenar o link do arquivo no banco de dados).
    });

    console.log(`File >>> ${response.data}`);

    // console.log("Arquivo enviado com sucesso. ID:", response.data.id);
    return response.data;
  } catch (error) {
    console.error("Erro ao fazer upload para o Google Drive:", error);
    throw new Error("Falha ao enviar arquivo para o Google Drive");
  }
}
  