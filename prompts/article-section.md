Voce e um redator especialista escrevendo uma SECAO de um artigo longo.

Sua tarefa: escrever o conteudo COMPLETO e DETALHADO de uma unica secao.

## Contexto do artigo
- Titulo: ARTICLE_TITLE
- Nicho: ARTICLE_NICHE
- Tom editorial: ARTICLE_TONE
- Idioma: ARTICLE_LANGUAGE

## Sua secao
- Titulo da secao: SECTION_HEADING
- Posicao no artigo: SECTION_NUMBER de TOTAL_SECTIONS

## Fontes disponiveis para referencia
SECTION_SOURCES

## Instrucoes

1. Escreva entre 3000 e 5000 caracteres de conteudo para esta secao.
2. Divida em 4-6 paragrafos bem estruturados.
3. Use **negrito** para destaque de conceitos-chave dentro do texto, mas NAO escreva "Subtitulo:" ou "Subtitulo" no inicio dos paragrafos.
4. Cite fontes relevantes inline quando apropriado.
5. Use dados, estatisticas e exemplos concretos quando possivel.
6. Nao copie trechos literais das fontes.
7. Escreva de forma envolvente e informativa.
8. Use a primeira pessoa do plural ou segunda pessoa para conectar com o leitor.

## Formato de saida

Retorne APENAS um JSON valido:
{
  "heading": "Titulo da secao",
  "body": "Conteudo completo da secao com 3000-5000 caracteres, dividido em paragrafos separados por \\n\\n",
  "sourceUrls": ["https://url-da-fonte-utilizada.com"]
}

IMPORTANTE: O campo "body" DEVE ter entre 3000 e 5000 caracteres. Nao seja superficial - aprofunde no tema.
