# Prática de Leitura à Primeira Vista

Aplicação web client-side para treino de leitura à primeira vista em partitura com rolagem contínua e síntese de áudio síncrona. O projeto foi construído em JavaScript/HTML/CSS puro (sem frameworks) e utiliza a biblioteca VexFlow para renderização vetorial e a Web Audio API para síntese sonora e metrônomo.

---

## 1. Stack e Dependências

* **VexFlow (v4.2.2):** Renderização de notação musical em SVG (pautas, claves, notas, pausas, ligaduras, tercinas e armaduras).
* **Web Audio API:** Geração procedural de áudio (osciladores sawtooth com filtro passa-baixa e envelopes ADSR) e relógio do metrônomo.
* **Vanilla JS (ES6+):** Arquitetura orientada a módulos funcionais dentro de um único arquivo autocontido, sem etapa de build.

---

## 2. Arquitetura do Sistema

O código está estruturado em módulos lógicos:

### 2.1. Sistema de Tempo e Âncoras (BPM Dinâmico)
Para permitir que o usuário altere o BPM ou pause/retome a execução sem reiniciar a partitura, o tempo não é calculado diretamente por `currentTime - startTime`. Em vez disso, o sistema utiliza **âncoras de tempo**:
* `anchorTime`: Timestamp (em segundos) do momento da última alteração de estado (play, pause ou mudança de BPM).
* `anchorBeat`: Batida musical exata correspondente àquele instante.
* Funções de conversão (`getBeatFromTime` e `getTimeFromBeat`) mapeiam continuamente o tempo de áudio para a posição visual na tela.

### 2.2. Agendador de Áudio (Lookahead Scheduler)
Um loop periódico (`setInterval` a cada 50ms) verifica uma fila de eventos (`globalEventTimeline`) e agenda no Web Audio API as notas e cliques do metrônomo que devem soar nos próximos 200ms (`lookahead`). Isso evita travamentos de áudio decorrentes de gargalos na thread principal de renderização.

