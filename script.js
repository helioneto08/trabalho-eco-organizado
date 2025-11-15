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

const maxFileSize = 5 * 1024 * 1024; // 5MB limite
const targetResolution = { width: 640, height: 480 }; // Resolução otimizada

const residuos = [
  { tipo: 'Plástico', lixeira: 'Azul', pontos: 10, co2: 2.0, dica: 'Plásticos reciclados economizam energia equivalente a 1 lâmpada por 6h.' },
  { tipo: 'Papel', lixeira: 'Amarelo', pontos: 5, co2: 1.0, dica: 'Reciclar papel salva árvores e reduz CO₂.' },
  { tipo: 'Orgânico', lixeira: 'Marrom', pontos: 8, co2: 0.5, dica: 'Orgânicos compostados viram adubo e evitam metano.' },
  { tipo: 'Vidro', lixeira: 'Verde', pontos: 7, co2: 0.5, dica: 'Vidro é 100% reciclável e infinito.' },
  { tipo: 'Metal', lixeira: 'Cinza', pontos: 9, co2: 2.0, dica: 'Reciclar metal economiza mineração e energia.' },
  { tipo: 'Eletrônicos', lixeira: 'Vermelho', pontos: 15, co2: 2.0, dica: 'Eletrônicos reciclados previnem poluição tóxica.' }
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

// Função para calcular distância (usando fórmula de Haversine)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function initMap() {
  mapInstance = L.map('map').setView([-20.22, -40.32], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mapInstance);

  const markers = [];
  const bounds = L.latLngBounds();
  pontosColeta.forEach(ponto => {
    const latLng = [ponto.lat, ponto.lng];
    const marker = L.marker(latLng).addTo(mapInstance)
      .bindPopup(`<b>${ponto.nome}</b><br>${ponto.coleta}<br>Telefone: ${ponto.telefone}<br>Endereço: ${ponto.endereco}`);
    markers.push({ marker, lat: ponto.lat, lng: ponto.lng, nome: ponto.nome });
    bounds.extend(latLng);
  });

  mapInstance.fitBounds(bounds, { padding: [50, 50] });

  function getUserLocationAndFindNearest() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          L.marker([userLat, userLng], {
            icon: L.divIcon({ className: 'user-marker', html: '<div style="background: blue; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>' })
          }).addTo(mapInstance).bindPopup('Sua localização atual').openPopup();

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
            nearest.marker.setIcon(L.divIcon({ className: 'nearest-marker', html: '<div style="background: red; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>' }));
            nearest.marker.openPopup();
            const userBounds = bounds.extend([userLat, userLng]);
            mapInstance.fitBounds(userBounds, { padding: [50, 50] });
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

  getUserLocationAndFindNearest();
}

// ===== Helpers =====
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
  if (id === 'home') {
    if (!mapInstance) initMap();
    else {
      setTimeout(() => mapInstance.invalidateSize(), 100);
    }
  }
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
  setTimeout(() => hideError(), 5000); // Auto-esconde após 5s
}

function hideError() {
  $('#errorMessage').hidden = true;
}

