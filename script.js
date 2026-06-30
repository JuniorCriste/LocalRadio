// Dicionário de rádios com caminhos dos áudios locais
const radios = {
    1: { nome: "Rádio Nova Onda FM - Nova Venécia", url: "https://virtues.live:8078/stream", audioNome: "novaonda.ogg" },
    2: { nome: "Rádio Espírito Santo", url: "https://cast4.hoost.com.br:20191/stream", audioNome: "espiritosanto.ogg" },
    3: { nome: "Rádio Notícia Transanorte FM - Boa Esperança", url: "https://5a2b083e9f360.streamlock.net/radionortehd/radionortehd.stream/playlist.m3u8", audioNome: "noticia.ogg" },
    4: { nome: "Rádio Sintonia FM - Baixo Guandu", url: "https://9669.brasilstream.com.br/stream", audioNome: "sintonia.ogg" },
    5: { nome: "Rádio Massa FM - Ecoporanga", url: "https://radio.saopaulo01.com.br/8226/stream", audioNome: "massa.ogg" },
    6: { nome: "Rádio Jovem Pan FM - Vitória", url: "https://streaming.livespanel.com:21011/jovempanes", audioNome: "jovempan.ogg" },
    7: { nome: "Rádio FlashBack FM - São Paulo", url: "https://cc6.streammaximum.com:20022/stream", audioNome: "flashback.ogg" }
};

const player = document.getElementById('audio-player');
const voicePlayer = document.getElementById('voice-player');
const statusDisplay = document.getElementById('status-display');
const volumeDisplay = document.getElementById('volume-display');

let radioAtualId = null;
let timeoutErro = null;
let redefinindoSinal = false;

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
    
    voicePlayer.play()
        .then(() => {
            voicePlayer.onended = () => {
                executarVozes(listaAudios, callback);
            };
        })
        .catch(erro => {
            console.warn(`Autoplay bloqueado ou erro na voz: ${proximoAudio}`, erro);
            // Se foi bloqueado pelo navegador, joga para o fallback de interação
            aguardarInteracaoUsuario(() => executarVozes([proximoAudio, ...listaAudios], callback));
        });
}

// Função de Fallback para navegadores sem permissão de autoplay
function aguardarInteracaoUsuario(acaoPendente) {
    statusDisplay.innerText = "Clique em qualquer lugar da tela para iniciar o sistema 📻";
    
    const interagir = () => {
        statusDisplay.innerText = "Iniciando...";
        acaoPendente();
        document.removeEventListener('click', interagir);
        document.removeEventListener('keydown', interagir);
    };

    document.addEventListener('click', interagir);
    document.addEventListener('keydown', interagir);
}

// Função para sintonizar uma rádio
function sintonizar(id, pularIntroducaoVoz = false) {
    if (!radios[id]) return;
    
    clearTimeout(timeoutErro);
    redefinindoSinal = false;

    radioAtualId = id;
    const radio = radios[id];
    
    // Atualiza interface visual
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
    const cardElement = document.getElementById(`card-${id}`);
    if (cardElement) cardElement.classList.add('active');

    statusDisplay.innerText = `Sintonizando: ${radio.nome}...`;
    player.pause();
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
    player.src = radio.url;
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

// Recuperação silenciosa de sinal
function tentarRecuperarSinal() {
    if (!radioAtualId || redefinindoSinal) return;
    
    redefinindoSinal = true;
    const radio = radios[radioAtualId];
    statusDisplay.innerText = `Sinal instável. Tentando reconectar...`;
    
    player.pause();
    player.src = radio.url;
    
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
    executarVozes(['semsinal.ogg']);
}

// Alteração de volume
function alterarVolume(quantidade) {
    let novoVolume = player.volume + quantidade;
    if (novoVolume > 1) novoVolume = 1;
    if (novoVolume < 0) novoVolume = 0;
    
    player.volume = Number(novoVolume.toFixed(1));
    voicePlayer.volume = Number(novoVolume.toFixed(1));
    volumeDisplay.innerText = `Vol: ${Math.round(novoVolume * 100)}%`;
}

// Ouvinte do Teclado Corrigido (Aceita teclado numérico comum e o NumPad)
document.addEventListener('keydown', (event) => {
    // Normaliza as teclas capturadas (ex: "Numpad1" vira "1")
    const tecla = event.key.replace('Numpad', '');

    // Verifica se a tecla pressionada é um número entre 1 e 7
    if (['1', '2', '3', '4', '5', '6', '7'].includes(tecla)) {
        sintonizar(parseInt(tecla));
    } else if (tecla === '+' || tecla === '=') { 
        alterarVolume(0.1);
    } else if (tecla === '-') {
        alterarVolume(-0.1);
    }
});

// Captura falhas abruptas durante a reprodução
player.addEventListener('error', () => {
    tentarRecuperarSinal();
});

// Inicialização segura para Kiosk e máquinas comuns
window.addEventListener('DOMContentLoaded', () => {
    statusDisplay.innerText = "Iniciando sistema de rádio...";
    
    // Tenta rodar a sequência inicial
    executarVozes(['bemvindo.ogg'], () => {
        sintonizar(1);
    });
});