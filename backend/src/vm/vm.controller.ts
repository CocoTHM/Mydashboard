import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VmService } from './vm.service';
import { CreateVmDto, UpdateVmDto } from './dto/vm.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('vm')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('vm')
export class VmController {
  constructor(private readonly vmService: VmService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle VM' })
  create(@CurrentUser('id') userId: string, @Body() createVmDto: CreateVmDto) {
    return this.vmService.create(userId, createVmDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les VM de l\'utilisateur' })
  findAll(@CurrentUser('id') userId: string) {
    return this.vmService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'une VM' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.vmService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une VM' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateVmDto: UpdateVmDto,
  ) {
    return this.vmService.update(id, userId, updateVmDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une VM' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.vmService.remove(id, userId);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Démarrer une VM' })
  start(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.vmService.start(id, userId);
  }

  @Post(':id/stop')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Arrêter une VM' })
  stop(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.vmService.stop(id, userId);
  }

  @Post(':id/restart')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Redémarrer une VM' })
  restart(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.vmService.restart(id, userId);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Obtenir le statut en temps réel d\'une VM' })
  getStatus(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.vmService.getStatus(id, userId);
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Obtenir les métriques d\'une VM' })
  getMetrics(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.vmService.getMetrics(id, userId);
  }

  @Post(':id/metrics/refresh')
  @ApiOperation({ summary: 'Rafraîchir les métriques d\'une VM' })
  refreshMetrics(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.vmService.refreshMetrics(id, userId);
  }
}
