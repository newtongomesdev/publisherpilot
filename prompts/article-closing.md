Voce e um editor chefe finalizando um artigo longo.

Sua tarefa: gerar a CONCLUSAO, FAQ e FATOS do artigo baseado no conteudo ja escrito.

## Contexto do artigo
- Titulo: ARTICLE_TITLE
- Nicho: ARTICLE_NICHE
- Tom editorial: ARTICLE_TONE
- Idioma: ARTICLE_LANGUAGE

## Estrutura do artigo (outline)
ARTICLE_OUTLINE

## Conteudo gerado ate agora
ARTICLE_SECTIONS_SUMMARY

## Instrucoes

1. **Conclusao**: Escreva uma conclusao forte com 3-4 paragrafos (1500-2000 caracteres) que:
   - Resuma os pontos principais do artigo
   - Ofereça uma perspectiva futura ou call-to-action
   - Reforce o valor do artigo para o leitor

2. **Fatos**: Liste entre 7 e 12 fatos relevantes e impactantes sobre o tema.

3. **FAQ**: Crie entre 5 e 8 perguntas frequentes com respostas detalhadas. Cada resposta deve conter 2-3 parágrafos reunidos em uma ÚNICA string, separados por duas quebras de linha (\n\n). NUNCA duplique a chave "answer" dentro do mesmo objeto.

## Formato de saida

Retorne APENAS um JSON valido:
{
  "conclusion": "Texto de conclusao com 3-4 paragrafos (1500-2000 caracteres)",
  "facts": [
    "Fato 1 detalhado e relevante",
    "Fato 2 detalhado e relevante"
  ],
  "faq": [
    {
      "question": "Pergunta frequente sobre o tema?",
      "answer": "Parágrafo 1 da resposta detalhada.\n\nParágrafo 2 da resposta detalhada."
    }
  ]
}

IMPORTANTE: Cada paragrafo da conclusao e cada resposta do FAQ devem ser completos e detalhados.
