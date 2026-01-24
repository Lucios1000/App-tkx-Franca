// Teste direto da API Gemini
const API_KEY = 'AIzaSyBnXEt-mMxvLNW558FEEHkJaZIxFKDbayc';

async function listModels() {
  console.log('📋 Listando modelos disponíveis...');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao listar modelos:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Modelos disponíveis:');
    data.models.forEach(model => {
      console.log(`- ${model.name} (${model.version})`);
    });

  } catch (error) {
    console.error('❌ Erro de rede:', error.message);
  }
}

async function testGeminiAPI() {
  console.log('🔧 Testando API Gemini...');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Olá! Você está funcionando? Responda apenas: "Sim, API Gemini funcionando perfeitamente!"'
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        }
      })
    });

    console.log('📤 Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Resposta recebida:');

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      console.log('📝 Texto:', data.candidates[0].content.parts[0].text);
    } else {
      console.log('❌ Estrutura inesperada:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro de rede:', error.message);
  }
}

// Executar ambos os testes
listModels().then(() => {
  console.log('\n' + '='.repeat(50) + '\n');
  return testGeminiAPI();
});