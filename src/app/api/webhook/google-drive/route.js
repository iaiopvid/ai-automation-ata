// app/api/webhook/google-drive/route.js
import { promises as fs } from "fs";
import path from "path";

import { NextResponse } from 'next/server';
import { generateMeetingSummary} from '@/app/services/iaService';
import { UploadFileToDrive } from '@/app/services/storeService';
import { createNotionPage } from '@/app/services/notionService';
import { postToSlack, sendFile } from '@/app/services/slackService';

const NOTION_PAGE_ID = process.env.NOTION_PAGE_ID;

export async function POST(request) {
  try {
    // Descomentar linha abaixo para uso no App Script
    // const { fileId, fileName, content: fileContent } = await request.json();

    // Comentar trecho abaixo, apenas para teste
    // :::: INICIO TEST ::::
    const fileId = "ID00001";
    const filePath = path.join("./src/tmp", "meet-transcription.txt"); // /tmp no Linux
    const fileContent = await fs.readFile(filePath, "utf-8"); // == request.fileContent
    // return NextResponse.json({ content: fileContent });
    // :::: FIM TEST ::::

    const ataName = `Ata-${fileId}-${Date.now()}`;

    // 1. Generate meeting summary
    const summary = await generateMeetingSummary(fileContent);
    if (!summary) throw new Error('Resumo não pôde ser gerado.');
    
    // 2. Upload file to Google Drive // Descomentar as 2 linhas abaixo
    // const driveFile = await UploadFileToDrive(ataName, summary, "text/plain");
    // if (!driveFile) throw new Error('Erro ao subir o arquivo para o Google Drive.');

    // 3. Create Notion Page
    const notionPage = await createNotionPage(NOTION_PAGE_ID, ataName, summary);
    if (!notionPage) throw new Error('Erro ao gerar a página do Notion.');


    // 2.1. Convert summary into a text file (Buffer)
    const fileBuffer = Buffer.from(summary, "utf-8");
    // const fileName = `ResumoReuniao_${Date.now()}.txt`;
    if (!fileBuffer) throw new Error('A conversão do resumo falhou.');

    // 4. Send file to Slack
    const slackChannel = "#toda-a-empresa-novo-workspace";
    const resSlack = await postToSlack(slackChannel, ataName, summary);

    return NextResponse.json({
      message: "Integração concluída com sucesso!",
      // driveFileId: driveFile.id, // Descomentar
      notionPageId: notionPage.id,
      slackId: resSlack.ts,
    });
  } catch (error) {
    console.error("Erro na integração:", error);
    return NextResponse.json({ error: error.message}, { status: 500});
  }
}

// GET - Health check e verificação do webhook
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const challenge = url.searchParams.get('challenge');
    
    // Se há um challenge, é verificação do webhook
    if (challenge) {
      console.log('🔍 Verificação do webhook recebida');
      return new Response(challenge, { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // Health check normal
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        message: 'Webhook endpoint is running',
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('❌ Erro no GET:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }), 
      { status: 500 }
    );
  }
}
