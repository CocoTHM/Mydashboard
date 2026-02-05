import { VM, VMStatus } from '@prisma/client';
import { VMMetrics } from '../dto/vm.dto';

/**
 * Interface commune pour tous les providers de VM
 */
export interface IVMProvider {
  /**
   * Démarrer une VM
   */
  start(vm: VM, credentials: any): Promise<void>;

  /**
   * Arrêter une VM
   */
  stop(vm: VM, credentials: any): Promise<void>;

  /**
   * Redémarrer une VM
   */
  restart(vm: VM, credentials: any): Promise<void>;

  /**
   * Obtenir le statut actuel d'une VM
   */
  getStatus(vm: VM, credentials: any): Promise<VMStatus>;

  /**
   * Obtenir les métriques d'une VM
   */
  getMetrics(vm: VM, credentials: any): Promise<VMMetrics>;

  /**
   * Tester la connexion avec les credentials
   */
  testConnection(credentials: any): Promise<boolean>;
}
