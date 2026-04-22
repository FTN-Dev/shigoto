import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
// Admin client to read users
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
sb.auth.admin.listUsers().then(res => console.log(res.data.users.map(u => ({ id: u.id, email: u.email }))));
