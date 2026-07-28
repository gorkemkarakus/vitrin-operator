import { supabase } from './supabase'

// supabase-js'in functions.invoke()'u fonksiyon 2xx-disi dondugunde error'u
// bir FunctionsHttpError olarak set eder ama yanit govdesindeki { error: '...' }
// mesajini OTOMATIK PARSE ETMEZ — error.context (Response nesnesi) elle
// okunmali, aksi halde tum operator-* fonksiyonlarinin ozenle yazdigi
// kullaniciya-ozel hata mesajlari (ör. "Bu calisan bu saatte mesaide degil")
// sessizce kaybolup jenerik bir mesaja duser.
export async function callOperator<T = Record<string, unknown>>(
  fn: string,
  body: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke(fn, { body })
  if (error) {
    const ctx = (error as { context?: Response }).context
    if (ctx) {
      try {
        const parsed = await ctx.clone().json()
        return { data: null, error: parsed?.error ?? error.message }
      } catch {
        return { data: null, error: error.message }
      }
    }
    return { data: null, error: error.message }
  }
  return { data: data as T, error: null }
}
