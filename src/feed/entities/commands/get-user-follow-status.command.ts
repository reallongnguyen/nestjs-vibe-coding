export class GetUserFollowStatusCommand {
  constructor(
    public readonly userId: string | null,
    public readonly targetUserIds: string[],
  ) {}
}
