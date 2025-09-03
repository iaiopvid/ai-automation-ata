This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the install packages:

```bash
npm install
# or
yarn
# or
pnpm install
```

Next, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# 📌 Configuração do Ambiente

Este projeto utiliza variáveis de ambiente para integrar com **Google Drive, Notion, Slack** e **Google Gemini AI**.  
Todas as credenciais devem ser configuradas no arquivo `.env` na raiz do projeto.

---

## 🔑 Variáveis do `.env`

### 📂 Google Drive
- **`PARENT_FOLDER_ID`**  
  ID da pasta do Google Drive onde os arquivos serão salvos.  
  🔹 Como obter:  
  - Abra a pasta no Google Drive.  
  - Na URL, copie o trecho após `folders/`.  
    - Exemplo:  
      ```
      https://drive.google.com/drive/folders/1AbCDeFGhIJKlmnOPqRstuVWXYZ
      ```
      O ID será:  
      ```
      1AbCDeFGhIJKlmnOPqRstuVWXYZ
      ```

---

### 📝 Notion
- **`NOTION_API_KEY`**  
  Chave de integração do Notion.  
  🔹 Como obter:  
  1. Vá em [Notion Integrations](https://www.notion.so/my-integrations).  
  2. Clique em **New Integration**.  
  3. Copie a chave gerada (formato `secret_xxxxx`).  

- **`NOTION_PAGE_ID`**  
  ID da página ou database do Notion onde os dados serão escritos.  
  🔹 Como obter:  
  - Abra a página do Notion no navegador.  
  - Copie o trecho final da URL.  
    - Exemplo:  
      ```
      https://www.notion.so/Meu-Workspace/Minha-Page-1234567890abcdef12345678
      ```
      O ID será:  
      ```
      1234567890abcdef12345678
      ```

---

### 💬 Slack
- **`SLACK_BOT_TOKEN`**  
  Token de autenticação para o bot do Slack.  
  🔹 Como obter:  
  1. Vá em [Slack API Apps](https://api.slack.com/apps).  
  2. Crie um novo app.  
  3. Em **OAuth & Permissions**, adicione os escopos necessários (`chat:write`, `files:write`, etc).  
  4. Clique em **Install to Workspace** e copie o token gerado (formato `xoxb-...`).

---

### 🤖 Gemini AI (Google Generative AI)
- **`GEMINI_API_KEY`**  
  Chave da API Gemini (Google AI).  
  🔹 Como obter:  
  1. Vá em [Google AI Studio](https://aistudio.google.com/app/apikey).  
  2. Gere uma nova chave de API.  
  3. Copie o valor e cole no `.env`.

---

### 🔐 Google OAuth (para acesso ao Drive e APIs Google)
Essas variáveis permitem que o app acesse a API do Google em nome do usuário.  

- **`GOOGLE_OAUTH_CLIENT_ID`**  
  ID do cliente OAuth.  

- **`GOOGLE_OAUTH_CLIENT_SECRET`**  
  Segredo do cliente OAuth.  

- **`GOOGLE_OAUTH_REDIRECT_URI`**  
  URL de redirecionamento configurada no console do Google (geralmente algo como `http://localhost:3000/api/auth/callback`).  

- **`GOOGLE_OAUTH_REFRESH_TOKEN`**  
  Token de atualização que mantém o acesso mesmo após o token expirar.  

---

## ⚡ Como gerar o `GOOGLE_OAUTH_REFRESH_TOKEN`

1. **Crie credenciais OAuth no Google Cloud**  
   - Acesse [Google Cloud Console](https://console.cloud.google.com/).  
   - Ative a **Google Drive API**.  
   - Em **APIs & Services > Credentials > Create Credentials > OAuth Client ID**  
     - Tipo: **Web application**  
     - Adicione um **Redirect URI** (exemplo: `http://localhost:3000/api/auth/callback`).  
   - Copie o `CLIENT_ID` e o `CLIENT_SECRET`.

2. **Obtenha o código de autorização**  
   Cole este link no navegador, substituindo `<CLIENT_ID>` e `<REDIRECT_URI>`:  

   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id=<CLIENT_ID>&redirect_uri=<REDIRECT_URI>&response_type=code&scope=https://www.googleapis.com/auth/drive.file%20https://www.googleapis.com/auth/userinfo.email%20https://www.googleapis.com/auth/userinfo.profile&access_type=offline&prompt=consent
   ```

   🔹 Isso abrirá a tela de login do Google.  
   🔹 Após aceitar, você será redirecionado para sua `REDIRECT_URI` com um parâmetro `?code=...`.

3. **Troque o código por um Refresh Token**  
   Execute no terminal (substitua os valores):  

   ```bash
   curl --request POST      --data "code=<AUTH_CODE>"      --data "client_id=<CLIENT_ID>"      --data "client_secret=<CLIENT_SECRET>"      --data "redirect_uri=<REDIRECT_URI>"      --data "grant_type=authorization_code"      https://oauth2.googleapis.com/token
   ```

   A resposta será algo como:  

   ```json
   {
     "access_token": "ya29.A0AfH6SMC...",
     "expires_in": 3599,
     "refresh_token": "1//0gXXXXXXXXXXXX",
     "scope": "https://www.googleapis.com/auth/drive.file ...",
     "token_type": "Bearer"
   }
   ```

   👉 Copie o valor de `"refresh_token"` e coloque no `.env`.

---

## 📂 Exemplo de `.env`

```env
# Google Drive
PARENT_FOLDER_ID="1AbCDeFGhIJKlmnOPqRstuVWXYZ"

# Notion
NOTION_API_KEY="secret_xxxxx"
NOTION_PAGE_ID="1234567890abcdef12345678"

# Slack
SLACK_BOT_TOKEN="xoxb-1111111111111-2222222222222-xxxxxxxxxxxx"

# Gemini AI
GEMINI_API_KEY="AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxx"

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID="1234567890-abc.apps.googleusercontent.com"
GOOGLE_OAUTH_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxx"
GOOGLE_OAUTH_REDIRECT_URI="http://localhost:3000/api/auth/callback"
GOOGLE_OAUTH_REFRESH_TOKEN="1//0gxxxxxxxxxxxxxxxxxxxxxxxx"
```
