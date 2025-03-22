import { SetMetadata } from '@nestjs/common';
import { MetadataKeys } from 'src/utils/enums';

export const FirebaseAuthMetadata = (path: 'login') =>
  SetMetadata(MetadataKeys.firebaseAuth, path);
