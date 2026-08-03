// Dicionário de rádios com caminhos dos áudios locais e suporte a iframe oculta
const radios = {
    1: { nome: "Rádio Nova Onda FM - Nova Venécia", url: "https://virtues.live:8078/stream", audioNome: "novaonda.ogg" },
    2: { nome: "Rádio Espírito Santo", url: "https://cast4.hoost.com.br:20191/stream", audioNome: "espiritosanto.ogg" },
    3: { nome: "Rádio Notícia Transanorte FM - Boa Esperança", url: "https://5a2b083e9f360.streamlock.net/radionortehd/radionortehd.stream/playlist.m3u8", audioNome: "noticia.ogg" },
    4: { nome: "Rádio Sintonia FM - Baixo Guandu", url: "https://9669.brasilstream.com.br/stream", audioNome: "sintonia.ogg" },
    5: { nome: "Rádio Massa FM - Ecoporanga", url: "https://radio.saopaulo01.com.br/8226/stream", audioNome: "massa.ogg" },
    6: { nome: "Rádio Jovem Pan FM - Vitória", url: "https://streaming.livespanel.com:21011/jovempanes", audioNome: "jovempan.ogg" },
    7: { nome: "Rádio FlashBack FM - São Paulo", url: "https://cc6.streammaximum.com:20022/stream", audioNome: "flashback.ogg" },
    8: { nome: "Rádio 100% Capixaba", url: "https://juniorcriste.github.io/radio-100-por-cento-capixaba/", audioNome: "capixaba.ogg", tipo: "iframe" },
    9: { nome: "Nova Onda FM - Aimorés", url: "https://virtues.live:8106/stream", audioNome: "novaondaaimores.ogg" }
};

const player = document.getElementById('audio-player');
const voicePlayer = document.getElementById('voice-player');
const webPlayer = document.getElementById('web-player');
const statusDisplay = document.getElementById('status-display');
const volumeDisplay = document.getElementById('volume-display');

let radioAtualId = null;
let timeoutErro = null;
let redefinindoSinal = false;
let sistemaIniciado = false;

// Configuração inicial de volume em 100%
player.volume = 1.0;
voicePlayer.volume = 1.0;

// Função para gerenciar a fila de áudios de voz pré-gravados
function executarVozes(listaAudios, callback) {
    if (listaAudios.length === 0) {
        if (callback) callback();
        return;
    }

    const proximoAudio = listaAudios.shift();
    voicePlayer.src = `voice/${proximoAudio}`;
    voicePlayer.load(); // Força o navegador a carregar o novo elemento de áudio
    
    voicePlayer.play()
        .then(() => {
            voicePlayer.onended = () => {
                executarVozes(listaAudios, callback);
            };
        })
        .catch(erro => {
            console.warn(`Bloqueio de áudio detectado no arquivo: ${proximoAudio}`, erro);
            AtivarModoInteracao(() => executarVozes([proximoAudio, ...listaAudios], callback));
        });
}

// Ativa uma barreira visual e de eventos para destravar o contexto de áudio do navegador
function AtivarModoInteracao(acaoPendente) {
    if (sistemaIniciado) return;
    
    statusDisplay.innerHTML = "<strong>Clique em qualquer lugar da tela ou pressione uma tecla para iniciar o Axis Rádio 📻</strong>";
    statusDisplay.style.background = "#007bff";

    const liberarContexto = () => {
        statusDisplay.style.background = "var(--card-bg)";
        statusDisplay.innerText = "Iniciando sistema...";
        
        player.load();
        voicePlayer.load();
        
        sistemaIniciado = true;
        
        document.removeEventListener('click', liberarContexto);
        document.removeEventListener('keydown', liberarContexto);
        
        acaoPendente();
    };

    document.addEventListener('click', liberarContexto);
    document.addEventListener('keydown', liberarContexto);
}

// Função para sintonizar uma rádio
function sintonizar(id, pularIntroducaoVoz = false) {
    if (!radios[id]) return;
    
    if (!sistemaIniciado) {
        sistemaIniciado = true;
        player.load();
        voicePlayer.load();
    }

    clearTimeout(timeoutErro);
    redefinindoSinal = false;

    // Se estivermos saindo de uma rádio iframe, enviamos a ordem de parada IMEDIATAMENTE
    if (webPlayer && webPlayer.contentWindow) {
        try {
            webPlayer.contentWindow.postMessage('stop_radio', '*');
        } catch (e) {}
    }

    radioAtualId = id;
    const radio = radios[id];
    
    // Atualiza interface visual
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
    const cardElement = document.getElementById(`card-${id}`);
    if (cardElement) cardElement.classList.add('active');

    statusDisplay.innerText = `Sintonizando: ${radio.nome}...`;
    player.pause();
    
    voicePlayer.loop = false;
    voicePlayer.pause();

    if (pularIntroducaoVoz) {
        conectarStreaming(radio);
    } else {
        executarVozes(['sintonizando.ogg', radio.audioNome], () => {
            conectarStreaming(radio);
        });
    }
}

