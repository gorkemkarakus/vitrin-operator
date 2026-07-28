import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Avatar from '../components/Avatar'
import { callOperator } from '../lib/operatorApi'
import { useAuth } from '../contexts/AuthContext'
import styles from './BusinessListPage.module.css'

interface Business {
  id: string
  name: string
  slug: string
  created_at: string
}

export default function BusinessListPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null)

  function loadBusinesses() {
    setLoading(true)
    callOperator<{ businesses: Business[] }>('operator-businesses', {}).then(({ data }) => {
      setBusinesses(data?.businesses ?? [])
      setLoading(false)
    })
  }

  useEffect(() => {
    loadBusinesses()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError(null)
    setCreating(true)
    const { data, error } = await callOperator<{ admin_email: string; temp_password: string }>(
      'operator-businesses',
      { action: 'create', name: newName.trim(), admin_email: newAdminEmail.trim(), admin_full_name: newAdminName.trim() },
    )
    setCreating(false)
    if (error || !data) {
      setCreateError(error ?? 'İşletme oluşturulamadı')
      return
    }
    setCreatedCreds({ email: data.admin_email, password: data.temp_password })
    setNewName('')
    setNewAdminEmail('')
    setNewAdminName('')
    loadBusinesses()
  }

  function closeCreate() {
    setShowCreate(false)
    setCreateError(null)
    setCreatedCreds(null)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="button" className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowCreate(true)}>
            + Yeni İşletme
          </button>
          <button type="button" className={styles.signOut} onClick={() => signOut()}>
            Çıkış yap
          </button>
        </div>
      </header>

      {showCreate && (
        <div className={styles.modalBackdrop} onClick={closeCreate}>
          <div className={`card ${styles.modalCard}`} onClick={(e) => e.stopPropagation()}>
            {createdCreds ? (
              <>
                <h2>İşletme oluşturuldu ✅</h2>
                <p className={styles.sub}>
                  Bu geçici şifreyi işletme sahibiyle paylaşın — kendi "Şifremi unuttum" akışıyla istediği zaman
                  değiştirebilir.
                </p>
                <div className="field">
                  <label>E-posta</label>
                  <input readOnly value={createdCreds.email} />
                </div>
                <div className="field">
                  <label>Geçici şifre</label>
                  <input readOnly value={createdCreds.password} />
                </div>
                <button type="button" className="btn-primary" onClick={closeCreate}>
                  Tamam
                </button>
              </>
            ) : (
              <>
                <h2>Yeni işletme</h2>
                <form onSubmit={handleCreate}>
                  <div className="field">
                    <label htmlFor="newName">İşletme adı</label>
                    <input id="newName" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label htmlFor="newAdminName">Yönetici adı soyadı</label>
                    <input id="newAdminName" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label htmlFor="newAdminEmail">Yönetici e-postası</label>
                    <input
                      id="newAdminEmail"
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      required
                    />
                  </div>
                  {createError && <p style={{ color: 'var(--danger-text)', fontSize: 13 }}>{createError}</p>}
                  <button type="submit" className="btn-primary" disabled={creating}>
                    {creating ? 'Oluşturuluyor…' : 'Oluştur'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <div className={styles.content}>
        <h1>İşletmeler</h1>
        <p className={styles.sub}>Yönetmek istediğiniz işletmeyi seçin.</p>

        {loading ? (
          <p style={{ color: 'var(--text-dim)' }}>Yükleniyor…</p>
        ) : businesses.length === 0 ? (
          <p style={{ color: 'var(--text-dim)' }}>Henüz kayıtlı işletme yok.</p>
        ) : (
          <div className={styles.grid}>
            {businesses.map((b) => (
              <button
                type="button"
                key={b.id}
                className={styles.card}
                onClick={() => navigate(`/isletme/${b.id}/dashboard`)}
              >
                <Avatar name={b.name} size={40} />
                <div className={styles.cardText}>
                  <span className={styles.cardName}>{b.name}</span>
                  <span className={styles.cardSlug}>{b.slug}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
