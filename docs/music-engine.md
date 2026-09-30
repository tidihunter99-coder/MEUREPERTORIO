# Motor de cifras

Uma música é um único `Song` no workspace. `originalContent` guarda o texto recebido; `photoData` guarda a fotografia. `sections` mantém as linhas editáveis. `musicModel` é a interpretação estruturada dessas linhas. O documento inteiro é sincronizado pelo endpoint `/api/workspace` como JSONB, sem criar quatro registros.

## Fluxo

`song-parser.ts` identifica metadados, seções e linhas. `normalizeChord` em `music.ts` converte a grafia para uma identidade harmônica comparável, preservando o texto original. `song-model.ts` define o formato único; `music-analyzer.ts` registra a posição de cada acorde e a linha de letra seguinte como âncora aproximada e cria blocos. `pattern-detector.ts` compara os blocos. `transposition-engine.ts` produz uma cópia de leitura no tom escolhido. Os quatro componentes em `components/song-readers.tsx` recebem essa mesma cópia.

## Decisões conservadoras

- `EXACT_REPEAT`: progressão inteira igual. Quatro ou mais acordes permitem compactação automática; três dependem de contexto adicional; dois não são compactados.
- `REPEAT_WITH_ENDING`: quatro ou mais acordes, todos iguais exceto o último. O modo Marcos mostra `↻ A → acorde`, deixando explícita a saída nova.
- `PARTIAL_REPEAT` e `UNCERTAIN`: ficam visíveis por extenso.
- Passagens marcadas manualmente, ou uma linha curta entre blocos maiores, continuam como movimento harmônico na mesma seção.
- Sustentação automática exige uma anotação explícita junto a um acorde isolado. Sem duração conhecida, o Guia de Tempo não adiciona `%`.
- A seção `Intro` continua uma seção própria mesmo quando a progressão reaparece depois.

Os limiares `autoThreshold` (0,90) e `suggestionThreshold` (0,70) podem ser passados a `createSongModel`. No Guia de Tempo, tocar um acorde permite classificá-lo como normal, sustentado ou passagem. A correção é salva no modelo da mesma música. `%` aparece apenas no Guia de Tempo e significa sustentar.

## Verificação

`node --test scripts/test-song-model.mjs` cobre repetição exata, variação de saída, passagem, acorde isolado, intro, duração desconhecida, equivalência enarmônica, âncora na letra e transposição central. Em desenvolvimento, abra uma música e expanda **Depuração da análise** para ver os blocos, decisões e confiança.
