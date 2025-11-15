// ===== App state =====
let pontosTotais = parseInt(localStorage.getItem('pontosTotais') || '0');
let co2Total = parseFloat(localStorage.getItem('co2Total') || '0');
let descartes = JSON.parse(localStorage.getItem('descartes') || '[]');
let fotoSelecionada = null;
let resultadoAtual = null;
let chartInstance = null;
let videoStream = null;
let imageCapture = null;
let mapInstance = null;

const hfApiKey = 'your_huggingface_api_key_here'; // Registre-se em huggingface.co e obtenha um token de API. Substitua aqui.
const maxFileSize = 5 * 1024 * 1024; // 5MB limite
const targetResolution = { width: 640, height: 480 }; // Resolução otimizada

const residuos = [
  { tipo: 'Plástico', lixeira: 'Azul', pontos: 10, co2: 0.5, dica: 'Plásticos reciclados economizam energia equivalente a 1 lâmpada por 6h.' },
  { tipo: 'Papel', lixeira: 'Amarelo', pontos: 5, co2: 0.2, dica: 'Reciclar papel salva árvores e reduz CO₂.' },
  { tipo: 'Orgânico', lixeira: 'Marrom', pontos: 8, co2: 0.3, dica: 'Orgânicos compostados viram adubo e evitam metano.' },
  { tipo: 'Vidro', lixeira: 'Verde', pontos: 7, co2: 0.4, dica: 'Vidro é 100% reciclável e infinito.' },
  { tipo: 'Metal', lixeira: 'Cinza', pontos: 9, co2: 0.6, dica: 'Reciclar metal economiza mineração e energia.' },
  { tipo: 'Eletrônicos', lixeira: 'Vermelho', pontos: 15, co2: 1.0, dica: 'Eletrônicos reciclados previnem poluição tóxica.' }
];

const dicasHome = [
  'Separe o lixo seco do úmido para facilitar a coleta.',
  'Evite plásticos de uso único — use sacolas reutilizáveis!',
  'Reciclagem reduz o uso de recursos naturais.',
  'Composte orgânicos para enriquecer o solo.',
  'Reutilize itens antes de descartar.'
];

// Pontos de coleta atualizados (com coordenadas e detalhes completos)
const pontosColeta = [
  { lat: -20.3207, lng: -40.3328, nome: 'Eletrônica Faé', endereco: 'R. Josué Prado, 90 - Centro, Vitória - ES, 29010-360', telefone: '(27) 3331-3181', coleta: 'Pilhas e baterias' },
  { lat: -20.3090, lng: -40.2930, nome: 'Gorza Musical', endereco: 'R. Des. Sampaio, 177 - Praia do Canto, Vitória - ES, 29055-250', telefone: '(27) 3314-3555', coleta: 'Lixo eletrônico de pequeno porte' },
  { lat: -20.2515, lng: -40.2673, nome: 'Supermercado Carone - Jardim Camburi', endereco: 'Av. Judith Leão Castello Ribeiro, 272 - Jardim Camburi, Vitória - ES, 29090-720', telefone: '(27) 3237-2727', coleta: 'Lixo eletrônico de pequeno porte' },
  { lat: -20.2979, lng: -40.3068, nome: 'Extrabom Supermercado - Itararé', endereco: 'R. Daniel Abreu Machado, 151 - Itararé, Vitória - ES, 29047-540', telefone: '(27) 3298-2338', coleta: 'Pilhas e baterias' },
  { lat: -20.2844, lng: -40.2960, nome: 'Extraplus Supermercado - Jardim da Penha', endereco: 'R. Dr. Antônio Basílio, 534 - Jardim da Penha, Vitória - ES, 29060-390', telefone: '(27) 3298-2339', coleta: 'Pilhas e baterias' },
  { lat: -20.3075, lng: -40.3028, nome: 'Supermercado Carone - Santa Lúcia', endereco: 'Av. Rio Branco, 77 - Santa Lúcia, Vitória - ES, 29056-255', telefone: '(27) 3137-2833', coleta: 'Pilhas e baterias' },
  { lat: -20.3189, lng: -40.3232, nome: 'Papa-móveis - Prefeitura de Vitória', endereco: 'Av. Mal. Mascarenhas de Moraes, 1927 - Bento Ferreira, Vitória - ES, 29050-625', telefone: '156 ou (27) 99693-8953', coleta: 'Eletrodomésticos (*Recolhe em residência)' },
  { lat: -20.1460, lng: -40.2780, nome: 'Biopetro Ambiental', endereco: 'R. Jaburú, 73 - Novo Porto Canoa, Serra - ES, 29167-548', telefone: '(27) 3298-3909', coleta: 'Pilhas, bateria, HD\'s e peças de computador' },
  { lat: -20.2073, lng: -40.2695, nome: 'CTR Marca Ambiental - Nova Carapina', endereco: 'Rod. Gov. Mário Covas, 260 - Nova Carapina I, Serra - ES, 29170-023', telefone: '(27) 2123-7700', coleta: 'Todos os tipos de lixo eletrônico' },
  { lat: -20.1589, lng: -40.2546, nome: 'Extrabom Supermercado - Porto Canoa', endereco: 'Av. Porto Canoa, 132 - Porto Canoa, Serra - ES, 29168-345', telefone: '(27) 3298-2334', coleta: 'Pilhas e baterias' },
  { lat: -20.1522, lng: -40.1861, nome: 'EPA Supermercados - Jacaraípe', endereco: 'Av. Abido Saad, 2340 - Jacaraípe, Serra - ES, 29173-180', telefone: '(27) 3252-1223', coleta: 'Pilhas e baterias' },
  { lat: -20.1780, lng: -40.2510, nome: 'Coleta Ambiental', endereco: 'Rua O, Quadra 16, Lote 13 - São Diogo I, Serra - ES, 29163-269', telefone: '(27) 3328-7001', coleta: 'Todos os tipos de lixo eletrônico' }
];

