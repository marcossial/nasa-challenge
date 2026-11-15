# Documentação Oficial de Submissão — NASA Space Apps Challenge 2026

> **Projeto:** AgroSat SP — Inteligência Agroambiental e Planejamento Agrícola para o Campo Paulista  
> **Desafio (Challenge):** *Field Shift: Adapting Farms with NASA Data*  
> **Cobertura Geográfica:** Estado de São Paulo, Brasil (645 municípios)

Este documento reúne a análise técnica e científica completa do repositório **AgroSat SP**, estruturada exatamente conforme os 5 critérios exigidos no formulário oficial de submissão do **NASA Space Apps Challenge** (incluindo os critérios de julgamento de *Relevance*, transparência de IA e rastreabilidade de referências).

---

## 1. Detailed Project Description (Descrição Detalhada do Projeto)

### O que o projeto faz (What it does)
O **AgroSat SP** é uma plataforma web de inteligência agroambiental e suporte à decisão agrícola projetada para ajudar produtores rurais, agrônomos, cooperativas e técnicos do Estado de São Paulo a adaptar o planejamento de suas propriedades frente às mudanças e variações climáticas.

A plataforma transforma dados complexos de observação da Terra da NASA, previsões meteorológicas, modelos de solo, topografia orbital e tabelas governamentais de zoneamento agrícola em recomendações práticas, visuais e geolocalizadas. A partir da seleção de qualquer ponto ou município dentro do Estado de São Paulo, o produtor tem acesso imediato a cinco módulos integrados:

1. **Mapa Interativo e Diagnóstico Agroambiental Rápido (`/`):**
   - Permite localizar a propriedade por clique direto no mapa (com alternância entre imagem de satélite *Esri World Imagery* e mapa viário *OpenStreetMap*), busca textual pelos 645 municípios paulistas ou inserção direta de coordenadas WGS84 (`latitude, longitude`).
   - Realiza validação geográfica em duas camadas (no cliente via *point-in-polygon* e no servidor via índice espacial *R-tree* sobre a malha oficial do IBGE).
   - Exibe um painel lateral de diagnóstico instantâneo contendo: temperatura atual, precipitação, umidade relativa do ar, velocidade do vento, umidade volumétrica estimada do solo, triagem rápida de risco de geada e calor, altitude orbital (NASA SRTM) e 5 propriedades físico-químicas superficiais do solo (0 a 5 cm).

2. **Monitoramento Ambiental e Climático (`/dashboard`):**
   - **Histórico Climático Diário (NASA POWER):** Gráficos interativos de séries diárias para janelas de **30, 90, 180 ou 365 dias** (temperatura média em °C, precipitação em mm/dia, umidade relativa em % e velocidade do vento em m/s).
   - **Séries Climáticas Multi-Anuais dos Últimos 5 Anos (NASA POWER):** Ferramenta analítica que agrega dados históricos de até 5 anos por mês, ano ou dia, permitindo comparar o regime de chuvas e temperaturas de um mês específico entre diferentes anos e verificar a cobertura de dias disponíveis.
   - **Previsão Meteorológica Operacional (Open-Meteo):** Previsão para os próximos 7 dias (suportando até 16 dias na API) com temperatura, acumulado de chuva, probabilidade de precipitação, vento máximo e umidade.
   - **Triagem de Riscos Agroambientais:** Avaliação automatizada de cinco riscos críticos:
     - *Geada potencial* (mínimas $\le 3\ ^\circ\text{C}$ moderado; $\le 0\ ^\circ\text{C}$ alto);
     - *Calor excessivo parametrizado por cultura* (soja $> 40\ ^\circ\text{C}$, milho $> 35\ ^\circ\text{C}$, cana-de-açúcar $> 35\ ^\circ\text{C}$);
     - *Chuva intensa* ($\ge 50\text{ mm/dia}$ moderado; $> 100\text{ mm/dia}$ alto);
     - *Vento forte* (rajadas $\ge 60\text{ km/h}$ moderado; $> 100\text{ km/h}$ alto);
     - *Déficit hídrico* (cálculo do balanço atmosférico $\text{Precipitação} - \text{ET}_0 < 0$ em pelo menos 5 dias completos, combinado com a umidade volumétrica do solo na camada de 3 a 9 cm).

