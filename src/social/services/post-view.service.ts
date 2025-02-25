import { Injectable, Logger, Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import { IPostViewRepository } from './interfaces/post-view.repository.interface';

@Injectable()
export class PostViewService {
  private readonly logger = new Logger(PostViewService.name);

  constructor(
    @Inject('IPostViewRepository')
    private readonly postViewRepository: IPostViewRepository,
  ) {}

  async recordView(
    postId: string,
    viewerId: string | null,
    ip: string,
    userAgent: string,
  ): Promise<void> {
    // Create a hash of IP and UserAgent for anonymous users
    const viewerHash = this.createViewerHash(ip, userAgent);

    return this.postViewRepository.recordView(postId, viewerId, viewerHash);
  }

  async getViewCount(postId: string): Promise<number> {
    return this.postViewRepository.getViewCount(postId);
  }

  private createViewerHash(ip: string, userAgent: string): string {
    return createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');
  }
}
