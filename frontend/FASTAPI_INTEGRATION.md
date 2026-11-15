# Integração com FastAPI

A URL padrão da API no frontend aponta para `https://nasa-challenge-nvrf.onrender.com` (ou pode ser sobrescrita via `VITE_API_BASE_URL` em `.env` / `.env.local`). Para desenvolvimento local, inicie o backend na pasta `backend` com `.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000` e execute `npm run dev -- --host 127.0.0.1 --port 5173`.

A busca por município usa pontos internos derivados da [malha de municípios do IBGE](https://servicodados.ibge.gov.br/api/docs/malhas?versao=4) já usada pelo backend. Para escolher a localização exata, use o mapa ou informe latitude e longitude. Uma instalação pode configurar `VITE_GEOCODING_URL` para buscas de endereço em um serviço compatível com Nominatim.

## Endpoints do frontend

| Método | Endpoint | Dados exibidos |
| --- | --- | --- |
| GET | `/api/v1/regions/summary` | Estimativas meteorológicas atuais |
| GET | `/api/v1/weather/forecast` | Previsão diária |
| GET | `/api/v1/climate/history` | Série diária de 30, 90, 180 ou 365 dias |
| GET | `/api/v1/climate/series` | Série mensal por ano, mês e indicador |
| GET | `/api/v1/soil` | Propriedades estimadas do solo |
| GET | `/api/v1/terrain` | Altitude SRTM |
| GET | `/api/v1/risks` | Triagem agroambiental e calor por cultura |
| GET | `/api/v1/crops` | Catálogo e opções de cultura |
| POST | `/api/v1/crops/suitability` | Avaliações com janelas condicionais do ZARC |
| POST | `/api/v1/crops/rotation` | Estratégias para o próximo plantio |
| POST | `/api/v1/ai/chat` | Resposta do Gemini, com localização e até oito mensagens anteriores |

O cliente HTTP em `src/services/api.ts` envia coordenadas WGS84 nos campos `latitude` e `longitude`. Os formatos FastAPI em `src/services/fastapi.ts` são convertidos para os dados que os componentes exibem. Campos nulos ou intervalos sem cobertura aparecem como indisponíveis. A chave do Gemini é configurada exclusivamente em `backend/.env`.

Plantio e rotação enviam a data como `planting_day`, `planting_month` e `planting_year`. Na rotação, `previous_crop_name` leva o nome digitado da cultura anterior.

The frontend sends `Accept-Language: en`. The FastAPI crop catalog, planting and rotation assessments, risk explanations, and AI responses use that preference. Deploy the updated FastAPI backend before deploying this frontend.
