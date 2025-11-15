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

const residueTypes = [
  { id: 0, namePt: 'Plástico', nameEn: 'Plastic', binPt: 'Azul', binEn: 'Blue', points: 10, co2: 2.0 },
  { id: 1, namePt: 'Papel', nameEn: 'Paper', binPt: 'Amarelo', binEn: 'Yellow', points: 5, co2: 1.0 },
  { id: 2, namePt: 'Orgânico', nameEn: 'Organic', binPt: 'Marrom', binEn: 'Brown', points: 8, co2: 0.5 },
  { id: 3, namePt: 'Vidro', nameEn: 'Glass', binPt: 'Verde', binEn: 'Green', points: 7, co2: 0.5 },
  { id: 4, namePt: 'Metal', nameEn: 'Metal', binPt: 'Cinza', binEn: 'Gray', points: 9, co2: 2.0 },
  { id: 5, namePt: 'Eletrônicos', nameEn: 'Electronics', binPt: 'Vermelho', binEn: 'Red', points: 15, co2: 2.0 }
];

const residueTips = {
  pt: [
    'Plásticos reciclados economizam energia equivalente a 1 lâmpada por 6h.',
    'Reciclar papel salva árvores e reduz CO₂.',
    'Orgânicos compostados viram adubo e evitam metano.',
    'Vidro é 100% reciclável e infinito.',
    'Reciclar metal economiza mineração e energia.',
    'Eletrônicos reciclados previnem poluição tóxica.'
  ],
  en: [
    'Recycled plastics save energy equivalent to 1 lamp for 6h.',
    'Recycling paper saves trees and reduces CO₂.',
    'Composted organics become fertilizer and avoid methane.',
    'Glass is 100% recyclable and infinite.',
    'Recycling metal saves mining and energy.',
    'Recycled electronics prevent toxic pollution.'
  ]
};

const homeTips = {
  pt: [
    'Separe o lixo seco do úmido para facilitar a coleta.',
    'Evite plásticos de uso único — use sacolas reutilizáveis!',
    'Reciclagem reduz o uso de recursos naturais.',
    'Composte orgânicos para enriquecer o solo.',
    'Reutilize itens antes de descartar.'
  ],
  en: [
    'Separate dry from wet waste to facilitate collection.',
    'Avoid single-use plastics — use reusable bags!',
    'Recycling reduces the use of natural resources.',
    'Compost organics to enrich the soil.',
    'Reuse items before discarding.'
  ]
};

