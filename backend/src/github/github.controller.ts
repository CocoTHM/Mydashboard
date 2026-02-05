import {
  Controller,
  Get,
  Post,
  UseGuards,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GithubService } from './github.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('github')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Post('sync')
  syncRepositories(
    @CurrentUser('id') userId: string,
    @Body('accessToken') accessToken: string,
  ) {
    return this.githubService.syncRepositories(userId, accessToken);
  }

  @Get('repositories')
  getRepositories(@CurrentUser('id') userId: string) {
    return this.githubService.getRepositories(userId);
  }

  @Get('workflows/:owner/:repo')
  getWorkflowRuns(
    @CurrentUser('id') userId: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Query('accessToken') accessToken: string,
  ) {
    return this.githubService.getWorkflowRuns(userId, owner, repo, accessToken);
  }

  @Post('workflows/trigger')
  triggerWorkflow(
    @Body('owner') owner: string,
    @Body('repo') repo: string,
    @Body('workflowId') workflowId: string,
    @Body('ref') ref: string,
    @Body('accessToken') accessToken: string,
  ) {
    return this.githubService.triggerWorkflow(owner, repo, workflowId, ref, accessToken);
  }

  @Get('activity')
  getActivity(
    @CurrentUser('id') userId: string,
    @Query('accessToken') accessToken: string,
  ) {
    return this.githubService.getActivity(userId, accessToken);
  }
}
