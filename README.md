# 📻 Axis Rádio `v1.0`

> **Sintonize o melhor do rádio capixaba em uma plataforma inteligente, acessível e otimizada para automação contínua.**

O **Axis Rádio** é uma aplicação web de alta performance desenvolvida para unificar o streaming das principais estações de rádio do Espírito Santo (e além) em uma interface limpa, rápida e totalmente controlável por hardware. Projetado sob medida para rodar em modo **Kiosk (Chromium)** e telas interativas de automação.

🌐 **Acesse agora mesmo:** [juniorcriste.github.io/LocalRadio/](https://juniorcriste.github.io/LocalRadio/)

---

## 🚀 O que há de novo na v1.0?

* 🔇 **Adeus, Sintetizador de Voz:** Toda a interação por voz agora utiliza locuções reais em arquivos de áudio de alta fidelidade (`.ogg`), garantindo compatibilidade uniforme entre navegadores sem depender de engines de terceiros.
* 🛡️ **Filtro Anti-Bloqueio (Safe Play):** Implementação de um ecossistema inteligente de *fallback*. Se o navegador bloquear o autoplay, o app avisa visualmente e destrava com um único clique ou toque.
* 📶 **Reconexão Silenciosa:** Se o sinal oscilar, o sistema tenta restabelecer o link em segundo plano por até 8 segundos antes de emitir o alerta visual e sonoro de falta de sinal.
* ⌨️ **Mapeamento Amplo de Teclado:** Integração total com teclados tradicionais e blocos numéricos reduzidos (**NumPads**).

---

## 🎛️ Estações Pré-Configuradas

| Slot | Emissora | Região/Foco |
| :---: | :--- | :--- |
| **1** | 📻 Rádio Nova Onda FM | Nova Venécia / ES |
| **2** | 🏛️ Rádio Espírito Santo | Vitória / ES (Governo) |
| **3** | 📰 Rádio Notícia FM Transanorte | Boa Esperança / ES |
| **4** | 🎵 Rádio Sintonia FM | Baixo Guandu / ES |
| **5** | 🚜 Rádio Massa FM | Ecoporanga / ES |
| **6** | ⚡ Rádio Jovem Pan FM | Vitória / ES |
| **7** | 📼 Rádio FlashBack FM | São Paulo / SP |

---

## 🛠️ Arquitetura do Sistema

O projeto foi inteiramente desacoplado e modularizado para facilitar manutenções futuras:

```bash
LocalRadio/
├── index.html     # Esqueleto estrutural sem scripts embutidos
├── style.css      # Customização visual responsiva (Dark Theme)
├── app.js         # Core Engine: filas de áudio, handlers e conexões
├── img/           # Identidade visual e logos das emissoras
└── voice/         # Pack de locuções locais em formato .ogg

```

---

## 👤 Desenvolvedor

Desenvolvido por **Junior Criste** 🚀  
Sinta-se à vontade para contribuir, relatar problemas ou dar sugestões no repositório!  
🔗 **GitHub:** [JuniorCriste](https://github.com/JuniorCriste)