// Conexão do streaming
function conectarStreaming(radio) {
    if (radio.tipo === "iframe") {
        player.pause();
        player.src = "";

        webPlayer.onload = () => {
            setTimeout(() => {
                if (webPlayer.contentWindow) {
                    webPlayer.contentWindow.postMessage('play_radio', '*');
                }
            }, 300);
        };

        webPlayer.src = radio.url;
        statusDisplay.innerText = `Tocando agora: ${radio.nome} 🔊`;
    } else {
        webPlayer.onload = null;
        webPlayer.src = "about:blank";

        player.src = radio.url;
        player.load();
        statusDisplay.innerText = `Conectando a ${radio.nome}...`;
        
        player.play()
            .then(() => {
                statusDisplay.innerText = `Tocando agora: ${radio.nome} 🔊`;
                
                timeoutErro = setTimeout(() => {
                    if (player.paused || player.currentTime === 0) {
                        tentarRecuperarSinal();
                    }
                }, 8000);
            })
            .catch(erro => {
                console.error("Erro ao reproduzir streaming:", erro);
                tentarRecuperarSinal();
            });
    }
}

// Recuperação silenciosa de sinal
function tentarRecuperarSinal() {
    if (!radioAtualId || redefinindoSinal) return;
    
    redefinindoSinal = true;
    const radio = radios[radioAtualId];

    if (radio.tipo === "iframe") {
        webPlayer.src = radio.url;
        statusDisplay.innerText = `Tocando agora: ${radio.nome} 🔊`;
        redefinindoSinal = false;
        return;
    }

    statusDisplay.innerText = `Sinal instável. Tentando reconectar...`;
    
    player.pause();
    player.src = radio.url;
    player.load();
    
    player.play()
        .then(() => {
            statusDisplay.innerText = `Tocando agora: ${radio.nome} 🔊`;
            redefinindoSinal = false;
        })
        .catch(() => {
            dispararErroRadio();
        });
}

function dispararErroRadio() {
    player.pause();
    redefinindoSinal = false;
    if (radioAtualId) {
        statusDisplay.innerText = `Erro: ${radios[radioAtualId].nome} está offline.`;
    }
    
    executarVozes(['semsinal.ogg'], () => {
        voicePlayer.src = 'voice/errormusic.ogg';
        voicePlayer.loop = true;
        voicePlayer.load();
        voicePlayer.play().catch(erro => console.error("Erro ao reproduzir errormusic.ogg:", erro));
    });
}

// Alteração de volume
function alterarVolume(quantidade) {
    let volumeCalculado = player.volume + quantidade;
    if (volumeCalculado > 1) volumeCalculado = 1;
    if (volumeCalculado < 0) volumeCalculado = 0;
    
    player.volume = Number(volumeCalculado.toFixed(1));
    voicePlayer.volume = Number(volumeCalculado.toFixed(1));
    volumeDisplay.innerText = `Vol: ${Math.round(volumeCalculado * 100)}%`;
}

// Função para mudar de rádio sequencialmente (com efeito carrossel)
function mudarRadioSequencial(direcao) {
    const idsDisponiveis = Object.keys(radios).map(Number); // Obtém [1, 2, 3, 4, 5, 6, 7, 8, 9]
    
    if (!radioAtualId) {
        sintonizar(idsDisponiveis[0]);
        return;
    }

    let indiceAtual = idsDisponiveis.indexOf(radioAtualId);
    let novoIndice;

    if (direcao === 'proxima') {
        novoIndice = indiceAtual + 1;
        if (novoIndice >= idsDisponiveis.length) {
            novoIndice = 0;
        }
    } else if (direcao === 'anterior') {
        novoIndice = indiceAtual - 1;
        if (novoIndice < 0) {
            novoIndice = idsDisponiveis.length - 1;
        }
    }

    const proximoId = idsDisponiveis[novoIndice];
    sintonizar(proximoId);
}

// Ouvinte Geral do Teclado
document.addEventListener('keydown', (event) => {
    const tecla = event.key.replace('Numpad', '');

    if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(tecla)) {
        sintonizar(parseInt(tecla));
    } else if (tecla === '+' || tecla === '=') { 
        alterarVolume(0.1);
    } else if (tecla === '-') {
        alterarVolume(-0.1);
    } else if (tecla === 'ArrowRight') {
        mudarRadioSequencial('proxima');
    } else if (tecla === 'ArrowLeft') {
        mudarRadioSequencial('anterior');
    }
});

// Captura falhas abruptas durante a reprodução
player.addEventListener('error', () => {
    tentarRecuperarSinal();
});

// Inicialização ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    executarVozes(['bemvindo.ogg'], () => {
        sintonizar(1);
    });
});

// Reprodução do Áudio de Hora Pre-gravado
function reproduzirAudioHora() {
    const agora = new Date();
    const horas24 = agora.getHours();
    
    // Converte de formato 24h para 12h (0h e 12h viram 12; 1h e 13h viram 1, etc.)
    const horaFormatada = (horas24 % 12) === 0 ? 12 : (horas24 % 12);
    
    const audioHora = new Audio(`sounds/hora/${horaFormatada}.ogg`);
    audioHora.play().catch(() => console.log(`Erro ao reproduzir o arquivo sounds/hora/${horaFormatada}.ogg`));
}

// Verificação do Relógio
setInterval(() => {
    const agora = new Date();
    if (agora.getMinutes() === 0 && agora.getSeconds() === 0) {
        reproduzirAudioHora();
    }
}, 1000);
