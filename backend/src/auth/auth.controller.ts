import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Přihlášení uživatele',
    description: 'Vrací JWT access token a základní info o uživateli.',
  })
  @ApiResponse({
    status: 201,
    description: 'Přihlášení úspěšné, vrácen JWT token',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          name: 'Jan Novák',
          email: 'jan.novak@example.com',
          role: 'member',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Nesprávné přihlašovací údaje' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
