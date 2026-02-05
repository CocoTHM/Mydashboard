export interface User {
  id: string
  email: string
  username?: string
  name?: string
  avatar?: string
  role: 'USER' | 'ADMIN'
}

export interface VM {
  id: string
  name: string
  provider: string
  status: 'RUNNING' | 'STOPPED' | 'PENDING' | 'STARTING' | 'STOPPING' | 'ERROR'
  ipAddress?: string
  dnsName?: string
  os?: string
  vcpus?: number
  ramMb?: number
  diskGb?: number
  tags: string[]
  description?: string
  lastMetrics?: VMMetrics
  createdAt: string
  updatedAt: string
}

export interface VMMetrics {
  cpuUsage: number
  ramUsage: number
  ramTotal: number
  diskUsage: number
  diskTotal: number
  networkIn?: number
  networkOut?: number
  timestamp: Date
}

export interface Expense {
  id: string
  title: string
  amount: number
  category: string
  date: string
  description?: string
  tags: string[]
  recurring: boolean
}

export interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  deadline?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Roadmap {
  id: string
  title: string
  domain: string
  description?: string
  color?: string
  steps: Step[]
  createdAt: string
  updatedAt: string
}

export interface Step {
  id: string
  title: string
  description?: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  order: number
  dueDate?: string
}

export interface Tool {
  id: string
  name: string
  type: 'SOFTWARE' | 'WEBSITE' | 'CLOUD_SERVICE' | 'VM' | 'API' | 'OTHER'
  url?: string
  description?: string
  icon?: string
  category?: string
  isFavorite: boolean
}
