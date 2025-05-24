// Exercício 1: Contagem Progressiva e Regressiva
function contar() {
    let inicio = parseInt(document.getElementById("inicio1").value);
    let fim = parseInt(document.getElementById("fim1").value);
    let resultado = document.getElementById("resultado1");

    resultado.innerHTML = ""; // Limpa o resultado anterior

    if (isNaN(inicio) || isNaN(fim)) {
        resultado.innerHTML = "Por favor, insira números válidos.";
        return;
    }

    if (inicio < fim) {
        for (let i = inicio; i <= fim; i++) {
            resultado.innerHTML += i + " ";
        }
    } else if (inicio > fim) {
        for (let i = inicio; i >= fim; i--) {
            resultado.innerHTML += i + " ";
        }
    } else {
        resultado.innerHTML = "Os números são iguais!";
    }
}

// Exercício 2: Tabuada Interativa
function gerarTabuada() {
    let numero = parseInt(document.getElementById("numero2").value);
    let tabuada = document.getElementById("tabuada2");

    tabuada.innerHTML = ""; // Limpa a tabuada anterior

    if (isNaN(numero)) {
        tabuada.innerHTML = "Por favor, insira um número válido.";
        return;
    }

    for (let i = 1; i <= 10; i++) {
        let resultadoCalc = numero * i; // Use um nome diferente para evitar conflito com 'resultado' global
        let item = document.createElement("li");
        item.textContent = `${numero} x ${i} = ${resultadoCalc}`;
        tabuada.appendChild(item);
    }
}

// Exercício 3: Soma de Números em um Intervalo
function somarIntervalo() {
    let inicio = parseInt(document.getElementById("inicio3").value);
    let fim = parseInt(document.getElementById("fim3").value);
    let resultado = document.getElementById("resultado3");

    if (isNaN(inicio) || isNaN(fim)) {
        resultado.textContent = "Por favor, insira números válidos.";
        return;
    }

    let soma = 0;
    // Garante que o loop sempre vá do menor para o maior para somar corretamente
    let menor = Math.min(inicio, fim);
    let maior = Math.max(inicio, fim);

    for (let i = menor; i <= maior; i++) {
        soma += i;
    }

    resultado.textContent = `A soma do intervalo é: ${soma}`;
}

// Lógica para mostrar/esconder o código
document.addEventListener('DOMContentLoaded', () => {
    const toggleButtons = document.querySelectorAll('.toggle-code-btn');

    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target; // Pega o ID do elemento a ser exibido
            const codeBlock = document.getElementById(targetId);

            if (codeBlock.style.display === 'block') {
                codeBlock.style.display = 'none';
                button.textContent = 'Ver Código';
            } else {
                codeBlock.style.display = 'block';
                button.textContent = 'Esconder Código';
            }
        });
    });
});

// --- Playground de Lógica: Carrinho na Rua ---

const paletaBlocos = document.querySelector('.paleta-blocos');
const areaProgramacao = document.querySelector('.area-programacao');
const mapa = document.getElementById('mapa');
const carrinho = document.getElementById('carrinho');
const btnExecutarPlayground = document.getElementById('btnExecutarPlayground');
const btnResetarPlayground = document.getElementById('btnResetarPlayground');
const logPlayground = document.getElementById('logPlayground');
let placeholderArea = null; // Inicializamos como null, será buscado no DOMContentLoaded

let comandosExecucao = []; // Array que armazenará os comandos a serem executados
let carrinhoX = 110; // Posição inicial X do carrinho
let carrinhoY = 110; // Posição inicial Y do carrinho
let carrinhoDirecao = 0; // 0: Cima, 90: Direita, 180: Baixo, 270: Esquerda (em graus)
let executando = false; // Flag para evitar múltiplas execuções

const STEP = 50; // Quantos pixels o carrinho move por "passo"
const MAP_SIZE = 250; // Tamanho do mapa em pixels
const CAR_SIZE = 30; // Tamanho do carrinho em pixels
const ANIMATION_DURATION = 600; // Duração da animação em ms (deve corresponder ao CSS transition)

// --- Funções de Drag and Drop ---

