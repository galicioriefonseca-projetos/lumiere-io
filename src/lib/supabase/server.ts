import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { Request, Response } from 'express';

const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)!;
const supabaseKey = (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!;

export const createClient = (req: Request, res: Response) => {
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return req.cookies[name];
      },
      set(name: string, value: string, options: CookieOptions) {
        res.cookie(name, value, {
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        res.clearCookie(name, options);
      },
    },
  });
};