// Pontos de coleta atualizados (com coordenadas e detalhes completos)
const pontosColeta = [
  { lat: -20.3207, lng: -40.3328, nome: 'Eletrônica Faé', endereco: 'R. Josué Prado, 90 - Centro, Vitória - ES, 29010-360', telefone: '(27) 3331-3181', coletaPt: 'Pilhas e baterias', coletaEn: 'Batteries' },
  { lat: -20.3090, lng: -40.2930, nome: 'Gorza Musical', endereco: 'R. Des. Sampaio, 177 - Praia do Canto, Vitória - ES, 29055-250', telefone: '(27) 3314-3555', coletaPt: 'Lixo eletrônico de pequeno porte', coletaEn: 'Small electronic waste' },
  { lat: -20.2515, lng: -40.2673, nome: 'Supermercado Carone - Jardim Camburi', endereco: 'Av. Judith Leão Castello Ribeiro, 272 - Jardim Camburi, Vitória - ES, 29090-720', telefone: '(27) 3237-2727', coletaPt: 'Lixo eletrônico de pequeno porte', coletaEn: 'Small electronic waste' },
  { lat: -20.2979, lng: -40.3068, nome: 'Extrabom Supermercado - Itararé', endereco: 'R. Daniel Abreu Machado, 151 - Itararé, Vitória - ES, 29047-540', telefone: '(27) 3298-2338', coletaPt: 'Pilhas e baterias', coletaEn: 'Batteries' },
  { lat: -20.2844, lng: -40.2960, nome: 'Extraplus Supermercado - Jardim da Penha', endereco: 'R. Dr. Antônio Basílio, 534 - Jardim da Penha, Vitória - ES, 29060-390', telefone: '(27) 3298-2339', coletaPt: 'Pilhas e baterias', coletaEn: 'Batteries' },
  { lat: -20.3075, lng: -40.3028, nome: 'Supermercado Carone - Santa Lúcia', endereco: 'Av. Rio Branco, 77 - Santa Lúcia, Vitória - ES, 29056-255', telefone: '(27) 3137-2833', coletaPt: 'Pilhas e baterias', coletaEn: 'Batteries' },
  { lat: -20.3189, lng: -40.3232, nome: 'Papa-móveis - Prefeitura de Vitória', endereco: 'Av. Mal. Mascarenhas de Moraes, 1927 - Bento Ferreira, Vitória - ES, 29050-625', telefone: '156 ou (27) 99693-8953', coletaPt: 'Eletrodomésticos (*Recolhe em residência)', coletaEn: 'Appliances (*Collects at residence)' },
  { lat: -20.1460, lng: -40.2780, nome: 'Biopetro Ambiental', endereco: 'R. Jaburú, 73 - Novo Porto Canoa, Serra - ES, 29167-548', telefone: '(27) 3298-3909', coletaPt: 'Pilhas, bateria, HD\'s e peças de computador', coletaEn: 'Batteries, HDs and computer parts' },
  { lat: -20.2073, lng: -40.2695, nome: 'CTR Marca Ambiental - Nova Carapina', endereco: 'Rod. Gov. Mário Covas, 260 - Nova Carapina I, Serra - ES, 29170-023', telefone: '(27) 2123-7700', coletaPt: 'Todos os tipos de lixo eletrônico', coletaEn: 'All types of electronic waste' },
  { lat: -20.1589, lng: -40.2546, nome: 'Extrabom Supermercado - Porto Canoa', endereco: 'Av. Porto Canoa, 132 - Porto Canoa, Serra - ES, 29168-345', telefone: '(27) 3298-2334', coletaPt: 'Pilhas e baterias', coletaEn: 'Batteries' },
  { lat: -20.1522, lng: -40.1861, nome: 'EPA Supermercados - Jacaraípe', endereco: 'Av. Abido Saad, 2340 - Jacaraípe, Serra - ES, 29173-180', telefone: '(27) 3252-1223', coletaPt: 'Pilhas e baterias', coletaEn: 'Batteries' },
  { lat: -20.1780, lng: -40.2510, nome: 'Coleta Ambiental', endereco: 'Rua O, Quadra 16, Lote 13 - São Diogo I, Serra - ES, 29163-269', telefone: '(27) 3328-7001', coletaPt: 'Todos os tipos de lixo eletrônico', coletaEn: 'All types of electronic waste' }
];

