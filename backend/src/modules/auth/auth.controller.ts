import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from '../../core/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('send-otp')
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto);
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Throttle({ auth: { limit: 20, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}
