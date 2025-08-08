import { SignInEndpoint } from './apps/features/v1/sign-in';
import { SignUpEndpoint } from './apps/features/v1/sign-up';

export const authModuleFederations: Function[] = [SignUpEndpoint,SignInEndpoint];
