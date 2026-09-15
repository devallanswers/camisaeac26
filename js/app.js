/* ==========================================================================
   CAMISA EAC — app.js
   Toda configuração que muda com frequência está no objeto CONFIG e no
   objeto MEDIDAS logo abaixo. Veja o README para instruções detalhadas.
   ========================================================================== */

/* ==========================================================================
   1. CONFIGURAÇÃO CENTRAL — edite aqui
   ========================================================================== */
const CONFIG = {
  // Nome do produto, mostrado no topo e no resumo do pedido.
  nomeProduto: "Camisa EAC",

  // Preço em número (use ponto para casas decimais). Ex.: 55 ou 55.90
  // ATENÇÃO: o preço final também é validado no Google Apps Script (Code.gs).
  // Se alterar aqui, altere também a constante PRECO_ESPERADO em Code.gs.
  preco: 35, // PRECO_DA_CAMISA_AQUI
  moeda: "BRL",

  // Textos livres do topo da página.
  nomeEvento: "EAC 2026",
  descricao:
    "Uma peça pensada para representar comunidade, fé e juventude. Confira os detalhes, escolha seu tamanho e garanta a sua.",

  // Tamanhos disponíveis, na ordem em que devem aparecer.
  tamanhos: ["PP", "P", "M", "G", "GG", "XG"],

  // Formas de pagamento disponíveis.
  // URL do Web App do Google Apps Script (gerada após a implantação — ver README).
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbxZLRHYuOQ2e653TLGrUiW0ub8Q9xyocHqkD6E_moHEUzHBYKsRoarzyj7O6oAwj8HG4w/exec",

  // Modelo 3D (opcional). Deixe "" para desativar e usar o fallback.
  modelo3D: "", // ex: "assets/camisa.glb"

  // Vídeo de fallback (usado se não houver modelo 3D ou se ele falhar).
  videoFallback: "assets/3d.mp4", // ex: "assets/camisa.mp4"

  // Galeria de fotos. A primeira imagem é usada como imagem principal
  // do hero e como pôster do vídeo, se houver.
  galeria: [
    { titulo: "Visão frontal", imagem: "assets/frente.png" },
    { titulo: "Visão frontal detalhada", imagem: "assets/frenteDetalhe.png"} ,
    { titulo: "Costas", imagem: "assets/costas.png" },
    { titulo: "Costas detalhada", imagem: "assets/costasDetalhe.png" },

    { titulo: "Manga", imagem: "assets/manga.png" },
  ]
};

// Medidas fictícias por tamanho, em centímetros. Substitua pelas medidas reais.
// As chaves precisam bater com os valores de CONFIG.tamanhos.
const MEDIDAS = {
  PP: { largura: 48, comprimento: 68, manga: 20 },
  P:  { largura: 50, comprimento: 70, manga: 21 },
  M:  { largura: 52, comprimento: 72, manga: 22 },
  G:  { largura: 54, comprimento: 74, manga: 23 },
  GG: { largura: 56, comprimento: 76, manga: 24 },
  XG: { largura: 58, comprimento: 78, manga: 25 }
};

/* ==========================================================================
   2. UTILITÁRIOS
   ========================================================================== */
function formatarMoeda(valor, moeda) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: moeda || "BRL" }).format(valor || 0);
  } catch (e) {
    return "R$ " + (valor || 0).toFixed(2).replace(".", ",");
  }
}

const state = {
  tamanhoSelecionado: null,
  galeriaIndex: 0,
  enviando: false
};

/* ==========================================================================
   3. PREENCHIMENTO INICIAL (hero, galeria, tabela, pills)
   ========================================================================== */
function iniciarConteudoEstatico() {
  document.getElementById("hero-titulo").textContent = CONFIG.nomeProduto;
  document.getElementById("hero-descricao").textContent = CONFIG.descricao;
  document.getElementById("hero-preco").textContent = formatarMoeda(CONFIG.preco, CONFIG.moeda);
  document.getElementById("resumo-produto").textContent = CONFIG.nomeProduto;
  document.querySelector(".hero-kicker").textContent = "Coleção EAC · " + CONFIG.nomeEvento;
  document.title = CONFIG.nomeProduto + " — Pedido oficial";

  const primeiraImagem = CONFIG.galeria[0] && CONFIG.galeria[0].imagem;
  if (primeiraImagem) {
    document.getElementById("gallery-main-img").src = primeiraImagem;
  }

  montarGaleria();
  montarTabelaMedidas();
  montarPills("tamanho-group", "tamanho", CONFIG.tamanhos, selecionarTamanho);
  preencherEquipePelaUrl();
}

