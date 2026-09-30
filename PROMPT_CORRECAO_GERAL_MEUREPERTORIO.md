# Prompt final — correção geral do MeuRepertório

Atualize o aplicativo web/PWA **MeuRepertório** existente. Examine o projeto antes de editar e aproveite as funções já implementadas. Preserve logotipo, cores, tipografia, estilo, navegação, dados cadastrados e comportamentos que já funcionam. Integre as correções abaixo ao aplicativo atual, com interface simples, rápida, responsiva e adequada ao uso no palco.

## 1. Biblioteca independente: “Minhas Músicas”

Crie uma área principal claramente identificada como **Minhas Músicas**, acessível pela navegação no computador e no celular. Ela é o banco pessoal de todas as músicas do usuário, independentemente dos repertórios. Uma música pode existir sem pertencer a nenhum repertório e pode integrar vários repertórios sem ser duplicada.

Nessa área, ofereça:

- Busca rápida por título e artista/banda, inclusive para encontrar uma música avulsa durante um show.
- Lista de todas as músicas, com artista, tom atual ou original e tags/categorias.
- Favoritos e músicas abertas recentemente.
- Ações de abrir, editar, excluir e adicionar a um ou mais repertórios, com escolha do repertório.
- Abertura rápida da cifra ou anotação e acesso imediato à troca de tom.

Mantenha os vínculos entre biblioteca e repertórios por referência à mesma música. Excluir uma música deve explicar o efeito nos repertórios que a utilizam; remover uma música de um repertório não deve apagá-la da biblioteca.

## 2. Adicionar música de quatro maneiras

Ao tocar em **Adicionar música**, apresente escolhas claras. Não obrigue o usuário a importar uma cifra pronta nem a vincular a música a um repertório.

### A. Colar texto ou cifra

Permita colar o texto, interpretar título, artista, tom, acordes, letra e seções, mostrar uma prévia editável e só então salvar. Preserve o texto original e permita corrigir qualquer interpretação. Ofereça a visualização no **Modo Visual Estruturado** e no **Modo Marcus Felipe — Tecladista**.

### B. Importar por foto

Permita tirar uma foto ou escolher uma imagem da galeria com anotações próprias do músico. Solicite ou confirme título, artista e tom. Interprete o conteúdo da imagem para criar uma música editável, mas mantenha a foto original disponível para consulta e revisão. Não force a conversão para uma cifra tradicional: preserve, quando possível, a disposição, os acordes, as divisões, observações, marcações e passagens rápidas usados pelo músico. Quando a leitura da imagem for incerta, mostre o resultado para correção antes de salvar; não invente acordes ou trechos.

Depois da importação, permita **editar a organização no Modo Visual Estruturado**, marcando trechos com etiquetas como Introdução, Verso, Pré-Refrão, Refrão, Ponte, Solo, Final e Observação. O usuário pode mudar etiquetas, conteúdo e ordem das partes e escrever suas próprias observações. Esse trabalho deve funcionar **independentemente do Modo Marcus Felipe**; a foto não obriga o uso desse modo.

### C. Escrever do zero

Esta opção é obrigatória. Após informar o título, abra um editor vazio, sem exigir foto, arquivo ou cifra. O músico pode escrever livremente acordes, letra, divisões e anotações, por exemplo:

```text
Coração Partido — Tom: G
Intro
G – D/F# – Em
Parte 1
G
D/F#
Em
C
Refrão
C – D – G
```

### D. Montar estrutura personalizada

Além da escrita livre, permita inserir e editar rapidamente blocos como Intro, Verso, Pré-Refrão, Refrão, Ponte, Solo, Final e Observação. A estrutura deve permanecer editável depois de salvar.

## 3. Edição contínua das músicas

Permita editar título, artista, tom original, tags, favoritos, conteúdo, seções, acordes, letras e observações depois do cadastro, seja qual for a origem da música. Mostre a diferença entre **tom original da música** e **tom escolhido para um repertório**. Salve as alterações sem perder marcações nem vínculos existentes. O Modo Visual Estruturado deve apresentar seções legíveis; o Modo Marcus Felipe deve manter sua apresentação compacta e suas marcações próprias de passagens rápidas.

## 4. Transposição musical correta

