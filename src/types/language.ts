import { APP_LANGUAGES } from '../utils/consts';

export type AppLanguage = (typeof APP_LANGUAGES)[keyof typeof APP_LANGUAGES];
