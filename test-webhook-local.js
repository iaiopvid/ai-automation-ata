// test-webhook-local.js
async function testLocalWebhook() {
  const baseUrl = 'http://localhost:3001/api/webhook/google-drive';

  console.log('🧪 Testando webhook local...\n');

  // Teste 1: Health Check (GET)
  console.log('1️⃣ Testando GET (health check)...');
  try {
    const response = await fetch(baseUrl);
    console.log('Response status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    const text = await response.text();
    console.log('Response text:', text.substring(0, 200) + '...');
    
    try {
      const data = JSON.parse(text);
      console.log('✅ GET Response:', response.status, data);
    } catch {
      console.log('⚠️ Response não é JSON válido');
    }
  } catch (error) {
    console.error('❌ Erro no GET:', error.message);
  }

  // Teste 2: POST com dados válidos
  console.log('\n2️⃣ Testando POST com dados válidos...');
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileId: '1ABC123XYZ456',
        fileName: 'Transcrição Teste.txt',
        createdAt: new Date().toISOString()
      })
    });
    
    console.log('Response status:', response.status);
    const text = await response.text();
    
    try {
      const data = JSON.parse(text);
      console.log('✅ POST Response:', response.status, data);
    } catch {
      console.log('⚠️ Response não é JSON:', text.substring(0, 200));
    }
  } catch (error) {
    console.error('❌ Erro no POST:', error.message);
  }

  // Teste 3: POST sem dados
  console.log('\n3️⃣ Testando POST vazio...');
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    const data = await response.json();
    console.log('✅ POST vazio Response:', response.status, data);
  } catch (error) {
    console.error('❌ Erro no POST vazio:', error.message);
  }

  console.log('\n🎉 Testes concluídos!');
}

// Executar se for chamado diretamente
if (typeof window === 'undefined') {
  testLocalWebhook();
}
