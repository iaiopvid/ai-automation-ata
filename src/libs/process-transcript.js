// // lib/google-drive.js
// import { google } from 'googleapis';

// export class GoogleDriveService {
//   constructor() {
//     this.auth = new google.auth.GoogleAuth({
//       keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
//       scopes: [
//         'https://www.googleapis.com/auth/drive.readonly',
//         'https://www.googleapis.com/auth/drive.file'
//       ]
//     });

//     this.drive = google.drive({ version: 'v3', auth: this.auth });
//   }

//   async getRecentFiles(minutesAgo = 5) {
//     try {
//       const timeThreshold = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
      
//       console.log(`🔍 Buscando arquivos criados após: ${timeThreshold}`);
      
//       const response = await this.drive.files.list({
//         q: `parents in '${process.env.GOOGLE_DRIVE_FOLDER_ID}' and createdTime > '${timeThreshold}' and trashed = false`,
//         fields: 'files(id, name, createdTime, mimeType, size)',
//         orderBy: 'createdTime desc'
//       });

//       const files = response.data.files || [];
//       console.log(`📄 Arquivos encontrados: ${files.length}`);
      
//       return files;
//     } catch (error) {
//       console.error('❌ Erro ao buscar arquivos:', error);
//       throw error;
//     }
//   }

//   async downloadFile(fileId) {
//     try {
//       console.log(`⬇️ Baixando arquivo: ${fileId}`);
      
//       const response = await this.drive.files.get({
//         fileId,
//         alt: 'media'
//       });

//       return response.data;
//     } catch (error) {
//       console.error(`❌ Erro ao baixar arquivo ${fileId}:`, error);
//       throw error;
//     }
//   }

//   isTranscriptFile(fileName) {
//     const transcriptKeywords = [
//       'transcript',
//       'transcrição',
//       'transcricao',
//       'ata',
//       'meeting',
//       'reunião',
//       'reuniao',
//       'gemini',
//       'meet'
//     ];

//     const lowerFileName = fileName.toLowerCase();
//     const isTranscript = transcriptKeywords.some(keyword => 
//       lowerFileName.includes(keyword)
//     );

//     console.log(`🔍 Arquivo "${fileName}" é transcrição? ${isTranscript ? 'SIM' : 'NÃO'}`);
    
//     return isTranscript;
//   }

//   async setupWebhook(webhookUrl) {
//     try {
//       const channelId = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
//       console.log(`📡 Configurando webhook: ${webhookUrl}`);
      
//       const response = await this.drive.files.watch({
//         fileId: process.env.GOOGLE_DRIVE_FOLDER_ID,
//         requestBody: {
//           id: channelId,
//           type: 'web_hook',
//           address: webhookUrl,
//           token: process.env.GOOGLE_WEBHOOK_TOKEN,
//           payload: true,
//           // Webhook expira em 24 horas
//           expiration: (Date.now() + 24 * 60 * 60 * 1000).toString()
//         }
//       });

//       console.log('✅ Webhook configurado:', response.data);
//       return response.data;
//     } catch (error) {
//       console.error('❌ Erro ao configurar webhook:', error);
//       throw error;
//     }
//   }
// }