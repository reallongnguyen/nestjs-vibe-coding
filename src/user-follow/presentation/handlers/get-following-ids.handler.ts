import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GetFollowingIdsCommand } from '../commands/get-following-ids.command';
import { UserFollowService } from '../../services/user-follow.service';

@CommandHandler(GetFollowingIdsCommand)
export class GetFollowingIdsHandler
  implements ICommandHandler<GetFollowingIdsCommand>
{
  constructor(private readonly userFollowService: UserFollowService) {}

  async execute(command: GetFollowingIdsCommand): Promise<string[]> {
    return this.userFollowService.getFollowingIds(command.userId);
  }
}