// Permite compartilhar links específicos, por exemplo: ?equipe=Bodega.
function preencherEquipePelaUrl() {
  const equipe = new URLSearchParams(window.location.search).get("equipe");
  const campo = document.getElementById("input-equipe");
  if (!equipe || !campo) return;

  campo.value = equipe.trim().slice(0, 60);
  atualizarResumo();
}

function montarPills(containerId, name, opcoes, onChange) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  opcoes.forEach((opcao, i) => {
    const id = name + "-" + i;
    const wrapper = document.createElement("span");
    wrapper.className = "pill-option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.id = id;
    input.value = opcao;

    const label = document.createElement("label");
    label.className = "pill-label";
    label.htmlFor = id;
    label.textContent = opcao;

    input.addEventListener("change", () => onChange(opcao));

    wrapper.appendChild(input);
    wrapper.appendChild(label);
    container.appendChild(wrapper);
  });
}

function montarTabelaMedidas() {
  const corpo = document.getElementById("measures-body");
  corpo.innerHTML = "";
  CONFIG.tamanhos.forEach((tamanho) => {
    const m = MEDIDAS[tamanho] || { largura: "—", comprimento: "—", manga: "—" };
    const tr = document.createElement("tr");
    tr.id = "linha-medida-" + tamanho;
    tr.innerHTML =
      "<td>" + tamanho + "</td>" +
      "<td>" + m.largura + " cm</td>" +
      "<td>" + m.comprimento + " cm</td>" +
      "<td>" + m.manga + " cm</td>";
    corpo.appendChild(tr);
  });
}

function destacarLinhaMedida(tamanho) {
  document.querySelectorAll("#measures-body tr").forEach((tr) => tr.removeAttribute("data-selected"));
  const linha = document.getElementById("linha-medida-" + tamanho);
  if (linha) {
    linha.setAttribute("data-selected", "true");
  }
}

function iniciarTabelaMedidas() {
  const botao = document.getElementById("btn-medidas");
  const painel = document.getElementById("medidas");
  botao.addEventListener("click", () => {
    const aberto = painel.hidden;
    painel.hidden = !aberto;
    botao.setAttribute("aria-expanded", String(aberto));
    botao.textContent = aberto ? "Ocultar tabela de tamanhos" : "Ver tabela de tamanhos";
  });
}

/* ==========================================================================
   4. GALERIA + LIGHTBOX
   ========================================================================== */
function montarGaleria() {
  const thumbs = document.getElementById("gallery-thumbs");
  thumbs.innerHTML = "";
  CONFIG.galeria.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gallery-thumb";
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", i === 0 ? "true" : "false");
    btn.setAttribute("aria-label", item.titulo);
    btn.innerHTML = `<img src="${item.imagem}" alt="${item.titulo}" loading="lazy">`;
    btn.addEventListener("click", () => selecionarImagemGaleria(i));
    thumbs.appendChild(btn);
  });

  document.getElementById("gallery-main-img").addEventListener("click", () => abrirLightbox(state.galeriaIndex));
  document.getElementById("gallery-expand").addEventListener("click", () => abrirLightbox(state.galeriaIndex));
}

function selecionarImagemGaleria(indice) {
  state.galeriaIndex = indice;
  const item = CONFIG.galeria[indice];
  const img = document.getElementById("gallery-main-img");
  img.src = item.imagem;
  img.alt = item.titulo;
  document.querySelectorAll(".gallery-thumb").forEach((el, i) => {
    el.setAttribute("aria-selected", i === indice ? "true" : "false");
  });
}

function abrirLightbox(indice) {
  state.galeriaIndex = indice;
  atualizarLightbox();
  const lightbox = document.getElementById("lightbox");
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("lightbox-close").focus();
}

function fecharLightbox() {
  document.getElementById("lightbox").hidden = true;
  document.body.style.overflow = "";
}

function atualizarLightbox() {
  const item = CONFIG.galeria[state.galeriaIndex];
  document.getElementById("lightbox-img").src = item.imagem;
  document.getElementById("lightbox-img").alt = item.titulo;
  document.getElementById("lightbox-caption").textContent = item.titulo;
}

function navegarLightbox(delta) {
  const total = CONFIG.galeria.length;
  state.galeriaIndex = (state.galeriaIndex + delta + total) % total;
  atualizarLightbox();
  selecionarImagemGaleria(state.galeriaIndex);
}