// Função para calcular distância (usando fórmula de Haversine, já que Leaflet distanceTo é em metros)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distância em km
}

function initMap() {
  mapInstance = L.map('map').setView([-20.22, -40.32], 11); // Centro ajustado para cobrir Vitória e Serra, zoom 11
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mapInstance);

  // Adiciona marcadores para todos os pontos
  const markers = [];
  pontosColeta.forEach(ponto => {
    const marker = L.marker([ponto.lat, ponto.lng]).addTo(mapInstance)
      .bindPopup(`<b>${ponto.nome}</b><br>${ponto.coleta}<br>Telefone: ${ponto.telefone}<br>Endereço: ${ponto.endereco}`);
    markers.push({ marker, lat: ponto.lat, lng: ponto.lng, nome: ponto.nome });
  });

  // Função para obter localização do usuário e encontrar o mais próximo
  function getUserLocationAndFindNearest() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          // Adiciona marcador para localização do usuário
          L.marker([userLat, userLng], {
            icon: L.divIcon({ className: 'user-marker', html: '<div style="background: blue; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>' })
          }).addTo(mapInstance).bindPopup('Sua localização atual').openPopup();

          // Encontra o ponto mais próximo
          let nearest = null;
          let minDist = Infinity;
          markers.forEach(m => {
            const dist = calculateDistance(userLat, userLng, m.lat, m.lng);
            if (dist < minDist) {
              minDist = dist;
              nearest = m;
            }
          });

          if (nearest) {
            // Destaca o mais próximo com ícone diferente
            nearest.marker.setIcon(L.divIcon({ className: 'nearest-marker', html: '<div style="background: red; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>' }));
            nearest.marker.openPopup();
            // Centraliza o mapa entre usuário e o mais próximo
            const bounds = L.latLngBounds([[userLat, userLng], [nearest.lat, nearest.lng]]);
            mapInstance.fitBounds(bounds, { padding: [50, 50] });
            // Atualiza a dica educacional com info do mais próximo
            $('#dicaEducacional').textContent = `Ponto mais próximo: ${nearest.nome} (${minDist.toFixed(2)} km de distância).`;
          }
        },
        (error) => {
          console.error('Erro na geolocalização:', error);
          $('#dicaEducacional').textContent = 'Não foi possível obter sua localização. Verifique permissões ou GPS.';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      $('#dicaEducacional').textContent = 'Geolocalização não suportada no seu navegador.';
    }
  }

  // Chama a função automaticamente ao iniciar o mapa
  getUserLocationAndFindNearest();
}

