import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs/promises';
import meetingAssistantPrompt from "../constants/prompt.js";
import dotenv from 'dotenv'

if (process.env.NODE_ENV !== 'test') {
    dotenv.config()
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Precisa ser removido para passar nos testes unitários 
const test = "./src/app/services/transcricao_exemplo_reuniao.txt"

/**
 * Gera um resumo de reunião a partir de uma transcrição.
 * O resumo não é salvo localmente, mas retornado como uma string.
 * 
 * @param {string} transcriptFilePath O caminho completo para o arquivo TXT da transcrição de entrada.
 * @returns {Promise<string|null>} O resumo gerado pelo Gemini (string) ou null em caso de erro.
 */

export async function generateMeetingSummary( rawTranscript ) {
    let generatedSummary = null;

    if ( !rawTranscript ) {
        console.error( 'Erro: Arquivo de transcrição não fornecido.' );
        return null;
    }

    if (!GEMINI_API_KEY) {
        console.error("Erro: A variável de ambiente GEMINI_API_KEY não está configurada.");
        return null;
    }

    try {
        const ai = new GoogleGenAI( {
            vertexai: false,
            apiKey: GEMINI_API_KEY
        } );
        console.log( 'Enviando transcrição para o Gemini via chave GEMINI...' )
        const prompt = meetingAssistantPrompt( rawTranscript );
        const result = await ai.models.generateContent( {
            model: 'gemini-2.0-flash',
            contents: prompt
        } );

        if (result?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            generatedSummary = result.response.candidates[0].content.parts[0].text;
        } else if (result?.text) {
            generatedSummary = result.text;
        } else {
            throw new Error('Resposta inválida da API Gemini');
        }
        console.log( 'Resumo gerado pelo Gemini com sucesso!' );

    } catch ( error ) {
        console.error( 'Erro ao chamar a API Gemini:', error );
        if ( error.response && error.response.data ) {
            console.error('Detalhes do erro da API:', error.response.data);
        } else if ( error.message ) {
            console.error('Mensagem de erro:', error.message);
        }
        return null
    }

    return generatedSummary;
}