import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';
import { PublicKey } from '@solana/web3.js';

export const SolanaAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const userAddress = request.params.user_address;

    try {
      new PublicKey(userAddress);
      return userAddress;
    } catch (error) {
      throw new Error('Invalid Solana address');
    }
  },
  [
    (target: any, key: string) => {
      // Use ApiParam to document the parameter for Swagger
      ApiParam({
        name: 'user_address',
        required: true,
        description: 'The Solana address of the user',
      })(target, key, Object.getOwnPropertyDescriptor(target, key));
    },
  ],
);