const translations = {
  pt: {
    pageTitle: 'EcoLixo — Mobile (otimizado)',
    metaDescription: 'Simulador EcoLixo — reconhecimento de resíduo, recompensas e monitor de impacto.',
    appTitle: 'EcoLixo',
    subtitle: 'Simulador de coleta inteligente',
    toggleThemeTitle: 'Alternar tema',
    homeAriaLabel: 'Home',
    cameraAriaLabel: 'Camera',
    resultadoAriaLabel: 'Resultado',
    recompensaAriaLabel: 'Recompensa',
    perfilAriaLabel: 'Perfil',
    dicaLoading: 'Dica: carregando...',
    recognizeWaste: '📸 Reconhecer Resíduo',
    viewImpact: '📊 Ver Meu Impacto',
    identifyWaste: 'Identifique o resíduo',
    cameraDica: 'Tire uma foto ou selecione uma imagem do resíduo, em seguida preencha os detalhes para simular o reconhecimento.',
    startCamera: 'Iniciar Câmera',
    selectFileAria: 'Selecionar arquivo de imagem',
    selectFile: 'Selecionar Arquivo',
    wasteType: 'Tipo de resíduo:',
    humidity: 'Umidade:',
    dry: 'Seco',
    wet: 'Úmido',
    quantity: 'Quantidade (kg):',
    identify: 'Identificar',
    loadingPreview: 'Carregando preview...',
    identificationResult: 'Resultado da Identificação',
    wastePhotoAlt: 'Foto do resíduo',
    confirmDisposal: 'Confirmar descarte',
    back: 'Voltar',
    congratulations: 'Parabéns! 🎉',
    viewImpactBtn: 'Ver impacto',
    backHome: 'Voltar à Home',
    yourImpact: 'Seu Impacto Ambiental',
    kgCo2Avoided: 'kg CO₂ evitado',
    points: 'pontos',
    resetData: 'Resetar dados',
    backBtn: 'Voltar',
    mainNav: 'Navegação principal',
    home: 'Home',
    photo: 'Foto',
    profile: 'Perfil',
    incompatibleHumidity: 'A umidade selecionada é incompatível com o tipo de resíduo. Orgânicos são úmidos, os outros são secos.',
    positiveQuantity: 'Quantidade deve ser um número positivo.',
    noPhoto: 'Por favor, tire ou selecione uma foto antes de identificar.',
    thisIs: 'Isso é',
    disposeInBin: 'Descarte na lixeira',
    youAvoided: 'Você evitou',
    kgOfCo2: 'kg de CO₂ 🌱',
    co2AvoidedLabel: 'CO₂ evitado (kg)',
    resetConfirm: 'Tem certeza que deseja resetar todos os dados?',
    dataReset: 'Dados resetados.',
    geoError: 'Erro na geolocalização:',
    noLocation: 'Não foi possível obter sua localização. Verifique permissões ou GPS.',
    noGeoSupport: 'Geolocalização não suportada no seu navegador.',
    nearestPoint: 'Ponto mais próximo:',
    kmDistance: 'km de distância.',
    phone: 'Telefone:',
    address: 'Endereço:',
    permissionDenied: 'Permissão para câmera negada. Por favor, permita o acesso ou use a seleção de arquivo.',
    cameraError: 'Não foi possível acessar a câmera. Verifique se outra app está usando ou use arquivo.',
    captureError: 'Erro ao capturar foto:',
    compressError: 'Erro ao comprimir imagem:',
    invalidImage: 'Arquivo não é uma imagem válida.',
    fileTooLarge: 'Arquivo muito grande (máx 5MB). Selecione uma menor.',
    userLocation: 'Sua localização atual'
  },
  en: {
    pageTitle: 'EcoLixo — Mobile (optimized)',
    metaDescription: 'EcoLixo Simulator — waste recognition, rewards and impact monitor.',
    appTitle: 'EcoLixo',
    subtitle: 'Intelligent collection simulator',
    toggleThemeTitle: 'Toggle theme',
    homeAriaLabel: 'Home',
    cameraAriaLabel: 'Camera',
    resultadoAriaLabel: 'Result',
    recompensaAriaLabel: 'Reward',
    perfilAriaLabel: 'Profile',
    dicaLoading: 'Tip: loading...',
    recognizeWaste: '📸 Recognize Waste',
    viewImpact: '📊 View My Impact',
    identifyWaste: 'Identify the waste',
    cameraDica: 'Take a photo or select an image of the waste, then fill in the details to simulate recognition.',
    startCamera: 'Start Camera',
    selectFileAria: 'Select image file',
    selectFile: 'Select File',
    wasteType: 'Waste type:',
    humidity: 'Humidity:',
    dry: 'Dry',
    wet: 'Wet',
    quantity: 'Quantity (kg):',
    identify: 'Identify',
    loadingPreview: 'Loading preview...',
    identificationResult: 'Identification Result',
    wastePhotoAlt: 'Waste photo',
    confirmDisposal: 'Confirm disposal',
    back: 'Back',
    congratulations: 'Congratulations! 🎉',
    viewImpactBtn: 'View impact',
    backHome: 'Back to Home',
    yourImpact: 'Your Environmental Impact',
    kgCo2Avoided: 'kg CO₂ avoided',
    points: 'points',
    resetData: 'Reset data',
    backBtn: 'Back',
    mainNav: 'Main navigation',
    home: 'Home',
    photo: 'Photo',
    profile: 'Profile',
    incompatibleHumidity: 'The selected humidity is incompatible with the waste type. Organics are wet, others are dry.',
    positiveQuantity: 'Quantity must be a positive number.',
    noPhoto: 'Please take or select a photo before identifying.',
    thisIs: 'This is',
    disposeInBin: 'Dispose in the bin',
    youAvoided: 'You avoided',
    kgOfCo2: 'kg of CO₂ 🌱',
    co2AvoidedLabel: 'CO₂ avoided (kg)',
    resetConfirm: 'Are you sure you want to reset all data?',
    dataReset: 'Data reset.',
    geoError: 'Geolocation error:',
    noLocation: 'Unable to get your location. Check permissions or GPS.',
    noGeoSupport: 'Geolocation not supported in your browser.',
    nearestPoint: 'Nearest point:',
    kmDistance: 'km away.',
    phone: 'Phone:',
    address: 'Address:',
    permissionDenied: 'Camera permission denied. Please allow access or use file selection.',
    cameraError: 'Unable to access camera. Check if another app is using it or use file.',
    captureError: 'Error capturing photo:',
    compressError: 'Error compressing image:',
    invalidImage: 'File is not a valid image.',
    fileTooLarge: 'File too large (max 5MB). Select a smaller one.',
    userLocation: 'Your current location'
  }
};

