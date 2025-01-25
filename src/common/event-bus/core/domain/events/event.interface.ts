export interface IProfileUpdatedEvent {
  id: string;
  name: string;
  avatar?: string;
}

export interface IRoleChangeEvent {
  userId: string;
  newRoles: string[];
  performedBy: string;
}

export interface IAccountActivatedEvent {
  userId: string;
  performedBy: string;
}

export interface IAccountDeactivatedEvent {
  userId: string;
  performedBy: string;
}

export interface IAccountDeletedEvent {
  userId: string;
  performedBy: string;
}