3. **Planejamento de Plantio (`/plantio`):**
   - Avalia a aptidão regional de **6 culturas agrícolas estratégicas** para São Paulo: **Soja** (*Glycine max*), **Milho** (*Zea mays*), **Sorgo granífero** (*Sorghum bicolor*), **Aveia branca** (*Avena sativa*), **Crotalária-júncea** (*Crotalaria juncea*) e **Cana-de-açúcar** (*Saccharum officinarum*).
   - Cruza o clima histórico do mês homólogo mais recente (extraído da **NASA POWER**) com as janelas oficiais de plantio por decêndio (períodos de 10 dias) e níveis de risco climático (20%, 30% e 40%) da **Tábua de Risco do ZARC/MAPA** para o município identificado.
   - Classifica cada cultura em *Condições potencialmente favoráveis*, *Condições com restrições*, *Sem janela no ZARC* ou *Dados insuficientes*, e oferece uma **tabela comparativa lado a lado** para até 3 culturas selecionadas.

4. **Planejamento de Rotação e Sucessão de Culturas (`/rotacao`):**
   - A partir da cultura anterior (selecionada ou digitada livremente), data do plantio anterior, data pretendida para o próximo cultivo e objetivo prioritário (**Conservação do solo**, **Diversificar a produção**, **Produção de grãos** ou **Reduzir riscos climáticos**), gera e ordena até 3 estratégias recomendadas.
   - Avalia a alternância de famílias botânicas (*Fabaceae* vs. *Poaceae* para quebra de ciclos fitossanitários e fixação biológica de nitrogênio), distingue entre *sucessão na mesma safra*, *candidata a rotação interanual* e *cultura de cobertura/adubação verde*, e permite comparar estratégias lado a lado.

5. **Assistente Agrícola Inteligente — AgroSat IA (`/assistente` e Widget Flutuante):**
   - Assistente conversacional em português brasileiro integrado ao **Google Gemini (`gemini-3.1-flash-lite`)** via *Function Calling*.
   - Em vez de responder apenas com conhecimento pré-treinado, o assistente invoca em tempo real as ferramentas científicas do backend (NASA POWER, ZARC, SRTM, SoilGrids, Open-Meteo) para a coordenada exata selecionada pelo usuário, fundamentando cada resposta em dados verificáveis, citando as fontes e explicitando limitações.

---

### Como funciona (Arquitetura Técnica)
O sistema foi construído em uma arquitetura moderna, desacoplada em camadas e empacotada para execução unificada em nuvem (Docker / Microsoft Azure):

```
[Navegador do Produtor Rural (Desktop / Mobile)]
       │
       ▼
[Frontend: React 19 + TanStack Start/Router + Tailwind CSS + Leaflet + Recharts]
       │  (Requisições REST JSON com coordenadas WGS84 validadas em São Paulo)
       ▼
[Backend: Python 3.12+ / FastAPI + HTTPX Async + TTLCache + Shapely STRtree]
       ├──► Índice Espacial Local (IBGE GeoJSON) ──► Validação SP + Geocódigo Municipal (645 municípios)
       ├──► Índice SQLite Local (ZARC/MAPA)      ──► 532.423 registros paulistas (Safra 2026/2027 + Sem Safra)
       ├──► NASA POWER Daily API (Comunidade AG) ──► Séries históricas diárias e agregações de 5 anos
       ├──► OpenTopoData SRTM 90m API            ──► Altitude ortométrica da missão NASA SRTM
       ├──► ISRIC SoilGrids 2.0 WCS              ──► Rasters GeoTIFF (0–5 cm): pH, argila, areia, silte, C orgânico
       ├──► Open-Meteo Forecast API              ──► Condições atuais, umidade do solo (0–9 cm), ET0 e previsão
       └──► Google Gemini API (Function Calling) ──► Orquestração de até 5 chamadas de ferramentas por mensagem
```

- **Resiliência e Degradação Elegante (*Graceful Degradation*):** O cliente HTTP assíncrono (`ProviderClient`) implementa *retries* com *backoff* exponencial para falhas transitórias (`408, 500, 502, 503, 504`), limites de conexões simultâneas e um cache em memória (`TTLCache`) com *locks* assíncronos por chave (evitando *cache stampede*). Caso um provedor externo falhe ou apresente lacunas, o sistema nunca oculta os demais indicadores nem inventa valores: cada métrica carrega seu próprio status (`available`, `partial`, `insufficient_data`, `unavailable`, `provider_error`).

---

### Benefícios e O que Esperamos Alcançar (Benefits & Expected Impact)
1. **Tradução de Dados Orbitais em Linguagem do Produtor:** Dados de satélite e reanálise climática frequentemente ficam restritos à academia. O AgroSat SP entrega esses dados em segundos, traduzidos em janelas de plantio, alertas de risco e estratégias de manejo.
2. **Redução de Riscos Climáticos e Perdas de Safra:** Ao cruzar o histórico da NASA POWER com as portarias vigentes do ZARC/MAPA e alertas de curto prazo (geada, calor extremo, déficit hídrico), o produtor evita plantar fora da janela recomendada ou sem preparo para veranicos.
3. **Promoção da Agricultura Sustentável e Conservação do Solo:** O motor de rotação incentiva ativamente o Sistema Plantio Direto (SPD), a cobertura vegetal no inverno (*aveia branca*), a adubação verde com fixação biológica de nitrogênio (*crotalária-júncea*) e a rotação entre gramíneas (*Poaceae*) e leguminosas (*Fabaceae*).
4. **Rigor Científico e Transparência:** Diferencia explicitamente na interface o que é *dado observado*, *estimativa de modelo* e *interpretação por IA*, sempre acompanhado de datas de referência, unidades de medida e links diretos para as fontes oficiais.