// ===== Helpers (otimizados com caching de DOM) =====
const $ = sel => document.querySelector(sel);
const $all = sel => Array.from(document.querySelectorAll(sel));

function showScreen(id) {
  $all('.screen').forEach(s => {
    s.classList.remove('visible');
    s.hidden = true;
  });
  const el = $(`#${id}`);
  if (el) {
    el.hidden = false;
    setTimeout(() => el.classList.add('visible'), 10);
  }
  $all('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.target === id));
  if (id === 'perfil') atualizarPerfil();
  if (id !== 'camera' && videoStream) stopCamera();
  if (id === 'home' && !mapInstance) initMap(); // Inicia mapa só se necessário
}

function getCorLixeira(nome) {
  const cores = {
    Azul: '#1976d2',
    Amarelo: '#fdd835',
    Marrom: '#6d4c41',
    Verde: '#2e7d32',
    Cinza: '#757575',
    Vermelho: '#f44336'
  };
  return cores[nome] || '#9e9e9e';
}

function showError(message) {
  const errorEl = $('#errorMessage');
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function hideError() {
  $('#errorMessage').hidden = true;
}

// Função para mostrar preview de imagem estática
function showPhotoPreview(blob) {
  const previewUrl = URL.createObjectURL(blob);
  const photoImg = $('#photoPreview');
  photoImg.src = previewUrl;
  photoImg.onload = () => {
    URL.revokeObjectURL(previewUrl); // Revoga só após carregar, evita timing issues
    $('#cameraPreview').classList.add('hidden'); // Esconde vídeo
    photoImg.classList.remove('hidden'); // Mostra imagem
    $('#loadingPreview').classList.add('hidden'); // Esconde spinner
  };
  photoImg.onerror = () => {
    showError('Erro ao carregar preview da imagem.');
    URL.revokeObjectURL(previewUrl);
  };
}

async function startCamera() {
  hideError();
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: targetResolution.width },
        height: { ideal: targetResolution.height }
      }
    });
    const cameraVid = $('#cameraPreview');
    cameraVid.srcObject = videoStream;
    cameraVid.onloadedmetadata = () => cameraVid.play(); // Garante play após metadata
    const track = videoStream.getVideoTracks()[0];
    imageCapture = new ImageCapture(track);
    $('#btnProcessar').disabled = false;
    $('#btnStartCamera').disabled = true;
    $('#photoPreview').classList.add('hidden'); // Esconde preview de imagem se estava visível
    cameraVid.classList.remove('hidden'); // Mostra vídeo
  } catch (err) {
    showError(err.name === 'NotAllowedError' ? 'Permissão para câmera negada. Use seleção de arquivo.' : 'Não foi possível acessar a câmera. Tente novamente ou use arquivo.');
    $('#btnProcessar').disabled = true;
  }
}

function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
    imageCapture = null;
    $('#cameraPreview').srcObject = null;
    $('#btnStartCamera').disabled = false;
  }
  // Limpa previews ao parar
  $('#photoPreview').src = '';
  $('#photoPreview').classList.add('hidden');
  $('#cameraPreview').classList.remove('hidden');
}

async function captureImage() {
  $('#loadingPreview').classList.remove('hidden'); // Mostra spinner
  if (imageCapture) {
    try {
      const blob = await imageCapture.takePhoto();
      return blob;
    } catch (err) {
      showError('Erro ao capturar foto: ' + err.message);
      return null;
    }
  }
  // Fallback canvas
  const video = $('#cameraPreview');
  const canvas = $('#compressCanvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Falha no fallback de captura.'));
    }, 'image/jpeg', 0.8);
  });
}

