'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Play, Square, RotateCw, Server, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data
const mockVMs = [
  {
    id: '1',
    name: 'prod-web-server',
    provider: 'AWS_EC2',
    status: 'RUNNING',
    ipAddress: '54.123.456.789',
    os: 'Ubuntu 22.04',
    vcpus: 4,
    ramMb: 8192,
    diskGb: 100,
    tags: ['production', 'web'],
    lastMetrics: {
      cpuUsage: 45,
      ramUsage: 5120,
      ramTotal: 8192,
      diskUsage: 60,
      diskTotal: 100,
    },
  },
  {
    id: '2',
    name: 'dev-environment',
    provider: 'AZURE_VM',
    status: 'RUNNING',
    ipAddress: '20.234.567.890',
    os: 'Windows Server 2022',
    vcpus: 2,
    ramMb: 4096,
    diskGb: 50,
    tags: ['development'],
    lastMetrics: {
      cpuUsage: 25,
      ramUsage: 2048,
      ramTotal: 4096,
      diskUsage: 30,
      diskTotal: 50,
    },
  },
  {
    id: '3',
    name: 'backup-server',
    provider: 'PROXMOX',
    status: 'STOPPED',
    ipAddress: '192.168.1.100',
    os: 'Debian 12',
    vcpus: 2,
    ramMb: 4096,
    diskGb: 500,
    tags: ['backup', 'storage'],
  },
  {
    id: '4',
    name: 'test-env',
    provider: 'GCP_COMPUTE',
    status: 'STOPPED',
    ipAddress: '35.123.456.789',
    os: 'Ubuntu 20.04',
    vcpus: 2,
    ramMb: 2048,
    diskGb: 30,
    tags: ['test'],
  },
]

const statusColors = {
  RUNNING: 'bg-green-500',
  STOPPED: 'bg-gray-500',
  STARTING: 'bg-yellow-500',
  STOPPING: 'bg-orange-500',
  ERROR: 'bg-red-500',
}

const providerNames = {
  AWS_EC2: 'AWS EC2',
  AZURE_VM: 'Azure VM',
  GCP_COMPUTE: 'GCP Compute',
  PROXMOX: 'Proxmox',
  VMWARE: 'VMware',
}

export default function VMPage() {
  const [vms, setVMs] = useState(mockVMs)
  const [selectedVM, setSelectedVM] = useState<string | null>(null)

  const handleStart = (vmId: string) => {
    console.log('Starting VM:', vmId)
    // TODO: Appeler l'API
  }

  const handleStop = (vmId: string) => {
    console.log('Stopping VM:', vmId)
    // TODO: Appeler l'API
  }

  const handleRestart = (vmId: string) => {
    console.log('Restarting VM:', vmId)
    // TODO: Appeler l'API
  }

  const selectedVMData = vms.find(vm => vm.id === selectedVM)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Gestion des Machines Virtuelles
          </h2>
          <p className="text-muted-foreground">
            Gérez et surveillez vos VM sur différents providers
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle VM
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total VM</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vms.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vms.filter(vm => vm.status === 'RUNNING').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrêtées</CardTitle>
            <Server className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vms.filter(vm => vm.status === 'STOPPED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Providers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(vms.map(vm => vm.provider)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des VM */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vms.map((vm) => (
          <Card 
            key={vm.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg',
              selectedVM === vm.id && 'ring-2 ring-primary'
            )}
            onClick={() => setSelectedVM(vm.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{vm.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', statusColors[vm.status])} />
                    <span className="text-xs text-muted-foreground">
                      {vm.status}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {providerNames[vm.provider]}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IP:</span>
                  <span className="font-mono">{vm.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OS:</span>
                  <span>{vm.os}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resources:</span>
                  <span>
                    {vm.vcpus}vCPU • {vm.ramMb / 1024}GB RAM
                  </span>
                </div>
              </div>

              {vm.lastMetrics && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>CPU</span>
                      <span>{vm.lastMetrics.cpuUsage}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${vm.lastMetrics.cpuUsage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>RAM</span>
                      <span>
                        {(vm.lastMetrics.ramUsage / 1024).toFixed(1)} / {vm.lastMetrics.ramTotal / 1024}GB
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${(vm.lastMetrics.ramUsage / vm.lastMetrics.ramTotal) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Disk</span>
                      <span>
                        {vm.lastMetrics.diskUsage} / {vm.lastMetrics.diskTotal}GB
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${(vm.lastMetrics.diskUsage / vm.lastMetrics.diskTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {vm.status === 'RUNNING' ? (
                  <>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStop(vm.id)
                      }}
                      className="flex-1"
                    >
                      <Square className="mr-1 h-3 w-3" />
                      Stop
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRestart(vm.id)
                      }}
                      className="flex-1"
                    >
                      <RotateCw className="mr-1 h-3 w-3" />
                      Restart
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStart(vm.id)
                    }}
                    className="flex-1"
                  >
                    <Play className="mr-1 h-3 w-3" />
                    Start
                  </Button>
                )}
              </div>

              {vm.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {vm.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-secondary rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Panneau de détails */}
      {selectedVMData && (
        <Card>
          <CardHeader>
            <CardTitle>Détails - {selectedVMData.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Informations</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Provider:</dt>
                    <dd>{providerNames[selectedVMData.provider]}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Status:</dt>
                    <dd>{selectedVMData.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">IP Address:</dt>
                    <dd className="font-mono">{selectedVMData.ipAddress}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Operating System:</dt>
                    <dd>{selectedVMData.os}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Resources</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">vCPUs:</dt>
                    <dd>{selectedVMData.vcpus}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">RAM:</dt>
                    <dd>{selectedVMData.ramMb / 1024} GB</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Disk:</dt>
                    <dd>{selectedVMData.diskGb} GB</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold mb-2">Accès rapide</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  SSH
                </Button>
                <Button variant="outline" size="sm">
                  Console Web
                </Button>
                <Button variant="outline" size="sm">
                  Métriques détaillées
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