---

### Ferramentas, Linguagens, Frameworks e Hardware (Tools, Coding Languages & Hardware)
- **Linguagens de Programação:** Python 3.12+, TypeScript 5.8, SQL (SQLite3), HTML5, CSS3.
- **Backend:** FastAPI, Uvicorn, Pydantic v2, Pydantic Settings, HTTPX (assíncrono), Shapely 2.2 (geometria computacional e árvore espacial `STRtree`), Pillow (decodificação de rasters GeoTIFF de 1×1 pixel), SQLite3 (indexação local do ZARC em modo somente-leitura), Google GenAI SDK (`google-genai`), Pytest e Pytest-Asyncio.
- **Frontend:** React 19, TanStack Router, TanStack Start, TanStack React Query, Vite 8, Tailwind CSS v4, Leaflet (mapas interativos), Recharts (visualização de séries temporais), Turf.js (`@turf/boolean-point-in-polygon`), Radix UI / shadcn/ui, Lucide React, React Markdown, Vitest e React Testing Library.
- **Infraestrutura e Deploy:** Docker (container unificado multi-stage), Microsoft Azure (Azure App Service for Containers / Azure Container Apps).
- **Hardware:** **Zero dependência de hardware em campo.** O sistema dispensa estações meteorológicas proprietárias locais de alto custo, operando 100% com sensoriamento remoto orbital da NASA e grades públicas globais/nacionais, acessível em computadores e celulares no campo.

---

## 2. NASA Data (Dados e Recursos da NASA Utilizados)

> *Nota para os Jurados (Relevance):* O projeto utiliza **dois conjuntos de dados oficiais da NASA** integrados diretamente no código-fonte de produção para alimentar tanto os painéis analíticos quanto os motores de recomendação agronômica e o assistente de IA.

