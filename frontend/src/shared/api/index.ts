// Общий HTTP-клиент и типы контракта API.md. Запросы к конкретным ресурсам живут в сегментах api слайсов.
export { ApiError, API_URL, http, setUnauthorizedHandler, tokenStore } from './client'
export type * from './types'
