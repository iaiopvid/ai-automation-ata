// test-webhook.js
async function testWebhook() {
  const baseUrl = 'http://localhost:3000/api/webhook/google-drive';
  const validToken = 'meu-token-super-secreto-123';

  console.log('🧪 Iniciando testes do webhook...\n');

  // Teste 1: Health Check
  console.log('1️⃣ Testando health check...');
  try {
    const response = await fetch(baseUrl);
    const data = await response.json();
    console.log('✅ Health check:', data);
  } catch (error) {
    console.error('❌ Erro no health check:', error.message);
  }

  // Teste 2: Webhook válido
  console.log('\n2️⃣ Testando webhook válido...');
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-channel-id': 'test-channel-123',
        'x-goog-channel-token': validToken,
        'x-goog-resource-state': 'exists',
        'x-goog-resource-id': 'test-resource-456'
      },
      body: JSON.stringify({})
    });
    const data = await response.json();
    console.log('✅ Webhook válido:', data);
  } catch (error) {
    console.error('❌ Erro no webhook válido:', error.message);
  }

  // Teste 3: Token inválido
  console.log('\n3️⃣ Testando token inválido...');
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-channel-id': 'test-channel-123',
        'x-goog-channel-token': 'token-errado',
        'x-goog-resource-state': 'exists'
      },
      body: JSON.stringify({})
    });
    const data = await response.json();
    console.log('✅ Token inválido (esperado):', data);
  } catch (error) {
    console.error('❌ Erro no teste de token inválido:', error.message);
  }

  console.log('\n🎉 Testes concluídos!');
}

// Executar testes
testWebhook();