let currentLang = localStorage.getItem('language') || 'pt';

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
      .bindPopup(`<b>${ponto.nome}</b><br>${ponto[`coleta${currentLang === 'pt' ? 'Pt' : 'En'}`]}<br>${translations[currentLang].phone} ${ponto.telefone}<br>${translations[currentLang].address} ${ponto.endereco}`);
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
          }).addTo(mapInstance).bindPopup(translations[currentLang].userLocation).openPopup();

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
            $('#dicaEducacional').textContent = `${translations[currentLang].nearestPoint} ${nearest.nome} (${minDist.toFixed(2)} ${translations[currentLang].kmDistance}).`;
          }
        },
        (error) => {
          console.error(`${translations[currentLang].geoError} ${error}`);
          $('#dicaEducacional').textContent = translations[currentLang].noLocation;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      $('#dicaEducacional').textContent = translations[currentLang].noGeoSupport;
    }
  }

  getUserLocationAndFindNearest();
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en-US';
  document.title = translations[lang].pageTitle;
  document.querySelector('meta[name="description"]').content = translations[lang].metaDescription;

  $all('[data-i18n]').forEach(el => {
    el.textContent = translations[lang][el.dataset.i18n];
  });

  $all('[data-i18n-title]').forEach(el => {
    el.title = translations[lang][el.dataset.i18nTitle];
  });

  $all('[data-i18n-aria-label]').forEach(el => {
    el.setAttribute('aria-label', translations[lang][el.dataset.i18nAriaLabel]);
  });

  $all('[data-i18n-alt]').forEach(el => {
    el.alt = translations[lang][el.dataset.i18nAlt];
  });

  updateResidueOptions();
  $('#toggleLanguage').textContent = lang === 'pt' ? 'EN' : 'PT';

  if (mapInstance && $('#home').classList.contains('visible')) {
    mapInstance.remove();
    mapInstance = null;
    initMap();
  }

  if ($('#resultado').classList.contains('visible') && resultadoAtual) {
    atualizarResultado();
  }

  if ($('#recompensa').classList.contains('visible') && resultadoAtual) {
    $('#pontosTexto').textContent = `+${resultadoAtual.pontos} ${translations[lang].points}!`;
    $('#co2Texto').textContent = `${translations[lang].youAvoided} ${resultadoAtual.co2} ${translations[lang].kgOfCo2}`;
  }

  if ($('#perfil').classList.contains('visible')) {
    atualizarPerfil();
  }
}

