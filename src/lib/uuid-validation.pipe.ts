import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { validate, IsUUID } from 'class-validator';

class UuidValidationPipeDto {
  @IsUUID('4')
  uuidValue: string;
}

@Injectable()
export class UuidValidationPipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (
      metadata.type !== 'param' ||
      !metadata.data ||
      metadata.data.length === 0
    ) {
      return value;
    }

    const instance = new UuidValidationPipeDto();
    instance.uuidValue = value;

    const errors = await validate(instance);

    if (errors.length) {
      throw new BadRequestException('invalid UUID parameter');
    }

    return value;
  }
}