### 2.1. NASA POWER (Prediction Of Worldwide Energy Resources) — Agroclimatology (`AG`) Daily API
- **Recurso / Dataset:** *NASA Langley Research Center (LaRC) POWER Project — Agroclimatology Community (`AG`), Daily Temporal API* (derivado de observações de satélite da NASA e do modelo de assimilação **MERRA-2** do *NASA GMAO* e **GPM/GEWEX**).
- **Endpoint Integrado:** `https://power.larc.nasa.gov/api/temporal/daily/point`
- **Implementação no Código:** [`backend/app/services/nasa_power.py`](file:///c:/Users/emman/Documents/t.i/nasa-challenge/backend/app/services/nasa_power.py), [`backend/app/services/climate_series.py`](file:///c:/Users/emman/Documents/t.i/nasa-challenge/backend/app/services/climate_series.py) e [`backend/app/services/crop_analysis.py`](file:///c:/Users/emman/Documents/t.i/nasa-challenge/backend/app/services/crop_analysis.py).
- **Variáveis Agroclimatológicas Consumidas (`parameters`):**
  1. `T2M` — Temperatura média diária do ar a 2 metros ($^\circ\text{C}$)
  2. `T2M_MIN` — Temperatura mínima diária do ar a 2 metros ($^\circ\text{C}$)
  3. `T2M_MAX` — Temperatura máxima diária do ar a 2 metros ($^\circ\text{C}$)
  4. `PRECTOTCORR` — Precipitação diária total corrigida ($\text{mm/dia}$, corrigida pelo *NASA Global Precipitation Measurement / MERRA-2*)
  5. `RH2M` — Umidade relativa do ar a 2 metros ($\text{\%}$)
  6. `WS10M` — Velocidade média do vento a 10 metros ($\text{m/s}$)
- **Como os dados da NASA POWER são processados e aplicados:**
  - **Padrão Temporal e Sanitização:** As consultas são feitas em *Local Solar Time* (`time-standard=LST`) para a comunidade agrícola (`community=AG`). O backend lê dinamicamente o `fill_value` do cabeçalho da resposta da NASA (como `-999.0` ou `-888`), converte valores não publicados em `null`, remove os dias finais ainda em processamento pela NASA e expõe a última data real disponível (`last_available_date`).
  - **Séries Diárias (30 a 365 dias):** Alimentam os quatro gráficos de monitoramento histórico na tela de Dashboard (`/api/v1/climate/history`).
  - **Análise Climática Multi-Anual (5 Anos):** No endpoint `/api/v1/climate/series` e no componente `ClimateSeriesChart.tsx`, o sistema consulta até 5 anos consecutivos da NASA POWER e realiza agregações estatísticas (soma de chuva acumulada em mm, média térmica/umidade/vento e extremos de mínima e máxima) agrupadas por mês, ano ou dia.
  - **Motor de Aptidão de Plantio e Rotação:** No módulo de plantio (`crop_analysis.py`), o backend consulta a série da NASA POWER para o **mês homólogo completo mais recente** correspondente ao mês de plantio desejado pelo agricultor, calculando a temperatura média mensal (`mean_air_temperature_c`) e a precipitação acumulada (`total_precipitation_mm`). Esse retrato climático da NASA é cruzado com os limites térmicos fisiológicos da cultura (ex.: faixa ideal de 20 a 30 °C para a soja) e com as janelas de risco do ZARC.
  - **Fundamentação do Assistente de IA:** O AgroSat IA consulta a NASA POWER em tempo real por meio das ferramentas `get_climate_history`, `get_environmental_summary`, `get_crop_suitability` e `get_crop_rotation_strategies`.

### 2.2. NASA SRTM (Shuttle Radar Topography Mission) — Digital Elevation Model (90m)
- **Recurso / Dataset:** *NASA / NGA Shuttle Radar Topography Mission (SRTM) GL3 90m Digital Elevation Database*.
- **Endpoint Integrado:** Consultado via `https://api.opentopodata.org/v1/srtm90m`
- **Implementação no Código:** [`backend/app/services/opentopodata.py`](file:///c:/Users/emman/Documents/t.i/nasa-challenge/backend/app/services/opentopodata.py) e rota `/api/v1/terrain`.
- **Como é utilizado:**
  - Determina a altitude ortométrica (`elevation_m`, em metros acima do nível do mar) para qualquer coordenada selecionada no Estado de São Paulo.
  - É exibida como indicador ambiental observado no painel de diagnóstico do mapa (`SidePanels.tsx`) e disponibilizada ao assistente **AgroSat IA** através da ferramenta `get_terrain`, auxiliando na interpretação de pisos térmicos e aptidão topográfica regional.

---

## 3. Space Agency Partner and Other Data (Dados de Agências Parceiras e Outras Fontes)

Além dos dados primários da NASA (NASA POWER e NASA SRTM), o AgroSat SP integra um ecossistema robusto de bases governamentais brasileiras e serviços científicos internacionais:

1. **Open-Meteo Weather Forecast API (Modelos Meteorológicos Globais e Regionais — NOAA, ECMWF, DWD, Météo-France):**
   - **Uso:** Fornece estimativas meteorológicas horárias/atuais, umidade volumétrica do solo em três profundidades (`0–1 cm`, `1–3 cm` e `3–9 cm` em $\text{m}^3/\text{m}^3$), previsão diária de 7 a 16 dias e **Evapotranspiração de Referência FAO Penman-Monteith ($\text{ET}_0$)** em mm.
   - **Aplicação:** Alimenta o resumo regional atual, os cartões de previsão de 7 dias e todos os 5 indicadores da triagem de riscos agroambientais (`/api/v1/risks`).

2. **ISRIC — World Soil Information (SoilGrids 2.0 Web Coverage Service — WCS):**
   - **Uso:** Serviço OGC WCS (`https://maps.isric.org/mapserv`) que retorna recortes GeoTIFF (`GEOTIFF_INT16`, sistema de referência `EPSG:4326`) da camada superficial de **0 a 5 cm** do solo.
   - **Aplicação:** O backend (`backend/app/services/soilgrids.py`) decodifica os rasters binários com a biblioteca `Pillow`, tratando a tag `GDAL_NODATA` (tag TIFF 42113) e os fatores de escala do ISRIC para fornecer 5 indicadores edáficos:
     - **pH em água** (`phh2o`, escala $\div 10$)
     - **Argila** (`clay`, % em massa, escala $\div 10$)
     - **Areia** (`sand`, % em massa, escala $\div 10$)
     - **Silte** (`silt`, % em massa, escala $\div 10$)
     - **Carbono orgânico do solo** (`soc`, g/kg, escala $\div 10$)

3. **MAPA — Ministério da Agricultura e Pecuária (ZARC — Zoneamento Agrícola de Risco Climático / Tábua de Risco):**
   - **Uso:** Dados abertos oficiais do Governo Federal do Brasil, recortados para os 645 municípios de São Paulo e embarcados no projeto em formato compactado (`gzip`) com indexação automática em banco **SQLite3** local (`backend/app/services/zarc.py`):
     - **Safra 2026/2027 (`backend/app/data/zarc/2026-2027.csv.gz`):** 163.005 registros paulistas cobrindo culturas anuais (Soja, Milho 1ª e 2ª Safra, Sorgo Granífero, Aveia, Crotalária-júncea, etc.).
     - **Culturas Perenes, Olerícolas e Sem Safra (`backend/app/data/zarc/sem-safra.csv.gz`):** 369.418 registros paulistas, incluindo 7.079 registros para Cana-de-Açúcar (portarias vigentes de sequeiro).
   - **Aplicação:** Permite consultar instantaneamente os 36 decêndios do ano por geocódigo IBGE do município, grupo de cultivar, classe de água disponível do solo (`cod_solo`) e sistema de manejo, retornando os níveis oficiais de risco climático de **20%, 30% e 40%**.

4. **IBGE — Instituto Brasileiro de Geografia e Estatística (API de Malhas v4 e API de Localidades v1):**
   - **Uso:** Malha territorial oficial do Estado de São Paulo (`backend/app/data/sp.geojson` e `frontend/src/data/sp-boundary.json` via dataset *click_that_hood* / IBGE) e malha dos 645 municípios paulistas (`backend/app/data/sp_municipalities.geojson.gz` e pontos centrais em `frontend/src/data/sp-municipalities.json`).
   - **Aplicação:** Garante que apenas coordenadas pertencentes ao Estado de São Paulo sejam aceitas e resolve automaticamente qualquer coordenada `(latitude, longitude)` para o nome oficial do município e seu código IBGE de 7 dígitos (`35XXXXX`), chave primária para consulta no ZARC.

5. **Embrapa (Empresa Brasileira de Pesquisa Agropecuária):**
   - **Uso:** Manuais técnicos, sistemas de produção e circulares técnicas da Embrapa Soja, Embrapa Milho e Sorgo, Embrapa Clima Temperado e Embrapa Meio Ambiente.
   - **Aplicação:** Fundamentam o catálogo agronômico (`backend/app/data/crops.json`), os limites térmicos de estresse de calor por cultura, as exigências hídricas e as regras de rotação de culturas, cobertura do solo e Sistema Plantio Direto (SPD).

6. **INMET (Instituto Nacional de Meteorologia) e SEDEC/MDR:**
   - **Uso:** Critérios operacionais de alertas meteorológicos (geada, precipitação intensa $\ge 50\text{ mm}$ e $> 100\text{ mm}$, rajadas de vento $\ge 60\text{ km/h}$ e $> 100\text{ km/h}$) e publicação *Agrometeorologia dos Cultivos*.
   - **Aplicação:** Parametrização dos limiares de triagem de risco em `backend/app/services/risk_analysis.py`.

7. **Esri World Imagery & OpenStreetMap (OSM):**
   - **Uso:** Provedores de *tiles* cartográficos no componente `MapView.tsx` (imagens orbitais/aéreas da Esri/Maxar/Earthstar Geographics e mapa base colaborativo do OpenStreetMap).

---

## 4. Use of AI (Uso de Inteligência Artificial)

O projeto utiliza Inteligência Artificial em duas frentes distintas, documentadas com total transparência:

### 4.1. IA como Componente Central da Aplicação (AgroSat IA — Google Gemini)
- **Modelo e SDK:** `gemini-3.1-flash-lite` integrado no backend Python por meio da biblioteca oficial `google-genai` ([`backend/app/services/gemini_agent.py`](file:///c:/Users/emman/Documents/t.i/nasa-challenge/backend/app/services/gemini_agent.py)).
- **Arquitetura de *Function Calling* Determinístico:**
  - O modelo não responde com base em suposições livres. Ele recebe um conjunto de **8 ferramentas declaradas (`TOOLS`)** que consultam diretamente os serviços do backend para a localização ativa do usuário:
    1. `get_climate_history` (NASA POWER — 30 a 365 dias)
    2. `get_weather_forecast` (Open-Meteo — 1 a 16 dias)
    3. `get_environmental_summary` (Resumo combinado NASA POWER + Open-Meteo)
    4. `get_environmental_risks` (Triagem de geada, calor, chuva intensa, vento e déficit hídrico)
    5. `get_crop_suitability` (Avaliação de plantio NASA POWER + ZARC/MAPA)
    6. `get_crop_rotation_strategies` (Estratégias de rotação e cobertura do solo)
    7. `get_terrain` (Altitude NASA SRTM)
    8. `get_soil` (Propriedades superficiais SoilGrids 0–5 cm)
  - O backend controla manualmente o loop de *function calling* (`automatic_function_calling` desativado) com orçamento máximo de **5 chamadas de ferramentas por mensagem**, timeout de **35 segundos** e *rate limit* local por cliente (`ChatRateLimit`).
- **Guardrails Anti-Alucinação e Transparência na UI:**
  - As instruções de sistema (`INSTRUCTIONS`) determinam expressamente: *"É proibido inventar números, estimar dados ausentes ou dar garantia agronômica. Trate previsões como estimativas e oriente a consulta ao INMET para avisos oficiais. Use apenas os links das fontes devolvidas pelas ferramentas."*
  - No frontend (`ChatWidget.tsx`), toda resposta do **AgroSat IA** exibe um rodapé de metadados classificando a resposta como **Interpretação**, listando todas as **Fontes consultadas** (ex.: *NASA POWER*, *MAPA — ZARC Tábua de Risco*, *Open-Meteo*, *NASA SRTM*) e apresentando avisos de limitações agronômicas.

### 4.2. Uso de IA durante o Desenvolvimento do Software (Notas e Marcas no Projeto)
- **AI generation disclosure:** Frontend and backend source files carry the `Generated by AI` notice where the format supports comments. Lovable assisted with frontend scaffolding, and Codex and Gemini/Antigravity assisted with implementation, integration, tests, and documentation. The notice identifies AI involvement in the project code, including adaptations of third-party components. See [AI_USAGE.json](AI_USAGE.json) for machine-readable disclosure and data provenance.
- **Prototipação de Interface (Lovable):** A estrutura inicial de componentes visuais do frontend (shadcn/ui, configuração base do TanStack Start em `vite.config.ts`, e arquivos de telemetria/erros como `frontend/AGENTS.md` e `frontend/src/lib/lovable-error-reporting.ts`) contou com o auxílio da plataforma **Lovable**, cujas notas e pacotes (`@lovable.dev/vite-tanstack-config`) permanecem documentados e preservados no repositório.
- **Engenharia, Integração e Containerização (Google Gemini / Antigravity):** Auxílio na integração dos contratos tipados entre o frontend e o FastAPI, suíte de testes automatizados (`pytest` e `vitest`), configuração de CORS/ambiente para nuvem, preparação do container Docker multi-stage para o Microsoft Azure e elaboração da documentação técnica.
- **Ausência de Mídia Sintética Não Declarada:** Nenhuma imagem de satélite, mapa ou dado climático exibido pela plataforma é gerado por IA; todos os dados numéricos e geográficos provêm em tempo real das APIs científicas oficiais (NASA, Open-Meteo, ISRIC, IBGE e MAPA).

---

## 5. References (Referências Completas — Obrigatório)

Abaixo estão listados **todos** os datasets, APIs científicas, publicações agronômicas, bibliotecas open source, ativos visuais e ferramentas utilizados no projeto.

### 5.1. Dados da NASA e Agências Espaciais / Científicas
1. **NASA POWER (Prediction Of Worldwide Energy Resources) — Agroclimatology Daily API:**  
   NASA Langley Research Center (LaRC). *POWER Project Data Sets (MERRA-2 / GPM)*.  
   URL: https://power.larc.nasa.gov/  
   Documentação da API Diária: https://power.larc.nasa.gov/docs/services/api/temporal/daily/  
   Tutoriais e Resolução: https://power.larc.nasa.gov/docs/tutorials/
2. **NASA SRTM (Shuttle Radar Topography Mission) — 90m Digital Elevation Data:**  
   NASA / National Geospatial-Intelligence Agency (NGA), acessado via *Open Topo Data REST API (`srtm90m`)*.  
   URL: https://www.opentopodata.org/datasets/srtm/  
   API: https://api.opentopodata.org/v1/srtm90m
3. **Open-Meteo Weather Forecast API:**  
   Open-Meteo. *Free Open-Source Weather API (integrating NOAA GFS, ECMWF IFS, DWD ICON)*.  
   URL: https://open-meteo.com/en/docs
4. **ISRIC — World Soil Information (SoilGrids 2.0 Web Coverage Service):**  
   Poggio, L., de Sousa, L. M., Batjes, N. H., Heuvelink, G. B. M., Kempen, B., Ribeiro, E., & Rossiter, D. (2021). *SoilGrids 2.0: producing soil information for the globe with quantified spatial uncertainty*. SOIL, 7(1), 217–240.  
   URL: https://soilgrids.org/  
   Documentação WCS: https://docs.isric.org/globaldata/soilgrids/wcs.html  
   FAQ SoilGrids: https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_01.html

### 5.2. Bases Governamentais e Literatura Agronômica Brasileira
5. **MAPA — Zoneamento Agrícola de Risco Climático (ZARC) — Tábua de Risco (Dados Abertos):**  
   Ministério da Agricultura e Pecuária (MAPA), Brasil. Licença *Creative Commons Attribution (CC-BY)*.  
   Conjunto de Dados: https://dados.agricultura.gov.br/dataset/tabua-de-risco-zoneamento-agricola-de-risco-climatico  
   - *Tábua de Risco Safra 2026/2027:* https://dados.agricultura.gov.br/dataset/tabua-de-risco-zoneamento-agricola-de-risco-climatico/resource/139e5a60-1f43-4cc8-aeab-a35dbbf816c0  
   - *Tábua de Risco Safra 2025/2026:* https://dados.agricultura.gov.br/dataset/tabua-de-risco-zoneamento-agricola-de-risco-climatico/resource/f9d597f9-0fee-47eb-9344-8642274ca9da  
   - *Tábua de Risco Perenes, Olerícolas e Sem Safra:* https://dados.agricultura.gov.br/dataset/tabua-de-risco-zoneamento-agricola-de-risco-climatico/resource/dae65d31-683f-4ac4-ab90-3abd0c1583ba  
   - *Dicionário de Dados do ZARC:* https://dados.agricultura.gov.br/dataset/tabua-de-risco-zoneamento-agricola-de-risco-climatico/resource/bebb0ebb-bc75-460c-b900-a7a1ebd87bee  
   - *Painel Oficial de Indicação de Riscos ZARC:* https://mapa-indicadores.agricultura.gov.br/publico/extensions/Zarc/Zarc.html  
   - *Portarias Vigentes do ZARC para São Paulo:* https://www.gov.br/agricultura/pt-br/assuntos/riscos-seguro/programa-nacional-de-zoneamento-agricola-de-risco-climatico/portarias/safra-vigente/sao-paulo
6. **IBGE — Instituto Brasileiro de Geografia e Estatística:**  
   - *API de Malhas Territoriais v4 (Malha Estadual e Municipal de São Paulo — UF 35):* https://servicodados.ibge.gov.br/api/docs/malhas?versao=4  
   - *API de Localidades v1 (Municípios de São Paulo):* https://servicodados.ibge.gov.br/api/v1/localidades/estados/35/municipios  
   - *Code for America — click_that_hood Brazil States GeoJSON (usado na validação rápida do cliente):* https://github.com/codeforamerica/click_that_hood
7. **Embrapa — Referências Agronômicas e Sistemas de Produção:**  
   - *Embrapa Soja — Tecnologias de produção de soja (Sistemas de Produção, 17):* https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1123928/1/SP-17-2020-online-1.pdf  
   - *Embrapa Milho e Sorgo — Relações do milho com o clima:* https://www.embrapa.br/en/web/agencia-de-informacao-tecnologica/cultivos/milho/pre-producao/caracteristicas-da-especie-e-relacoes-com-o-ambiente/relacoes-com-o-clima  
   - *Embrapa Milho e Sorgo — Plantio do Milho (Comunicado Técnico):* https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/748759/1/Milho-Plantio.pdf  
   - *Embrapa Milho e Sorgo — Sorgo: 500 perguntas, 500 respostas:* https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1015482/1/500-perguntas-sorgo.pdf  
   - *Embrapa Clima Temperado — Forrageiras (Aveia branca):* https://www.embrapa.br/web/clima-temperado/forrageiras  
   - *Embrapa — Adubação verde e plantas de cobertura no Brasil (Vol. 1, 2ª ed., 2023):* https://www.alice.cnptia.embrapa.br/alice/bitstream/doc/1153241/1/ADUBACAO-VERDE-VOL-01-ed02-2023.pdf  
   - *Embrapa — Sistema Plantio Direto: 500 perguntas, 500 respostas:* https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/98258/1/500perguntassistemaplantiodireto.pdf  
   - *Embrapa — Características e Plantio da Cana-de-açúcar:* https://www.embrapa.br/en/web/agencia-de-informacao-tecnologica/cultivos/cana-de-acucar/pre-producao/caracteristicas e https://www.embrapa.br/web/agencia-de-informacao-tecnologica/cultivos/cana-de-acucar/producao/manejo/plantio
8. **INMET (Instituto Nacional de Meteorologia) e Defesa Civil (SEDEC/MDR):**  
   - *Avisos Meteorológicos e Critérios de Geada do INMET:* https://avisos.inmet.gov.br/56121  
   - *Guia Prático de Alertas e Critérios de Desastres (SEDEC/MDR & INMET):* https://www.gov.br/mdr/pt-br/centrais-de-conteudo/publicacoes/protecao-e-defesa-civil-sedec/guiapraticodesastres.pdf  
   - *Monteiro, J. E. B. A. (Org.); Marin, F. R. — Agrometeorologia dos Cultivos: O fator meteorológico na produção agrícola (INMET, p. 122 — Cana-de-açúcar):* https://portal.inmet.gov.br/uploads/publicacoesDigitais/agrometeorologia_dos_cultivos.pdf#page=122

### 5.3. Inteligência Artificial e Mapas Base
9. **Google Gemini API & Function Calling:**  
   Google DeepMind / Google AI for Developers.  
   URL: https://ai.google.dev/  
   Documentação de Function Calling: https://ai.google.dev/gemini-api/docs/generate-content/function-calling
10. **Camadas Cartográficas (Map Tiles):**  
    - *Esri World Imagery:* Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`).  
    - *OpenStreetMap:* © OpenStreetMap contributors, sob licença ODbL (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).

### 5.4. Bibliotecas, Frameworks e Pacotes Open Source Utilizados

#### Backend (Python — `backend/requirements.txt`)
- **FastAPI** (`fastapi`, `starlette`) — Framework web assíncrono e geração automática de OpenAPI/Swagger (Licença MIT).
- **Uvicorn** (`uvicorn`, `uvloop`, `httptools`, `h11`, `websockets`, `watchfiles`) — Servidor ASGI de alta performance (Licença BSD-3-Clause).
- **HTTPX** (`httpx`, `httpcore`, `anyio`, `certifi`, `idna`) — Cliente HTTP assíncrono para consumo das APIs da NASA, Open-Meteo, OpenTopoData e SoilGrids (Licença BSD-3-Clause).
- **Pydantic & Pydantic Settings** (`pydantic`, `pydantic-core`, `pydantic-settings`, `pydantic-extra-types`, `annotated-types`, `typing-inspection`) — Validação de dados, contratos de esquemas e variáveis de ambiente (Licença MIT).
- **Shapely** (`shapely`) — Operações geométricas planares e indexação espacial `STRtree` das malhas estaduais e municipais do IBGE (Licença BSD-3-Clause).
- **Pillow** (`Pillow`) — Leitura e validação de rasters GeoTIFF retornados pelo WCS do SoilGrids (Licença MIT-CMU).
- **Google GenAI SDK** (`google-genai`, `protobuf`, `googleapis-common-protos`) — SDK oficial para comunicação com os modelos Gemini e *function calling* (Licença Apache-2.0).
- **Python Standard Library:** `sqlite3`, `gzip`, `csv`, `zoneinfo`, `asyncio`, `statistics`, `math`, `calendar`.
- **Pytest & Pytest-Asyncio** (`pytest`, `pytest-asyncio`) — Framework de testes unitários e de integração com `MockTransport` (Licença MIT / Apache-2.0).

#### Frontend (TypeScript / React — `frontend/package.json`)
- **React & React DOM** (`react`, `react-dom`) — Biblioteca de interface de usuário (Licença MIT).
- **TanStack Router & TanStack Start** (`@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`, `nitro`) — Roteamento tipado e estrutura SSR/SPA (Licença MIT).
- **TanStack React Query** (`@tanstack/react-query`) — Gerenciamento de estado assíncrono, cache e requisições HTTP no cliente (Licença MIT).
- **Vite** (`vite`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `@lovable.dev/vite-tanstack-config`) — Bundler e servidor de desenvolvimento frontend (Licença MIT).
- **Tailwind CSS** (`tailwindcss`, `@tailwindcss/vite`, `tailwind-merge`, `clsx`, `class-variance-authority`, `tw-animate-css`) — Estilização utilitária responsiva (Licença MIT).
- **Leaflet** (`leaflet`, `@types/leaflet`) — Renderização de mapas interativos (Licença BSD-2-Clause).
- **Turf.js** (`@turf/boolean-point-in-polygon`) — Validação geométrica espacial ponto-em-polígono no navegador (Licença MIT).
- **Recharts** (`recharts`) — Gráficos de linhas e barras para séries históricas da NASA POWER (Licença MIT).
- **Radix UI & shadcn/ui** (`@radix-ui/react-*`, `cmdk`, `vaul`, `sonner`, `lucide-react`) — Componentes de interface acessíveis e ícones vetoriais (Licença MIT / ISC).
- **React Markdown** (`react-markdown`) — Renderização segura de respostas formatadas do AgroSat IA (Licença MIT).
- **React Hook Form & Zod** (`react-hook-form`, `@hookform/resolvers`, `zod`, `date-fns`) — Validação de formulários e manipulação de datas (Licença MIT).
- **Vitest & Testing Library** (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`) — Testes automatizados de componentes, formulários, rotas e contratos (Licença MIT).
- **Tipografia (Google Fonts):** *Space Grotesk* e *JetBrains Mono* (Licença SIL Open Font License 1.1).
