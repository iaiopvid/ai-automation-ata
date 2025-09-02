// libs/google-drive.js

// Importa o módulo googleapis para interagir com a API do Google Drive
import { google } from 'googleapis';

// Configura as credenciais para autenticação
const auth = new google.auth.GoogleAuth({
  // Opção 1: Usar um arquivo de credenciais (Service Account)
//   keyFile: "./path/to/service-account-key.json", // Caminho para o arquivo JSON com as credenciais da Service Account
  // OU Opção 2: Usar variáveis de ambiente para credenciais
  credentials: {
    type: process.env.GOOGLE_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN
  },
  scopes: ["https://www.googleapis.com/auth/drive"], // Escopo necessário para operações no Drive
});

// Cria uma instância do cliente do Google Drive
export const drive = google.drive({
  version: "v3", // Usa a versão 3 da API do Google Drive
  auth, // Passa a autenticação configurada
});