import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../contexts/AuthContext'
import { callOperator } from '../lib/operatorApi'
import { DashboardIcon, AppointmentsIcon, TeamIcon, ServicesIcon, SearchIcon } from '../components/icons'
import styles from './DashboardLayout.module.css'

const NAV_ITEMS = [
  { path: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { path: 'randevular', label: 'Randevular', icon: AppointmentsIcon },
  { path: 'ekip', label: 'Ekip', icon: TeamIcon },
  { path: 'hizmetler', label: 'Hizmetler', icon: ServicesIcon },
]

interface Business {
  id: string
  name: string
  slug: string
}

export interface LayoutOutletContext {
  searchQuery: string
  setSearchPlaceholder: (placeholder: string) => void
}

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { businessId } = useParams<{ businessId: string }>()
  const { signOut } = useAuth()

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchPlaceholder, setSearchPlaceholder] = useState('Ara…')

  useEffect(() => {
    setSearchQuery('')
  }, [location.pathname])

  useEffect(() => {
    callOperator<{ businesses: Business[] }>('operator-businesses', {}).then(({ data }) => {
      setBusinesses(data?.businesses ?? [])
    })
  }, [])

  const currentBusiness = businesses.find((b) => b.id === businessId)
  const currentTitle = NAV_ITEMS.find((item) => location.pathname.endsWith(`/${item.path}`))?.label ?? 'Panel'

  function handleBusinessSwitch(newBusinessId: string) {
    // Ayni alt sayfada kal, sadece isletme id'sini degistir — asagidaki
    // Outlet'teki key={businessId} bu degisimde sayfayi TAMAMEN yeniden
    // mount eder, boylece bos-bagimlilik-dizili useEffect'ler yeniden
    // tetiklenir ve eski isletmenin verisi ekranda kalmaz.
    const currentPage = NAV_ITEMS.find((item) => location.pathname.endsWith(`/${item.path}`))?.path ?? 'dashboard'
    navigate(`/isletme/${newBusinessId}/${currentPage}`)
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logoWrap}>
          <Logo />
        </div>

        <select
          className={styles.businessSwitcher}
          value={businessId}
          onChange={(e) => handleBusinessSwitch(e.target.value)}
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={`/isletme/${businessId}/${item.path}`}
                className={({ isActive }) =>
                  isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
                }
              >
                <Icon className={styles.navIcon} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <h1 className={styles.pageTitle}>{currentTitle}</h1>
          <div className={styles.searchWrap}>
            <SearchIcon className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.topbarRight}>
            <span className={styles.profileName}>{currentBusiness?.name ?? ''}</span>
            <button className={styles.signOut} onClick={() => signOut()}>
              Çıkış yap
            </button>
          </div>
        </header>
        <main className={styles.content}>
          <Outlet key={businessId} context={{ searchQuery, setSearchPlaceholder } satisfies LayoutOutletContext} />
        </main>
      </div>
    </div>
  )
}