async function compressImage(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = $('#compressCanvas');
      const scale = Math.min(targetResolution.width / img.width, targetResolution.height / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', 0.7);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

// ===== Processamento de imagem (com IA real via Hugging Face) =====
async function processarFoto() {
  if (!fotoSelecionada) return showError('Selecione ou capture uma foto antes.');

  const loadingEl = $('#loadingProcess');
  loadingEl.classList.add('visible');
  $('#btnProcessar').disabled = true;

  const compressedBlob = await compressImage(fotoSelecionada);
  const previewUrl = URL.createObjectURL(compressedBlob);
  $('#fotoMostrada').src = previewUrl;
  URL.revokeObjectURL(previewUrl); // Limpa imediatamente após uso

  if (hfApiKey === 'your_huggingface_api_key_here' || !hfApiKey) {
    // Simulação
    resultadoAtual = residuos[Math.floor(Math.random() * residuos.length)];
    atualizarResultado();
    loadingEl.classList.remove('visible');
    $('#btnProcessar').disabled = false;
    showScreen('resultado');
  } else {
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/yangy50/garbage-classification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': compressedBlob.type
        },
        body: compressedBlob
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.error) throw new Error(result.error);

      const topLabel = result[0].label.toLowerCase();
      const mapping = { plastic: 0, paper: 1, cardboard: 1, trash: 2, glass: 3, metal: 4 };
      const index = mapping[topLabel] ?? Math.floor(Math.random() * residuos.length);
      resultadoAtual = residuos[index];
      atualizarResultado();
      showScreen('resultado');
    } catch (err) {
      showError('Erro no processamento com IA: ' + err.message + '. Usando simulação.');
      resultadoAtual = residuos[Math.floor(Math.random() * residuos.length)];
      atualizarResultado();
      showScreen('resultado');
    } finally {
      loadingEl.classList.remove('visible');
      $('#btnProcessar').disabled = false;
      fotoSelecionada = null;
    }
  }
}

function atualizarResultado() {
  $('#tipoLixo').textContent = `Isso é ${resultadoAtual.tipo}!`;
  $('#lixeira').innerHTML = `Descarte na lixeira <strong style="color:${getCorLixeira(resultadoAtual.lixeira)}">${resultadoAtual.lixeira}</strong>.`;
  $('#dicaResultado').textContent = resultadoAtual.dica;
}

// ===== Confirmar descarte =====
function confirmarDescarte() {
  if (!resultadoAtual) return;
  pontosTotais += resultadoAtual.pontos;
  co2Total = parseFloat((co2Total + resultadoAtual.co2).toFixed(2));
  const now = new Date();
  descartes.push({ data: now.toISOString(), pontos: resultadoAtual.pontos, co2: resultadoAtual.co2 });
  localStorage.setItem('pontosTotais', pontosTotais);
  localStorage.setItem('co2Total', co2Total);
  localStorage.setItem('descartes', JSON.stringify(descartes));

  $('#pontosTexto').textContent = `+${resultadoAtual.pontos} pontos!`;
  $('#co2Texto').textContent = `Você evitou ${resultadoAtual.co2} kg de CO₂ 🌱`;

  criarConfete();
  showScreen('recompensa');
}

// ===== Confetti otimizado (reduzido para 40 peças) =====
function criarConfete() {
  const container = $('#confetti');
  container.innerHTML = '';
  const frag = document.createDocumentFragment();
  const colors = ['#4caf50', '#8bc34a', '#cddc39', '#ffca28', '#81c784'];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = `${Math.random() * 100}%`;
    el.style.top = `${-10 - Math.random() * 20}vh`;
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    el.style.animationDuration = `${1.5 + Math.random() * 2}s`;
    el.style.width = `${8 + Math.random() * 6}px`;
    el.style.height = `${12 + Math.random() * 8}px`;
    frag.appendChild(el);
  }
  container.appendChild(frag);
  setTimeout(() => container.innerHTML = '', 4000);
}