### 2.3. Motor Teórico e Tratamento Enarmônico
Para evitar acidentes incorretos (como sustenidos aparecendo em tonalidades de bemol):
* A tabela `KEYS` mapeia explicitamente cada tonalidade ao seu relativo maior canônico.
* A função `midiToVexKey` calcula a letra e acidente corretos baseando-se no relativo maior, aplicando compensação de oitava em notas limite (como Cb e B#) para evitar deslocamento visual indevido no VexFlow.

### 2.4. Engraving e Agrupamento Rítmico (Beaming)
* O algoritmo de agrupamento (`renderMeasureSVG`) separa notas por tempos matemáticos (beats 0 a 3 no compasso 4/4).
* Pausas nas extremidades de um grupo de colcheias/semicolcheias são desvinculadas da barra de ligação (*beam*) para evitar hastes soltas, mantendo apenas barras sobre notas reais ou pausas intermediárias.

---

## 3. Modos de Geração (Algoritmos)

O gerador de notas atua sobre a duração rítmica resolvida a cada compasso:

### Aleatório
Gera notas selecionadas do conjunto permitido (definido pelo tom, modo pentatônico e limites de altura). Entre cada nota consecutiva, o algoritmo restringe o salto para que não ultrapasse o valor configurado no parâmetro de salto intervalar.

### Arpejos
A cada compasso, sorteia um grau diatônico (I a VII) da tonalidade ativa. As notas do compasso são limitadas às notas do respectivo acorde (tríade ou tétrade com 7ª). O símbolo da cifra correspondente é anotado acima da pauta no primeiro tempo do compasso.

### Groove Repetitivo
Gera um padrão rítmico de 1 a 2 compassos e o mantém fixo em loop sobre a progressão harmônica clássica I - IV - V - I. No último compasso do ciclo de 4 compassos, há chance de inserção de uma variação (*fill*) com subdivisões mais rápidas.

### Padrões de Escala
Aplica fórmulas matemáticas de deslocamento melódico sequencial sobre a escala diatônica/pentatônica:
* **Em Terças:** Salta em intervalos de terça (1-3, 2-4, 3-5...).
* **Em Quartas / Quintas / Sextas:** Saltos intervalares fixos ao longo dos graus da escala.
* **Zigue-Zague:** Sobe 4 graus e recua 2 (1-2-3-4, 3-4-5-6...).
* **Grupos de 3 e 4:** Blocos lineares ascendentes/descendentes (1-2-3, 2-3-4...).
* **Arpejos Diatônicos:** Empilhamento de terças escalares (1-3-5, 2-4-6...).
* **Hanon:** Padrão clássico de independência (1-3-2-4, 2-4-3-5...).
* *Ao atingir o limite superior do range configurado, a direção do vetor é invertida automaticamente para descendente.*

### Nota Pivô
Identifica a tônica mais grave disponível no range e a fixa como nota pedal nos tempos pares/ímpares, intercalando com notas melódicas móveis do restante da escala para treino de salto de cordas e linhas suplementares.

### Enclosures
Aplica aproximação cromática sobre notas de arpejos em um ciclo de três fases:
1. Nota meio tom acima da nota-alvo.
2. Nota meio tom abaixo da nota-alvo.
3. Resolução na nota-alvo do acorde.

---

## 4. Parâmetros e Configurações

### Configuração de Leitura
* **Clave:** Seleção entre Fá (Bass), Sol (Treble), Dó na 3ª linha (Alto) e Dó na 4ª linha (Tenor). Ajusta automaticamente a posição das notas e pausas no pentagrama, além de adaptar os limites padrão do seletor de extensão.
* **Tom:** Define a armadura de clave e a escala diatônica base.
* **Restringir à Escala Pentatônica:** Filtra os graus da escala para usar apenas a pentatônica maior (1, 2, 3, 5, 6) ou menor (1, b3, 4, 5, b7).

### Extensão de Notas
* **Posição (1ª a 10ª posição):** Mapeia a mão esquerda em um bloco de 4 trastes contíguos no braço do contrabaixo (ex.: 5ª posição = trastes 5 a 8). Na 1ª posição, cordas soltas são incluídas.
* **Livre:** Desativa a lógica de posições e utiliza estritamente as notas mínima e máxima selecionadas nos dropdowns.

### Limite de Salto entre Notas
Define a distância intervalar máxima permitida entre duas notas sucessivas (de 2ª maior até 15ª / duas oitavas).

### Figuras Rítmicas
* Checkboxes para habilitar Semibreve, Mínima, Semínima, Colcheia e Semicolcheia.
* **Notas Pontuadas:** Habilita subdivisões assimétricas (mínima pontuada, semínima pontuada + colcheia, colcheia pontuada + semicolcheia).

### Ajustes de Frequência (Probabilidades 0% a 100%)
* **Pausas:** Chance de converter uma figura sonora em pausa equivalente.
* **Tercinas:** Probabilidade de substituir um tempo por tercinas (de semínima, colcheia ou semicolcheia, dependendo das figuras ativas).
* **Ligaduras de Valor (Síncopes):** Probabilidade de ligar uma nota em contratempo à cabeça do tempo seguinte, estendendo a duração sonora sem reataque.
* **Aproximação Cromática:** Desloca notas curtas em meio tom para criar notas de passagem cromáticas direcionadas à nota seguinte.
* **Ghost Notes / Staccato:** Adiciona articulações visuais (cabeça em X ou ponto de staccato) e reduz o tempo de sustentação do oscilador de áudio.

---

## 5. Como Executar

Por ser uma aplicação autocontida em arquivo único:
1. Salve o código como um arquivo `.html` (ex.: `index.html`).
2. Abra diretamente em qualquer navegador moderno com suporte a Web Audio API (Chrome, Firefox, Safari, Edge).
3. Não é necessário servidor local, Node.js ou instalação de pacotes.

### Atalhos
* **Barra de Espaço:** Alterna entre Iniciar, Pausar e Continuar a rolagem da partitura.

---

## 6. Licença

Código aberto sob a licença MIT. Livre para uso, modificação e distribuição.