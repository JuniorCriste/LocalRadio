// Dicionário atualizado de rádios com caminhos dos áudios locais
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

// Configuração inicial de volume em 100% (1.0)
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
            console.error(`Erro ao reproduzir voz: ${proximoAudio}`, erro);
            // Se falhar (ex: arquivo ausente), pula para o próximo da fila
            executarVozes(listaAudios, callback);
        });
}

// Função para sintonizar uma rádio
function sintonizar(id, pularIntroducaoVoz = false) {
    if (!radios[id]) return;
    
    // Limpa monitores de erros anteriores e estados de retextativa
    clearTimeout(timeoutErro);
    redefinindoSinal = false;

    radioAtualId = id;
    const radio = radios[id];
    
    // Atualiza interface visual (Cards ativos)
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
    const cardElement = document.getElementById(`card-${id}`);
    if (cardElement) cardElement.classList.add('active');

    statusDisplay.innerText = `Sintonizando: ${radio.nome}...`;
    player.pause();
    voicePlayer.pause();

    if (pularIntroducaoVoz) {
        // Inicialização direta do streaming
        conectarStreaming(radio);
    } else {
        // Enfileira: "sintonizando.ogg" e depois o ogg específico da rádio
        executarVozes(['sintonizando.ogg', radio.audioNome], () => {
            conectarStreaming(radio);
        });
    }
}

// Função que realiza a conexão do link de streaming
function conectarStreaming(radio) {
    player.src = radio.url;
    statusDisplay.innerText = `Conectando a ${radio.nome}...`;
    
    player.play()
        .then(() => {
            statusDisplay.innerText = `Tocando agora: ${radio.nome} 🔊`;
            
            // Monitor de travamento inicial: Se em 8s não carregar buffer, tenta recuperar sinal
            timeoutErro = setTimeout(() => {
                if (player.paused || player.currentTime === 0) {
                    tentarRecuperarSinal();
                }
            }, 8000);
        })
        .catch(erro => {
            console.error(erro);
            tentarRecuperarSinal();
        });
}

// Rotina para tentar restabelecer o sinal sem avisar o usuário
function tentarRecuperarSinal() {
    if (!radioAtualId || redefinindoSinal) return;
    
    redefinindoSinal = true;
    const radio = radios[radioAtualId];
    statusDisplay.innerText = `Sinal instável. Tentando reconectar a ${radio.nome}...`;
    
    player.pause();
    player.src = radio.url;
    
    // Tenta uma segunda carga limpa do streaming
    player.play()
        .then(() => {
            statusDisplay.innerText = `Tocando agora: ${radio.nome} 🔊`;
            redefinindoSinal = false;
        })
        .catch(() => {
            // Se falhar na segunda vez consecutiva, emite o alerta de sem sinal
            dispararErroRadio();
        });
}

// Função acionada se a rádio continuar offline após a tentativa de reconexão
function dispararErroRadio() {
    player.pause();
    redefinindoSinal = false;
    
    if (radioAtualId) {
        statusDisplay.innerText = `Erro: ${radios[radioAtualId].nome} está offline.`;
    }
    
    executarVozes(['semsinal.ogg']);
}

// Função para alterar o volume
function alterarVolume(quantidade) {
    let novoVolume = player.volume + quantidade;
    if (novoVolume > 1) novoVolume = 1;
    if (novoVolume < 0) novoVolume = 0;
    
    player.volume = novoVolume;
    voicePlayer.volume = novoVolume;
    volumeDisplay.innerText = `Vol: ${Math.round(novoVolume * 100)}%`;
}

// Ouvinte do Teclado (Números de 1 a 7, Sinais de + e -)
document.addEventListener('keydown', (event) => {
    const tecla = event.key;

    if (tecla >= '1' && tecla <= '7') {
        sintonizar(parseInt(tecla));
    } else if (tecla === '+' || tecla === '=') { 
        alterarVolume(0.1);
    } else if (tecla === '-') {
        alterarVolume(-0.1);
    }
});

// Captura falhas de conexão abruptas durante a reprodução contínua
player.addEventListener('error', () => {
    tentarRecuperarSinal();
});

// Inicialização automática voltada para o ambiente Kiosk
window.addEventListener('DOMContentLoaded', () => {
    statusDisplay.innerText = "Iniciando sistema de rádio...";
    
    // Executa a sequência: Bem-vindo e logo após sintoniza a rádio 1
    executarVozes(['bemvindo.ogg'], () => {
        sintonizar(1);
    });
});