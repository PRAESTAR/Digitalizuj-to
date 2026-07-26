import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware náhrady za next/link a next/navigation.
 * Používaj TIETO namiesto next/link — samy doplnia jazykový prefix,
 * takže sa nikde nesmie objaviť natvrdo napísané href="/peers".
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