Na tela da música, ofereça controles para descer ou subir **meio tom** e **um tom inteiro**, seleção direta do tom desejado, alternância entre sustenidos (`#`) e bemóis (`♭`), botão **Tom original** e ação **Salvar este tom**. Mostre a nota e seu nome em português, como `G — Sol` e `A — Lá`.

Transponha apenas acordes reconhecidos, nunca palavras da letra. Use interpretação musical dos acordes, e não substituição simples de caracteres. Preserve qualidade, extensões, alterações, baixos e inversões: por exemplo, ao subir um tom, `C#m7/G#` passa a `D#m7/A#`. Cubra também acordes como `G7`, `G7M`, `Gmaj7`, `Gsus4`, `F#7(9)`, `Bb7M`, `D/F#` e `Am7/G`. Preserve espaçamento, letras, seções, observações e marcações de ambos os modos.

Uma mesma música pode ter tons salvos diferentes em bandas ou repertórios diferentes, sem duplicar o cadastro da biblioteca. Abrir a música pelo repertório deve usar o tom definido para aquela ocorrência; abrir pela biblioteca deve continuar permitindo escolher ou restaurar o tom original.

## 5. Bandas e repertórios

Mantenha ou complete **Minhas Bandas**, permitindo cadastrar nome, foto/logo, descrição opcional, instrumento e observações. Dentro de cada banda, permita criar repertórios de show ou ensaio com nome, data, horário, local, tipo de evento e observações.

Cada repertório deve usar músicas da biblioteca, permitir pesquisar e selecionar várias de uma vez, criar uma música nova quando necessário e definir um tom específico por música naquele repertório. Permita ordenar músicas por arrastar e soltar, com alternativa acessível para subir ou descer itens, e salve a ordem. Permita criar, renomear e reorganizar blocos do show. Inclua a opção **Duplicar repertório**, copiando músicas, blocos, ordem e tons, para posterior edição, sem duplicar os cadastros das músicas.

## 6. Modo Show

Mantenha ou complete um **Modo Show** que priorize a cifra e evite comandos acidentais. Mostre música anterior, posição no repertório, próxima música e tom atual. Permita mudança rápida de tom, escolha direta, ajuste de tamanho da fonte, rolagem automática opcional com pausa e velocidade, e navegação por gestos no celular.

Inclua busca rápida no repertório e acesso à busca de **todas as Minhas Músicas**, inclusive músicas que não estejam no repertório atual. Ao abrir uma música avulsa durante o show, o músico deve poder consultar ou transpor a cifra e voltar ao ponto do repertório em que estava.

## 7. Dados, funcionamento offline e sincronização

Reaproveite a persistência e a sincronização existentes. Preserve os dados atuais durante qualquer mudança de estrutura. Garanta que músicas, repertórios carregados, ordem, tons e preferências de visualização funcionem sem conexão e sincronizem quando ela voltar. Evite perder alterações locais ou sobrescrever dados mais recentes silenciosamente.

## 8. Entrega e verificação

Antes de implementar, identifique o que já existe e as lacunas reais. Faça as mudanças necessárias no aplicativo, no armazenamento e na interface, sem redesenhar o produto. Verifique no computador e no celular, com atenção ao uso em palco.

Considere a atualização concluída quando estes fluxos funcionarem de ponta a ponta:

1. Cadastrar uma música manualmente sem foto, cifra ou repertório; encontrá-la em **Minhas Músicas** e depois adicioná-la a dois repertórios.
2. Importar uma foto, revisar o conteúdo interpretado, preservar a imagem e editar etiquetas de Intro, Verso e Refrão no **Modo Visual Estruturado**, sem depender do Modo Marcus Felipe.
3. Colar uma cifra, revisar a prévia, salvar, editar depois e alternar entre os dois modos sem perder conteúdo ou marcações.
4. Abrir a mesma música em dois repertórios com tons diferentes e confirmar que a biblioteca contém um único cadastro.
5. Transpor acordes simples e complexos, inclusive o baixo da inversão, mantendo letra, seções, espaçamento e observações intactos.
6. Durante o Modo Show, encontrar uma música fora do repertório, abri-la, mudar o tom e voltar à música em que a apresentação estava.
7. Reabrir o aplicativo sem internet e encontrar os dados previamente salvos, com ordem e tons corretos.

Ao final, informe objetivamente o que foi implementado, como foi verificado e qualquer limitação real que ainda exista.