paletaBlocos.querySelectorAll('.bloco').forEach(bloco => {
    bloco.addEventListener('dragstart', (e) => {
        // MUDANÇA CRÍTICA AQUI: NÃO PASSE text/html.
        // Passe APENAS os dados essenciais para reconstruir o bloco no drop.
        const blocoData = {
            command: e.target.dataset.command,
            value: e.target.dataset.value,
            text: e.target.textContent.trim() // Pega o texto visível do bloco
        };
        e.dataTransfer.setData('application/json', JSON.stringify(blocoData));
        e.dataTransfer.effectAllowed = 'copy'; // Permite copiar

        // Opcional: Criar uma imagem de arrasto personalizada (melhora a UX)
        const dragImage = e.target.cloneNode(true); // Clona o bloco original para a imagem
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px'; // Move para fora da tela
        dragImage.style.left = '-1000px';
        dragImage.style.opacity = '0.7'; // Torna-o semitransparente
        document.body.appendChild(dragImage); // Adiciona temporariamente ao corpo
        e.dataTransfer.setDragImage(dragImage, e.offsetX, e.offsetY);

        // Remove a imagem de arrasto depois que o drag termina
        dragImage.addEventListener('dragend', () => {
            dragImage.remove();
        });
    });
});

function permitirSoltar(e) {
    e.preventDefault(); // Necessário para permitir o drop
    areaProgramacao.classList.add('drag-over'); // Adiciona estilo visual de "arrastando sobre"
}

areaProgramacao.addEventListener('dragleave', () => {
    areaProgramacao.classList.remove('drag-over');
});

// FUNÇÃO soltarBloco - RECRIANDO O ELEMENTO DO ZERO A PARTIR DOS DADOS
// Esta função é chamada quando um NOVO bloco é solto da paleta
function soltarBloco(e, targetElement) { // targetElement é o elemento DOM onde o bloco deve ser inserido
    e.preventDefault(); // Garante que o comportamento padrão do drop seja prevenido
    areaProgramacao.classList.remove('drag-over'); // Remove o estilo visual de "arrastando sobre"

    try {
        // Recupera os dados do bloco como JSON
        const blocoData = JSON.parse(e.dataTransfer.getData('application/json'));
        const { command, value, text } = blocoData;

        // Remove o placeholder se a área de programação estiver vazia
        if (placeholderArea && areaProgramacao.contains(placeholderArea) && comandosExecucao.length === 0) {
            placeholderArea.remove();
        }

        // CRIAÇÃO DO ELEMENTO DIV DO ZERO
        const novoBlocoElement = document.createElement('div');
        novoBlocoElement.classList.add('bloco-programa'); // Classe base para todos os blocos na área de programa

        // Adiciona classes específicas para estilização (VERIFIQUE SEU CSS PARA ESTAS CLASSES)
        if (command === 'mover') {
            novoBlocoElement.classList.add('bloco-mover'); 
        } else if (command === 'virar') {
            novoBlocoElement.classList.add('bloco-virar'); 
            // Classes opcionais para estilo de seta, se você tiver no CSS
            // if (value === 'direita') { novoBlocoElement.classList.add('bloco-virar-direita'); }
            // else if (value === 'esquerda') { novoBlocoElement.classList.add('bloco-virar-esquerda'); }
        } else if (command === 'repetir') {
            novoBlocoElement.classList.add('bloco-loop'); 
        }

        // Define o texto visível no bloco
        novoBlocoElement.textContent = text;
        
        // Define os dataset para o bloco
        novoBlocoElement.dataset.command = command;
        novoBlocoElement.dataset.value = value;
        novoBlocoElement.draggable = true; // Torna o bloco arrastável para reordenar

        // Lógica de inserção no DOM (onde o bloco foi solto)
        if (targetElement.classList.contains('placeholder-area')) {
            areaProgramacao.insertBefore(novoBlocoElement, targetElement);
        } else if (targetElement === areaProgramacao) {
            areaProgramacao.appendChild(novoBlocoElement);
        } else {
            // Se o drop ocorreu sobre outro bloco-programa, insere antes ou depois
            const targetRect = targetElement.getBoundingClientRect();
            const targetMidY = targetRect.top + targetRect.height / 2;
            if (e.clientY < targetMidY) {
                areaProgramacao.insertBefore(novoBlocoElement, targetElement);
            } else {
                areaProgramacao.insertBefore(novoBlocoElement, targetElement.nextSibling);
            }
        }

        // Reconstruir a array de comandos para garantir a ordem correta
        reconstruirComandosExecucao(); 

        atualizarLog(`Bloco "${command} (${value})" adicionado.`);

    } catch (error) {
        console.error("Erro ao soltar bloco:", error);
        atualizarLog("Erro: O que você soltou não é um bloco válido ou houve um problema na criação.");
    }
}