function showPhotoPreview(blob) {
  const previewUrl = URL.createObjectURL(blob);
  const photoImg = $('#photoPreview');
  photoImg.src = previewUrl;
  photoImg.onload = () => {
    URL.revokeObjectURL(previewUrl);
    $('#cameraPreview').classList.add('hidden');
    photoImg.classList.remove('hidden');
    $('#loadingPreview').classList.add('hidden');
    $('#residueForm').classList.remove('hidden'); // Mostra form após preview
    $('#btnIdentificar').disabled = false;
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
    cameraVid.onloadedmetadata = () => cameraVid.play();
    const track = videoStream.getVideoTracks()[0];
    imageCapture = new ImageCapture(track);
    $('#btnStartCamera').disabled = true;
    $('#photoPreview').classList.add('hidden');
    cameraVid.classList.remove('hidden');
  } catch (err) {
    showError(err.name === 'NotAllowedError' ? 'Permissão para câmera negada. Por favor, permita o acesso ou use a seleção de arquivo.' : 'Não foi possível acessar a câmera. Verifique se outra app está usando ou use arquivo.');
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
  $('#photoPreview').src = '';
  $('#photoPreview').classList.add('hidden');
  $('#cameraPreview').classList.remove('hidden');
  $('#residueForm').classList.add('hidden');
  $('#btnIdentificar').disabled = true;
}

async function captureImage() {
  $('#loadingPreview').classList.remove('hidden');
  if (imageCapture) {
    try {
      const blob = await imageCapture.takePhoto();
      return blob;
    } catch (err) {
      showError('Erro ao capturar foto: ' + err.message);
      return null;
    }
  }
  const video = $('#cameraPreview');
  const canvas = $('#compressCanvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Falha na captura.'));
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

// ===== Processamento manual =====
async function identificarResiduo() {
  if (!fotoSelecionada) return showError('Por favor, tire ou selecione uma foto antes de identificar.');

  const loadingEl = $('#loadingProcess');
  loadingEl.classList.add('visible');

  const tipoIdx = parseInt($('#tipoResiduo').value);
  const umidade = document.querySelector('input[name="umidade"]:checked')?.value;
  const quantidade = parseFloat($('#quantidade').value);

  if (isNaN(quantidade) || quantidade <= 0) {
    loadingEl.classList.remove('visible');
    return showError('Quantidade deve ser um número positivo.');
  }

  const res = residuos[tipoIdx];
  const isOrganico = res.tipo === 'Orgânico';

  if ((isOrganico && umidade !== 'umido') || (!isOrganico && umidade !== 'seco')) {
    loadingEl.classList.remove('visible');
    return showError('A umidade selecionada é incompatível com o tipo de resíduo. Orgânicos são úmidos, os outros são secos.');
  }

  const compressedBlob = await compressImage(fotoSelecionada);
  const previewUrl = URL.createObjectURL(compressedBlob);

  // Set src e revoga só após onload
  const fotoMostrada = $('#fotoMostrada');
  fotoMostrada.src = previewUrl;
  fotoMostrada.onload = () => {
    URL.revokeObjectURL(previewUrl); // Revoga após carregar
  };

  resultadoAtual = {
    ...res,
    pontos: Math.round(res.pontos * quantidade),
    co2: parseFloat((res.co2 * quantidade).toFixed(2))
  };

  atualizarResultado();
  loadingEl.classList.remove('visible');
  showScreen('resultado');
  fotoSelecionada = null;
  stopCamera(); // Limpa após processar
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

// ===== Confetti =====
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
  const dicaEducacional = $('#dicaEducacional');
  dicaEducacional.textContent = dicasHome[Math.floor(Math.random() * dicasHome.length)];

  $all('.nav-item').forEach(item => item.addEventListener('click', () => showScreen(item.dataset.target)));

  $('#toggleTheme').addEventListener('click', () => {
    document.documentElement.classList.toggle('light-mode');
    localStorage.setItem('lightMode', document.documentElement.classList.contains('light-mode'));
    if (!$('#graficoCO2').closest('section').hidden) atualizarPerfil();
  });

  if (localStorage.getItem('lightMode') === 'true') document.documentElement.classList.add('light-mode');

  $('#btnOpenCamera').addEventListener('click', () => showScreen('camera'));
  $('#btnOpenPerfil').addEventListener('click', () => showScreen('perfil'));

  $('#btnStartCamera').addEventListener('click', startCamera);
  $('#btnSelectFile').addEventListener('click', () => $('#fotoInput').click());
  $('#fotoInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return showError('Arquivo não é uma imagem válida.');
    if (file.size > maxFileSize) return showError('Arquivo muito grande (máx 5MB). Selecione uma menor.');
    hideError();
    $('#loadingPreview').classList.remove('hidden');
    try {
      fotoSelecionada = await compressImage(file);
      if (fotoSelecionada) {
        showPhotoPreview(fotoSelecionada);
      }
    } catch (err) {
      showError('Erro ao comprimir imagem: ' + err.message);
    } finally {
      $('#loadingPreview').classList.add('hidden');
    }
  });

  // Captura foto se câmera ativa
  $('#btnStartCamera').addEventListener('click', startCamera); // Já tem

  // Novo botão identificar
  $('#btnIdentificar').addEventListener('click', identificarResiduo);

  // Para capturar foto: adicionar botão "Capturar" se câmera ativa?
  // Para simplificar, adicionar botão Capturar após iniciar câmera.

  const btnCapturar = document.createElement('button');
  btnCapturar.id = 'btnCapturar';
  btnCapturar.className = 'btn btn-primary';
  btnCapturar.textContent = 'Capturar Foto';
  btnCapturar.disabled = true;
  $('#btnStartCamera').after(btnCapturar);

  btnCapturar.addEventListener('click', async () => {
    if (videoStream) {
      const capturedBlob = await captureImage();
      if (capturedBlob) {
        $('#loadingPreview').classList.remove('hidden');
        fotoSelecionada = await compressImage(capturedBlob);
        showPhotoPreview(fotoSelecionada);
        $('#loadingPreview').classList.add('hidden');
      }
    }
  });

  // Habilitar capturar após iniciar câmera
  const originalStartCamera = startCamera;
  startCamera = async () => {
    await originalStartCamera();
    btnCapturar.disabled = false;
  };

  $('#btnResultadoVoltar').addEventListener('click', () => showScreen('home'));
  $('#btnConfirmar').addEventListener('click', confirmarDescarte);

  $('#btnVerPerfil').addEventListener('click', () => showScreen('perfil'));
  $('#btnRecompensaHome').addEventListener('click', () => showScreen('home'));

  $('#btnPerfilHome').addEventListener('click', () => showScreen('home'));
  $('#btnReset').addEventListener('click', resetarDados);

  showScreen('home');
  atualizarPerfil();
});