// ===== Perfil / gráfico =====
function atualizarPerfil() {
  $('#totalPontos').textContent = pontosTotais;
  $('#totalCO2').textContent = co2Total.toFixed(2);

  // Agrupa últimos 6 meses
  const dadosPorMes = {};
  const labels = [];
  const hoje = new Date();
  for (let i = 5; i >= 0; i--) {
    const m = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
    dadosPorMes[key] = 0;
    labels.push(m.toLocaleString('pt-BR', { month: 'short' }));
  }
  descartes.forEach(d => {
    const dt = new Date(d.data);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    if (dadosPorMes[key] !== undefined) dadosPorMes[key] += d.co2;
  });
  const data = Object.values(dadosPorMes);

  if (chartInstance) chartInstance.destroy();
  const ctx = $('#graficoCO2');
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'CO₂ evitado (kg)',
        data,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-color') || '#4caf50'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
      animation: { duration: 1000, easing: 'easeOutBounce' }
    }
  });
}

// ===== Reset =====
function resetarDados() {
  if (!confirm('Tem certeza que deseja resetar todos os dados?')) return;
  pontosTotais = 0;
  co2Total = 0;
  descartes = [];
  localStorage.removeItem('pontosTotais');
  localStorage.removeItem('co2Total');
  localStorage.removeItem('descartes');
  atualizarPerfil();
  alert('Dados resetados.');
}

// ===== Init / UI wiring =====
document.addEventListener('DOMContentLoaded', () => {
  // Cache de elementos frequentes
  const dicaEducacional = $('#dicaEducacional');
  dicaEducacional.textContent = dicasHome[Math.floor(Math.random() * dicasHome.length)];

  // Nav clicks
  $all('.nav-item').forEach(item => item.addEventListener('click', () => showScreen(item.dataset.target)));

  // Header buttons
  $('#toggleTheme').addEventListener('click', () => {
    document.documentElement.classList.toggle('light-mode');
    localStorage.setItem('lightMode', document.documentElement.classList.contains('light-mode'));
    if (!$('#graficoCO2').closest('section').hidden) atualizarPerfil();
  });

  // Load saved pref
  if (localStorage.getItem('lightMode') === 'true') document.documentElement.classList.add('light-mode');

  // Home actions
  $('#btnOpenCamera').addEventListener('click', () => showScreen('camera'));
  $('#btnOpenPerfil').addEventListener('click', () => showScreen('perfil'));

  // Camera actions
  $('#btnStartCamera').addEventListener('click', startCamera);
  $('#btnSelectFile').addEventListener('click', () => $('#fotoInput').click());
  $('#fotoInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return showError('Arquivo não é uma imagem válida.');
    if (file.size > maxFileSize) return showError('Arquivo muito grande (máx 5MB). Selecione uma menor.');
    hideError();
    $('#loadingPreview').classList.remove('hidden'); // Mostra spinner
    try {
      fotoSelecionada = await compressImage(file);
      if (fotoSelecionada) {
        showPhotoPreview(fotoSelecionada); // Mostra preview estática
        $('#btnProcessar').disabled = false;
      }
    } catch (err) {
      showError('Erro ao comprimir imagem: ' + err.message);
    } finally {
      $('#loadingPreview').classList.add('hidden');
    }
  });
  $('#btnProcessar').addEventListener('click', async () => {
    if (videoStream && !fotoSelecionada) {
      const capturedBlob = await captureImage();
      if (capturedBlob) {
        $('#loadingPreview').classList.remove('hidden');
        fotoSelecionada = await compressImage(capturedBlob);
        showPhotoPreview(fotoSelecionada);
        $('#loadingPreview').classList.add('hidden');
      } else {
        return; // Erro já mostrado em captureImage
      }
    }
    if (fotoSelecionada) processarFoto();
  });

  // Resultado actions
  $('#btnResultadoVoltar').addEventListener('click', () => showScreen('home'));
  $('#btnConfirmar').addEventListener('click', confirmarDescarte);

  // Recompensa
  $('#btnVerPerfil').addEventListener('click', () => showScreen('perfil'));
  $('#btnRecompensaHome').addEventListener('click', () => showScreen('home'));

  // Perfil
  $('#btnPerfilHome').addEventListener('click', () => showScreen('home'));
  $('#btnReset').addEventListener('click', resetarDados);

  // Start at home
  showScreen('home');
  atualizarPerfil();
});