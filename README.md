# DocLens Semantic Explorer 🔍

> **AI-powered PDF analysis platform with interactive chat, semantic knowledge graphs, and visual annotations**
>
> [![GitHub License](https://img.shields.io/github/license/Ivaanildo/doclens-semantic-explorer?style=flat-square)](LICENSE)
> [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
> [![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)](https://reactjs.org/)
> [![Vite](https://img.shields.io/badge/Vite-6.2-purple?style=flat-square&logo=vite)](https://vitejs.dev/)
> [![Node.js](https://img.shields.io/badge/Node.js-Required-green?style=flat-square&logo=node.js)](https://nodejs.org/)
>
> ## 📋 Sumário
>
> - [Características](#características)
> - - [Requisitos](#requisitos)
>   - - [Instalação](#instalação)
>     - - [Uso](#uso)
>       - - [Estrutura do Projeto](#estrutura-do-projeto)
>         - - [Configuração de Ambiente](#configuração-de-ambiente)
>           - - [Documentação Técnica](#documentação-técnica)
>             - - [Contribuição](#contribuição)
>               - - [Licença](#licença)
>                
>                 - ## ✨ Características
>                
>                 - DocLens Semantic Explorer é uma plataforma inovadora de análise de PDF que combina IA com visualização de dados:
>                
>                 - - 🤖 **Chat Interativo** - Converse com seus documentos usando IA (Gemini)
> - 🕸️ **Grafos de Conhecimento** - Visualize relacionamentos semânticos entre conceitos
> - - 📍 **Anotações Visuais** - Marque e analise regiões específicas de PDFs
>   - - 📊 **Análise Semântica** - Extração inteligente de contexto e significado
>     - - 🔄 **Histórico de Conversas** - Gerencie múltiplas sessões de análise
>       - - 💾 **Persistência Local** - Salve suas análises localmente
>        
>         - ## 🛠️ Requisitos
>        
>         - - **Node.js** >= 16.x
>           - - **npm** >= 8.x ou **yarn** >= 1.22.x
>             - - Chave de API do **Google Gemini AI**
>              
>               - ## 📦 Instalação
>              
>               - ### 1️⃣ Clonar o Repositório
>              
>               - ```bash
> git clone https://github.com/Ivaanildo/doclens-semantic-explorer.git
> cd doclens-semantic-explorer
> ```
>
> ### 2️⃣ Instalar Dependências
>
> ```bash
> npm install
> ```
>
> ### 3️⃣ Configurar Variáveis de Ambiente
>
> Crie um arquivo `.env.local` na raiz do projeto:
>
> ```env
> VITE_GEMINI_API_KEY=sua_chave_api_aqui
> ```
>
> **Obtendo sua chave Gemini API:**
>
> 1. Visite [Google AI Studio](https://ai.studio)
> 2. 2. Clique em "Get API Key"
>    3. 3. Crie uma nova chave
>       4. 4. Copie e cole em `.env.local`
>         
>          5. ### 4️⃣ Executar a Aplicação
>         
>          6. ```bash
>             # Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da produção localmente
npm run preview
```

A aplicação estará disponível em `http://localhost:5173`

## 🚀 Uso

### Interface Principal

1. **Upload de PDF** - Clique em "Upload" para selecionar um PDF
2. **Exploração Semântica** - Selecione regiões do documento
3. **Chat** - Faça perguntas sobre o documento
4. **Visualização** - Observe o grafo de relacionamentos

### Exemplos de Uso

```typescript
// Conversação com documento
"Qual é o tema principal deste documento?"
"Resuma a conclusão em 3 pontos"
"Quais são os conceitos-chave?"
```

## 📁 Estrutura do Projeto

```
doclens-semantic-explorer/
├── components/
│   ├── ChatInterface.tsx          # Interface de chat
│   ├── DocumentViewer.tsx         # Visualizador de PDF
│   ├── SemanticMapModal.tsx       # Modal de mapa semântico
│   └── Resizer.tsx                # Componente de redimensionamento
├── services/
│   ├── geminiService.ts           # Integrações com Gemini API
│   └── storageService.ts          # Gerenciamento de armazenamento local
├── App.tsx                        # Componente raiz
├── index.tsx                      # Entry point
├── constants.ts                   # Constantes da aplicação
├── types.ts                       # Definições de tipos TypeScript
└── index.html                     # HTML base
```

## ⚙️ Configuração de Ambiente

### Variáveis Disponíveis

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_GEMINI_API_KEY` | Sim | Chave de API do Google Gemini |

### Segurança

- **Nunca** commita `.env.local` ao repositório
- - Use `.env.example` como template
  - - Chaves de API devem ser protegidas
   
    - ## 📚 Documentação Técnica
   
    - ### Componentes
   
    - #### ChatInterface
    - Gerencia interações de chat com a IA.
   
    - ```typescript
      interface Message {
        role: 'user' | 'assistant';
        content: string;
        timestamp: Date;
      }
      ```

      #### DocumentViewer
      Renderiza e gerencia PDFs com suporte a seleção de região.

      ```typescript
      interface DocumentState {
        file: File | null;
        currentPage: number;
        zoom: number;
      }
      ```

      ### Serviços

      #### Gemini Service
      Integração com Google Gemini para análise semântica.

      ```typescript
      async streamChatResponse(
        messages: Message[],
        documentContext: string
      ): Promise<AsyncIterable<string>>
      ```

      #### Storage Service
      Persistência local de conversas e preferências.

      ```typescript
      saveConversation(id: string, data: Conversation): void
      loadConversation(id: string): Conversation | null
      ```

      ## 🔧 Scripts Disponíveis

      ```bash
      npm run dev       # Inicia servidor de desenvolvimento
      npm run build     # Cria build otimizado para produção
      npm run preview   # Preview local da versão de produção
      npm run lint      # Executa ESLint (quando configurado)
      npm run format    # Formata código com Prettier (quando configurado)
      npm run test      # Executa testes (quando configurado)
      ```

      ## 🤝 Contribuição

      Contribuições são bem-vindas! Por favor:

      1. **Fork** o projeto
      2. 2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
         3. 3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
            4. 4. Push para a branch (`git push origin feature/AmazingFeature`)
               5. 5. Abra um **Pull Request**
                 
                  6. Para detalhes completos, veja [CONTRIBUTING.md](CONTRIBUTING.md)
                 
                  7. ### Padrões de Código
                 
                  8. - Use **TypeScript** rigorosamente (não use `any`)
                     - - Siga **ESLint** e **Prettier** configuration
                       - - Escreva testes para novas funcionalidades
                         - - Mantenha componentes pequenos e focados
                          
                           - ## 🐛 Problemas Conhecidos
                          
                           - - [ ] Suporte a arquivos PDF com criptografia limitado
                             - [ ] - [ ] Performance em PDFs > 100MB pode ser impactada
                             - [ ] - [ ] Grafo semântico otimizado para até 500 nós
                            
                             - [ ] ## 🗺️ Roadmap
                            
                             - [ ] - [ ] Suporte a múltiplos idiomas
                             - [ ] - [ ] Exportar análises em PDF/JSON
                             - [ ] - [ ] Integração com mais modelos de IA
                             - [ ] - [ ] Editor de anotações avançado
                             - [ ] - [ ] Compartilhamento de documentos
                             - [ ] - [ ] Sincronização em nuvem
                            
                             - [ ] ## 📝 Licença
                            
                             - [ ] Este projeto é licenciado sob a [MIT License](LICENSE) - veja o arquivo [LICENSE](LICENSE) para detalhes.
                            
                             - [ ] ## 👤 Autor
                            
                             - [ ] **Ivaanildo**
                             - [ ] - GitHub: [@Ivaanildo](https://github.com/Ivaanildo)
                            
                             - [ ] ## 🙏 Agradecimentos
                            
                             - [ ] - [Google Gemini AI](https://ai.studio) pelo poder de IA
                             - [ ] - [React](https://reactjs.org/) e [TypeScript](https://www.typescriptlang.org/) pelas ferramentas
                             - [ ] - [Vite](https://vitejs.dev/) pelo excelente build tool
                            
                             - [ ] ## 📞 Suporte
                            
                             - [ ] Encontrou um problema? Abra uma [Issue](https://github.com/Ivaanildo/doclens-semantic-explorer/issues)
                            
                             - [ ] ---
                            
                             - [ ] **Última atualização:** Janeiro de 2026 | **Versão:** 1.0.0
