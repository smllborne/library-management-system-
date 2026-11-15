import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto, LoginDto } from './dto/auth.dto.js';
import { access } from 'fs';

@Injectable()
export class AuthService {
  constructor (
    private prisma: PrismaService,
    private jwt: JwtService
  ){}


async register(dto: RegisterDto) {
  const exists = await this.prisma.user.findUnique({where: {email: dto.email}});
  if(exists) throw new ConflictException('Email already registered');

  const hash = await bcrypt.hash(dto.password, 10);
  const user = await this.prisma.user.create({
    data: {email: dto.email, password: hash}
  });
  const { password, ...safe } = user;
  return safe;
  }

async login(dto: LoginDto){
  const user = await this.prisma.user.findUnique({where: {email: dto.email}});
  const valid = user && (await bcrypt.compare(dto.password, user.password));
  if(!user || ! valid) throw new UnauthorizedException('Invalid credentials');

  const payload = {sub: user.id, email: user.email, role: user.role};
  return{access_token: await this.jwt.signAsync(payload)};
 }  
}
