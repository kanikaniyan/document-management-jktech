import { Body, Controller, Delete, Get, Param, Patch, Post, SetMetadata, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiLink, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public, Roles } from '../auth/decorator/roles.decorator';
import { UserRole } from './enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    @Public()
    @ApiOperation({ summary: 'Create user' })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    @ApiLink({from: ()=>{}, routeParam: ':id'})
    createUser(@Body() createUserDto: CreateUserDto) {
        return this.userService.createUser(createUserDto);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all users' })
    @ApiResponse({ description: 'User retrieved successfully' })
    findAllUsers() {
        return this.userService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.ADMIN)
    @ApiResponse({ description: 'User fetched by id successfully' })
    findUserById(@Param('id') id: string) {
        return this.userService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiResponse({ description: 'User updated successfully' })
    updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.updateUser(id, updateUserDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete user' })
    @ApiResponse({ description: 'User deleted successfully' })
    deleteUser(@Param('id') id: string) {
        return this.userService.remove(id);
    }
}

