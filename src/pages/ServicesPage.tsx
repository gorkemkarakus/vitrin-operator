import { useEffect, useState, type FormEvent } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { callOperator } from '../lib/operatorApi'
import type { LayoutOutletContext } from '../layouts/DashboardLayout'
import styles from './ServicesPage.module.css'

interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number | null
  is_active: boolean
  description: string | null
}

interface MonthAppointment {
  service_id: string | null
}

const currency = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })

export default function ServicesPage() {
  const { businessId } = useParams<{ businessId: string }>()
  const { searchQuery, setSearchPlaceholder } = useOutletContext<LayoutOutletContext>()
  const [services, setServices] = useState<Service[]>([])
  const [monthAppointments, setMonthAppointments] = useState<MonthAppointment[]>([])
  const [servicePrices, setServicePrices] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [duration, setDuration] = useState('60')
  const [price, setPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function callServices(action: string, payload: Record<string, unknown> = {}) {
    return callOperator('operator-services', { action, business_id: businessId, ...payload })
  }

  // "silent=true" bir mutasyondan sonra cagrilir — veriyi arka planda
  // tazeler ama "loading" bayragini geri true yapmaz, boylece sayfa her
  // islemden sonra bos "Yükleniyor…" yazisina donup yeniden cizilmiyor.
  async function loadData(silent = false) {
    if (!silent) setLoading(true)
    const { data } = await callOperator<{ services: Service[]; monthAppointments: MonthAppointment[] }>(
      'operator-services',
      { action: 'load', business_id: businessId },
    )
    setServices(data?.services ?? [])
    setServicePrices(new Map((data?.services ?? []).map((s) => [s.id, s.price ?? 0])))
    setMonthAppointments(data?.monthAppointments ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  useEffect(() => {
    setSearchPlaceholder('Hizmet ara…')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    await callServices('create', {
      name: name.trim(),
      duration_minutes: Math.max(5, Number(duration) || 60),
      price: price === '' ? null : Math.max(0, Number(price) || 0),
    })
    setName('')
    setDuration('60')
    setPrice('')
    await loadData(true)
    setSubmitting(false)
  }

  async function updateService(service: Service, patch: Partial<Service>) {
    await callServices('update', { service_id: service.id, patch })
    await loadData(true)
  }

  async function deleteService(service: Service) {
    const ok = window.confirm(
      `"${service.name}" hizmetini kalıcı olarak silmek istediğinize emin misiniz?\n\nBu hizmetin geçmişte kullanıldığı randevular silinmez, sadece o randevulardaki hizmet bağlantısı boşa düşer.`,
    )
    if (!ok) return
    await callServices('delete', { service_id: service.id })
    await loadData(true)
  }

  if (loading) return <p style={{ color: 'var(--text-dim)' }}>Yükleniyor…</p>

  const activeCount = services.filter((s) => s.is_active).length
  const monthRevenue = monthAppointments.reduce(
    (sum, a) => sum + (a.service_id ? (servicePrices.get(a.service_id) ?? 0) : 0),
    0,
  )
  const q = searchQuery.trim().toLowerCase()
  const visibleServices = q ? services.filter((s) => s.name.toLowerCase().includes(q)) : services

  return (
    <div className={styles.wrap}>
      <div className={`card ${styles.summaryRow}`}>
        <div className={styles.summaryTile}>
          <span className={styles.summaryValue}>{activeCount}</span>
          <span className={styles.summaryLabel}>Aktif hizmet</span>
        </div>
        <div className={styles.summaryTile}>
          <span className={styles.summaryValue}>{currency.format(monthRevenue)}</span>
          <span className={styles.summaryLabel}>Bu ayki ciro</span>
        </div>
        <div className={styles.summaryTile}>
          <span className={styles.summaryValue}>{monthAppointments.length}</span>
          <span className={styles.summaryLabel}>Bu ayki randevu</span>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 16 }}>Yeni hizmet ekle</h2>
        <form className={styles.form} onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="serviceName">Hizmet adı</label>
            <input
              id="serviceName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ör. Manikür"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="serviceDuration">Süre (dk)</label>
            <input
              id="serviceDuration"
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="servicePrice">Fiyat (TL)</label>
            <input
              id="servicePrice"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Ekleniyor…' : 'Ekle'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 16 }}>Hizmetler</h2>
        {visibleServices.length === 0 ? (
          <p className={styles.empty}>{q ? 'Eşleşen hizmet yok.' : 'Henüz hizmet eklenmedi.'}</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hizmet adı</th>
                <th>Süre (dk)</th>
                <th>Fiyat (TL)</th>
                <th>Durum</th>
                <th>Chatbot açıklaması</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibleServices.map((s) => (
                <tr key={s.id} className={s.is_active ? '' : styles.inactive}>
                  <td>
                    <input
                      className={styles.nameInput}
                      defaultValue={s.name}
                      onBlur={(e) => {
                        const value = e.target.value.trim()
                        if (value && value !== s.name) updateService(s, { name: value })
                        else e.target.value = s.name
                      }}
                      aria-label={`${s.name} adı`}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.numberInput}
                      type="number"
                      min={5}
                      step={5}
                      defaultValue={s.duration_minutes}
                      onBlur={(e) => {
                        const value = Math.max(5, Number(e.target.value) || s.duration_minutes)
                        if (value !== s.duration_minutes) updateService(s, { duration_minutes: value })
                        else e.target.value = String(s.duration_minutes)
                      }}
                      aria-label={`${s.name} süresi`}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.numberInput}
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={s.price ?? 0}
                      onBlur={(e) => {
                        const value = Math.max(0, Number(e.target.value) || 0)
                        if (value !== (s.price ?? 0)) updateService(s, { price: value })
                        else e.target.value = String(s.price ?? 0)
                      }}
                      aria-label={`${s.name} fiyatı`}
                    />
                    {s.price != null && (
                      <span style={{ marginLeft: 8, color: 'var(--text-dim)', fontSize: 12 }}>
                        {currency.format(s.price)}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={s.is_active ? styles.toggleActive : styles.toggle}
                      onClick={() => updateService(s, { is_active: !s.is_active })}
                      aria-label={`${s.name} ${s.is_active ? 'aktif' : 'pasif'}`}
                    />
                  </td>
                  <td>
                    <Link to={`/isletme/${businessId}/hizmetler/${s.id}/aciklama`} className="btn-secondary" style={{ width: 'auto', display: 'inline-block', textDecoration: 'none' }}>
                      {s.description ? 'Açıklamayı düzenle' : 'Açıklama ekle'}
                    </Link>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ width: 'auto' }}
                      onClick={() => deleteService(s)}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
