export class GetUserLikesStatusCommand {
  constructor(
    public readonly userId: string | null,
    public readonly contentIds: string[],
  ) {}
}