function iniciarLightbox() {
  document.getElementById("lightbox-close").addEventListener("click", fecharLightbox);
  document.getElementById("lightbox-prev").addEventListener("click", () => navegarLightbox(-1));
  document.getElementById("lightbox-next").addEventListener("click", () => navegarLightbox(1));
  document.getElementById("lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox") fecharLightbox();
  });
  document.addEventListener("keydown", (e) => {
    const lightbox = document.getElementById("lightbox");
    if (lightbox.hidden) return;
    if (e.key === "Escape") fecharLightbox();
    if (e.key === "ArrowLeft") navegarLightbox(-1);
    if (e.key === "ArrowRight") navegarLightbox(1);
  });
}

/* ==========================================================================
   5. VISUALIZADOR (3D com fallback para vídeo ou imagem)
   Carrega Three.js via CDN somente se um modelo 3D estiver configurado.
   Se o carregamento ou a leitura do modelo falhar, cai automaticamente
   para vídeo e, se este também não existir, para a imagem principal.
   ========================================================================== */
async function iniciarVisualizador() {
  const stage = document.getElementById("viewer-stage");
  const loading = document.getElementById("viewer-loading");
  const controls = document.getElementById("viewer-controls");

  if (CONFIG.modelo3D) {
    try {
      await carregarModelo3D(stage);
      loading.remove();
      controls.hidden = false;
      return;
    } catch (erro) {
      console.warn("Não foi possível carregar o modelo 3D, usando fallback.", erro);
    }
  }

  if (CONFIG.videoFallback) {
    montarVideoFallback(stage);
    loading.remove();
    controls.hidden = false;
    document.getElementById("btn-girar").style.display = "none";
    document.getElementById("btn-zoom-in").style.display = "none";
    document.getElementById("btn-zoom-out").style.display = "none";
    return;
  }

  montarImagemFallback(stage);
  loading.remove();
  controls.hidden = true;
}

function montarImagemFallback(stage) {
  const primeira = CONFIG.galeria[0];
  const img = document.createElement("img");
  img.src = primeira ? primeira.imagem : "";
  img.alt = primeira ? primeira.titulo : CONFIG.nomeProduto;
  stage.appendChild(img);
}

function montarVideoFallback(stage) {
  const video = document.createElement("video");
  video.src = CONFIG.videoFallback;
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.controls = false;
  video.addEventListener("error", () => {
    video.remove();
    montarImagemFallback(stage);
  }, { once: true });
  const primeira = CONFIG.galeria[0];
  if (primeira) video.poster = primeira.imagem;
  stage.appendChild(video);

  document.getElementById("btn-tela-cheia").addEventListener("click", () => solicitarTelaCheia(video));
}

let threeState = null;

async function carregarModelo3D(stage) {
  const THREE = await import("https://unpkg.com/three@0.160.0/build/three.module.js");
  const { GLTFLoader } = await import("https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js");
  const { OrbitControls } = await import("https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js");

  const largura = stage.clientWidth;
  const altura = stage.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, largura / altura, 0.1, 100);
  camera.position.set(0, 0, 3.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(largura, altura);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  stage.appendChild(renderer.domElement);

  const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.9);
  const luzDirecional = new THREE.DirectionalLight(0xffffff, 0.9);
  luzDirecional.position.set(2, 3, 4);
  scene.add(luzAmbiente, luzDirecional);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.autoRotate = false;

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(CONFIG.modelo3D);
  scene.add(gltf.scene);

  function animar() {
    requestAnimationFrame(animar);
    orbit.update();
    renderer.render(scene, camera);
  }
  animar();

  window.addEventListener("resize", () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  threeState = { camera, orbit, renderer, stage };

  document.getElementById("btn-girar").addEventListener("click", () => {
    orbit.autoRotate = !orbit.autoRotate;
  });
  document.getElementById("btn-zoom-in").addEventListener("click", () => {
    camera.position.multiplyScalar(0.9);
  });
  document.getElementById("btn-zoom-out").addEventListener("click", () => {
    camera.position.multiplyScalar(1.1);
  });
  document.getElementById("btn-tela-cheia").addEventListener("click", () => solicitarTelaCheia(stage));
}

function solicitarTelaCheia(elemento) {
  if (elemento.requestFullscreen) elemento.requestFullscreen();
  else if (elemento.webkitRequestFullscreen) elemento.webkitRequestFullscreen();
}

/* ==========================================================================
   6. FORMULÁRIO — seleção, validação, resumo e envio
   ========================================================================== */
function selecionarTamanho(tamanho) {
  state.tamanhoSelecionado = tamanho;
  document.getElementById("erro-tamanho").hidden = true;
  destacarLinhaMedida(tamanho);
  atualizarResumo();
}