// --- Funções de Lógica do Carrinho (sem alterações) ---

function atualizarCarrinhoPosicao() {
    carrinho.style.left = `${carrinhoX}px`;
    carrinho.style.top = `${carrinhoY}px`;
    carrinho.style.transform = `rotate(${carrinhoDirecao}deg)`;
}

function moverFrente(passos = 1) {
    return new Promise(resolve => {
        let newX = carrinhoX;
        let newY = carrinhoY;
        for (let i = 0; i < passos; i++) {
            switch (carrinhoDirecao) {
                case 0: newY -= STEP; break; // Cima
                case 90: newX += STEP; break; // Direita
                case 180: newY += STEP; break; // Baixo
                case 270: newX -= STEP; break; // Esquerda
            }
        }
        if (newX < 0 || newX > (MAP_SIZE - CAR_SIZE) || newY < 0 || newY > (MAP_SIZE - CAR_SIZE)) {
            atualizarLog("O carrinho tentou sair do mapa ou colidiu!");
            return resolve(false);
        }
        carrinhoX = newX;
        carrinhoY = newY;
        atualizarCarrinhoPosicao();
        atualizarLog(`Carrinho moveu ${passos * STEP}px para frente.`);
        setTimeout(() => resolve(true), ANIMATION_DURATION);
    });
}

function virar(direcao) {
    return new Promise(resolve => {
        if (direcao === 'direita') {
            carrinhoDirecao = (carrinhoDirecao + 90) % 360;
            atualizarLog("Carrinho virou à direita.");
        } else if (direcao === 'esquerda') {
            carrinhoDirecao = (carrinhoDirecao - 90 + 360) % 360;
            atualizarLog("Carrinho virou à esquerda.");
        }
        atualizarCarrinhoPosicao();
        setTimeout(() => resolve(true), ANIMATION_DURATION);
    });
}

function atualizarLog(mensagem) {
    logPlayground.textContent = mensagem;
}

// --- Execução dos Comandos (sem alterações) ---

async function executarComandos() {
    if (executando) return;
    executando = true;
    btnExecutarPlayground.disabled = true;
    btnResetarPlayground.disabled = true;
    atualizarLog("Iniciando execução...");

    for (let i = 0; i < comandosExecucao.length; i++) {
        const cmd = comandosExecucao[i];
        let continua = true;

        if (cmd.command === 'repetir') {
            const repeticoes = parseInt(cmd.value);
            atualizarLog(`Iniciando repetição de ${repeticoes} vezes...`);
            if (i + 1 < comandosExecucao.length) {
                const cmdInterno = comandosExecucao[i + 1];
                for (let r = 0; r < repeticoes; r++) {
                    atualizarLog(`Repetição ${r + 1}/${repeticoes} para: ${cmdInterno.command}`);
                    if (cmdInterno.command === 'mover') {
                        continua = await moverFrente(parseInt(cmdInterno.value));
                    } else if (cmdInterno.command === 'virar') {
                        continua = await virar(cmdInterno.value);
                    } else {
                        atualizarLog(`Comando "${cmdInterno.command}" não pode ser repetido por este bloco.`);
                        continua = false;
                    }
                    if (!continua) {
                        atualizarLog("Repetição interrompida devido a obstáculo ou comando inválido.");
                        break;
                    }
                }
                i++;
            } else {
                atualizarLog("Bloco 'Repetir' sem comando para repetir, pulando...");
            }
        } else if (cmd.command === 'mover') {
            continua = await moverFrente(parseInt(cmd.value));
        } else if (cmd.command === 'virar') {
            continua = await virar(cmd.value);
        }
        
        if (!continua) {
            atualizarLog("Execução interrompida devido a um obstáculo ou limite do mapa!");
            break;
        }
    }
    atualizarLog("Execução concluída!");
    executando = false;
    btnExecutarPlayground.disabled = false;
    btnResetarPlayground.disabled = false;
}

