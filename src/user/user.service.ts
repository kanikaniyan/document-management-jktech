import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entites/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>
    ) {}

    async findAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const existingUser = await this.findByEmail(createUserDto.email);

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword
        });

        return this.userRepository.save(user);
    }

    async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(id);

        if (updateUserDto.password) {
            
            const isSamePassword = await bcrypt.compare(updateUserDto.password, user.password);

            if (isSamePassword) {
                throw new ConflictException('Password cannot be the same');
            }

            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        
        Object.assign(user, updateUserDto);

        return this.userRepository.save(user);
    }

    async remove(id: string): Promise<boolean> {
        const user = await this.findOne(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }
        let isdeleted = await this.userRepository.remove(user);

        return isdeleted ? true : false;
    }

    async findOne(id: string): Promise<User> {
        return this.userRepository.findOne({ where: { id }});
    }

    async findByEmail(email: string): Promise<User | undefined> {
        return this.userRepository.findOne({ where: { email } });
    }
}