function updateResidueOptions() {
  const select = $('#tipoResiduo');
  select.innerHTML = '';
  residueTypes.forEach(res => {
    const opt = document.createElement('option');
    opt.value = res.id;
    opt.textContent = res[`name${currentLang === 'pt' ? 'Pt' : 'En'}`];
    select.appendChild(opt);
  });
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
    'Azul': '#1976d2',
    'Blue': '#1976d2',
    'Amarelo': '#fdd835',
    'Yellow': '#fdd835',
    'Marrom': '#6d4c41',
    'Brown': '#6d4c41',
    'Verde': '#2e7d32',
    'Green': '#2e7d32',
    'Cinza': '#757575',
    'Gray': '#757575',
    'Vermelho': '#f44336',
    'Red': '#f44336'
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
    showError(translations[currentLang].compressError);
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
    showError(err.name === 'NotAllowedError' ? translations[currentLang].permissionDenied : translations[currentLang].cameraError);
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
      showError(`${translations[currentLang].captureError} ${err.message}`);
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
  if (!fotoSelecionada) return showError(translations[currentLang].noPhoto);

  const loadingEl = $('#loadingProcess');
  loadingEl.classList.add('visible');

  const tipoIdx = parseInt($('#tipoResiduo').value);
  const umidade = document.querySelector('input[name="umidade"]:checked')?.value;
  const quantidade = parseFloat($('#quantidade').value);

  if (isNaN(quantidade) || quantidade <= 0) {
    loadingEl.classList.remove('visible');
    return showError(translations[currentLang].positiveQuantity);
  }

  const resType = residueTypes[tipoIdx];
  const isOrganico = tipoIdx === 2;

  if ((isOrganico && umidade !== 'wet') || (!isOrganico && umidade !== 'dry')) {
    loadingEl.classList.remove('visible');
    return showError(translations[currentLang].incompatibleHumidity);
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
    tipo: resType[`name${currentLang === 'pt' ? 'Pt' : 'En'}`],
    lixeira: resType[`bin${currentLang === 'pt' ? 'Pt' : 'En'}`],
    pontos: Math.round(resType.points * quantidade),
    co2: parseFloat((resType.co2 * quantidade).toFixed(2)),
    dica: residueTips[currentLang][tipoIdx]
  };

  atualizarResultado();
  loadingEl.classList.remove('visible');
  showScreen('resultado');
  fotoSelecionada = null;
  stopCamera(); // Limpa após processar
}

function atualizarResultado() {
  $('#tipoLixo').textContent = `${translations[currentLang].thisIs} ${resultadoAtual.tipo}!`;
  $('#lixeira').innerHTML = `${translations[currentLang].disposeInBin} <strong style="color:${getCorLixeira(resultadoAtual.lixeira)}">${resultadoAtual.lixeira}</strong>.`;
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

  $('#pontosTexto').textContent = `+${resultadoAtual.pontos} ${translations[currentLang].points}!`;
  $('#co2Texto').textContent = `${translations[currentLang].youAvoided} ${resultadoAtual.co2} ${translations[currentLang].kgOfCo2}`;

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
    labels.push(m.toLocaleString(currentLang === 'pt' ? 'pt-BR' : 'en-US', { month: 'short' }));
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
        label: translations[currentLang].co2AvoidedLabel,
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
  if (!confirm(translations[currentLang].resetConfirm)) return;
  pontosTotais = 0;
  co2Total = 0;
  descartes = [];
  localStorage.removeItem('pontosTotais');
  localStorage.removeItem('co2Total');
  localStorage.removeItem('descartes');
  atualizarPerfil();
  alert(translations[currentLang].dataReset);
}

// ===== Init / UI wiring =====
document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);

  $all('.nav-item').forEach(item => item.addEventListener('click', () => showScreen(item.dataset.target)));

  $('#toggleTheme').addEventListener('click', () => {
    document.documentElement.classList.toggle('light-mode');
    localStorage.setItem('lightMode', document.documentElement.classList.contains('light-mode'));
    if (!$('#graficoCO2').closest('section').hidden) atualizarPerfil();
  });

  if (localStorage.getItem('lightMode') === 'true') document.documentElement.classList.add('light-mode');

  $('#toggleLanguage').addEventListener('click', () => {
    const newLang = currentLang === 'pt' ? 'en' : 'pt';
    setLanguage(newLang);
  });

  $('#btnOpenCamera').addEventListener('click', () => showScreen('camera'));
  $('#btnOpenPerfil').addEventListener('click', () => showScreen('perfil'));

  $('#btnStartCamera').addEventListener('click', startCamera);
  $('#btnSelectFile').addEventListener('click', () => $('#fotoInput').click());
  $('#fotoInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return showError(translations[currentLang].invalidImage);
    if (file.size > maxFileSize) return showError(translations[currentLang].fileTooLarge);
    hideError();
    $('#loadingPreview').classList.remove('hidden');
    try {
      fotoSelecionada = await compressImage(file);
      if (fotoSelecionada) {
        showPhotoPreview(fotoSelecionada);
      }
    } catch (err) {
      showError(`${translations[currentLang].compressError} ${err.message}`);
    } finally {
      $('#loadingPreview').classList.add('hidden');
    }
  });

  // Novo botão identificar
  $('#btnIdentificar').addEventListener('click', identificarResiduo);

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