function resetarPlayground() {
    carrinhoX = 110;
    carrinhoY = 110;
    carrinhoDirecao = 0;
    atualizarCarrinhoPosicao();
    comandosExecucao = [];
    areaProgramacao.innerHTML = '';
    if (placeholderArea && !areaProgramacao.contains(placeholderArea)) { // Adiciona placeholder se ele existe e não está na área
        areaProgramacao.appendChild(placeholderArea);
    }
    atualizarLog("Playground resetado.");
    executando = false;
    btnExecutarPlayground.disabled = false;
    btnResetarPlayground.disabled = false;
}

// --- Event Listeners e Lógica de Reordenação ---

btnExecutarPlayground.addEventListener('click', executarComandos);
btnResetarPlayground.addEventListener('click', resetarPlayground);

document.addEventListener('DOMContentLoaded', () => {
    atualizarCarrinhoPosicao();
    placeholderArea = document.querySelector('.placeholder-area'); 

    areaProgramacao.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('bloco-programa')) {
            // Para reordenação, identificamos a origem e o índice
            e.dataTransfer.setData('text/source', 'areaProgramacao');
            e.dataTransfer.setData('text/movedIndex', Array.from(areaProgramacao.children).indexOf(e.target).toString());
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    areaProgramacao.addEventListener('drop', (e) => {
        e.preventDefault();
        areaProgramacao.classList.remove('drag-over');

        const source = e.dataTransfer.getData('text/source');
        
        if (source === 'areaProgramacao') { // Lógica para reordenar blocos existentes
            const movedIndex = parseInt(e.dataTransfer.getData('text/movedIndex'));
            const draggedElement = areaProgramacao.children[movedIndex];
            
            let targetElement = e.target.closest('.bloco-programa');
            if (!targetElement) {
                targetElement = e.target; // Pode ser o placeholder ou a própria areaProgramacao
            }

            if (draggedElement === targetElement) { // Soltou no próprio elemento
                return;
            }
            
            // Lógica de inserção para reordenação
            if (targetElement.classList.contains('placeholder-area')) {
                 areaProgramacao.insertBefore(draggedElement, targetElement);
            } else if (targetElement === areaProgramacao) {
                areaProgramacao.appendChild(draggedElement); // Adiciona ao final se soltou na área vazia
            } else {
                const targetRect = targetElement.getBoundingClientRect();
                const targetMidY = targetRect.top + targetRect.height / 2;
                if (e.clientY < targetMidY) {
                    areaProgramacao.insertBefore(draggedElement, targetElement);
                } else {
                    areaProgramacao.insertBefore(draggedElement, targetElement.nextSibling);
                }
            }
            reconstruirComandosExecucao();
            atualizarLog("Bloco reordenado.");

        } else { // Lógica para adicionar um NOVO bloco da paleta
            let insertTarget = e.target.closest('.bloco-programa') || e.target;
            // Garantir que o insertTarget é a própria área de programação se o drop não foi sobre um bloco ou placeholder
            if (insertTarget !== areaProgramacao && !insertTarget.classList.contains('bloco-programa') && !insertTarget.classList.contains('placeholder-area')) {
                 insertTarget = areaProgramacao;
            }
            soltarBloco(e, insertTarget); // Chama soltarBloco com o evento e o alvo de inserção
        }
    });
});

function reconstruirComandosExecucao() {
    const novosComandos = [];
    Array.from(areaProgramacao.children).forEach(blocoElement => {
        // Apenas elementos com a classe 'bloco-programa' são considerados comandos
        if (blocoElement.classList.contains('bloco-programa')) {
            novosComandos.push({
                command: blocoElement.dataset.command,
                value: blocoElement.dataset.value
            });
        }
    });
    comandosExecucao = novosComandos;
    
    // Adiciona o placeholder de volta se a área de programação estiver vazia
    if (comandosExecucao.length === 0 && placeholderArea && !areaProgramacao.querySelector('.placeholder-area')) {
        areaProgramacao.appendChild(placeholderArea);
    }
}