import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../user/enums/user-role.enum';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

export const Public = () => SetMetadata('isPublic', true);