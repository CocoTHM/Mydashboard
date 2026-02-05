import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Octokit } from '@octokit/rest';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(private prisma: PrismaService) {}

  private getOctokit(accessToken: string): Octokit {
    return new Octokit({ auth: accessToken });
  }

  async syncRepositories(userId: string, accessToken: string) {
    this.logger.log(`Syncing GitHub repositories for user ${userId}`);
    
    const octokit = this.getOctokit(accessToken);
    
    try {
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
      });

      const savedRepos = await Promise.all(
        repos.map(repo =>
          this.prisma.gitHubRepo.upsert({
            where: { githubId: repo.id },
            update: {
              name: repo.name,
              fullName: repo.full_name,
              description: repo.description,
              url: repo.html_url,
              private: repo.private,
              language: repo.language,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              openIssues: repo.open_issues_count,
              lastSyncAt: new Date(),
            },
            create: {
              githubId: repo.id,
              name: repo.name,
              fullName: repo.full_name,
              description: repo.description,
              url: repo.html_url,
              private: repo.private,
              language: repo.language,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              openIssues: repo.open_issues_count,
              userId,
              lastSyncAt: new Date(),
            },
          }),
        ),
      );

      this.logger.log(`Synced ${savedRepos.length} repositories`);
      return savedRepos;
    } catch (error) {
      this.logger.error(`Failed to sync repositories: ${error.message}`);
      throw error;
    }
  }

  async getRepositories(userId: string) {
    return this.prisma.gitHubRepo.findMany({
      where: { userId },
      orderBy: { lastSyncAt: 'desc' },
    });
  }

  async getWorkflowRuns(userId: string, owner: string, repo: string, accessToken: string) {
    const octokit = this.getOctokit(accessToken);

    try {
      const { data } = await octokit.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: 20,
      });

      return data.workflow_runs;
    } catch (error) {
      this.logger.error(`Failed to get workflow runs: ${error.message}`);
      throw error;
    }
  }

  async triggerWorkflow(
    owner: string,
    repo: string,
    workflowId: string | number,
    ref: string,
    accessToken: string,
  ) {
    const octokit = this.getOctokit(accessToken);

    try {
      await octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowId,
        ref,
      });

      this.logger.log(`Triggered workflow ${workflowId} for ${owner}/${repo}`);
      return { success: true, message: 'Workflow triggered successfully' };
    } catch (error) {
      this.logger.error(`Failed to trigger workflow: ${error.message}`);
      throw error;
    }
  }

  async getActivity(userId: string, accessToken: string) {
    const octokit = this.getOctokit(accessToken);

    try {
      const { data } = await octokit.activity.listEventsForAuthenticatedUser({
        username: userId,
        per_page: 20,
      });

      return data;
    } catch (error) {
      this.logger.error(`Failed to get activity: ${error.message}`);
      throw error;
    }
  }
}
