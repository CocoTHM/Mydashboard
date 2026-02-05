'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Wallet, 
  CheckSquare, 
  Map, 
  Github, 
  Wrench,
  Server,
  LogOut,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Dépenses', href: '/expenses', icon: Wallet },
  { name: 'Tâches', href: '/tasks', icon: CheckSquare },
  { name: 'Roadmaps', href: '/roadmaps', icon: Map },
  { name: 'GitHub', href: '/github', icon: Github },
  { name: 'Outils', href: '/tools', icon: Wrench },
  { name: 'VM', href: '/vm', icon: Server },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Dashboard</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Utilisateur</p>
            <p className="text-xs text-muted-foreground">user@example.com</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
