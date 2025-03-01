export class FollowerDto {
  id: string;
  firstName: string;
  lastName: string | null;
  avatar: string | null;
  followedAt: Date;
}