function atualizarResumo() {
  const nome = document.getElementById("input-nome").value.trim();
  const equipe = document.getElementById("input-equipe").value.trim();
  document.getElementById("resumo-nome").textContent = nome || "—";
  document.getElementById("resumo-tamanho").textContent = state.tamanhoSelecionado || "—";
  document.getElementById("resumo-equipe").textContent = equipe || "—";
}

function mostrarErroCampo(idErro, mensagem) {
  const el = document.getElementById(idErro);
  el.textContent = mensagem;
  el.hidden = false;
}

function validarFormulario() {
  let valido = true;
  let primeiroInvalido = null;
  const nomeInput = document.getElementById("input-nome");
  const equipeInput = document.getElementById("input-equipe");
  const nome = nomeInput.value.trim();
  const equipe = equipeInput.value.trim();

  if (nome.length < 3) {
    mostrarErroCampo("erro-nome", "Por favor, informe seu nome completo.");
    nomeInput.classList.add("invalid");
    valido = false;
    primeiroInvalido = nomeInput;
  } else {
    nomeInput.classList.remove("invalid");
  }

  if (equipe.length < 1 || equipe.length > 60) {
    mostrarErroCampo("erro-equipe", "Informe sua equipe ou o código dela.");
    equipeInput.classList.add("invalid");
    valido = false;
    primeiroInvalido = primeiroInvalido || equipeInput;
  } else {
    equipeInput.classList.remove("invalid");
    document.getElementById("erro-equipe").hidden = true;
  }

  if (!state.tamanhoSelecionado) {
    mostrarErroCampo("erro-tamanho", "Selecione um tamanho.");
    valido = false;
    primeiroInvalido = primeiroInvalido || document.querySelector('#tamanho-group input');
  }

  if (primeiroInvalido) {
    primeiroInvalido.focus();
    primeiroInvalido.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return valido;
}

function mostrarMensagemFormulario(texto, tipo) {
  const el = document.getElementById("form-message");
  el.textContent = texto;
  el.hidden = false;
  el.style.color = tipo === "erro" ? "var(--erro)" : "var(--sucesso)";
}

function ocultarMensagemFormulario() {
  document.getElementById("form-message").hidden = true;
}

async function enviarPedido(payload) {
  const resposta = await fetch(CONFIG.appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // evita pré-requisição CORS no Apps Script
    body: JSON.stringify(payload)
  });

  if (!resposta.ok) {
    throw new Error("Falha na comunicação com o servidor.");
  }

  const dados = await resposta.json();
  if (!dados.sucesso) {
    throw new Error(dados.mensagem || "Não foi possível registrar o pedido.");
  }
  return dados;
}

function iniciarFormulario() {
  const form = document.getElementById("form-pedido");
  const botao = document.getElementById("btn-enviar");
  const textoBotao = document.getElementById("btn-enviar-texto");

  document.getElementById("input-nome").addEventListener("input", atualizarResumo);
  document.getElementById("input-equipe").addEventListener("input", atualizarResumo);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    ocultarMensagemFormulario();

    if (state.enviando) return; // evita duplo clique / duplo envio
    if (!validarFormulario()) return;

    state.enviando = true;
    botao.disabled = true;
    textoBotao.textContent = "Enviando pedido...";

    const payload = {
      nome: document.getElementById("input-nome").value.trim(),
      equipe: document.getElementById("input-equipe").value.trim(),
      tamanho: state.tamanhoSelecionado,
      moeda: CONFIG.moeda
    };

    try {
      if (!CONFIG.appsScriptUrl || CONFIG.appsScriptUrl.indexOf("COLE_AQUI") === 0) {
        throw new Error("O formulário ainda não foi conectado ao Google Apps Script. Veja o README.");
      }

      const resultado = await enviarPedido(payload);

      form.hidden = true;
      const successCard = document.getElementById("success-card");
      successCard.hidden = false;
      document.getElementById("success-id").textContent = resultado.id || "—";
      successCard.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (erro) {
      console.error(erro);
      mostrarMensagemFormulario(erro.message || "Não foi possível enviar seu pedido agora. Verifique sua conexão e tente novamente.", "erro");
      state.enviando = false;
      botao.disabled = false;
      textoBotao.textContent = "Confirmar pedido";
    }
  });
}

/* ==========================================================================
   7. INICIALIZAÇÃO
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  iniciarConteudoEstatico();
  iniciarTabelaMedidas();
  iniciarLightbox();
  iniciarFormulario();
  iniciarVisualizador();
});
