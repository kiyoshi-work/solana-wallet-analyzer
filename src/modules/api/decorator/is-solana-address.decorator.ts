import { PublicKey } from '@solana/web3.js';
import {
  registerDecorator,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
class IsSolanaAddressConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    try {
      new PublicKey(value);
      return true;
    } catch (error) {
      return false;
    }
  }

  defaultMessage() {
    return `Invalid Solana Address`;
  }
}

// Create Decorator for the constraint that was just created
export function IsSolanaAddress() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      validator: IsSolanaAddressConstraint,
    });
  };
}
