// services/driveService.js

// Importa o cliente da API do Google Drive configurado para realizar as operações de upload.
import { Readable } from 'stream';

import { google } from "googleapis";
import fs from "fs";

const PARENT_FOLDER_ID = process.env.PARENT_FOLDER_ID;
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export async function uploadFile(ataName, summary) {
  const fileMetadata = { name: `${ataName}.md`, parents: [PARENT_FOLDER_ID] };
  const media = {
    mimeType: 'text/plain',
    // body: fs.createReadStream(summary),
    body: summary,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
  });

  console.log('Arquivo enviado:', response.data);

  return response.data;
}

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
      body: bufferToStream(Buffer.from(fileContent)),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id", // retorna o id do arquivo criado, que pode ser útil para outras partes do projeto (por exemplo, para armazenar o link do arquivo no banco de dados).
    });

    // console.log("Arquivo enviado com sucesso. ID:", response.data.id);
    return response.data;
  } catch (error) {
    console.error("Erro ao fazer upload para o Google Drive:", error);
    throw new Error(error);
  }
}

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}